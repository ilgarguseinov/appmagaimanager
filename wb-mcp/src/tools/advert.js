import { z } from "zod";
import { jsonResult, errorResult } from "../respond.js";

export function registerAdvertTools(server, client) {
  server.registerTool(
    "wb_advert_list_campaigns",
    {
      title: "List Wildberries advertising campaigns",
      description:
        "List the seller's advertising campaigns, grouped and counted by type and status. Use this first to see " +
        "what campaigns exist and their IDs before fetching details or stats.",
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async () => {
      try {
        const data = await client.request("advert", "/adv/v1/promotion/count");
        return jsonResult(data);
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "wb_advert_get_campaigns_info",
    {
      title: "Get Wildberries advertising campaign details",
      description:
        "Get detailed info (budget, bids, products, dates) for up to 50 campaigns by their IDs. Use " +
        "`wb_advert_list_campaigns` first to discover campaign IDs.",
      inputSchema: {
        campaign_ids: z.array(z.number().int()).min(1).max(50).describe("Up to 50 campaign (advert) IDs")
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ campaign_ids }) => {
      try {
        const data = await client.request("advert", "/adv/v1/promotion/adverts", {
          method: "POST",
          body: campaign_ids
        });
        return jsonResult(data);
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "wb_advert_get_stats",
    {
      title: "Get Wildberries advertising campaign statistics",
      description:
        "Get performance statistics (views, clicks, CTR, CPC, spend, orders, CR) for campaigns over date ranges. " +
        "Wildberries rate-limits this endpoint to 1 request per minute per seller, so batch campaign IDs into a " +
        "single call rather than calling it in a loop.",
      inputSchema: {
        campaigns: z
          .array(
            z.object({
              id: z.number().int().describe("Campaign (advert) ID"),
              dates: z
                .array(z.string())
                .min(1)
                .describe("ISO dates to fetch stats for, e.g. ['2026-08-01', '2026-08-02']")
            })
          )
          .min(1)
          .max(100)
          .describe("Campaigns and the dates to fetch stats for")
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ campaigns }) => {
      try {
        const data = await client.request("advert", "/adv/v2/fullstats", { method: "POST", body: campaigns });
        return jsonResult(data);
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "wb_advert_start",
    {
      title: "Start a Wildberries advertising campaign",
      description: "Launch a paused or ready campaign so it starts spending budget and showing ads.",
      inputSchema: {
        campaign_id: z.number().int().describe("Campaign (advert) ID to start")
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ campaign_id }) => {
      try {
        const data = await client.request("advert", "/adv/v0/start", { query: { id: campaign_id } });
        return jsonResult(data ?? { success: true });
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "wb_advert_pause",
    {
      title: "Pause a Wildberries advertising campaign",
      description: "Pause a running campaign. It can be resumed later with wb_advert_start.",
      inputSchema: {
        campaign_id: z.number().int().describe("Campaign (advert) ID to pause")
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ campaign_id }) => {
      try {
        const data = await client.request("advert", "/adv/v0/pause", { query: { id: campaign_id } });
        return jsonResult(data ?? { success: true });
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "wb_advert_stop",
    {
      title: "Stop a Wildberries advertising campaign",
      description:
        "Stop a campaign completely. Unlike pause, a stopped campaign generally cannot be resumed - use pause " +
        "instead if you just want to temporarily halt spend.",
      inputSchema: {
        campaign_id: z.number().int().describe("Campaign (advert) ID to stop")
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true }
    },
    async ({ campaign_id }) => {
      try {
        const data = await client.request("advert", "/adv/v0/stop", { query: { id: campaign_id } });
        return jsonResult(data ?? { success: true });
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "wb_advert_update_cpm",
    {
      title: "Update Wildberries advertising campaign bid",
      description:
        "Change the CPM bid amount for a campaign's placement (search, product cards, or recommendations). " +
        "Use wb_advert_get_campaigns_info to see current bids and valid subject/placement values first.",
      inputSchema: {
        campaign_id: z.number().int().describe("Campaign (advert) ID"),
        cpm: z.number().int().positive().describe("New bid amount (CPM, in kopecks per WB convention)"),
        subject_id: z.number().int().optional().describe("Subject (category) ID the bid applies to, if required by campaign type"),
        param: z.string().optional().describe("Placement parameter WB expects for this campaign type (e.g. a search parameter string)")
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true }
    },
    async ({ campaign_id, cpm, subject_id, param }) => {
      try {
        const data = await client.request("advert", "/adv/v0/cpm", {
          method: "POST",
          body: {
            advertId: campaign_id,
            cpm,
            ...(subject_id !== undefined ? { subjectId: subject_id } : {}),
            ...(param !== undefined ? { param } : {})
          }
        });
        return jsonResult(data ?? { success: true });
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "wb_advert_rename",
    {
      title: "Rename a Wildberries advertising campaign",
      description: "Change the display name of a campaign (up to 100 characters).",
      inputSchema: {
        campaign_id: z.number().int().describe("Campaign (advert) ID"),
        name: z.string().min(1).max(100).describe("New campaign name")
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ campaign_id, name }) => {
      try {
        const data = await client.request("advert", "/adv/v0/rename", {
          method: "POST",
          body: { advertId: campaign_id, name }
        });
        return jsonResult(data ?? { success: true });
      } catch (error) {
        return errorResult(error);
      }
    }
  );
}
