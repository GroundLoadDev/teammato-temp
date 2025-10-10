// Very light coarsening for review/quote preview.
// - Normalize explicit dates/times ("Tuesday 3:15pm" -> "earlier this week")
// - Remove precise numbers > 3 digits ("12345" -> "xx,xxx")
// - Keep gist; enforce max length
export function prepQuoteForDigest(input: string, maxLen = 240): string {
  if (!input) return "";
  let s = input;

  // Dates & weekdays
  s = s.replace(/\b(mon|tue|wed|thu|fri|sat|sun)\w*(day)?\b.*?\b(\d{1,2}:\d{2}\s*(am|pm)?)?/gi, "earlier this week");
  s = s.replace(/\b(20\d{2}|19\d{2})[-/\.]\d{1,2}[-/\.]\d{1,2}\b/gi, "recently");

  // Exact big numbers
  s = s.replace(/\b\d{4,}\b/g, (m) => "≈" + m.replace(/\d/g, "x"));

  // Collapse whitespace
  s = s.replace(/\s+/g, " ").trim();

  if (s.length > maxLen) s = s.slice(0, maxLen - 1) + "…";
  return s;
}
