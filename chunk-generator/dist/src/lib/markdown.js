"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownDocument = exports.MarkdownHeading = void 0;
const mdast_util_from_markdown_1 = require("mdast-util-from-markdown");
const mdast_util_to_string_1 = require("mdast-util-to-string");
const assert_1 = __importDefault(require("assert"));
const utils_1 = require("./utils");
const mkdocs_admonition_1 = require("./mkdocs-admonition");
class MarkdownHeading {
    astIndex;
    id;
    text;
    level;
    owner;
    next;
    nextSibling;
    constructor(options) {
        this.astIndex = options.astIndex;
        this.id = options.id;
        this.text = options.text;
        this.level = options.level;
        this.owner = options.owner ?? null;
        this.next = options.next ?? null;
        this.nextSibling = options.nextSibling ?? null;
    }
    getHeadingStack() {
        const stack = new Array(this.level);
        stack.fill(null);
        let current = this;
        do {
            stack[current.level - 1] = current;
            current = current.owner;
        } while (current !== null);
        return stack;
    }
}
exports.MarkdownHeading = MarkdownHeading;
class MarkdownDocument {
    _ast;
    _firstHeading;
    _codeBlocks;
    _idPrefix;
    constructor(content, options) {
        this._ast = (0, mdast_util_from_markdown_1.fromMarkdown)(content, {
            extensions: [mkdocs_admonition_1.mkdocsAdmonition],
            mdastExtensions: [mkdocs_admonition_1.mkdocsAdmonitionFromMarkdown],
        });
        this._firstHeading = null;
        this._codeBlocks = [];
        this._idPrefix = options?.idPrefix ?? "";
        this.retrieveHeadings();
        if (options?.retrieveCodeBlocks ?? true) {
            this.retrieveCodeBlocks();
        }
    }
    get contentAst() {
        return this._ast.children;
    }
    get firstHeading() {
        return this._firstHeading;
    }
    get codeBlocks() {
        return this._codeBlocks;
    }
    *getHeadings() {
        let current = this.firstHeading;
        while (current) {
            yield current;
            current = current.next;
        }
    }
    retrieveHeadings() {
        const idCounts = new Map();
        let stack = [];
        for (const [index, node] of this.contentAst.entries()) {
            if (node.type !== "heading") {
                continue;
            }
            // ヘッダーをASTから生成
            const headingLevel = node.depth;
            const headingText = (0, mdast_util_to_string_1.toString)(node.children, {
                includeHtml: false,
            });
            const headingId = this._idPrefix + (0, utils_1.generateMkdocsHeadingId)(headingText);
            const headingNumber = idCounts.get(headingId) ?? 0;
            const heading = new MarkdownHeading({
                astIndex: index,
                id: headingNumber > 0 ? `${headingId}_${headingNumber}` : headingId,
                text: headingText,
                level: headingLevel,
                owner: stack.findLast((h) => h.level < headingLevel),
            });
            // ヘッダーIDの重複を防ぐために、ヘッダーIDの重複をカウントする
            idCounts.set(headingId, headingNumber + 1);
            // 同じ階層のヘッダーが過去にあれば、nextSiblingに設定する
            const prevSibling = stack.findLast((h) => h.level === headingLevel);
            if (prevSibling) {
                prevSibling.nextSibling = heading;
            }
            // 最初のヘッダーを設定する
            this._firstHeading ??= heading;
            // 前のヘッダーのnextに設定する
            const prevHeading = stack.at(-1);
            if (prevHeading) {
                prevHeading.next = heading;
            }
            // スタックを更新する
            while (stack.length > 0 &&
                stack[stack.length - 1].level >= headingLevel) {
                stack.pop();
            }
            stack.push(heading);
        }
        (0, assert_1.default)(this._firstHeading !== null);
    }
    retrieveCodeBlocks() {
        const idCounts = new Map();
        let currentHeading = this._firstHeading;
        while (currentHeading) {
            const nextHeading = currentHeading.next;
            const beginIndex = currentHeading.astIndex + 1;
            const endIndex = nextHeading?.astIndex ?? this.contentAst.length;
            for (let i = beginIndex; i < endIndex; i++) {
                this.processCodeBlock(this.contentAst[i], currentHeading.id, idCounts);
            }
            currentHeading = nextHeading;
        }
    }
    processCodeBlock(node, headingId, idCounts) {
        if (node.type === "code") {
            // コードブロックをASTから生成
            const count = idCounts.get(headingId) ?? 0;
            idCounts.set(headingId, count + 1);
            let codeId = `${headingId}_code`;
            if (count > 0) {
                codeId += `_${count}`;
            }
            this._codeBlocks.push({
                id: codeId,
                language: node.lang ?? null,
                content: node.value,
            });
            // ASTからコードブロックをID付きタグに置き換え
            const newNode = {
                type: "html",
                value: `<code-block id="${codeId}">`,
            };
            Object.assign(node, newNode);
        }
        else if ("children" in node && Array.isArray(node.children)) {
            // Parentノードの場合は子要素を再帰的に処理
            for (const child of node.children) {
                this.processCodeBlock(child, headingId, idCounts);
            }
        }
    }
}
exports.MarkdownDocument = MarkdownDocument;
