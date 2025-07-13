"use strict";
// 目的：
// Siv3DのドキュメントをAlgoliaで検索しやすい分割データにする
// ゴール：
// siv3d.docsのディレクトリを探索して、各Markdownファイルをセクションに分割したJSONを生成する
// 条件：
// - yarn runで実行できること
// - ファイル出力はせず、生成したJSONを標準出力のみすること
// - 実行開始時に、siv3d.docsの中身が存在するか確認すること (git submoduleの実行忘れを防ぐため)
// - 配列はen-usとja-jpで別々になるため、コマンドの引数で言語を指定できるようにすること
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const utils_1 = require("./lib/utils");
const schema_1 = require("../schema");
const chunks_1 = require("./lib/chunks");
const markdown_1 = require("./lib/markdown");
const minimist_1 = __importDefault(require("minimist"));
function parseDisableAudit(value) {
    if (value === undefined)
        return false;
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
    }
    return false;
}
function auditChunks(chunks) {
    let chunkIdx = 0;
    // スキーマ通りの出力になっているか確認
    try {
        for (chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
            schema_1.ChunkSchema.parse(chunks[chunkIdx]);
        }
    }
    catch (error) {
        console.error(`Error at chunk index ${chunkIdx}:`, JSON.stringify(chunks[chunkIdx]));
        throw new Error("Invalid chunk data structure");
    }
    // チャンクIDがユニークであることを確認
    const ids = new Set();
    for (const chunk of chunks) {
        if (ids.has(chunk.objectID)) {
            throw new Error(`Duplicate chunk ID found: ${chunk.objectID}`);
        }
        ids.add(chunk.objectID);
    }
}
function auditCodeBlocks(codeBlocks) {
    const ids = new Set();
    for (const codeBlock of codeBlocks) {
        if (ids.has(codeBlock.id)) {
            throw new Error(`Duplicate code block ID found: ${codeBlock.id}`);
        }
        ids.add(codeBlock.id);
    }
}
function main() {
    // Parse command line arguments using minimist
    const argv = (0, minimist_1.default)(process.argv.slice(2), {
        string: [
            "siv3d-docs-path",
            "siv3d-docs-language",
            "chunks-output-path",
            "code-blocks-output-path",
        ],
    });
    // Get input values with environment variable priority (GitHub Actions support)
    const siv3dDocsPath = process.env.INPUT_SIV3D_DOCS_PATH || argv["siv3d-docs-path"];
    const siv3dDocsLanguage = process.env.INPUT_SIV3D_DOCS_LANGUAGE || argv["siv3d-docs-language"];
    const chunksOutputPath = process.env.INPUT_CHUNKS_OUTPUT_PATH || argv["chunks-output-path"];
    const codeBlocksOutputPath = process.env.INPUT_CODE_BLOCKS_OUTPUT_PATH || argv["code-blocks-output-path"];
    const disableAudit = parseDisableAudit(process.env.INPUT_DISABLE_AUDIT || argv["disable-audit"]);
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
        console.error(`Error: Invalid language. Available languages: ${validLanguages.join(", ")}`);
        process.exit(1);
    }
    try {
        const chunks = [];
        const codeBlocks = [];
        for (const { docsUrl, filePath, route } of (0, utils_1.walkSiv3dDocsMarkdowns)(siv3dDocsPath, siv3dDocsLanguage)) {
            const pageId = route.map((p) => p.toLowerCase()).join("-");
            const content = fs.readFileSync(filePath, "utf-8");
            const markdown = new markdown_1.MarkdownDocument(content, {
                idPrefix: pageId,
            });
            chunks.push(...(0, chunks_1.splitMarkdownIntoChunks)(markdown, docsUrl, pageId, schema_1.CONTENT_MAX_LENGTH));
            codeBlocks.push(...markdown.codeBlocks.map((src) => ({
                id: src.id,
                pageId: pageId,
                language: src.language,
                content: src.content,
            })));
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
    }
    catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}
if (require.main === module) {
    main();
}
