/**
 * Moderate, keyword-list-based content filter for the free-text "Other"
 * dismissal reason. Two independent checks, tracked separately per spec:
 *
 * - containsProfanity: general profanity/vulgarity. Never delivered to the
 *   contractor regardless of the check's outcome elsewhere — this flag exists
 *   only so admin can track a client's pattern of behavior over time.
 * - containsSensitiveContent: discriminatory or otherwise sensitive language
 *   (slurs, protected-class-targeting insults). Drives whether the text is
 *   ever delivered to the contractor at all (held for admin review).
 *
 * This is a word-list match, not an ML/AI service — no such service is
 * currently configured in this project. It normalizes common leetspeak
 * substitutions and matches on word boundaries to catch simple evasions
 * without being a full anti-evasion system.
 */

const PROFANITY_WORDS = [
  "fuck", "shit", "bitch", "asshole", "bastard", "dick", "piss",
  "cunt", "dumbass", "jackass", "prick", "twat", "wanker",
];

const SENSITIVE_WORDS = [
  "nigger", "nigga", "spic", "chink", "gook", "kike", "wetback", "beaner",
  "raghead", "towelhead", "tranny", "faggot", "fag", "retard", "retarded",
  "illegal alien",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[@]/g, "a")
    .replace(/[0]/g, "o")
    .replace(/[1!]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[$]/g, "s")
    .replace(/[^a-z0-9\s]/g, " ");
}

function matchesAny(normalized: string, words: string[]): boolean {
  return words.some((w) => new RegExp(`\\b${w.replace(/\s+/g, "\\s+")}\\b`).test(normalized));
}

export function containsProfanity(text: string): boolean {
  if (!text.trim()) return false;
  return matchesAny(normalize(text), PROFANITY_WORDS);
}

export function containsSensitiveContent(text: string): boolean {
  if (!text.trim()) return false;
  return matchesAny(normalize(text), SENSITIVE_WORDS);
}

export function moderateDismissalText(text: string | null): {
  containsProfanity: boolean;
  moderationStatus: "not_applicable" | "pending_review";
} {
  if (!text || !text.trim()) {
    return { containsProfanity: false, moderationStatus: "not_applicable" };
  }
  return {
    containsProfanity: containsProfanity(text),
    moderationStatus: containsSensitiveContent(text) ? "pending_review" : "not_applicable",
  };
}
