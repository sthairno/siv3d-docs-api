import { toMarkdown as astToMarkdown } from "mdast-util-to-markdown";
import { RootContent as AstRootContent, Root } from "mdast";
import assert from "assert";
import { MarkdownDocument, MarkdownHeading } from "./markdown";
import { mkdocsAdmonitionToMarkdown } from "./mkdocs-admonition";

const SPLIT_HEADING_LEVEL = 2; // Normal heading level to split sections

export class Section {
  private _document: MarkdownDocument;
  private _heading: MarkdownHeading;

  public _contentStartIndex: number;
  public _contentEndIndex: number;

  constructor(options: {
    document: MarkdownDocument;
    heading: MarkdownHeading;
    contentRange: { start: number; end: number };
  }) {
    this._document = options.document;
    this._heading = options.heading;

    assert(
      0 <= options.contentRange.start &&
        options.contentRange.start <= this._document.contentAst.length
    );
    assert(
      0 <= options.contentRange.end &&
        options.contentRange.end <= this._document.contentAst.length
    );
    this._contentStartIndex = options.contentRange.start;
    this._contentEndIndex = options.contentRange.end;
  }

  get id(): string {
    return this._heading.id;
  }

  get document(): MarkdownDocument {
    return this._document;
  }

  get heading(): MarkdownHeading {
    return this._heading;
  }

  get contentRange(): { start: number; end: number } | null {
    if (this._contentStartIndex >= this._contentEndIndex) {
      return null;
    }
    return { start: this._contentStartIndex, end: this._contentEndIndex };
  }

  set contentRange(value: { start: number; end: number }) {
    assert(0 <= value.start && value.start <= this._document.contentAst.length);
    assert(0 <= value.end && value.end <= this._document.contentAst.length);
    this._contentStartIndex = value.start;
    this._contentEndIndex = value.end;
  }

  hasContent(): boolean {
    return this._contentStartIndex < this._contentEndIndex;
  }

  getContentAst(): AstRootContent[] {
    const range = this.contentRange;
    if (!range) {
      return [];
    }
    return this._document.contentAst.slice(range.start, range.end);
  }

  getContentAstLength(): number {
    const range = this.contentRange;
    if (!range) {
      return 0;
    }
    return range.end - range.start;
  }

  getContentMarkdown(): string {
    const tree: Root = {
      type: "root",
      children: this.getContentAst(),
    };
    return astToMarkdown(tree, { extensions: [mkdocsAdmonitionToMarkdown] });
  }

  clone(): Section {
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

export function splitSectionIntoSections(
  src: Section,
  maxLevel: number
): Section[] {
  const document = src.document;
  const srcContentRange = src.contentRange;

  let sections: Section[] = [src.clone()];

  if (srcContentRange === null) {
    return sections;
  }

  let nextHeading = src.heading.next;
  while (nextHeading && nextHeading.astIndex < srcContentRange.end) {
    const currentSection = sections.at(-1)!;
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
  sections = sections.filter(
    (section, index) => section.hasContent() || index === 0 // srcが既に空の可能性があるので1つ目は残す
  );

  return sections;
}

export function splitMarkdownIntoSections(
  document: MarkdownDocument,
  contentMaxLength: number
): Section[] {
  const rootSection = new Section({
    document: document,
    heading: document.firstHeading!,
    contentRange: {
      start: document.firstHeading!.astIndex + 1,
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
