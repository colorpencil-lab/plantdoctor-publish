// Shared contract between the API route, the AI prompt, the demo engine,
// and the React UI. The model is instructed to return the AnalysisResult shape.

export type Confidence = "low" | "medium" | "high";

export type HealthStatus =
  | "healthy"
  | "minor_issues"
  | "serious_issues"
  | "unknown";

export type IssueType =
  | "disease"
  | "pest"
  | "deficiency"
  | "environmental"
  | "other";

export type Severity = "low" | "medium" | "high";

export type Urgency = "now" | "soon" | "ongoing";

/** How likely the plant is to recover if the issues are treated. */
export type Recovery = "likely" | "uncertain" | "unlikely";

export interface Identification {
  commonName: string;
  scientificName: string;
  confidence: Confidence;
  notes: string;
}

export interface Health {
  status: HealthStatus;
  summary: string;
  /** Recovery outlook. "not_applicable" for a healthy plant / non-plant photo. */
  recovery: Recovery | "not_applicable";
}

export interface Issue {
  name: string;
  type: IssueType;
  severity: Severity;
  confidence: Confidence;
  description: string;
  evidence: string;
}

export interface TreatmentStep {
  title: string;
  detail: string;
  urgency: Urgency;
}

export interface CareGuide {
  light: string;
  water: string;
  soil: string;
  humidity: string;
  temperature: string;
}

export interface AnalysisResult {
  isPlant: boolean;
  identification: Identification;
  health: Health;
  issues: Issue[];
  treatment: TreatmentStep[];
  prevention: string[];
  care: CareGuide;
  disclaimer: string;
}

export interface AnalyzeResponse {
  result: AnalysisResult;
  /** True when the response did not come from a live AI call (demo engine or a saved fixture). */
  demo: boolean;
  model: string | null;
  /** True when the response is a saved demo fixture, not a fresh analysis. */
  fixture?: boolean;
}

export interface AnalyzeErrorResponse {
  error: string;
}
