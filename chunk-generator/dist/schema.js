"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeBlockSchema = exports.ChunkSchema = exports.CONTENT_MAX_LENGTH = void 0;
const zod_1 = require("zod");
exports.CONTENT_MAX_LENGTH = 1000; // Maximum length of a section in characters
exports.ChunkSchema = zod_1.z.object({
    objectID: zod_1.z
        .string()
        .describe("ヘッダーから生成したチャンクのID。配列の中でユニークである必要がある"),
    pageID: zod_1.z.string().describe("ページのID。"),
    headings: zod_1.z
        .array(zod_1.z.string())
        .describe("セクションのヘッダー階層。パンくずリストを想像してもらうとわかりやすい。 例：['配列', '空であるかを調べる（2）']"),
    url: zod_1.z
        .string()
        .describe("siv3d.github.io上のURL 例：https://siv3d.github.io/ja-jp/tools/msvc-exception/#サンプルコード"),
    order: zod_1.z
        .number()
        .describe("ページ内の表示順序 (ページ中でチャンクが登場する順に0, 1, 2...とする)"),
    content: zod_1.z.string().describe("チャンクの内容").max(exports.CONTENT_MAX_LENGTH),
});
exports.CodeBlockSchema = zod_1.z.object({
    id: zod_1.z
        .string()
        .describe("コードブロックのID。チャンクの中でユニークである必要がある"),
    pageId: zod_1.z.string().describe("ページのID"),
    language: zod_1.z.string().nullable().describe("コードブロックの言語 例：'cpp'"),
    content: zod_1.z.string().describe("コードブロックの内容"),
});
