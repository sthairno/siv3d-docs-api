"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section = void 0;
exports.splitSectionIntoSections = splitSectionIntoSections;
exports.splitMarkdownIntoSections = splitMarkdownIntoSections;
const mdast_util_to_markdown_1 = require("mdast-util-to-markdown");
const assert_1 = __importDefault(require("assert"));
const mkdocs_admonition_1 = require("./mkdocs-admonition");
const SPLIT_HEADING_LEVEL = 2; // Normal heading level to split sections
class Section {
    _document;
    _heading;
    _contentStartIndex;
    _contentEndIndex;
    constructor(options) {
        this._document = options.document;
        this._heading = options.heading;
        (0, assert_1.default)(0 <= options.contentRange.start &&
            options.contentRange.start <= this._document.contentAst.length);
        (0, assert_1.default)(0 <= options.contentRange.end &&
            options.contentRange.end <= this._document.contentAst.length);
        this._contentStartIndex = options.contentRange.start;
        this._contentEndIndex = options.contentRange.end;
    }
    get id() {
        return this._heading.id;
    }
    get document() {
        return this._document;
    }
    get heading() {
        return this._heading;
    }
    get contentRange() {
        if (this._contentStartIndex >= this._contentEndIndex) {
            return null;
        }
        return { start: this._contentStartIndex, end: this._contentEndIndex };
    }
    set contentRange(value) {
        (0, assert_1.default)(0 <= value.start && value.start <= this._document.contentAst.length);
        (0, assert_1.default)(0 <= value.end && value.end <= this._document.contentAst.length);
        this._contentStartIndex = value.start;
        this._contentEndIndex = value.end;
    }
    hasContent() {
        return this._contentStartIndex < this._contentEndIndex;
    }
    getContentAst() {
        const range = this.contentRange;
        if (!range) {
            return [];
        }
        return this._document.contentAst.slice(range.start, range.end);
    }
    getContentAstLength() {
        const range = this.contentRange;
        if (!range) {
            return 0;
        }
        return range.end - range.start;
    }
    getContentMarkdown() {
        const tree = {
            type: "root",
            children: this.getContentAst(),
        };
        return (0, mdast_util_to_markdown_1.toMarkdown)(tree, { extensions: [mkdocs_admonition_1.mkdocsAdmonitionToMarkdown] });
    }
    clone() {
        return new Section({
            document: this._document,
            heading: this._heading,
            contentRange: {
                start: this._contentStartIndex,
                end: this._contentEndIndex,
            },
        });
    }
}
exports.Section = Section;
function splitSectionIntoSections(src, maxLevel) {
    const document = src.document;
    const srcContentRange = src.contentRange;
    let sections = [src.clone()];
    if (srcContentRange === null) {
        return sections;
    }
    let nextHeading = src.heading.next;
    while (nextHeading && nextHeading.astIndex < srcContentRange.end) {
        const currentSection = sections.at(-1);
        const currentContentRange = currentSection.contentRange;
        if (currentContentRange === null) {
            break;
        }
        if (nextHeading.level <= maxLevel) {
            const newSection = new Section({
                document,
                heading: nextHeading,
                contentRange: { start: 0, end: 0 },
            });
            currentSection.contentRange = {
                start: currentContentRange.start,
                end: nextHeading.astIndex,
            };
            newSection.contentRange = {
                start: nextHeading.astIndex + 1,
                end: currentContentRange.end,
            };
            sections.push(newSection);
        }
        nextHeading = nextHeading.next;
    }
    // 空のセクションを削除
    sections = sections.filter((section, index) => section.hasContent() || index === 0 // srcが既に空の可能性があるので1つ目は残す
    );
    return sections;
}
function splitMarkdownIntoSections(document, contentMaxLength) {
    const rootSection = new Section({
        document: document,
        heading: document.firstHeading,
        contentRange: {
            start: document.firstHeading.astIndex + 1,
            end: document.contentAst.length,
        },
    });
    if (rootSection.getContentMarkdown().length <= contentMaxLength) {
        return [rootSection];
    }
    // 1. セクションに分割する
    let sections = splitSectionIntoSections(rootSection, SPLIT_HEADING_LEVEL);
    // 2. コンテンツが長すぎるセクションをさらに分割する
    sections = sections.flatMap((section) => {
        if (section.getContentMarkdown().length > contentMaxLength) {
            return splitSectionIntoSections(section, SPLIT_HEADING_LEVEL + 1);
        }
        return [section];
    });
    return sections;
}
