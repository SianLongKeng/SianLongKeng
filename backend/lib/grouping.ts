// Shared "which Learning-Gap bucket is this student in right now" logic —
// used by both the AI Grouping insights page and anywhere a mission needs
// to be targeted at a bucket (Mission Builder's Assign To, Student Home's
// assigned-mission list). Rule-based on the student's most recent attempt's
// dominant mistake type, matching the PDF's "Rule-based + AI Classification"
// approach — no extra LLM call needed since the classification already
// happened per-attempt (see migration_002_missions.sql / mistake_types).
export type Bucket = "concept_gap" | "application_gap" | "mastery" | "pending";

const CONCEPT_CODES = new Set(["misconception", "wrong_concept_recall"]);
const APPLICATION_CODES = new Set(["logic_gap", "calculation_error", "misread_question", "guessing"]);

export function bucketFor(row: {
  completed_at: string | null;
  top_mistake_code: string | null;
  top_mistake_pct: string | number | null;
}): Bucket {
  if (!row.completed_at) return "pending";
  const pct = row.top_mistake_pct ? Number(row.top_mistake_pct) : 0;
  if (!row.top_mistake_code || pct < 15) return "mastery";
  if (CONCEPT_CODES.has(row.top_mistake_code)) return "concept_gap";
  if (APPLICATION_CODES.has(row.top_mistake_code)) return "application_gap";
  return "mastery";
}
