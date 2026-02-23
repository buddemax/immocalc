import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireIdentity } from "./auth";
import { assertFeature, getPlanTier } from "./plan";

const personalInfo = v.object({
  name: v.string(),
  address: v.string(),
  city: v.string(),
  maritalStatus: v.string(),
  propertyRegime: v.string(),
  children: v.string(),
  referenceDate: v.string(),
});

const assetItem = v.object({
  description: v.string(),
  amount: v.float64(),
  pledged: v.boolean(),
  comment: v.optional(v.string()),
});

const liabilityItem = v.object({
  description: v.string(),
  amount: v.float64(),
  comment: v.optional(v.string()),
});

export const upsert = mutation({
  args: {
    id: v.optional(v.id("assetStatements")),
    personalInfo,
    assets: v.array(assetItem),
    liabilities: v.array(liabilityItem),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const planTier = getPlanTier(identity as unknown as Record<string, unknown>);
    assertFeature(planTier, "asset_statement");

    if (args.id) {
      const existing = await ctx.db.get(args.id);
      if (!existing || existing.userId !== identity.subject) {
        throw new Error("Not found");
      }
      await ctx.db.patch(args.id, {
        personalInfo: args.personalInfo,
        assets: args.assets,
        liabilities: args.liabilities,
      });
      return args.id;
    }

    return ctx.db.insert("assetStatements", {
      userId: identity.subject,
      personalInfo: args.personalInfo,
      assets: args.assets,
      liabilities: args.liabilities,
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const planTier = getPlanTier(identity as unknown as Record<string, unknown>);
    assertFeature(planTier, "asset_statement");
    return ctx.db
      .query("assetStatements")
      .withIndex("by_user", (queryBuilder) => queryBuilder.eq("userId", identity.subject))
      .collect();
  },
});
