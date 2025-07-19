import { Hono } from "hono";
import { StreamableHTTPTransport } from "@hono/mcp";
import { createMcpServer } from "./controllers/mcp";
import restServer from "./controllers/rest";

const app = new Hono();

app.all("/mcp", async (c) => {
  const mcpServer = createMcpServer();
  const transport = new StreamableHTTPTransport();
  await mcpServer.connect(transport);
  return transport.handleRequest(c);
});
app.route("/api", restServer);

app.get("/", (c) => c.redirect("https://siv3d.github.io/"));

export default app;
