import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const getByKey = internalQuery({
  args: {
    userId: v.string(),
    cacheKey: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("geoCache")
      .withIndex("by_user_key", (queryBuilder) => queryBuilder.eq("userId", args.userId).eq("cacheKey", args.cacheKey))
      .first();
  },
});

export const upsert = internalMutation({
  args: {
    userId: v.string(),
    cacheKey: v.string(),
    provider: v.string(),
    requestType: v.string(),
    payload: v.string(),
    status: v.union(v.literal("ok"), v.literal("error")),
    fetchedAt: v.string(),
    expiresAt: v.string(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("geoCache")
      .withIndex("by_user_key", (queryBuilder) => queryBuilder.eq("userId", args.userId).eq("cacheKey", args.cacheKey))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        provider: args.provider,
        requestType: args.requestType,
        payload: args.payload,
        status: args.status,
        fetchedAt: args.fetchedAt,
        expiresAt: args.expiresAt,
        error: args.error,
      });
      return existing._id;
    }

    return ctx.db.insert("geoCache", args);
  },
});
