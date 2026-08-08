import { z } from "zod";
import { jsonResult, errorResult } from "../respond.js";

export function registerPricesTools(server, client) {
  server.registerTool(
    "wb_prices_list",
    {
      title: "List Wildberries prices and discounts",
      description:
        "List current prices and discounts for the seller's goods, paginated. Each item includes nmID, " +
        "vendorCode, price, discount, and the resulting club/customer price.",
      inputSchema: {
        limit: z.number().int().min(1).max(1000).default(100).describe("Items per page"),
        offset: z.number().int().min(0).default(0).describe("Items to skip"),
        filter_nm_id: z.number().int().optional().describe("Restrict to a single WB article (nmID)")
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ limit, offset, filter_nm_id }) => {
      try {
        const data = await client.request("prices", "/api/v2/list/goods/filter", {
          query: { limit, offset, ...(filter_nm_id ? { filterNmID: filter_nm_id } : {}) }
        });
        return jsonResult(data);
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "wb_prices_update",
    {
      title: "Update Wildberries prices and discounts",
      description:
        "Submit new prices and/or discounts for up to 1000 products in one request. Returns an uploadId - use " +
        "`wb_prices_get_upload_status` to check whether Wildberries accepted the changes, since processing is async.",
      inputSchema: {
        updates: z
          .array(
            z.object({
              nmID: z.number().int().describe("Wildberries article number (nmID)"),
              price: z.number().int().positive().optional().describe("New price in rubles (whole number)"),
              discount: z.number().int().min(0).max(99).optional().describe("New discount percent (0-99)")
            })
          )
          .min(1)
          .max(1000)
          .describe("Up to 1000 {nmID, price?, discount?} updates; at least one of price/discount per item")
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true }
    },
    async ({ updates }) => {
      try {
        const data = await client.request("prices", "/api/v2/upload/task", {
          method: "POST",
          body: { data: updates }
        });
        return jsonResult(data);
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "wb_prices_get_upload_status",
    {
      title: "Get Wildberries price upload status",
      description:
        "Check the processing status of a previous `wb_prices_update` call, and see per-item errors if any updates " +
        "were rejected.",
      inputSchema: {
        upload_id: z.number().int().describe("uploadId returned by wb_prices_update")
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ upload_id }) => {
      try {
        const data = await client.request("prices", "/api/v2/history/goods/task", {
          query: { uploadID: upload_id }
        });
        return jsonResult(data);
      } catch (error) {
        return errorResult(error);
      }
    }
  );
}
