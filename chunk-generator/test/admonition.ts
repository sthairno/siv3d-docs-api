import { readFileSync } from "fs";
import { MarkdownDocument } from "../src/lib/markdown";
import { diff } from "jest-diff";

// テストファイルを読み込み
const testContent = readFileSync("./test/admonition-input.md", "utf8");
// 期待されるASTを読み込み
const expectedAst = JSON.parse(
  readFileSync("./test/admonition-output.json", "utf8")
);

console.log("=== Original Markdown ===");
console.log(testContent);
console.log("\n");

// MarkdownDocumentを作成
const doc = new MarkdownDocument(testContent);

function normalizeAst(ast: any): any {
  if (Array.isArray(ast)) {
    return ast.map(normalizeAst);
  }

  if (ast && typeof ast === "object") {
    const normalized: any = {};

    // 重要なプロパティのみを保持
    const importantProps = [
      "type",
      "admonitionType",
      "depth",
      "title",
      "value",
      "lang",
      "spread",
    ];

    for (const key of importantProps) {
      if (ast.hasOwnProperty(key)) {
        normalized[key] = ast[key];
      }
    }

    // childrenプロパティがある場合は再帰的に処理
    if (ast.children && Array.isArray(ast.children)) {
      normalized.children = ast.children.map(normalizeAst);
    }

    return normalized;
  }

  return ast;
}

console.log("=== Processed AST ===");
console.log(JSON.stringify(normalizeAst(doc.contentAst), null, 2));
console.log("\n");

// ヘッダー情報を表示
console.log("=== Headings ===");
for (const heading of doc.getHeadings()) {
  console.log(`Level ${heading.level}: ${heading.text} (ID: ${heading.id})`);
}

console.log("\n=== AST Comparison ===");

// ASTを正規化
const normalizedActual = normalizeAst(doc.contentAst);
const normalizedExpected = normalizeAst(expectedAst);

// 差分を表示
if (JSON.stringify(normalizedExpected) !== JSON.stringify(normalizedActual)) {
  console.log("❌ AST does not match expected structure:");
  const diffResult = diff(normalizedExpected, normalizedActual, {
    expand: false,
    contextLines: 3,
    includeChangeCounts: true,
  });
  console.log(diffResult);
} else {
  console.log("✅ AST matches expected structure perfectly!");
}
