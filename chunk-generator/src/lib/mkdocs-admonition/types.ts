import { Parent } from "mdast";

declare module "micromark-util-types" {
  interface TokenTypeMap {
    mkdocsAdmonition: "mkdocsAdmonition";
    mkdocsAdmonitionMarker: "mkdocsAdmonitionMarker";
    mkdocsAdmonitionHeader: "mkdocsAdmonitionHeader";
    mkdocsAdmonitionType: "mkdocsAdmonitionType";
    mkdocsAdmonitionTitle: "mkdocsAdmonitionTitle";
    mkdocsAdmonitionIndent: "mkdocsAdmonitionIndent";
  }
}

declare module "mdast-util-to-markdown" {
  interface ConstructNameMap {
    mkdocsAdmonition: "mkdocsAdmonition";
  }
}

declare module "mdast" {
  interface RootContentMap {
    mkdocsAdmonition: MkdocsAdmonition;
  }
}

const ADMONITION_PREDEFINED_TYPES = [
  "note",
  "abstract",
  "info",
  "tip",
  "success",
  "question",
  "warning",
  "failure",
  "danger",
  "bug",
  "example",
  "quote",
] as const;

export type AdmonitionType =
  | (typeof ADMONITION_PREDEFINED_TYPES)[number]
  | string;

// Admonitionノードの型
export interface MkdocsAdmonition extends Parent {
  type: "mkdocsAdmonition";
  admonitionType: AdmonitionType;
  collapsible: boolean;
  expandDefault: boolean;
  title: string | null;
}
