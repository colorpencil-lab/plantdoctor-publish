// Generate demo data for the farm dashboard: one full scan session with a
// handful of flagged plants. Writes lib/farm/demo-scan.json.
//
//   npm run farm-demo
//
// Env overrides:
//   PLANTS      total plants scanned            (default 1000)
//   ROWS        farm grid rows                  (default 40; cols = PLANTS / ROWS)
//   START       ISO local start time, no zone   (default 2026-09-02T11:00:00)
//   DURATION    minutes for the whole pass      (default 30)
//
// The JSON is plain data — edit it by hand afterwards to tune the demo.

import { writeFileSync, mkdirSync } from "node:fs";

const PLANTS = Number(process.env.PLANTS || 1000);
const ROWS = Number(process.env.ROWS || 40);
const COLS = Math.max(1, Math.round(PLANTS / ROWS));
const START = process.env.START || "2026-09-02T11:00:00";
const DURATION_MIN = Number(process.env.DURATION || 30);

// Issue templates. category ∈ fungal|bacterial|viral|pest|nutrient|
// water_stress|sunscald|cold|other   severity ∈ low|medium|high
// recovery ∈ likely|uncertain|unlikely
const TEMPLATES = [
  {
    plant: { en: "Tomato", zh: "番茄" },
    issueTitle: { en: "Early blight (Alternaria)", zh: "早疫病（链格孢菌）" },
    issueSummary: {
      en: "Target-pattern brown spots on the lower leaves, spreading upward.",
      zh: "下部叶片出现同心轮纹褐斑，并逐渐向上蔓延。",
    },
    category: "fungal", severity: "high", recovery: "uncertain",
  },
  {
    plant: { en: "Rose", zh: "月季" },
    issueTitle: { en: "Black spot (Diplocarpon rosae)", zh: "黑斑病（蔷薇双壳菌）" },
    issueSummary: {
      en: "Black lesions with feathery edges and yellowing around them.",
      zh: "叶片有边缘呈羽状的黑色病斑，周围组织发黄。",
    },
    category: "fungal", severity: "medium", recovery: "likely",
  },
  {
    plant: { en: "Cucumber", zh: "黄瓜" },
    issueTitle: { en: "Powdery mildew", zh: "白粉病" },
    issueSummary: {
      en: "White powdery film across the upper leaf surface.",
      zh: "叶片正面覆有一层白色粉状霉层。",
    },
    category: "fungal", severity: "medium", recovery: "likely",
  },
  {
    plant: { en: "Chili pepper", zh: "辣椒" },
    issueTitle: { en: "Bacterial leaf spot", zh: "细菌性叶斑病" },
    issueSummary: {
      en: "Water-soaked spots turning brown with a yellow halo; some leaf drop.",
      zh: "水渍状斑点转褐并带黄晕，部分叶片脱落。",
    },
    category: "bacterial", severity: "high", recovery: "unlikely",
  },
  {
    plant: { en: "Papaya", zh: "木瓜" },
    issueTitle: { en: "Papaya ringspot virus", zh: "番木瓜环斑病毒" },
    issueSummary: {
      en: "Mosaic mottling on leaves and oily ring marks on the stem.",
      zh: "叶片花叶斑驳，茎部有油渍状环纹。",
    },
    category: "viral", severity: "high", recovery: "unlikely",
  },
  {
    plant: { en: "Eggplant", zh: "茄子" },
    issueTitle: { en: "Two-spotted spider mite", zh: "二斑叶螨" },
    issueSummary: {
      en: "Fine stippling and faint webbing on the undersides of leaves.",
      zh: "叶背有细密失绿斑点和少量丝网。",
    },
    category: "pest", severity: "medium", recovery: "likely",
  },
  {
    plant: { en: "Cabbage", zh: "甘蓝" },
    issueTitle: { en: "Aphid infestation", zh: "蚜虫为害" },
    issueSummary: {
      en: "Colonies on new growth with sticky honeydew and some curling.",
      zh: "新梢聚集大量蚜虫，有黏腻蜜露，叶片轻微卷曲。",
    },
    category: "pest", severity: "low", recovery: "likely",
  },
  {
    plant: { en: "Citrus", zh: "柑橘" },
    issueTitle: { en: "Magnesium deficiency", zh: "缺镁" },
    issueSummary: {
      en: "Interveinal yellowing on older leaves in an inverted-V pattern.",
      zh: "老叶脉间黄化，呈倒 V 形。",
    },
    category: "nutrient", severity: "low", recovery: "likely",
  },
  {
    plant: { en: "Sweet corn", zh: "甜玉米" },
    issueTitle: { en: "Nitrogen deficiency", zh: "缺氮" },
    issueSummary: {
      en: "Pale lower leaves yellowing from the tip along the midrib.",
      zh: "下部叶片发黄，自叶尖沿主脉向内扩展。",
    },
    category: "nutrient", severity: "medium", recovery: "likely",
  },
  {
    plant: { en: "Lettuce", zh: "生菜" },
    issueTitle: { en: "Water stress", zh: "缺水" },
    issueSummary: {
      en: "Whole plant wilting at midday with dry, crisping leaf margins.",
      zh: "正午整株萎蔫，叶缘干枯发脆。",
    },
    category: "water_stress", severity: "medium", recovery: "likely",
  },
  {
    plant: { en: "Sweet pepper", zh: "甜椒" },
    issueTitle: { en: "Leaf scorch (sun)", zh: "日灼" },
    issueSummary: {
      en: "Bleached, papery patches on leaves and fruit facing the sun.",
      zh: "朝阳面的叶片和果实出现漂白、纸质化的斑块。",
    },
    category: "sunscald", severity: "low", recovery: "likely",
  },
  {
    plant: { en: "Basil", zh: "罗勒" },
    issueTitle: { en: "Cold damage", zh: "冷害" },
    issueSummary: {
      en: "Dark, water-soaked blotches after a cold night; leaves collapsing.",
      zh: "经历寒夜后出现深色水渍状斑块，叶片萎垂。",
    },
    category: "cold", severity: "medium", recovery: "uncertain",
  },
  {
    plant: { en: "Spinach", zh: "菠菜" },
    issueTitle: { en: "Downy mildew", zh: "霜霉病" },
    issueSummary: {
      en: "Yellow blotches on top, grey-purple fuzz on the underside.",
      zh: "叶面黄斑，叶背有灰紫色霉层。",
    },
    category: "fungal", severity: "high", recovery: "unlikely",
  },
  {
    plant: { en: "Strawberry", zh: "草莓" },
    issueTitle: { en: "Leaf spot (Mycosphaerella)", zh: "叶斑病（球腔菌）" },
    issueSummary: {
      en: "Small purple spots with pale centres scattered over the leaves.",
      zh: "叶片散布中心灰白、外缘紫色的小斑点。",
    },
    category: "fungal", severity: "low", recovery: "likely",
  },
];

