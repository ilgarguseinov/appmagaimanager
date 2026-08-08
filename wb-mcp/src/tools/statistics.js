import { z } from "zod";
import { jsonResult, errorResult } from "../respond.js";

export function registerStatisticsTools(server, client) {
  server.registerTool(
    "wb_stats_incomes",
    {
      title: "Get Wildberries incoming supplies statistics",
      description:
        "List all incoming supplies (goods received into WB warehouses) updated on or after `date_from`. " +
        "Useful for reconciling what stock has actually arrived at Wildberries.",
      inputSchema: {
        date_from: z.string().describe("ISO date/time lower bound, e.g. 2026-08-01T00:00:00")
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ date_from }) => {
      try {
        const data = await client.request("statistics", "/api/v1/supplier/incomes", {
          query: { dateFrom: date_from }
        });
        return jsonResult(data);
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "wb_stats_stocks",
    {
      title: "Get Wildberries warehouse stock statistics",
      description:
        "Get stock quantities across all Wildberries warehouses (FBO), updated every ~30 minutes, for items " +
        "updated on or after `date_from`.",
      inputSchema: {
        date_from: z.string().describe("ISO date/time lower bound, e.g. 2026-08-01T00:00:00")
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ date_from }) => {
      try {
        const data = await client.request("statistics", "/api/v1/supplier/stocks", {
          query: { dateFrom: date_from }
        });
        return jsonResult(data);
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "wb_stats_orders",
    {
      title: "Get Wildberries orders statistics",
      description:
        "Get order statistics. With `mode: 'since'` (default) returns all orders updated on/after `date`, kept for " +
        "90 days. With `mode: 'on_date'` returns orders placed exactly on `date` (time-of-day ignored).",
      inputSchema: {
        date: z.string().describe("ISO date or date/time, e.g. 2026-08-01 or 2026-08-01T00:00:00"),
        mode: z.enum(["since", "on_date"]).default("since").describe("since = updated after date; on_date = placed on that date")
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ date, mode }) => {
      try {
        const data = await client.request("statistics", "/api/v1/supplier/orders", {
          query: { dateFrom: date, flag: mode === "on_date" ? 1 : 0 }
        });
        return jsonResult(data);
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "wb_stats_sales",
    {
      title: "Get Wildberries sales and returns statistics",
      description:
        "Get sales/returns statistics, updated every ~30 minutes. With `mode: 'since'` (default) returns records " +
        "updated on/after `date`, kept for 90 days. With `mode: 'on_date'` returns records for that exact date.",
      inputSchema: {
        date: z.string().describe("ISO date or date/time, e.g. 2026-08-01 or 2026-08-01T00:00:00"),
        mode: z.enum(["since", "on_date"]).default("since").describe("since = updated after date; on_date = for that date")
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ date, mode }) => {
      try {
        const data = await client.request("statistics", "/api/v1/supplier/sales", {
          query: { dateFrom: date, flag: mode === "on_date" ? 1 : 0 }
        });
        return jsonResult(data);
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "wb_stats_detail_report",
    {
      title: "Get Wildberries detailed sales report by period",
      description:
        "Get the detailed financial sales report (комиссии, логистика, штрафы, доплаты) for a date range, " +
        "paginated via `rrdid`. Pass the last row's `rrd_id` from the previous response as `rrdid` to get the next " +
        "page; stop when the response is empty. Data is only available from 2024-01-29 onwards.",
      inputSchema: {
        date_from: z.string().describe("ISO date/time lower bound"),
        date_to: z.string().describe("ISO date/time upper bound"),
        limit: z.number().int().min(1).max(100000).default(1000).describe("Max rows to return"),
        rrdid: z.number().int().min(0).default(0).describe("Pagination cursor (rrd_id of last row seen, 0 for first page)")
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ date_from, date_to, limit, rrdid }) => {
      try {
        const data = await client.request("statistics", "/api/v5/supplier/reportDetailByPeriod", {
          query: { dateFrom: date_from, dateTo: date_to, limit, rrdid }
        });
        return jsonResult(data);
      } catch (error) {
        return errorResult(error);
      }
    }
  );
}
