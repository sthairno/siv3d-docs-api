import { fromMarkdown as markdownToAst } from "mdast-util-from-markdown";
import { toString as astToString } from "mdast-util-to-string";
import {
  Root as AstRoot,
  RootContent as AstRootContent,
  Html as AstHtml,
  TableCell,
  TableRow,
  ListItem,
  BlockContent,
  DefinitionContent,
  PhrasingContent,
} from "mdast";
import assert from "assert";
import { generateMkdocsHeadingId } from "./utils";
import {
  mkdocsAdmonitionFromMarkdown,
  mkdocsAdmonition,
} from "./mkdocs-admonition";

export class MarkdownHeading {
  astIndex: number;
  id: string;
  text: string;
  level: number;
  owner: MarkdownHeading | null;
  next: MarkdownHeading | null;
  nextSibling: MarkdownHeading | null;

  constructor(options: {
    astIndex: number;
    id: string;
    text: string;
    level: number;
    owner?: MarkdownHeading;
    next?: MarkdownHeading;
    nextSibling?: MarkdownHeading;
  }) {
    this.astIndex = options.astIndex;
    this.id = options.id;
    this.text = options.text;
    this.level = options.level;
    this.owner = options.owner ?? null;
    this.next = options.next ?? null;
    this.nextSibling = options.nextSibling ?? null;
  }

  getHeadingStack(): Array<MarkdownHeading | null> {
    const stack: Array<MarkdownHeading | null> = new Array(this.level);
    stack.fill(null);

    let current: MarkdownHeading | null = this;
    do {
      stack[current.level - 1] = current;
      current = current.owner;
    } while (current !== null);

    return stack;
  }
}

export interface MarkdownCodeBlock {
  id: string;
  language: string | null;
  content: string;
}

type NodeType =
  | AstRootContent
  | PhrasingContent
  | BlockContent
  | DefinitionContent
  | ListItem
  | TableRow
  | TableCell;

export class MarkdownDocument {
  private _ast: AstRoot;
  private _firstHeading: MarkdownHeading | null;
  private _codeBlocks: MarkdownCodeBlock[];

  constructor(content: string, options?: { retrieveCodeBlocks?: boolean }) {
    this._ast = markdownToAst(content, {
      extensions: [mkdocsAdmonition],
      mdastExtensions: [mkdocsAdmonitionFromMarkdown],
    });

    this._firstHeading = null;
    this._codeBlocks = [];

    this.retrieveHeadings();
    if (options?.retrieveCodeBlocks ?? true) {
      this.retrieveCodeBlocks();
    }
  }

  get contentAst(): AstRootContent[] {
    return this._ast.children;
  }

  get firstHeading(): MarkdownHeading | null {
    return this._firstHeading;
  }

  get codeBlocks(): ReadonlyArray<MarkdownCodeBlock> {
    return this._codeBlocks;
  }

  *getHeadings(): Generator<MarkdownHeading> {
    let current = this.firstHeading;
    while (current) {
      yield current;
      current = current.next;
    }
  }

  private retrieveHeadings(): void {
    const idCounts: Map<string, number> = new Map();

    let stack: MarkdownHeading[] = [];

    for (const [index, node] of this.contentAst.entries()) {
      if (node.type !== "heading") {
        continue;
      }

      // ヘッダーをASTから生成
      const headingLevel = node.depth;
      const headingText = astToString(node.children, {
        includeHtml: false,
      });
      const headingId = generateMkdocsHeadingId(headingText);
      const headingNumber = idCounts.get(headingId) ?? 0;
      const heading = new MarkdownHeading({
        astIndex: index,
        id: headingNumber > 0 ? `${headingId}_${headingNumber}` : headingId,
        text: headingText,
        level: headingLevel,
        owner: stack.findLast((h: MarkdownHeading) => h.level < headingLevel),
      });

      // ヘッダーIDの重複を防ぐために、ヘッダーIDの重複をカウントする
      idCounts.set(headingId, headingNumber + 1);

      // 同じ階層のヘッダーが過去にあれば、nextSiblingに設定する
      const prevSibling = stack.findLast(
        (h: MarkdownHeading) => h.level === headingLevel
      );
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
      while (
        stack.length > 0 &&
        stack[stack.length - 1].level >= headingLevel
      ) {
        stack.pop();
      }
      stack.push(heading);
    }

    assert(this._firstHeading !== null);
  }

  private retrieveCodeBlocks(): void {
    const idCounts: Map<string, number> = new Map();

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

  private processCodeBlock(
    node: NodeType,
    headingId: string,
    idCounts: Map<string, number>
  ): void {
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
      const newNode: AstHtml = {
        type: "html" as const,
        value: `<code-block id="${codeId}">`,
      };
      Object.assign(node, newNode);
    } else if ("children" in node && Array.isArray(node.children)) {
      // Parentノードの場合は子要素を再帰的に処理
      for (const child of node.children) {
        this.processCodeBlock(child, headingId, idCounts);
      }
    }
  }
}
