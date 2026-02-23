import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireIdentity } from "./auth";

const thresholdArgs = {
  grossYieldGreen: v.float64(),
  grossYieldYellow: v.float64(),
  grossYieldRed: v.float64(),
  netYieldGreen: v.float64(),
  netYieldYellow: v.float64(),
  netYieldRed: v.float64(),
  equityReturnGreen: v.float64(),
  equityReturnYellow: v.float64(),
  equityReturnRed: v.float64(),
  operativeCfGreen: v.float64(),
  operativeCfYellow: v.float64(),
  operativeCfRed: v.float64(),
  afterTaxCfGreen: v.float64(),
  afterTaxCfYellow: v.float64(),
  afterTaxCfRed: v.float64(),
};

export const upsert = mutation({
  args: thresholdArgs,
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const existing = await ctx.db
      .query("kpiThresholds")
      .withIndex("by_user", (queryBuilder) => queryBuilder.eq("userId", identity.subject))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return ctx.db.insert("kpiThresholds", { userId: identity.subject, ...args });
  },
});

export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    return ctx.db
      .query("kpiThresholds")
      .withIndex("by_user", (queryBuilder) => queryBuilder.eq("userId", identity.subject))
      .first();
  },
});
