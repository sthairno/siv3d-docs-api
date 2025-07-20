import { Hono } from "hono";
import { structuredSearch } from "../lib/algolia";
import { getDocsCodeblock, getDocsMarkdown } from "../lib/storage";
import { zValidator } from "@hono/zod-validator";
import z from "zod";

const rest = new Hono();

const searchQuerySchema = z.object({
  q: z.string(),
  lang: z.enum(["ja-jp", "en-us"]),
});

rest.get(
  "/docs/search",
  zValidator("query", searchQuerySchema, (result, c) => {
    if (!result.success) {
      return c.text("query and lang are both required", 400);
    }
    if (result.data.q === "") {
      return c.text("query cannot be empty", 400);
    }
  }),
  async (c) => {
    const query = c.req.valid("query");
    const result = await structuredSearch(query.q, query.lang);
    return c.text(result, 200, {
      "Content-Type": "text/markdown; charset=utf-8",
    });
  }
);

const readMarkdownSchema = z.object({
  url: z.string().url(),
});

rest.get(
  "/docs/markdown",
  zValidator("query", readMarkdownSchema, (result, c) => {
    if (!result.success) {
      return c.text("url and lang are both required", 400);
    }
    if (!result.data.url.startsWith("https://siv3d.github.io/")) {
      return c.text("url must start with https://siv3d.github.io/", 400);
    }
  }),
  async (c) => {
    const query = c.req.valid("query");
    const parsedUrl = new URL(query.url);

    const route = parsedUrl.pathname.split("/").slice(1);
    if (route.at(-1) === "") {
      route.pop();
    }

    const markdown = await getDocsMarkdown(route);

    return markdown
      ? c.text(markdown, 200, {
          "Content-Type": "text/markdown; charset=utf-8",
        })
      : c.text("Not Found", 404);
  }
);

rest.get("/codeblock/:lang/:id", async (c) => {
  const lang = c.req.param("lang");
  const id = c.req.param("id");
  const codeblock = await getDocsCodeblock(lang, id);
  return codeblock
    ? c.text(codeblock.content, 200, {
        "Content-Type": "text/plain; charset=utf-8",
      })
    : c.text("Not Found", 404);
});

export default rest;
