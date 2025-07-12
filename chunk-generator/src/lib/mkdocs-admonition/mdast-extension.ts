import {
  Extension as MdAstExtension,
  CompileContext,
  Token,
} from "mdast-util-from-markdown";
import { AdmonitionType } from "./types";

export const mkdocsAdmonitionFromMarkdown: MdAstExtension = {
  enter: {
    mkdocsAdmonition: enterAdmonition,
  },
  exit: {
    mkdocsAdmonition: exitAdmonition,
    mkdocsAdmonitionMarker: exitAdmonitionMarker,
    mkdocsAdmonitionType: exitAdmonitionType,
    mkdocsAdmonitionTitle: exitAdmonitionTitle,
  },
};

function enterAdmonition(this: CompileContext, token: Token) {
  this.enter(
    {
      type: "mkdocsAdmonition",
      admonitionType: "note",
      collapsible: false,
      expandDefault: false,
      title: null,
      children: [],
    },
    token,
  );
}

function exitAdmonition(this: CompileContext, token: Token) {
  this.exit(token);
}

function exitAdmonitionMarker(this: CompileContext, token: Token) {
  const marker = this.sliceSerialize(token);
  const admonitionNode = this.stack[this.stack.length - 1];
  if (admonitionNode.type === "mkdocsAdmonition") {
    admonitionNode.collapsible = marker.startsWith("?");
    admonitionNode.expandDefault = marker.endsWith("+");
  }
}

function exitAdmonitionType(this: CompileContext, token: Token) {
  const type = this.sliceSerialize(token);
  const admonitionNode = this.stack[this.stack.length - 1];
  if (admonitionNode.type === "mkdocsAdmonition") {
    admonitionNode.admonitionType = type as AdmonitionType;
  }
}

function exitAdmonitionTitle(this: CompileContext, token: Token) {
  const title = this.sliceSerialize(token);
  const admonitionNode = this.stack[this.stack.length - 1];
  if (admonitionNode.type === "mkdocsAdmonition") {
    admonitionNode.title = title.slice(1, -1);
  }
}
