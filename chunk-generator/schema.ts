import { z } from "zod";

export const CONTENT_MAX_LENGTH = 1000; // Maximum length of a section in characters

export const ChunkSchema = z.object({
  objectID: z
    .string()
    .describe(
      "ヘッダーから生成したチャンクのID。配列の中でユニークである必要がある"
    ),
  pageID: z.string().describe("ページのID。"),
  pageVersion: z.string().describe("ページのバージョン。"),
  headings: z
    .array(z.string())
    .describe(
      "セクションのヘッダー階層。パンくずリストを想像してもらうとわかりやすい。 例：['配列', '空であるかを調べる（2）']"
    ),
  url: z
    .string()
    .describe(
      "siv3d.github.io上のURL 例：https://siv3d.github.io/ja-jp/tools/msvc-exception/#サンプルコード"
    ),
  order: z
    .number()
    .describe(
      "ページ内の表示順序 (ページ中でチャンクが登場する順に0, 1, 2...とする)"
    ),
  content: z.string().describe("チャンクの内容").max(CONTENT_MAX_LENGTH),
});

export type Chunk = z.infer<typeof ChunkSchema>;

export const CodeBlockSchema = z.object({
  id: z
    .string()
    .describe("コードブロックのID。チャンクの中でユニークである必要がある"),
  pageId: z.string().describe("ページのID"),
  language: z.string().nullable().describe("コードブロックの言語 例：'cpp'"),
  content: z.string().describe("コードブロックの内容"),
});

export type CodeBlock = z.infer<typeof CodeBlockSchema>;
