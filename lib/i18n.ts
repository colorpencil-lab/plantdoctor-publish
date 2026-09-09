// UI strings + AI language instruction for the EN / 中文 toggle.
// `en` is the source language; `zh` is Simplified Chinese (zh-CN).

export type Lang = "en" | "zh";

export const LANGS: Lang[] = ["en", "zh"];
export const DEFAULT_LANG: Lang = "en";

export function isLang(v: unknown): v is Lang {
  return v === "en" || v === "zh";
}

/** Best-effort pick from a browser language tag (e.g. "zh-CN", "en-GB"). */
export function langFromNavigator(tag: string | undefined | null): Lang {
  return tag && tag.toLowerCase().startsWith("zh") ? "zh" : "en";
}

/** Appended to the vision prompt so the model writes its answer in `lang`. */
export const AI_LANG_INSTRUCTION: Record<Lang, string> = {
  en: "",
  zh: `请用简体中文撰写所有回答。JSON 中的每一个文本值（commonName、scientificName、notes、summary、name、description、evidence、title、detail、prevention 列表、care 各项、disclaimer 等）都必须是简体中文。scientificName 请保留拉丁学名。请勿翻译 JSON 的字段名，也勿翻译枚举值（例如 "healthy"、"disease"、"deficiency"、"now"、"soon"、"ongoing"、"low"、"medium"、"high"），它们必须保持英文原样。`,
};

export interface UIStrings {
  htmlLang: string;
  tagline: string;
  footer: string;
  languageLabel: string;
  langNameEn: string;
  langNameZh: string;
  dashboardLink: string;
  recoveryOutlook: Record<"likely" | "uncertain" | "unlikely", string>;

  tabsAria: string;
  tabUpload: string;
  tabCamera: string;

  demoStripLabel: string;
  savedDemo: string;

  dropTitle: string;
  dropHint: string;

  cameraPlaceholder: string;
  cameraStart: string;
  cameraCapture: string;
  cameraStop: string;
  cameraNoApi: string;
  cameraDenied: string;

  previewAlt: string;
  analyse: string;
  analysing: string;
  chooseAnother: string;
  loading: string;

  errBadType: string;
  errTooLarge: string;
  errReadImage: string;
  errReadFile: string;
  errLoadImage: string;
  errRequestFailed: (status: number) => string;
  errAnalysisFailed: string;
  analysedBy: (model: string) => string;

  // Diagnosis
  noPlantTitle: string;
  noPlantBody: string;
  identification: string;
  confidence: (level: string) => string;
  healthLabel: Record<"healthy" | "minor_issues" | "serious_issues" | "unknown", string>;
  issuesTitle: (n: number) => string;
  issueType: Record<"disease" | "pest" | "deficiency" | "environmental" | "other", string>;
  severity: (level: string) => string;
  inThePhoto: string;
  treatmentTitle: string;
  urgency: Record<"now" | "soon" | "ongoing", string>;
  preventionTitle: string;
  careTitle: string;
  care: Record<"light" | "water" | "soil" | "humidity" | "temperature", string>;

  /** Split around the two <code> env-var names rendered inline by DemoNote. */
  demoNoteBefore: string;
  demoNoteMid: string;
  demoNoteAfter: string;
}

const LEVEL_EN: Record<string, string> = { low: "low", medium: "medium", high: "high" };
const LEVEL_ZH: Record<string, string> = { low: "低", medium: "中", high: "高" };

