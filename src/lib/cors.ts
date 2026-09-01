export function corsHeaders(extra: Record<string, string> = {}) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    ...extra,
  };
}
