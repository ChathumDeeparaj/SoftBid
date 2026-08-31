/**
 * MessageGuard — SoftBid's content moderation engine
 *
 * Two-tier system:
 *   TIER 1 (CRITICAL)  — Detects & REDACTS contact info before delivery
 *   TIER 2 (SUSPICIOUS) — Detects circumvention keywords, flags for admin review
 */

// ── TIER 1: Patterns that auto-redact ────────────────────────────────────────

const REDACT_PATTERNS = [
  {
    name: 'email address',
    regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/gi,
    replacement: '[email removed]',
  },
  {
    name: 'phone number',
    // Matches international formats: +94 77 123 4567, 0771234567, (077) 123-4567 etc.
    regex: /(\+?\d[\d\s\-().]{7,}\d)/g,
    replacement: '[contact removed]',
  },
  {
    name: 'WhatsApp link',
    regex: /wa\.me\/[\d+]+/gi,
    replacement: '[link removed]',
  },
  {
    name: 'Telegram link',
    regex: /t\.me\/[a-zA-Z0-9_]+/gi,
    replacement: '[link removed]',
  },
  {
    name: 'generic URL with handle',
    // e.g. facebook.com/johndoe, instagram.com/johndoe
    regex: /(https?:\/\/)?(www\.)?(facebook|instagram|twitter|linkedin|snapchat)\.com\/[a-zA-Z0-9._\-]+/gi,
    replacement: '[profile link removed]',
  },
];

// ── TIER 2: Keywords that flag without redacting ──────────────────────────────

const SUSPICIOUS_KEYWORDS = [
  // Messaging platforms
  { word: 'whatsapp',    severity: 'suspicious', reason: 'whatsapp keyword' },
  { word: 'telegram',    severity: 'suspicious', reason: 'telegram keyword' },
  { word: 'signal',      severity: 'suspicious', reason: 'signal keyword' },
  { word: 'viber',       severity: 'suspicious', reason: 'viber keyword' },
  { word: 'wechat',      severity: 'suspicious', reason: 'wechat keyword' },
  { word: 'discord',     severity: 'suspicious', reason: 'discord keyword' },
  { word: 'skype',       severity: 'suspicious', reason: 'skype keyword' },
  { word: 'line app',    severity: 'suspicious', reason: 'line app keyword' },

  // Social platforms
  { word: 'facebook',    severity: 'suspicious', reason: 'facebook keyword' },
  { word: 'instagram',   severity: 'suspicious', reason: 'instagram keyword' },
  { word: 'linkedin',    severity: 'suspicious', reason: 'linkedin keyword' },
  { word: 'twitter',     severity: 'suspicious', reason: 'twitter keyword' },
  { word: 'snapchat',    severity: 'suspicious', reason: 'snapchat keyword' },

  // Circumvention phrases
  { word: 'off platform',        severity: 'suspicious', reason: 'circumvention phrase' },
  { word: 'outside softbid',     severity: 'suspicious', reason: 'circumvention phrase' },
  { word: 'outside the platform',severity: 'suspicious', reason: 'circumvention phrase' },
  { word: 'bypass',              severity: 'suspicious', reason: 'circumvention phrase' },
  { word: 'avoid the fee',       severity: 'suspicious', reason: 'circumvention phrase' },
  { word: 'avoid fees',          severity: 'suspicious', reason: 'circumvention phrase' },
  { word: 'contact me directly', severity: 'suspicious', reason: 'direct contact request' },
  { word: 'reach me at',         severity: 'suspicious', reason: 'direct contact request' },
  { word: 'dm me',               severity: 'suspicious', reason: 'direct contact request' },
  { word: 'text me',             severity: 'suspicious', reason: 'direct contact request' },
  { word: 'call me on',          severity: 'suspicious', reason: 'direct contact request' },
  { word: 'my number is',        severity: 'suspicious', reason: 'direct contact request' },
  { word: 'my email is',         severity: 'suspicious', reason: 'direct contact request' },
  { word: 'email me at',         severity: 'suspicious', reason: 'direct contact request' },
  { word: 'message me on',       severity: 'suspicious', reason: 'direct contact request' },
  { word: 'add me on',           severity: 'suspicious', reason: 'direct contact request' },
  { word: 'find me on',          severity: 'suspicious', reason: 'direct contact request' },
  { word: 'connect on',          severity: 'suspicious', reason: 'direct contact request' },
  { word: 'let\'s talk on',      severity: 'suspicious', reason: 'direct contact request' },
];

/**
 * Run the MessageGuard on a raw message string.
 *
 * @param {string} rawText — original message from the user
 * @returns {{
 *   sanitized: string,   — text to store as `content` and show in UI
 *   flagged: boolean,
 *   flagSeverity: 'none' | 'suspicious' | 'critical',
 *   flagReasons: string[],
 *   wasRedacted: boolean,
 * }}
 */
function analyzeMessage(rawText) {
  let sanitized = rawText;
  let flagged = false;
  let flagSeverity = 'none';
  const flagReasons = [];
  let wasRedacted = false;

  // ── TIER 1: Redact contact information ────────────────────────────────────
  for (const pattern of REDACT_PATTERNS) {
    if (pattern.regex.test(sanitized)) {
      pattern.regex.lastIndex = 0; // reset regex state
      sanitized = sanitized.replace(pattern.regex, pattern.replacement);
      flagged = true;
      flagSeverity = 'critical';
      flagReasons.push(pattern.name + ' detected');
      wasRedacted = true;
    }
    pattern.regex.lastIndex = 0; // always reset after use
  }

  // ── TIER 2: Keyword detection (case-insensitive) ──────────────────────────
  const lowerText = rawText.toLowerCase();
  for (const kw of SUSPICIOUS_KEYWORDS) {
    if (lowerText.includes(kw.word)) {
      flagged = true;
      // Don't downgrade a 'critical' flag to 'suspicious'
      if (flagSeverity !== 'critical') {
        flagSeverity = kw.severity;
      }
      if (!flagReasons.includes(kw.reason)) {
        flagReasons.push(kw.reason);
      }
    }
  }

  return { sanitized, flagged, flagSeverity, flagReasons, wasRedacted };
}

module.exports = { analyzeMessage };
