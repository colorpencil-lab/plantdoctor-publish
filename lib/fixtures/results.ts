import type { AnalysisResult } from "../types";
import type { Lang } from "../i18n";
import data from "./results.json";

// Saved, hand-reviewed diagnoses keyed by demo-photo id. Server-only (imported
// by the analyze route) so the full result bodies never ship to the browser.
// Regenerate / append with `npm run fixtures`; edit the JSON by hand to polish.

const RESULTS = data as Record<string, Partial<Record<Lang, AnalysisResult>>>;

export function getFixtureResult(
  id: string,
  lang: Lang,
): AnalysisResult | undefined {
  const entry = RESULTS[id];
  if (!entry) return undefined;
  return entry[lang] ?? entry.en;
}
