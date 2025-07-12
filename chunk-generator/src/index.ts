// 目的：
// Siv3DのドキュメントをAlgoliaで検索しやすい分割データにする
// ゴール：
// siv3d.docsのディレクトリを探索して、各Markdownファイルをセクションに分割したJSONを生成する
// 条件：
// - yarn runで実行できること
// - ファイル出力はせず、生成したJSONを標準出力のみすること
// - 実行開始時に、siv3d.docsの中身が存在するか確認すること (git submoduleの実行忘れを防ぐため)
// - 配列はen-usとja-jpで別々になるため、コマンドの引数で言語を指定できるようにすること

import * as fs from "fs";
import { walkSiv3dDocsMarkdowns } from "./lib/utils";
import { CONTENT_MAX_LENGTH, ChunkSchema, Chunk, CodeBlock } from "../schema";
import { splitMarkdownIntoChunks } from "./lib/chunks";
import { MarkdownDocument } from "./lib/markdown";
import minimist from "minimist";

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
  // Parse command line arguments using minimist
  const argv = minimist(process.argv.slice(2), {
    string: [
      "siv3d-docs-path",
      "siv3d-docs-language",
      "chunks-output-path",
      "code-blocks-output-path",
      "disable-audit",
    ],
  });

  const siv3dDocsPath = argv["siv3d-docs-path"];
  const siv3dDocsLanguage = argv["siv3d-docs-language"];
  const chunksOutputPath = argv["chunks-output-path"];
  const codeBlocksOutputPath = argv["code-blocks-output-path"];
  const disableAudit = ["true", "1", ""].includes(argv["disable-audit"]);

  // Validate required arguments
  if (!siv3dDocsPath) {
    console.error("Error: --siv3d-docs-path is required");
    process.exit(1);
  }

  if (!siv3dDocsLanguage) {
    console.error("Error: --siv3d-docs-language is required");
    process.exit(1);
  }

  if (!chunksOutputPath) {
    console.error("Error: --chunks-output-path is required");
    process.exit(1);
  }

  if (!codeBlocksOutputPath) {
    console.error("Error: --code-blocks-output-path is required");
    process.exit(1);
  }

  // Check if siv3d.docs exists
  if (!fs.existsSync(siv3dDocsPath)) {
    console.error(`Error: siv3d.docs directory not found at ${siv3dDocsPath}`);
    process.exit(1);
  }

  // Validate language
  const validLanguages = ["en-us", "ja-jp"];
  if (!validLanguages.includes(siv3dDocsLanguage)) {
    console.error(
      `Error: Invalid language. Available languages: ${validLanguages.join(", ")}`
    );
    process.exit(1);
  }

  try {
    const chunks: Chunk[] = [];
    const codeBlocks: CodeBlock[] = [];

    for (const { docsUrl, filePath, route } of walkSiv3dDocsMarkdowns(
      siv3dDocsPath,
      siv3dDocsLanguage
    )) {
      const pageId = route.map((p) => p.toLowerCase()).join("-");
      const content = fs.readFileSync(filePath, "utf-8");
      const markdown = new MarkdownDocument(content, {
        idPrefix: pageId,
      });
      chunks.push(
        ...splitMarkdownIntoChunks(
          markdown,
          docsUrl,
          pageId,
          CONTENT_MAX_LENGTH
        )
      );
      codeBlocks.push(
        ...markdown.codeBlocks.map<CodeBlock>((src) => ({
          id: src.id,
          pageId: pageId,
          language: src.language,
          content: src.content,
        }))
      );
    }

    if (!disableAudit) {
      auditChunks(chunks);
      auditCodeBlocks(codeBlocks);
    }

    // Write chunks to file
    fs.writeFileSync(chunksOutputPath, JSON.stringify(chunks, null, 2));
    console.log(`Chunks written to: ${chunksOutputPath}`);

    // Write code blocks to file
    fs.writeFileSync(codeBlocksOutputPath, JSON.stringify(codeBlocks, null, 2));
    console.log(`Code blocks written to: ${codeBlocksOutputPath}`);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
