import {
  searchClient,
  SearchResponse,
  SearchResponses,
} from "@algolia/client-search";
import { env } from "cloudflare:workers";
import { Chunk } from "../../../chunk-generator/schema";

const client = searchClient(
  env.ALGOLIA_APPLICATION_ID,
  env.ALGOLIA_SEARCH_API_KEY
);

const ALGOLIA_INDEX_NAMES = {
  "ja-jp": "siv3d-docs-jp",
  "en-us": "siv3d-docs-en",
} as const;

type SearchLanguage = keyof typeof ALGOLIA_INDEX_NAMES;

export async function search(query: string, language: SearchLanguage) {
  const response = (await client.search<Chunk>({
    requests: [
      {
        indexName: ALGOLIA_INDEX_NAMES[language],
        query,
      },
    ],
  })) as SearchResponses<Chunk>;
  return response.results[0] as SearchResponse<Chunk>;
}

export async function structuredSearch(
  query: string,
  language: SearchLanguage
) {
  const response = await search(query, language);

  if (response.hits.length === 0) {
    return "No results";
  }

  const chunksByPage = new Map<string, Chunk[]>();

  // Group chunks by page
  for (const hit of response.hits) {
    const pageID = hit.pageID;
    if (!chunksByPage.has(pageID)) {
      chunksByPage.set(pageID, []);
    }
    chunksByPage.get(pageID)!.push(hit);
  }

  // Sort chunks by order
  for (const chunks of chunksByPage.values()) {
    chunks.sort((a, b) => a.order - b.order);
  }

  let result = "";
  for (const chunks of chunksByPage.values()) {
    const pageUrl = new URL(chunks[0].url);
    pageUrl.hash = "";

    result += `<page url="${pageUrl.toString()}">\n`;
    let currentHeadings: string[] = [];
    let previousChunk: Chunk | null = null;
    for (const chunk of chunks) {
      let isContinuedChunk =
        previousChunk === null || previousChunk.order + 1 === chunk.order;
      // 内容が省略されている場合は省略記号を描画
      if (!isContinuedChunk) {
        result += "\n<skipped>\n";
      }

      // ヘッダーの描画
      for (let i = 0; i < chunk.headings.length; i++) {
        const text = chunk.headings[i];

        if (i < currentHeadings.length) {
          if (currentHeadings[i] === text) {
            continue;
          } else {
            currentHeadings = currentHeadings.slice(0, i);
          }
        }

        result += "\n" + "#".repeat(i + 1);
        if (i === chunk.headings.length - 1) {
          result += ` [${text}](${chunk.url})\n`;
        } else {
          result += ` ${text}\n`;
        }
        isContinuedChunk = false;
      }

      if (isContinuedChunk) {
        result += `${chunk.content}\n`;
      } else {
        result += `\n${chunk.content}\n`;
      }

      previousChunk = chunk;
      currentHeadings = [...chunk.headings];
    }
    result += "\n</page>\n";
  }

  return result.trimEnd();
}