export const UI: Record<Lang, UIStrings> = {
  en: {
    htmlLang: "en",
    tagline:
      "Snap a photo of a plant or a single leaf. Get an identification, a health check, and a step-by-step treatment plan.",
    footer:
      "Diagnoses are an automated visual estimate. For valuable or food crops, confirm with a local extension service or nursery.",
    languageLabel: "Language",
    langNameEn: "EN",
    langNameZh: "中文",
    dashboardLink: "Farm dashboard →",
    recoveryOutlook: {
      likely: "Recovery likely with care",
      uncertain: "Recovery uncertain",
      unlikely: "Recovery unlikely",
    },

    tabsAria: "How to add a photo",
    tabUpload: "Upload photo",
    tabCamera: "Use camera",

    demoStripLabel: "Or try a sample photo",
    savedDemo: "Saved demo result — not a live AI analysis.",

    dropTitle: "Tap to choose a photo",
    dropHint: "or drag an image here — leaf close-ups work best",

    cameraPlaceholder: "Give the page camera permission, then frame the plant.",
    cameraStart: "Start camera",
    cameraCapture: "Capture photo",
    cameraStop: "Stop",
    cameraNoApi: "This browser can't open the camera. Upload a photo instead.",
    cameraDenied:
      "Couldn't access the camera. Check permissions, or upload a photo instead.",

    previewAlt: "Plant to analyse",
    analyse: "Analyse plant",
    analysing: "Analysing…",
    chooseAnother: "Choose another",
    loading: "Looking at leaves, checking for disease, drafting a plan…",

    errBadType: "Please choose a JPEG, PNG, WebP, or GIF image.",
    errTooLarge: "That file is very large. Please choose one under 25 MB.",
    errReadImage: "Could not read that image file.",
    errReadFile: "Could not read that file.",
    errLoadImage: "Could not load that image.",
    errRequestFailed: (status) => `Request failed (${status}).`,
    errAnalysisFailed: "Analysis failed. Please retry.",
    analysedBy: (model) => ` · Analysed by ${model}.`,

    noPlantTitle: "No plant spotted",
    noPlantBody:
      "This photo doesn't seem to show a plant. Try a well-lit, close-up shot of a leaf, stem, or the whole plant.",
    identification: "Identification",
    confidence: (level) => `${LEVEL_EN[level] ?? level} confidence`,
    healthLabel: {
      healthy: "Looks healthy",
      minor_issues: "Minor issues",
      serious_issues: "Needs attention",
      unknown: "Unclear from photo",
    },
    issuesTitle: (n) => `What's wrong (${n})`,
    issueType: {
      disease: "Disease",
      pest: "Pest",
      deficiency: "Nutrient",
      environmental: "Environment",
      other: "Other",
    },
    severity: (level) => `${LEVEL_EN[level] ?? level} severity`,
    inThePhoto: "In the photo:",
    treatmentTitle: "Treatment plan",
    urgency: { now: "Do now", soon: "Do soon", ongoing: "Ongoing" },
    preventionTitle: "Prevention",
    careTitle: "Care guide",
    care: {
      light: "Light",
      water: "Water",
      soil: "Soil",
      humidity: "Humidity",
      temperature: "Temperature",
    },
    demoNoteBefore: "Demo mode. No AI key is set, so these are canned sample results. Add a ",
    demoNoteMid: " or ",
    demoNoteAfter: " for a real diagnosis.",
  },

  zh: {
    htmlLang: "zh-CN",
    tagline:
      "拍一张植物或单片叶子的照片，即可获得物种识别、健康评估，以及分步的处理方案。",
    footer:
      "诊断结果为基于图像的自动估计。对于贵重作物或食用作物，请咨询当地农技推广机构或苗圃后再处理。",
    languageLabel: "语言",
    langNameEn: "EN",
    langNameZh: "中文",
    dashboardLink: "农场看板 →",
    recoveryOutlook: {
      likely: "经处理很可能康复",
      uncertain: "康复情况尚不确定",
      unlikely: "难以康复",
    },

    tabsAria: "如何添加照片",
    tabUpload: "上传照片",
    tabCamera: "使用相机",

    demoStripLabel: "或试用示例照片",
    savedDemo: "已保存的示例结果 —— 非实时 AI 分析。",

    dropTitle: "点击选择照片",
    dropHint: "或将图片拖到这里 —— 叶片特写效果最佳",

    cameraPlaceholder: "请允许本页面使用相机，然后对准植物。",
    cameraStart: "开启相机",
    cameraCapture: "拍摄照片",
    cameraStop: "停止",
    cameraNoApi: "此浏览器无法打开相机，请改为上传照片。",
    cameraDenied: "无法访问相机。请检查权限，或改为上传照片。",

    previewAlt: "待分析的植物",
    analyse: "分析植物",
    analysing: "分析中…",
    chooseAnother: "重新选择",
    loading: "正在观察叶片、排查病害、拟定方案…",

    errBadType: "请选择 JPEG、PNG、WebP 或 GIF 格式的图片。",
    errTooLarge: "该文件太大，请选择小于 25 MB 的图片。",
    errReadImage: "无法读取该图片文件。",
    errReadFile: "无法读取该文件。",
    errLoadImage: "无法加载该图片。",
    errRequestFailed: (status) => `请求失败（${status}）。`,
    errAnalysisFailed: "分析失败，请重试。",
    analysedBy: (model) => ` · 由 ${model} 分析。`,

    noPlantTitle: "未识别到植物",
    noPlantBody:
      "这张照片似乎没有植物。请尝试在光线充足的条件下，拍摄叶片、茎干或整株植物的特写。",
    identification: "识别结果",
    confidence: (level) => `置信度：${LEVEL_ZH[level] ?? level}`,
    healthLabel: {
      healthy: "看起来健康",
      minor_issues: "轻微问题",
      serious_issues: "需要处理",
      unknown: "照片无法判断",
    },
    issuesTitle: (n) => `存在的问题（${n}）`,
    issueType: {
      disease: "病害",
      pest: "虫害",
      deficiency: "缺素",
      environmental: "环境",
      other: "其他",
    },
    severity: (level) => `严重程度：${LEVEL_ZH[level] ?? level}`,
    inThePhoto: "照片依据：",
    treatmentTitle: "处理方案",
    urgency: { now: "立即处理", soon: "尽快处理", ongoing: "长期维护" },
    preventionTitle: "预防措施",
    careTitle: "养护指南",
    care: {
      light: "光照",
      water: "浇水",
      soil: "土壤",
      humidity: "湿度",
      temperature: "温度",
    },
    demoNoteBefore: "演示模式。未设置 AI 密钥，以下为预置的示例结果。请设置 ",
    demoNoteMid: " 或 ",
    demoNoteAfter: " 以获得真实诊断。",
  },
};
