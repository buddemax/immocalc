type Identity = { subject: string; [key: string]: unknown };

export async function requireIdentity(ctx: { auth: { getUserIdentity: () => Promise<Identity | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  return identity;
}