// Which plants (row, col) came back flagged. Spread across the pass.
const FLAGGED_CELLS = [
  [2, 17], [4, 3], [6, 22], [8, 11], [11, 6],
  [13, 24], [16, 2], [18, 19], [20, 9], [23, 14],
  [25, 25], [27, 5], [29, 16], [31, 8], [33, 21],
  [35, 12], [37, 1], [38, 23], [40, 10],
];

const startMs = new Date(START).getTime();
const totalMs = DURATION_MIN * 60 * 1000;

const pad = (n) => String(n).padStart(2, "0");
const toLocalIso = (ms) => {
  const d = new Date(ms);
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
};

const checks = FLAGGED_CELLS.map(([row, col], i) => {
  const tpl = TEMPLATES[i % TEMPLATES.length];
  const scanIndex = (row - 1) * COLS + (col - 1); // 0-based order the unit visits
  const checkedAt = toLocalIso(
    startMs + Math.round((scanIndex / PLANTS) * totalMs),
  );
  return {
    unit: `R${row}C${col}`,
    row,
    col,
    checkedAt,
    plant: tpl.plant,
    issueTitle: tpl.issueTitle,
    issueSummary: tpl.issueSummary,
    category: tpl.category,
    severity: tpl.severity,
    recovery: tpl.recovery,
  };
}).sort((a, b) => a.checkedAt.localeCompare(b.checkedAt));

const session = {
  id: `scan-${START.slice(0, 10)}`,
  startedAt: START,
  finishedAt: toLocalIso(startMs + totalMs),
  plantsScanned: PLANTS,
  plantsHealthy: PLANTS - checks.length,
  plantsFlagged: checks.length,
  rows: ROWS,
  cols: COLS,
  checks,
};

mkdirSync("lib/farm", { recursive: true });
writeFileSync(
  "lib/farm/demo-scan.json",
  JSON.stringify(session, null, 2) + "\n",
);
console.log(
  `✓ ${checks.length} flagged of ${PLANTS} scanned → lib/farm/demo-scan.json`,
);
