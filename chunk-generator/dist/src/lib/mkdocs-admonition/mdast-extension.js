"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mkdocsAdmonitionFromMarkdown = void 0;
exports.mkdocsAdmonitionFromMarkdown = {
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
function enterAdmonition(token) {
    this.enter({
        type: "mkdocsAdmonition",
        admonitionType: "note",
        collapsible: false,
        expandDefault: false,
        title: null,
        children: [],
    }, token);
}
function exitAdmonition(token) {
    this.exit(token);
}
function exitAdmonitionMarker(token) {
    const marker = this.sliceSerialize(token);
    const admonitionNode = this.stack[this.stack.length - 1];
    if (admonitionNode.type === "mkdocsAdmonition") {
        admonitionNode.collapsible = marker.startsWith("?");
        admonitionNode.expandDefault = marker.endsWith("+");
    }
}
function exitAdmonitionType(token) {
    const type = this.sliceSerialize(token);
    const admonitionNode = this.stack[this.stack.length - 1];
    if (admonitionNode.type === "mkdocsAdmonition") {
        admonitionNode.admonitionType = type;
    }
}
function exitAdmonitionTitle(token) {
    const title = this.sliceSerialize(token);
    const admonitionNode = this.stack[this.stack.length - 1];
    if (admonitionNode.type === "mkdocsAdmonition") {
        admonitionNode.title = title.slice(1, -1);
    }
}
