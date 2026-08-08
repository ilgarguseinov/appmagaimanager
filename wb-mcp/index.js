#!/usr/bin/env node
import { fileURLToPath } from "url";
import path from "path";
import { config } from "dotenv";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, ".env") });

import { createWbClient } from "./src/wbClient.js";
import { registerContentTools } from "./src/tools/content.js";
import { registerPricesTools } from "./src/tools/prices.js";
import { registerMarketplaceTools } from "./src/tools/marketplace.js";
import { registerStatisticsTools } from "./src/tools/statistics.js";
import { registerAdvertTools } from "./src/tools/advert.js";

if (!process.env.WB_API_KEY) {
  console.error(
    "WARNING: WB_API_KEY is not set. Wildberries API tools will fail until it is provided " +
      "(see wb-mcp/.env.example)."
  );
}

const server = new McpServer({
  name: "wildberries-mcp-server",
  version: "1.0.0"
});

const client = createWbClient();

registerContentTools(server, client);
registerPricesTools(server, client);
registerMarketplaceTools(server, client);
registerStatisticsTools(server, client);
registerAdvertTools(server, client);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Wildberries MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error starting Wildberries MCP server:", error);
  process.exit(1);
});
