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

export type SessionStatus = "in_progress" | "completed";

export interface ScanSession {
  id: string;
  /** ISO local time (no zone). */
  startedAt: string;
  /** Absent while the session is in progress. */
  finishedAt?: string;
  plantsScanned: number;
  plantsHealthy: number;
  plantsFlagged: number;
  /** Only the plants that need attention. */
  checks: PlantCheck[];
}

/** Session fields without the (potentially long) checks list — for list views. */
export type SessionSummary = Omit<ScanSession, "checks">;

export function sessionStatus(s: Pick<ScanSession, "finishedAt">): SessionStatus {
  return s.finishedAt ? "completed" : "in_progress";
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
  notFinished: string;
  inProgressBanner: string;
  toSessions: string;
}

export const FARM_UI: Record<Lang, FarmStrings> = {
  en: {
    title: "Farm scan",
    subtitle: "One farm walkthrough, device or manual.",
    back: "← Plant checker",
    toSessions: "← All sessions",
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
    notFinished: "—",
    inProgressBanner: "Scan in progress — upload photos as you go.",
  },
  zh: {
    title: "农场巡检",
    subtitle: "单次农场巡检，设备或手动均可。",
    back: "← 植物检测",
    toSessions: "← 全部巡检",
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
    notFinished: "—",
    inProgressBanner: "巡检进行中 —— 可随时上传照片。",
  },
};

// ---- session list / lifecycle UI strings -----------------------------------

export interface SessionListStrings {
  title: string;
  subtitle: string;
  back: string;
  newSession: string;
  colStarted: string;
  colFinished: string;
  colStatus: string;
  colDuration: string;
  colScanned: string;
  colFlagged: string;
  statusInProgress: string;
  statusCompleted: string;
  empty: string;
  notStarted: string;
  minutes: (m: number) => string;

  newDialogTitle: string;
  startTimeLabel: string;
  start: string;
  cancel: string;
  alreadyInProgress: string;

  endSession: string;
  endDialogTitle: string;
  endTimeLabel: string;
  end: string;

  uploadTitle: string;
  uploadHint: string;
  uploading: string;
  uploadResultHealthy: string;
  uploadResultFlagged: (issue: string) => string;
  uploadFailed: string;
  liveInProgress: string;
}

export const SESSION_UI: Record<Lang, SessionListStrings> = {
  en: {
    title: "Scan sessions",
    subtitle: "The last 10 farm walkthroughs, device or manual.",
    back: "← Plant checker",
    newSession: "New session",
    colStarted: "Started",
    colFinished: "Finished",
    colStatus: "Status",
    colDuration: "Duration",
    colScanned: "Scanned",
    colFlagged: "Flagged",
    statusInProgress: "In progress",
    statusCompleted: "Completed",
    empty: "No sessions yet — start one to begin scanning.",
    notStarted: "—",
    minutes: (m) => `${m} min`,

    newDialogTitle: "Start a new session",
    startTimeLabel: "Start time",
    start: "Start session",
    cancel: "Cancel",
    alreadyInProgress:
      "A session is already in progress — end it before starting a new one.",

    endSession: "End session",
    endDialogTitle: "End this session",
    endTimeLabel: "End time",
    end: "End session",

    uploadTitle: "Upload a plant photo",
    uploadHint: "Each photo counts as one plant scanned.",
    uploading: "Analysing…",
    uploadResultHealthy: "Healthy",
    uploadResultFlagged: (issue) => `Flagged: ${issue}`,
    uploadFailed: "Upload failed. Please retry.",
    liveInProgress: "Scan in progress — upload photos as you go.",
  },
  zh: {
    title: "巡检记录",
    subtitle: "最近 10 次农场巡检，设备或手动均在此列出。",
    back: "← 植物检测",
    newSession: "新建巡检",
    colStarted: "开始时间",
    colFinished: "结束时间",
    colStatus: "状态",
    colDuration: "耗时",
    colScanned: "已扫描",
    colFlagged: "需关注",
    statusInProgress: "进行中",
    statusCompleted: "已完成",
    empty: "暂无巡检记录 —— 点击新建以开始扫描。",
    notStarted: "—",
    minutes: (m) => `${m} 分钟`,

    newDialogTitle: "新建巡检",
    startTimeLabel: "开始时间",
    start: "开始巡检",
    cancel: "取消",
    alreadyInProgress: "已有一个巡检正在进行 —— 请先结束它，再新建。",

    endSession: "结束巡检",
    endDialogTitle: "结束此次巡检",
    endTimeLabel: "结束时间",
    end: "结束巡检",

    uploadTitle: "上传植物照片",
    uploadHint: "每张照片计为一次植株扫描。",
    uploading: "分析中…",
    uploadResultHealthy: "健康",
    uploadResultFlagged: (issue) => `已标记：${issue}`,
    uploadFailed: "上传失败，请重试。",
    liveInProgress: "巡检进行中 —— 可随时上传照片。",
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

export function durationMinutes(startIso: string, endIso?: string): number | null {
  if (!endIso) return null;
  return Math.round(
    (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000,
  );
}

/** "Now", in the same ISO-local-no-zone convention used throughout this module. */
export function nowLocalIso(): string {
  return new Date().toISOString().slice(0, 19);
}

/** Grouped with a fixed locale so SSR and client agree. */
export function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}
