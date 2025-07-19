import { env } from "cloudflare:workers";
import { CodeBlock, CodeBlockSchema } from "../../../chunk-generator/schema";

const ALLOWED_LANGUAGES = ["ja-jp", "en-us"];

export async function getDocsMarkdown(route: string[]): Promise<string | null> {
  // ルートページか言語が指定されていないルートはスキップする
  if (route.length === 0 || !ALLOWED_LANGUAGES.includes(route[0])) {
    return null;
  }

  // ファイルパスを生成
  const storagePath =
    route.length === 1
      ? `${env.SIV3D_DOCS_VERSION}/markdown/${route[0]}/index.md`
      : `${env.SIV3D_DOCS_VERSION}/markdown/${route[0]}/${route.slice(1).join("/")}.md`;

  // ストレージからファイルを取得
  const object = await env.SIV3D_DOCS_STORAGE.get(storagePath);
  if (!object) {
    return null;
  }

  return await object.text();
}

const CODEBLOGK_ID_REGEX = /^[^\s\/]{1,100}$/gu;

export async function getDocsCodeblock(
  lang: string,
  id: string
): Promise<CodeBlock | null> {
  if (!ALLOWED_LANGUAGES.includes(lang) || !CODEBLOGK_ID_REGEX.test(id)) {
    console.warn(`Invalid language or codeblock ID: ${lang}, ${id}`);
    return null;
  }

  // IDからストレージのパスを生成してオブジェクトを取得
  const storagePath = `${env.SIV3D_DOCS_VERSION}/codeblock/${lang}/${id}.json`;
  const object = await env.SIV3D_DOCS_STORAGE.get(storagePath);
  if (!object) {
    console.warn(`Codeblock not found: ${storagePath}`);
    return null;
  }

  // コードブロックのJSONを処理
  const codeBlock = await CodeBlockSchema.safeParseAsync(await object.json());
  if (codeBlock.error) {
    console.warn(
      `Failed to parse codeblock ${storagePath}: ${codeBlock.error.message}`
    );
    return null;
  }

  return codeBlock.data;
}
