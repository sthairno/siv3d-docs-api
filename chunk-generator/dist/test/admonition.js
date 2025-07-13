"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const markdown_1 = require("../src/lib/markdown");
const jest_diff_1 = require("jest-diff");
// テストファイルを読み込み
const testContent = (0, fs_1.readFileSync)("./test/admonition-input.md", "utf8");
// 期待されるASTを読み込み
const expectedAst = JSON.parse((0, fs_1.readFileSync)("./test/admonition-output.json", "utf8"));
console.log("=== Original Markdown ===");
console.log(testContent);
console.log("\n");
// MarkdownDocumentを作成
const doc = new markdown_1.MarkdownDocument(testContent, {
    retrieveCodeBlocks: false,
});
function normalizeAst(ast) {
    if (Array.isArray(ast)) {
        return ast.map(normalizeAst);
    }
    if (ast && typeof ast === "object") {
        const normalized = {};
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
    const diffResult = (0, jest_diff_1.diff)(normalizedExpected, normalizedActual, {
        expand: false,
        contextLines: 3,
        includeChangeCounts: true,
    });
    console.log(diffResult);
}
else {
    console.log("✅ AST matches expected structure perfectly!");
}
