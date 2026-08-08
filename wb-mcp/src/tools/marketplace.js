import { z } from "zod";
import { jsonResult, errorResult } from "../respond.js";

export function registerMarketplaceTools(server, client) {
  server.registerTool(
    "wb_orders_list_new",
    {
      title: "List new Wildberries orders",
      description: "List all new (not yet assembled) FBS orders awaiting action.",
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async () => {
      try {
        const data = await client.request("marketplace", "/api/v3/orders/new");
        return jsonResult(data);
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "wb_orders_list",
    {
      title: "List Wildberries orders",
      description:
        "List historical FBS orders with pagination and optional date filtering. Orders are returned newest-first.",
      inputSchema: {
        limit: z.number().int().min(1).max(1000).default(100).describe("Orders per page (max 1000)"),
        next: z.number().int().min(0).default(0).describe("Cursor from previous response's `next` field"),
        date_from: z.string().optional().describe("ISO date/time lower bound, e.g. 2026-08-01"),
        date_to: z.string().optional().describe("ISO date/time upper bound, e.g. 2026-08-08")
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ limit, next, date_from, date_to }) => {
      try {
        const data = await client.request("marketplace", "/api/v3/orders", {
          query: {
            limit,
            next,
            ...(date_from ? { dateFrom: date_from } : {}),
            ...(date_to ? { dateTo: date_to } : {})
          }
        });
        return jsonResult(data);
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "wb_orders_get_statuses",
    {
      title: "Get Wildberries order statuses",
      description: "Fetch current WB status and supplier status for up to 1000 order IDs in one call.",
      inputSchema: {
        order_ids: z.array(z.number().int()).min(1).max(1000).describe("List of order IDs")
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ order_ids }) => {
      try {
        const data = await client.request("marketplace", "/api/v3/orders/status", {
          method: "POST",
          body: { orders: order_ids }
        });
        return jsonResult(data);
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "wb_orders_cancel",
    {
      title: "Cancel a Wildberries order",
      description:
        "Cancel a single FBS order by ID. Only orders that haven't been assembled/shipped can be cancelled - " +
        "Wildberries will reject the request otherwise.",
      inputSchema: {
        order_id: z.number().int().describe("Order ID to cancel")
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true }
    },
    async ({ order_id }) => {
      try {
        const data = await client.request("marketplace", `/api/v3/orders/${order_id}/cancel`, { method: "PATCH" });
        return jsonResult(data ?? { success: true });
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "wb_stocks_get_warehouse",
    {
      title: "Get Wildberries FBS warehouse stock",
      description:
        "Query current stock quantities in a seller's own (FBS) warehouse for a list of SKUs (barcodes).",
      inputSchema: {
        warehouse_id: z.number().int().describe("Seller's warehouse ID"),
        skus: z.array(z.string()).min(1).max(1000).describe("Barcodes (SKUs) to check, up to 1000")
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ warehouse_id, skus }) => {
      try {
        const data = await client.request("marketplace", `/api/v3/stocks/${warehouse_id}`, {
          method: "POST",
          body: { skus }
        });
        return jsonResult(data);
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "wb_stocks_update_warehouse",
    {
      title: "Update Wildberries FBS warehouse stock",
      description:
        "Set stock quantities for up to 1000 SKUs in a seller's own (FBS) warehouse. Each entry replaces the " +
        "current quantity for that SKU - it does not increment.",
      inputSchema: {
        warehouse_id: z.number().int().describe("Seller's warehouse ID"),
        stocks: z
          .array(z.object({ sku: z.string().describe("Barcode (SKU)"), amount: z.number().int().min(0) }))
          .min(1)
          .max(1000)
          .describe("Up to 1000 {sku, amount} entries; amount is the new absolute quantity")
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true }
    },
    async ({ warehouse_id, stocks }) => {
      try {
        const data = await client.request("marketplace", `/api/v3/stocks/${warehouse_id}`, {
          method: "PUT",
          body: { stocks }
        });
        return jsonResult(data ?? { success: true });
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "wb_supplies_list",
    {
      title: "List Wildberries supplies (FBS shipments)",
      description: "List the seller's supplies (boxes/shipments being prepared or sent to Wildberries), paginated.",
      inputSchema: {
        limit: z.number().int().min(1).max(1000).default(50).describe("Supplies per page"),
        next: z.number().int().min(0).default(0).describe("Cursor from previous response's `next` field")
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ limit, next }) => {
      try {
        const data = await client.request("marketplace", "/api/v3/supplies", { query: { limit, next } });
        return jsonResult(data);
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "wb_supplies_create",
    {
      title: "Create a Wildberries supply",
      description: "Create a new empty supply (shipment) that orders can then be attached to.",
      inputSchema: {
        name: z.string().min(1).max(128).describe("Supply name, up to 128 characters")
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ name }) => {
      try {
        const data = await client.request("marketplace", "/api/v3/supplies", { method: "POST", body: { name } });
        return jsonResult(data);
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "wb_supplies_get_orders",
    {
      title: "List orders in a Wildberries supply",
      description: "List the FBS orders currently attached to a given supply.",
      inputSchema: {
        supply_id: z.string().min(1).describe("Supply ID, e.g. WB-GI-1234567")
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ supply_id }) => {
      try {
        const data = await client.request("marketplace", `/api/v3/supplies/${supply_id}/orders`);
        return jsonResult(data);
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "wb_supplies_close",
    {
      title: "Close and send a Wildberries supply",
      description:
        "Close a supply and mark it ready for delivery/pickup. This is a one-way action - once closed, orders can " +
        "no longer be added or removed from the supply.",
      inputSchema: {
        supply_id: z.string().min(1).describe("Supply ID to close")
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true }
    },
    async ({ supply_id }) => {
      try {
        const data = await client.request("marketplace", `/api/v3/supplies/${supply_id}/deliver`, {
          method: "PATCH"
        });
        return jsonResult(data ?? { success: true });
      } catch (error) {
        return errorResult(error);
      }
    }
  );
}
