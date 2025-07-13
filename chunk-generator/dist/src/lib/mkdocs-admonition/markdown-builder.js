"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mkdocsAdmonitionToMarkdown = void 0;
const mkdocsAdmonitionHandle = (node, parent, context, info) => {
    let header = "";
    header += node.collapsible ? "???" : "!!!";
    if (node.expandDefault)
        header += "+";
    header += ` ${node.admonitionType}`;
    if (node.title)
        header += ` "${node.title}"`;
    header += "\n";
    const content = node.children
        .map((child) => context.indentLines(context.handle(child, node, context, info), (line, _, blank) => (blank ? "" : "    ") + line))
        .join("\n");
    return header + content;
};
exports.mkdocsAdmonitionToMarkdown = {
    handlers: {
        mkdocsAdmonition: mkdocsAdmonitionHandle,
    },
};
