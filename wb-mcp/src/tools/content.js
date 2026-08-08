import { z } from "zod";
import { jsonResult, errorResult } from "../respond.js";

export function registerContentTools(server, client) {
  server.registerTool(
    "wb_content_list_cards",
    {
      title: "List Wildberries product cards",
      description:
        "List product cards (nomenclatures) from the Wildberries Content API, optionally filtered by text search. " +
        "Returns up to `limit` cards starting after `cursor_updated_at`/`cursor_nm_id` for pagination (use the " +
        "`cursor` object from the previous response's tail to get the next page).",
      inputSchema: {
        limit: z.number().int().min(1).max(100).default(100).describe("Max cards to return (max 100)"),
        text_search: z.string().optional().describe("Filter by vendor code, WB article, or title substring"),
        with_photo: z.union([z.literal(-1), z.literal(0), z.literal(1)]).optional()
          .describe("-1 = all, 0 = without photo, 1 = with photo"),
        cursor: z
          .object({
            updatedAt: z.string().optional().describe("ISO timestamp from previous response's cursor"),
            nmID: z.number().int().optional().describe("nmID from previous response's cursor")
          })
          .optional()
          .describe("Pagination cursor from the previous call's response.cursor")
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ limit, text_search, with_photo, cursor }) => {
      try {
        const data = await client.request("content", "/content/v2/get/cards/list", {
          method: "POST",
          body: {
            settings: {
              cursor: { limit, ...(cursor || {}) },
              filter: {
                withPhoto: with_photo ?? -1,
                ...(text_search ? { textSearch: text_search } : {})
              }
            }
          }
        });
        return jsonResult(data);
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "wb_content_get_card_by_vendor_code",
    {
      title: "Get Wildberries product card by vendor code",
      description:
        "Look up a single product card by the seller's own vendor code (артикул продавца). " +
        "Returns the full card including sizes, characteristics, and photos if found.",
      inputSchema: {
        vendor_code: z.string().min(1).describe("Seller's vendor code (артикул продавца)")
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ vendor_code }) => {
      try {
        const data = await client.request("content", "/content/v2/get/cards/list", {
          method: "POST",
          body: {
            settings: {
              cursor: { limit: 1 },
              filter: { textSearch: vendor_code, withPhoto: -1 }
            }
          }
        });
        return jsonResult(data);
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "wb_content_create_cards",
    {
      title: "Create Wildberries product cards",
      description:
        "Create new product cards (up to 100 cards, up to 30 variants each) in one request. " +
        "`cards` must follow the Wildberries card upload format: an array of objects with `subjectID`, " +
        "`variants` (array with `vendorCode`, `sizes`, `characteristics`, etc). This is a bulk write operation - " +
        "review the payload carefully before calling.",
      inputSchema: {
        cards: z
          .array(z.record(z.any()))
          .min(1)
          .max(100)
          .describe("Array of card objects in Wildberries content/v2/cards/upload format")
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ cards }) => {
      try {
        const data = await client.request("content", "/content/v2/cards/upload", {
          method: "POST",
          body: cards
        });
        return jsonResult(data ?? { success: true });
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "wb_content_update_cards",
    {
      title: "Update Wildberries product cards",
      description:
        "Edit existing nomenclatures (up to 3000 items, 10 MB payload). `cards` must include `nmID` for each item " +
        "plus the fields to update, following the Wildberries content/v2/cards/update format. This is a bulk write " +
        "operation that overwrites the specified fields on live product cards.",
      inputSchema: {
        cards: z
          .array(z.record(z.any()))
          .min(1)
          .max(3000)
          .describe("Array of card update objects, each including nmID, in Wildberries content/v2/cards/update format")
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true }
    },
    async ({ cards }) => {
      try {
        const data = await client.request("content", "/content/v2/cards/update", {
          method: "POST",
          body: cards
        });
        return jsonResult(data ?? { success: true });
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "wb_content_get_cards_limits",
    {
      title: "Get Wildberries card creation limits",
      description: "Get the seller's free and paid product card creation limits and current usage.",
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async () => {
      try {
        const data = await client.request("content", "/content/v2/cards/limits");
        return jsonResult(data);
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "wb_content_get_error_cards",
    {
      title: "List Wildberries cards that failed moderation",
      description: "List nomenclatures that failed to be created/updated, with WB's error description for each.",
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async () => {
      try {
        const data = await client.request("content", "/content/v2/cards/error/list");
        return jsonResult(data);
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "wb_content_get_parent_categories",
    {
      title: "List Wildberries parent product categories",
      description:
        "List all top-level (parent) product categories available on Wildberries. Useful before creating a new " +
        "card to find a valid subjectID/category to assign.",
      inputSchema: {
        locale: z.enum(["ru", "en", "zh"]).default("ru").describe("Language for category names")
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ locale }) => {
      try {
        const data = await client.request("content", "/content/v2/object/parent/all", { query: { locale } });
        return jsonResult(data);
      } catch (error) {
        return errorResult(error);
      }
    }
  );
}
