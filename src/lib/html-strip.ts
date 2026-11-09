// Minimal executable-HTML stripper for dangerouslySetInnerHTML sinks.
// Removes script/style/iframe/object/embed/form/link/meta tags, on* handlers,
// and javascript: URLs. Cosmetic transforms stay in the caller's sanitizer.
export function stripExecutableHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<\s*(script|style|iframe|object|embed|form|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|form|link|meta)[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, "$1=$2#$2");
}
