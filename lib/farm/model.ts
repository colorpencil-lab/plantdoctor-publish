import type { Lang } from "../i18n";
import type { Severity } from "../types";

// Data model + bilingual labels for the farm scan dashboard.
//
// A field camera unit does one pass over the farm, photographing every plant.
// Each photo is analysed; healthy plants are just counted, plants with a
// detected illness become a PlantCheck row on the dashboard.

export type { Severity };

export type IssueCategory =
  | "fungal" // 真菌感染
  | "bacterial" // 细菌感染
  | "viral" // 病毒感染
  | "pest" // 虫害
  | "nutrient" // 缺素 / 缺少元素
  | "water_stress" // 缺水
  | "sunscald" // 日灼
  | "cold" // 冷害
  | "other"; // 其他

/** Possibility of recovery if treated. */
export type Recovery = "likely" | "uncertain" | "unlikely";

export interface Bilingual {
  en: string;
  zh: string;
}

export interface PlantCheck {
  /** Grid id, e.g. "R1C4" — Row 1, Count 4. */
  unit: string;
  row: number;
  col: number;
  /** ISO local time (no zone) the unit reached this plant. */
  checkedAt: string;
  plant: Bilingual;
  issueTitle: Bilingual;
  issueSummary: Bilingual;
  category: IssueCategory;
  severity: Severity;
  recovery: Recovery;
}

export interface ScanSession {
  id: string;
  /** ISO local time (no zone). */
  startedAt: string;
  finishedAt: string;
  plantsScanned: number;
  plantsHealthy: number;
  plantsFlagged: number;
  rows: number;
  cols: number;
  /** Only the plants that need attention. */
  checks: PlantCheck[];
}

export function text(b: Bilingual, lang: Lang): string {
  return b[lang] ?? b.en;
}

// ---- labels -----------------------------------------------------------------

export const CATEGORY_LABEL: Record<Lang, Record<IssueCategory, string>> = {
  en: {
    fungal: "Fungal infection",
    bacterial: "Bacterial infection",
    viral: "Viral infection",
    pest: "Pest damage",
    nutrient: "Nutrient deficiency",
    water_stress: "Water stress",
    sunscald: "Sun scorch",
    cold: "Cold damage",
    other: "Other",
  },
  zh: {
    fungal: "真菌感染",
    bacterial: "细菌感染",
    viral: "病毒感染",
    pest: "虫害",
    nutrient: "缺少元素",
    water_stress: "缺水",
    sunscald: "日灼",
    cold: "冷害",
    other: "其他",
  },
};

export const SEVERITY_LABEL: Record<Lang, Record<Severity, string>> = {
  en: { low: "Low", medium: "Medium", high: "High" },
  zh: { low: "轻微", medium: "中等", high: "严重" },
};

export const RECOVERY_LABEL: Record<Lang, Record<Recovery, string>> = {
  en: { likely: "Likely", uncertain: "Uncertain", unlikely: "Unlikely" },
  zh: { likely: "很可能康复", uncertain: "尚不确定", unlikely: "难以康复" },
};

export const SEVERITY_TONE: Record<Severity, string> = {
  low: "good",
  medium: "warn",
  high: "bad",
};

export const RECOVERY_TONE: Record<Recovery, string> = {
  likely: "good",
  uncertain: "warn",
  unlikely: "bad",
};

// ---- dashboard UI strings --------------------------------------------------

export interface FarmStrings {
  title: string;
  subtitle: string;
  back: string;
  statScanned: string;
  statHealthy: string;
  statFlagged: string;
  statStart: string;
  statEnd: string;
  statDuration: string;
  filterLabel: string;
  filterAll: string;
  colUnit: string;
  colTime: string;
  colPlant: string;
  colIssue: string;
  colCategory: string;
  colSeverity: string;
  colRecovery: string;
  empty: string;
  minutes: (m: number) => string;
  awaitingDevice: string;
}

export const FARM_UI: Record<Lang, FarmStrings> = {
  en: {
    title: "Farm scan",
    subtitle: "Most recent full pass by the field camera unit.",
    back: "← Plant checker",
    statScanned: "Plants scanned",
    statHealthy: "Healthy",
    statFlagged: "Needs attention",
    statStart: "Scan started",
    statEnd: "Scan finished",
    statDuration: "Duration",
    filterLabel: "Severity",
    filterAll: "All",
    colUnit: "Unit",
    colTime: "Scanned",
    colPlant: "Plant",
    colIssue: "Issue",
    colCategory: "Category",
    colSeverity: "Severity",
    colRecovery: "Recovery",
    empty: "No plants match this filter.",
    minutes: (m) => `${m} min`,
    awaitingDevice:
      "Sample data. The camera unit is not connected yet — once it is, each pass will populate this list automatically.",
  },
  zh: {
    title: "农场巡检",
    subtitle: "田间摄像单元最近一次全场扫描结果。",
    back: "← 植物检测",
    statScanned: "扫描植株",
    statHealthy: "健康",
    statFlagged: "需要处理",
    statStart: "开始时间",
    statEnd: "结束时间",
    statDuration: "耗时",
    filterLabel: "严重程度",
    filterAll: "全部",
    colUnit: "编号",
    colTime: "扫描时间",
    colPlant: "植物",
    colIssue: "问题",
    colCategory: "类别",
    colSeverity: "严重程度",
    colRecovery: "康复可能",
    empty: "没有符合该筛选条件的植株。",
    minutes: (m) => `${m} 分钟`,
    awaitingDevice:
      "示例数据。摄像单元尚未接入 —— 接入后，每次巡检都会自动填充此列表。",
  },
};

// ---- formatting ----------------------------------------------------------

const MONTHS_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO local strings are parsed as wall-clock, so this renders the same on
 *  server and client regardless of time zone (no hydration mismatch). */
export function formatDateTime(iso: string, lang: Lang): string {
  const d = new Date(iso);
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (lang === "zh") {
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${hm}`;
  }
  return `${d.getDate()} ${MONTHS_EN[d.getMonth()]} ${d.getFullYear()}, ${hm}`;
}

export function durationMinutes(startIso: string, endIso: string): number {
  return Math.round(
    (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000,
  );
}

/** Grouped with a fixed locale so SSR and client agree. */
export function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}
