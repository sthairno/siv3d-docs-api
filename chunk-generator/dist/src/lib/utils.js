"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.walkSiv3dDocsMarkdowns = walkSiv3dDocsMarkdowns;
exports.generateMkdocsHeadingId = generateMkdocsHeadingId;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DOCS_BASE_URL = "https://siv3d.github.io";
function* walkSiv3dDocsMarkdowns(repoDirectory, language) {
    if (!fs.existsSync(repoDirectory)) {
        throw new Error(`Docs directory not found: ${repoDirectory}`);
    }
    const mkdocsDir = path.join(repoDirectory, language, "docs");
    for (const entry of fs.readdirSync(mkdocsDir, {
        withFileTypes: true,
        recursive: true,
    })) {
        if (entry.isFile() && entry.name.endsWith(".md")) {
            const route = [
                language,
                ...path
                    .relative(mkdocsDir, entry.parentPath)
                    .split(path.sep)
                    .filter((p) => p !== ""),
            ];
            if (entry.name !== "index.md")
                route.push(entry.name.slice(0, -3));
            yield {
                docsUrl: `${DOCS_BASE_URL}/${route.join("/")}`,
                filePath: path.join(entry.parentPath, entry.name),
                route,
            };
        }
    }
}
/**
 * Implementation based on pymdownx.slugs.slugify used by Siv3D's mkdocs configuration
 * @see {@link https://github.com/facelessuser/pymdown-extensions/blob/f64422f87c05031a8c8d62b1988bf76e8f65f27f/pymdownx/slugs.py#L36-L56}
 * @see {@link https://github.com/Siv3D/siv3d.docs/blob/0796a4eb44ebf36dd88301f04fb22960ec139743/ja-jp/mkdocs.yml#L50-L52}
 */
function generateMkdocsHeadingId(heading) {
    const id = heading
        .normalize("NFC") // Normalize Unicode
        .replace(/<\/?[^>]*>/g, "") // Strip HTML tags (e.g., "<Type>" becomes empty string)
        .trim() // Strip leading and trailing whitespace
        .toLowerCase() // Convert to lowercase
        .replace(/[^\p{L}\p{N}_\- ]/gu, "") // Keep Unicode letters, digits, underscore, space, and dash
        .replace(/ /g, "-"); // Convert spaces to dashes
    return id;
}
