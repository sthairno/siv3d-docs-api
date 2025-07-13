// 目的：
// Siv3DのドキュメントをAlgoliaで検索しやすい分割データにする
// ゴール：
// siv3d.docsのディレクトリを探索して、各Markdownファイルをセクションに分割したJSONを生成する
// 条件：
// - yarn runで実行できること
// - ファイル出力はせず、生成したJSONを標準出力のみすること
// - 実行開始時に、siv3d.docsの中身が存在するか確認すること
// - 配列はen-usとja-jpで別々になるため、入力で言語を指定できるようにすること

import * as fs from "fs";
import { CONTENT_MAX_LENGTH, ChunkSchema, Chunk, CodeBlock } from "../schema";
import { walkSiv3dDocsMarkdowns } from "./lib/utils";
import { splitMarkdownIntoChunks } from "./lib/chunks";
import { MarkdownDocument } from "./lib/markdown";

function auditChunks(chunks: Chunk[]): void {
  let chunkIdx = 0;

  // スキーマ通りの出力になっているか確認
  try {
    for (chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
      ChunkSchema.parse(chunks[chunkIdx]);
    }
  } catch (error) {
    console.error(
      `Error at chunk index ${chunkIdx}:`,
      JSON.stringify(chunks[chunkIdx])
    );
    throw new Error("Invalid chunk data structure");
  }

  // チャンクIDがユニークであることを確認
  const ids = new Set<string>();
  for (const chunk of chunks) {
    if (ids.has(chunk.objectID)) {
      throw new Error(`Duplicate chunk ID found: ${chunk.objectID}`);
    }
    ids.add(chunk.objectID);
  }
}

function auditCodeBlocks(codeBlocks: CodeBlock[]): void {
  const ids = new Set<string>();
  for (const codeBlock of codeBlocks) {
    if (ids.has(codeBlock.id)) {
      throw new Error(`Duplicate code block ID found: ${codeBlock.id}`);
    }
    ids.add(codeBlock.id);
  }
}

function main() {
  // Get input values with environment variable priority (GitHub Actions support)
  const siv3dDocsDir = process.env["INPUT_SIV3D-DOCS-DIR"];
  const siv3dDocsVersion = process.env["INPUT_SIV3D-DOCS-VERSION"];
  const siv3dDocsLanguage = process.env["INPUT_SIV3D-DOCS-LANGUAGE"];
  const chunksOutputFile = process.env["INPUT_CHUNKS-OUTPUT-FILE"];
  const codeBlocksOutputDir = process.env["INPUT_CODE-BLOCKS-OUTPUT-DIR"];
  const disableValidation = process.env["INPUT_DISABLE-VALIDATION"] === "true";

  console.log(process.env);

  // Validate required arguments
  if (!siv3dDocsDir || !siv3dDocsVersion || !siv3dDocsLanguage) {
    console.error(
      "Error: siv3d-docs-path, siv3d-docs-version, and siv3d-docs-language are required"
    );
    process.exit(1);
  }

  if (!fs.existsSync(siv3dDocsDir)) {
    console.error(`Error: siv3d.docs directory not found at ${siv3dDocsDir}`);
    process.exit(1);
  }

  const validLanguages = ["en-us", "ja-jp"];
  if (!validLanguages.includes(siv3dDocsLanguage)) {
    console.error(
      `Error: Invalid language. Available languages: ${validLanguages.join(", ")}`
    );
    process.exit(1);
  }

  const chunks: Chunk[] = [];
  const codeBlocks: CodeBlock[] = [];

  for (const { docsUrl, filePath, route } of walkSiv3dDocsMarkdowns(
    siv3dDocsDir,
    siv3dDocsLanguage
  )) {
    const pageId = route.map((p) => p.toLowerCase()).join("-");
    const content = fs.readFileSync(filePath, "utf-8");
    const markdown = new MarkdownDocument(content);
    chunks.push(
      ...splitMarkdownIntoChunks(
        markdown,
        docsUrl,
        pageId,
        siv3dDocsVersion,
        CONTENT_MAX_LENGTH
      )
    );
    codeBlocks.push(
      ...markdown.codeBlocks.map<CodeBlock>((src) => ({
        id: `${pageId}_${src.id}`,
        pageId: pageId,
        language: src.language,
        content: src.content,
      }))
    );
  }

  if (!disableValidation) {
    auditChunks(chunks);
    auditCodeBlocks(codeBlocks);
  }

  // Write chunks to file
  if (chunksOutputFile) {
    fs.writeFileSync(chunksOutputFile, JSON.stringify(chunks));
    console.log(`Chunks written to: ${chunksOutputFile}`);
  }

  // Write code blocks to file
  if (codeBlocksOutputDir) {
    if (!fs.existsSync(codeBlocksOutputDir)) {
      fs.mkdirSync(codeBlocksOutputDir, { recursive: true });
    }
    for (const codeBlock of codeBlocks) {
      fs.writeFileSync(
        `${codeBlocksOutputDir}/${codeBlock.id}.json`,
        JSON.stringify(codeBlock)
      );
    }
  }
}

if (require.main === module) {
  main();
}
