# wb-mcp

An MCP (Model Context Protocol) server that exposes the [Wildberries Seller API](https://dev.wildberries.ru/)
as tools for AI agents: product cards (Content), prices & discounts, orders & FBS stocks (Marketplace),
sales/stock statistics, and advertising campaigns (Advert).

## Setup

```bash
cd wb-mcp
npm install
cp .env.example .env   # then fill in WB_API_KEY
```

Get an API token from the Wildberries seller portal: **profile → Settings → Access to API**.
Generate a token with the scopes matching the tool groups you plan to use (Content, Prices,
Marketplace, Statistics, Promotion/Advert).

## Register with Claude Code

Run locally (adjust the path to wherever you cloned this repo):

```bash
claude mcp add wildberries -- node /absolute/path/to/appmagaimanager/wb-mcp/index.js
```

On Windows:

```powershell
claude mcp add wildberries -- node C:\path\to\appmagaimanager\wb-mcp\index.js
```

`WB_API_KEY` needs to be available in the environment the server runs in — either export it in your
shell profile, or add it to Claude Code's MCP server env config for `wildberries`.

## Tool groups

| Group | Examples |
|---|---|
| Content | `wb_content_list_cards`, `wb_content_create_cards`, `wb_content_update_cards` |
| Prices | `wb_prices_list`, `wb_prices_update`, `wb_prices_get_upload_status` |
| Marketplace | `wb_orders_list`, `wb_orders_cancel`, `wb_stocks_update_warehouse`, `wb_supplies_create` |
| Statistics | `wb_stats_incomes`, `wb_stats_stocks`, `wb_stats_orders`, `wb_stats_sales`, `wb_stats_detail_report` |
| Advert | `wb_advert_list_campaigns`, `wb_advert_get_stats`, `wb_advert_start`, `wb_advert_pause`, `wb_advert_stop`, `wb_advert_update_cpm` |

Each category talks to its own Wildberries host (`content-api`, `discounts-prices-api`,
`marketplace-api`, `statistics-api`, `advert-api`.wildberries.ru); override any of them via
`WB_CONTENT_API_URL`, `WB_PRICES_API_URL`, `WB_MARKETPLACE_API_URL`, `WB_STATISTICS_API_URL`,
`WB_ADVERT_API_URL` if Wildberries changes a host.

## Manual test

```bash
npx @modelcontextprotocol/inspector node index.js
```
