import * as fs from "fs";
import * as path from "path";

const DOCS_BASE_URL = "https://siv3d.github.io";

interface MarkdownEntry {
  docsUrl: string;
  filePath: string;
  route: string[];
}

export function* walkSiv3dDocsMarkdowns(
  repoDirectory: string,
  language: string,
): Generator<MarkdownEntry> {
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
      if (entry.name !== "index.md") route.push(entry.name.slice(0, -3));

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
export function generateMkdocsHeadingId(heading: string): string {
  const id = heading
    .normalize("NFC") // Normalize Unicode
    .replace(/<\/?[^>]*>/g, "") // Strip HTML tags (e.g., "<Type>" becomes empty string)
    .trim() // Strip leading and trailing whitespace
    .toLowerCase() // Convert to lowercase
    .replace(/[^\p{L}\p{N}_\- ]/gu, "") // Keep Unicode letters, digits, underscore, space, and dash
    .replace(/ /g, "-"); // Convert spaces to dashes
  return id;
}
