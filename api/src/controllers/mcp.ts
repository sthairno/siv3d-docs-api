import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { structuredSearch } from "../lib/algolia";
import { getDocsCodeblock, getDocsMarkdown } from "../lib/storage";

export function createMcpServer() {
  const server = new McpServer({
    name: "siv3d-docs",
    version: "1.0.0",
  });

  server.registerTool(
    "search_siv3d_docs",
    {
      title: "Search Siv3D Documentation",
      description: "Search Siv3D documentation for a specific term.",
      inputSchema: {
        q: z.string().describe("Search query"),
        lang: z
          .enum(["en-us", "ja-jp"])
          .default("ja-jp")
          .describe("Language of the search query"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async ({ q, lang }) => ({
      content: [
        {
          type: "text",
          text: await structuredSearch(q, lang),
        },
      ],
    })
  );

  server.registerTool(
    "read_siv3d_docs_full_text",
    {
      title: "Read Siv3D Documentation Full Text",
      description:
        "Read full markdown text of the specified documentation page.",
      inputSchema: {
        url: z
          .string()
          .describe(
            "URL of the documentation page. e.g. https://siv3d.github.io/ja-jp/"
          ),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async ({ url }) => {
      const maybeDocsUrl = URL.parse(url);
      if (!maybeDocsUrl || maybeDocsUrl.origin !== "https://siv3d.github.io") {
        throw new Error(`Invalid URL: ${url}`);
      }

      const route = maybeDocsUrl.pathname
        .split("/")
        .slice(1) // pathname starts with "/"
        .map(decodeURIComponent);
      if (route.at(-1) === "") {
        route.pop();
      }

      const markdown = await getDocsMarkdown(route);
      if (!markdown) {
        throw new Error(
          `Given documentation page ${maybeDocsUrl.href} not found`
        );
      }

      return {
        content: [
          {
            type: "text",
            text: markdown,
          },
        ],
      };
    }
  );

  server.registerTool(
    "read_siv3d_docs_code_block",
    {
      title: "Read Siv3D Documentation Code Block",
      inputSchema: {
        lang: z
          .enum(["en-us", "ja-jp"])
          .default("ja-jp")
          .describe("Language of the search query"),
        id: z.string().describe("ID of the code block"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async ({ lang, id }) => {
      const codeblock = await getDocsCodeblock(
        lang as string,
        decodeURIComponent(id as string)
      );
      if (!codeblock) {
        throw new Error(`Given code block "${id}" not found`);
      }
      return {
        content: [
          {
            type: "text",
            text: codeblock.content,
            _meta: codeblock.language
              ? {
                  lang: codeblock.language,
                }
              : undefined,
          },
        ],
      };
    }
  );

  return server;
}
