"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitMarkdownIntoChunks = splitMarkdownIntoChunks;
const sections_1 = require("./sections");
function splitChunkIntoChunks(src, maxLength) {
    if (src.content.length <= maxLength) {
        return [src];
    }
    const lines = src.content.split("\n");
    const splitCount = Math.ceil(src.content.length / maxLength);
    const targetLengthPerChunk = Math.ceil(src.content.length / splitCount);
    const chunks = [];
    let currentChunkLines = [];
    let currentLength = 0;
    for (const line of lines) {
        const lineLength = line.length + 1; // +1 for newline
        // この行を追加した場合の長さをチェック
        if (currentLength + lineLength > targetLengthPerChunk &&
            currentChunkLines.length > 0) {
            // 現在のチャンクを保存
            chunks.push({
                objectID: `${src.objectID}-${chunks.length + 1}`,
                pageID: src.pageID,
                headings: [...src.headings],
                url: src.url,
                order: src.order,
                content: currentChunkLines.join("\n"),
            });
            // 新しいチャンクを開始
            currentChunkLines = [line];
            currentLength = lineLength;
        }
        else {
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
            headings: [...src.headings],
            url: src.url,
            order: src.order,
            content: currentChunkLines.join("\n"),
        });
    }
    return chunks;
}
function splitMarkdownIntoChunks(markdown, docsUrl, pageId, contentMaxLength) {
    // セクションに分割
    const sections = (0, sections_1.splitMarkdownIntoSections)(markdown, contentMaxLength);
    if (sections.length === 0) {
        return [];
    }
    // 各セクションをチャンクに変換
    let chunks = sections.map((section) => ({
        objectID: section.id,
        pageID: pageId,
        headings: section.heading.getHeadingStack().map((h) => h?.text ?? ""),
        url: `${docsUrl}#${section.id}`,
        order: 0,
        content: section.getContentMarkdown(),
    }));
    // 3. セクション分割してもコンテンツが長すぎる場合(そもそもセクションの内容が長すぎる場合)は、さらに分割する
    chunks = chunks.flatMap((chunk) => splitChunkIntoChunks(chunk, contentMaxLength));
    // チャンクにorderを設定
    chunks.forEach((chunk, index) => (chunk.order = index));
    return chunks;
}
