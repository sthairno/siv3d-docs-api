import { Hono } from "hono";
import { structuredSearch } from "../lib/algolia";
import { getDocsCodeblock } from "../lib/storage";
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
