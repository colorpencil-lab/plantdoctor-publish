import type { AnalysisResult, Issue } from "../types";
import type { IssueCategory, PlantCheck, Recovery } from "./model";

// Turn one AnalysisResult into a dashboard row. Used by /api/ingest when the
// field camera unit sends a photo. Returns null when the plant is healthy /
// the photo isn't a plant — those don't appear on the dashboard.

const RX: Array<[IssueCategory, RegExp]> = [
  ["viral", /virus|viral|mosaic|leaf ?curl virus/i],
  ["bacterial", /bacter|fire blight|halo blight/i],
  ["pest", /aphid|mite|thrip|whitefly|mealybug|scale insect|caterpillar|borer|beetle|leaf ?miner|weevil|nematode|slug|snail/i],
  ["nutrient", /deficien|chloros|nitrogen|magnesium|potassium|phosphor|iron|calcium|manganese|nutrient/i],
  ["sunscald", /sunburn|sunscald|sun ?scorch|leaf ?scorch|heat stress/i],
  ["cold", /frost|cold damage|chilling|freeze/i],
  ["water_stress", /drought|under ?water|water stress|dehydrat|wilt|too dry|dry soil/i],
  ["fungal", /blight|mildew|rust|\brot\b|leaf ?spot|anthracnose|scab|botrytis|canker|fungal|fungus|damping ?off/i],
];

function categorize(issue: Issue): IssueCategory {
  const hay = `${issue.name} ${issue.description}`;
  for (const [cat, rx] of RX) if (rx.test(hay)) return cat;
  if (issue.type === "pest") return "pest";
  if (issue.type === "deficiency") return "nutrient";
  if (issue.type === "disease") return "fungal";
  if (issue.type === "environmental") return "water_stress";
  return "other";
}

function recoveryFrom(r: AnalysisResult): Recovery {
  if (r.health.recovery === "likely" || r.health.recovery === "uncertain" || r.health.recovery === "unlikely") {
    return r.health.recovery;
  }
  const top = r.issues[0]?.severity;
  if (r.health.status === "serious_issues" || top === "high") return "unlikely";
  if (r.health.status === "minor_issues" || top === "low") return "likely";
  return "uncertain";
}

export function checkFromAnalysis(
  loc: { unit: string; row: number; col: number; checkedAt: string },
  result: AnalysisResult,
): PlantCheck | null {
  if (!result.isPlant) return null;
  if (result.health.status === "healthy" || result.issues.length === 0) return null;

  const top =
    result.issues.find((i) => i.severity === "high") ?? result.issues[0];

  const plant = result.identification.commonName || "Unknown plant";
  const title = top.name;
  const summary = result.health.summary || top.description;

  return {
    unit: loc.unit,
    row: loc.row,
    col: loc.col,
    checkedAt: loc.checkedAt,
    // The device sends one language per pass; store it in both slots for now.
    plant: { en: plant, zh: plant },
    issueTitle: { en: title, zh: title },
    issueSummary: { en: summary, zh: summary },
    category: categorize(top),
    severity: top.severity,
    recovery: recoveryFrom(result),
  };
}
