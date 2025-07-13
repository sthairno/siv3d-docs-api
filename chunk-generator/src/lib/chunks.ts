import { Chunk } from "../../schema";
import { MarkdownDocument } from "./markdown";
import { splitMarkdownIntoSections } from "./sections";

function splitChunkIntoChunks(src: Chunk, maxLength: number): Chunk[] {
  if (src.content.length <= maxLength) {
    return [src];
  }

  const lines = src.content.split("\n");
  const splitCount = Math.ceil(src.content.length / maxLength);
  const targetLengthPerChunk = Math.ceil(src.content.length / splitCount);

  const chunks: Chunk[] = [];
  let currentChunkLines: string[] = [];
  let currentLength = 0;

  for (const line of lines) {
    const lineLength = line.length + 1; // +1 for newline

    // この行を追加した場合の長さをチェック
    if (
      currentLength + lineLength > targetLengthPerChunk &&
      currentChunkLines.length > 0
    ) {
      // 現在のチャンクを保存
      chunks.push({
        objectID: `${src.objectID}-${chunks.length + 1}`,
        pageID: src.pageID,
        pageVersion: src.pageVersion,
        headings: [...src.headings],
        url: src.url,
        order: src.order,
        content: currentChunkLines.join("\n"),
      });

      // 新しいチャンクを開始
      currentChunkLines = [line];
      currentLength = lineLength;
    } else {
      // 現在のチャンクに追加
      currentChunkLines.push(line);
      currentLength += lineLength;
    }
  }

  // 最後のチャンクを追加
  if (currentChunkLines.length > 0) {
    chunks.push({
      objectID: `${src.objectID}-${chunks.length + 1}`,
      pageID: src.pageID,
      pageVersion: src.pageVersion,
      headings: [...src.headings],
      url: src.url,
      order: src.order,
      content: currentChunkLines.join("\n"),
    });
  }

  return chunks;
}

export function splitMarkdownIntoChunks(
  markdown: MarkdownDocument,
  docsUrl: string,
  pageId: string,
  version: string,
  contentMaxLength: number
): Chunk[] {
  // セクションに分割
  const sections = splitMarkdownIntoSections(markdown, contentMaxLength);
  if (sections.length === 0) {
    return [];
  }

  // 各セクションをチャンクに変換
  let chunks = sections.map<Chunk>((section) => ({
    objectID: `${pageId}_${section.id}`,
    pageID: pageId,
    pageVersion: version,
    headings: section.heading.getHeadingStack().map((h) => h?.text ?? ""),
    url: `${docsUrl}#${section.id}`,
    order: 0,
    content: section.getContentMarkdown(),
  }));

  // 3. セクション分割してもコンテンツが長すぎる場合(そもそもセクションの内容が長すぎる場合)は、さらに分割する
  chunks = chunks.flatMap((chunk) =>
    splitChunkIntoChunks(chunk, contentMaxLength)
  );

  // チャンクにorderを設定
  chunks.forEach((chunk, index) => (chunk.order = index));

  return chunks;
}
