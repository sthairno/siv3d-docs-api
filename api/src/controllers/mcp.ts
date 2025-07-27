import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { structuredSearch } from "../lib/algolia";
import { getDocsCodeblock, getDocsMarkdown } from "../lib/storage";

export function createMcpServer() {
  const server = new McpServer({
    name: "siv3d-docs",
    version: "1.0.0",
  });

  server.registerTool(
    "search_siv3d_docs",
    {
      title: "Search the Siv3D Documentation",
      description: `Search Siv3D documentation. Results are returned in Markdown format, split into small sections.

**Searchable Categories**:
- **Tutorials** (Chapters 1-81): Progressive learning from basics to advanced
  - Basic Operations (Chapters 1-20): Hello World, shape drawing, input handling, animation
  - Applied Features (Chapters 21-40): Arrays, shape manipulation, GUI, textures, video, fonts
  - Advanced Features (Chapters 41-60): Audio, physics, file system, scene management
  - Practical Features (Chapters 61-80): HTTP communication, image processing, networking, AI integration
- **Sample Collections**: Games, applications, shape drawing, UI, audio, 3D, physics simulation, etc.
- **Courses**: Practical projects (calculator, radar chart, UI creation, etc.)
- **API**: Class listings and references
- **Articles**: Development tips, best practices
- **Tools**: Development support tools (palette browser, emoji search, easing functions, etc.)
- **Development Guides**: Build instructions, contribution guidelines, coding style

**Effective Search Query Writing**:
1. **Specific Feature Names**: 
   - English: "draw circle", "array", "texture", "physics simulation"
   - Japanese: "円を描く", "配列", "テクスチャ", "物理演算"
2. **Class Names**: 
   - English/Japanese: "Circle", "Array", "Texture", "Physics2D"
3. **Use Cases and Purposes**: 
   - English: "game development", "image processing", "audio playback", "network communication"
   - Japanese: "ゲーム開発", "画像処理", "音声再生", "ネットワーク通信"
4. **Technical Concepts**: 
   - English: "asynchronous processing", "shader", "render texture", "effect"
   - Japanese: "非同期処理", "シェーダー", "レンダーテクスチャ", "エフェクト"

**Important**: Always match the language of the lang parameter with the q parameter.
- For Japanese searches: lang: "ja-jp"
- For English searches: lang: "en-us"`,
      inputSchema: {
        q: z
          .string()
          .describe(
            "Search query. Include specific feature names, class names, use cases, etc."
          ),
        lang: z
          .enum(["en-us", "ja-jp"])
          .default("ja-jp")
          .describe(
            "Search language. Must match the language of the q parameter."
          ),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async ({ q, lang }) => ({
      content: [
        {
          type: "text",
          text: await structuredSearch(q, lang),
        },
      ],
    })
  );

  server.registerTool(
    "read_siv3d_docs_full_text",
    {
      title: "Read Siv3D Documentation Full Text",
      description: `Read the complete Markdown text of the specified documentation page.

**Use Cases**:
- When you want to read the complete content of a page found in search results
- When you want to understand the overall structure of a specific page
- When you want to understand the context before and after code blocks
- When you want to check the table of contents or navigation structure of the entire page
- When you want to review all sections of a page in order

**URL Format**:
- Japanese: https://siv3d.github.io/ja-jp/tutorial/hello/
- English: https://siv3d.github.io/en-us/tutorial/hello/
- Subsection: https://siv3d.github.io/ja-jp/tutorial/hello#12-改造例`,
      inputSchema: {
        url: z
          .string()
          .describe(
            "siv3d.github.io documentation page URL. Example: https://siv3d.github.io/ja-jp/tutorial/hello/"
          ),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async ({ url }) => {
      const maybeDocsUrl = URL.parse(url);
      if (!maybeDocsUrl || maybeDocsUrl.origin !== "https://siv3d.github.io") {
        throw new Error(`Invalid URL: ${url}`);
      }

      const route = maybeDocsUrl.pathname
        .split("/")
        .slice(1) // pathname starts with "/"
        .map(decodeURIComponent);
      if (route.at(-1) === "") {
        route.pop();
      }

      const markdown = await getDocsMarkdown(route);
      if (!markdown) {
        throw new Error(
          `Given documentation page ${maybeDocsUrl.href} not found`
        );
      }

      return {
        content: [
          {
            type: "text",
            text: markdown,
          },
        ],
      };
    }
  );

  server.registerTool(
    "read_siv3d_docs_code_block",
    {
      title: "Read Siv3D Documentation Code Block",
      description: `Read a code block with the specified ID. The ID can be obtained from search results.

**Use Cases**:
- When you want to get the complete code of a code block found in search results
- When you want to copy and paste specific sample code
- When you want to check the programming language information (C++, HLSL, etc.)
- When you want to compare multiple code blocks
- When you want to get pure code without surrounding explanatory text

**How to Get IDs**:
- Use code block IDs included in search results from search_siv3d_docs
- Examples: tutorial-hello_circle_001_code, array-basic_001_code, etc.

**Returned Information**:
- Code content

**Note**: IDs are language-specific. Code block IDs from Japanese pages cannot be used with English pages.`,
      inputSchema: {
        lang: z
          .enum(["en-us", "ja-jp"])
          .default("ja-jp")
          .describe(
            "Language of the code block. Must match the language of the page the ID belongs to."
          ),
        id: z
          .string()
          .describe("Code block ID. Can be obtained from search results."),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async ({ lang, id }) => {
      const codeblock = await getDocsCodeblock(
        lang as string,
        decodeURIComponent(id as string)
      );
      if (!codeblock) {
        throw new Error(`Given code block "${id}" not found`);
      }
      return {
        content: [
          {
            type: "text",
            text: codeblock.content,
            _meta: codeblock.language
              ? {
                  lang: codeblock.language,
                }
              : undefined,
          },
        ],
      };
    }
  );

  return server;
}
