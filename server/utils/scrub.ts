export type ScrubResult = {
  scrubbed: string;
  issues: Array<{ kind: string; value: string }>;
};

const REDACT = {
  email: "[email]",
  phone: "[phone]",
  id: "[id]",
  link: "[link]",
  card: "[card]",
  ip: "[ip]",
  at: "[@redacted]",
  channel: "[channel]",
  group: "[@group]",
};

function luhnCheck(s: string) {
  const digits = s.replace(/\D/g, "");
  if (digits.length < 13) return false;
  let sum = 0, dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (dbl) { d *= 2; if (d > 9) d -= 9; }
    sum += d; dbl = !dbl;
  }
  return sum % 10 === 0;
}

/**
 * Scrub personally identifying tokens for REVIEW (replace, don't reject).
 * NOTE: This is separate from your existing validator; keep validator for hard-blocks if desired.
 */
export function scrubPIIForReview(text: string): ScrubResult {
  if (!text) return { scrubbed: "", issues: [] };
  const issues: ScrubResult["issues"] = [];
  let t = text;

  // Normalize common obfuscations to catch them
  t = t
    .replace(/\[(at|dot)\]/gi, (m) => m.toLowerCase() === "[at]" ? "@" : ".")
    .replace(/\s+at\s+/gi, "@")
    .replace(/\s+dot\s+/gi, ".");

  // Slack mentions/groups/channels
  t = t.replace(/<@U[A-Z0-9]+>/g, (m) => { issues.push({ kind: "at", value: m }); return REDACT.at; });
  t = t.replace(/<!subteam\^S[A-Z0-9]+(?:\|[^>]+)?>/g, (m) => { issues.push({ kind: "group", value: m }); return REDACT.group; });
  t = t.replace(/<#C[A-Z0-9]+(?:\|[^>]+)?>/g, (m) => { issues.push({ kind: "channel", value: m }); return REDACT.channel; });

  // Emails
  t = t.replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, (m) => { issues.push({ kind: "email", value: m }); return REDACT.email; });

  // Generic @handles (non-Slack)
  t = t.replace(/(^|\s)@([A-Za-z0-9_.-]+)/g, (m) => { issues.push({ kind: "at", value: m.trim() }); return " " + REDACT.at; });

  // Phones (broad)
  t = t.replace(/\+?\d[\d\s().-]{7,}\d/g, (m) => { issues.push({ kind: "phone", value: m }); return REDACT.phone; });

  // Potential credit cards via Luhn
  t = t.replace(/\b(?:\d[ -]*?){13,19}\b/g, (m) => {
    if (luhnCheck(m)) { issues.push({ kind: "card", value: m }); return REDACT.card; }
    return m;
  });

  // IDs (6–10 digits)
  t = t.replace(/\b\d{6,10}\b/g, (m) => { issues.push({ kind: "id", value: m }); return REDACT.id; });

  // URLs
  t = t.replace(/https?:\/\/\S+/gi, (m) => { issues.push({ kind: "link", value: m }); return REDACT.link; });

  // IPv4
  t = t.replace(/\b(\d{1,3}\.){3}\d{1,3}\b/g, (m) => { issues.push({ kind: "ip", value: m }); return REDACT.ip; });

  return { scrubbed: t, issues };
}

/** Optional: simple HTML-mark highlight for REVIEW modal (not stored). */
export function highlightRedactions(scrubbed: string) {
  return scrubbed.replace(
    /\[(email|phone|id|link|card|ip|@redacted|channel|@group)\]/g,
    (m) => `\`${m}\`` // renders as inline code in Slack mrkdwn
  );
}
