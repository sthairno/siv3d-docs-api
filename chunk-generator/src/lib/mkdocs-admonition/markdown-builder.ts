import { Handle, Options } from "mdast-util-to-markdown";
import { MkdocsAdmonition } from "./types";

const mkdocsAdmonitionHandle: Handle = (
  node: MkdocsAdmonition,
  parent,
  context,
  info,
) => {
  let header = "";
  header += node.collapsible ? "???" : "!!!";
  if (node.expandDefault) header += "+";
  header += ` ${node.admonitionType}`;
  if (node.title) header += ` "${node.title}"`;
  header += "\n";

  const content = node.children
    .map((child) =>
      context.indentLines(
        context.handle(child, node, context, info),
        (line, _, blank) => (blank ? "" : "    ") + line,
      ),
    )
    .join("\n");

  return header + content;
};

export const mkdocsAdmonitionToMarkdown: Options = {
  handlers: {
    mkdocsAdmonition: mkdocsAdmonitionHandle,
  },
};
