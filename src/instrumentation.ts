// Warm the shared product cache during server boot so the first user request
// doesn't pay the slow full-collection query (~2.3MB over a slow Atlas link).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { getPublicProducts } = await import("@/lib/public-site");
  getPublicProducts().catch(() => {});
}
