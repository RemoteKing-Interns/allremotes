/**
 * Read the `?next=` return URL from the current location. Only same-site
 * relative paths are allowed (no protocol-relative "//", no external URLs)
 * so a crafted link can't bounce users off-site after login.
 */
export function getReturnUrl(fallback = "/"): string {
  if (typeof window === "undefined") return fallback;
  const next = new URLSearchParams(window.location.search).get("next") || "";
  if (next.startsWith("/") && !next.startsWith("//")) return next;
  return fallback;
}
