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

const budgetItem = v.object({
  category: v.string(),
  annualAmount: v.float64(),
  comment: v.optional(v.string()),
});

export const upsert = mutation({
  args: {
    id: v.optional(v.id("householdBudgets")),
    personalInfo,
    income: v.array(budgetItem),
    expenses: v.array(budgetItem),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const planTier = getPlanTier(identity as unknown as Record<string, unknown>);
    assertFeature(planTier, "household_budget");

    if (args.id) {
      const existing = await ctx.db.get(args.id);
      if (!existing || existing.userId !== identity.subject) {
        throw new Error("Not found");
      }
      await ctx.db.patch(args.id, {
        personalInfo: args.personalInfo,
        income: args.income,
        expenses: args.expenses,
      });
      return args.id;
    }

    return ctx.db.insert("householdBudgets", {
      userId: identity.subject,
      personalInfo: args.personalInfo,
      income: args.income,
      expenses: args.expenses,
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const planTier = getPlanTier(identity as unknown as Record<string, unknown>);
    assertFeature(planTier, "household_budget");
    return ctx.db
      .query("householdBudgets")
      .withIndex("by_user", (queryBuilder) => queryBuilder.eq("userId", identity.subject))
      .collect();
  },
});
