import type { AnalysisResult } from "./types";
import type { Lang } from "./i18n";

// Offline demo analyzer. Used automatically when no AI key is set, so the UI can
// be built and demoed without a key. The result is deterministic per image size
// so repeated uploads of the same photo look stable.

const SAMPLES_EN: AnalysisResult[] = [
  {
    isPlant: true,
    identification: {
      commonName: "Tomato",
      scientificName: "Solanum lycopersicum",
      confidence: "medium",
      notes:
        "Leaf shape and serrated margins are consistent with a garden tomato. A wider shot of the whole plant would raise confidence.",
    },
    health: {
      status: "serious_issues",
      summary:
        "Early blight is likely taking hold on the lower leaves. Catching it now keeps it off the fruit.",
      recovery: "uncertain",
    },
    issues: [
      {
        name: "Early blight (Alternaria)",
        type: "disease",
        severity: "high",
        confidence: "medium",
        description:
          "A common fungal disease that starts on older, lower leaves and moves upward in warm, humid weather.",
        evidence:
          "Brown spots with concentric rings ('target' pattern) and a yellow halo on the lower leaves in the photo.",
      },
      {
        name: "Possible magnesium deficiency",
        type: "deficiency",
        severity: "low",
        confidence: "low",
        description:
          "Yellowing between the veins on older leaves can point to low magnesium, especially in containers.",
        evidence:
          "Faint interveinal yellowing on one leaf, though this overlaps with the early blight symptoms.",
      },
    ],
    treatment: [
      {
        title: "Remove and bin affected leaves",
        detail:
          "Prune off every spotted leaf and any that touch the soil. Put them in the trash, not the compost. Disinfect your snips between cuts.",
        urgency: "now",
      },
      {
        title: "Improve airflow and keep foliage dry",
        detail:
          "Stake or cage the plant, space it from neighbours, and water at the base in the morning so leaves dry fast.",
        urgency: "now",
      },
      {
        title: "Mulch the soil surface",
        detail:
          "A 5 cm layer of straw or wood chips stops spores splashing up from the soil onto the leaves.",
        urgency: "soon",
      },
      {
        title: "Apply a protectant fungicide if it keeps spreading",
        detail:
          "Copper or chlorothalonil, sprayed every 7-10 days per the label. This is a last resort — always read and follow the product instructions.",
        urgency: "soon",
      },
    ],
    prevention: [
      "Rotate tomatoes and potatoes to a fresh bed each year.",
      "Choose blight-tolerant varieties where you can.",
      "Water in the morning, at soil level, never overhead.",
      "Clear all plant debris at the end of the season.",
    ],
    care: {
      light: "Full sun, at least 6-8 hours a day.",
      water:
        "Deep and even — about 2.5 cm per week. Let the top 2-3 cm of soil dry between waterings.",
      soil: "Rich, well-drained loam, pH 6.2-6.8, with plenty of compost.",
      humidity: "Moderate. High humidity with wet leaves invites fungal disease.",
      temperature: "Grows best between 18-29 C; fruit set drops above 32 C.",
    },
    disclaimer:
      "This is an automated visual estimate, not a substitute for local expert diagnosis.",
  },
  {
    isPlant: true,
    identification: {
      commonName: "Peace lily",
      scientificName: "Spathiphyllum wallisii",
      confidence: "high",
      notes:
        "Glossy lance-shaped leaves and the white spathe are unmistakable for Spathiphyllum.",
    },
    health: {
      status: "minor_issues",
      summary:
        "Mostly healthy, but the leaf tips show classic signs of watering and humidity stress.",
      recovery: "likely",
    },
    issues: [
      {
        name: "Leaf-tip browning",
        type: "environmental",
        severity: "low",
        confidence: "high",
        description:
          "Crispy brown tips on a peace lily usually mean inconsistent watering, low humidity, or mineral build-up from tap water.",
        evidence:
          "Dry, dark-brown tips on several leaves with a thin yellow transition zone, while the leaf centres stay green.",
      },
    ],
    treatment: [
      {
        title: "Even out watering",
        detail:
          "Water when the top 2-3 cm of soil is dry, until it runs from the drainage holes. Never let the pot sit in a saucer of water.",
        urgency: "soon",
      },
      {
        title: "Raise humidity",
        detail:
          "Group it with other plants or set the pot on a tray of pebbles and water. Aim for 50%+ humidity.",
        urgency: "ongoing",
      },
      {
        title: "Flush the soil",
        detail:
          "Every couple of months, run water through the pot for a minute to wash out built-up salts. Filtered or rainwater helps if your tap water is hard.",
        urgency: "ongoing",
      },
      {
        title: "Trim the damaged tips",
        detail:
          "Cut the brown tips off following the leaf's natural shape. It's cosmetic — the leaf won't regrow the tip.",
        urgency: "ongoing",
      },
    ],
    prevention: [
      "Keep a regular watering rhythm rather than long dry spells then a flood.",
      "Use room-temperature filtered water where possible.",
      "Keep it out of cold draughts and away from heating vents.",
    ],
    care: {
      light: "Bright, indirect light. Tolerates low light but flowers less.",
      water: "Keep lightly moist; droops dramatically when thirsty, then recovers.",
      soil: "Loose, well-draining peat-based potting mix.",
      humidity: "Prefers 50-60%. Dry indoor air causes brown tips.",
      temperature: "18-27 C. Avoid anything below 12 C.",
    },
    disclaimer:
      "This is an automated visual estimate, not a substitute for local expert diagnosis.",
  },
  {
    isPlant: true,
    identification: {
      commonName: "Rose",
      scientificName: "Rosa sp.",
      confidence: "medium",
      notes:
        "Compound leaves with toothed leaflets and a thorny stem indicate a garden rose; the cultivar can't be named from foliage alone.",
    },
    health: {
      status: "serious_issues",
      summary:
        "Black spot is well established. Roses rarely shrug this off without help.",
      recovery: "likely",
    },
    issues: [
      {
        name: "Black spot (Diplocarpon rosae)",
        type: "disease",
        severity: "high",
        confidence: "high",
        description:
          "A fungal disease that thrives in warm, wet conditions and can defoliate a rose by midsummer.",
        evidence:
          "Round black lesions with feathery edges, surrounded by yellowing leaf tissue, on several leaflets.",
      },
      {
        name: "Aphids",
        type: "pest",
        severity: "medium",
        confidence: "medium",
        description:
          "Sap-sucking insects that cluster on new growth and buds, leaving sticky honeydew.",
        evidence:
          "Small pale-green clusters visible along the youngest stem and a shine on the leaf below it.",
      },
    ],
    treatment: [
      {
        title: "Strip and bin infected leaves",
        detail:
          "Remove spotted leaves from the plant and the ground. Do not compost them. Sanitise pruners afterward.",
        urgency: "now",
      },
      {
        title: "Blast off the aphids",
        detail:
          "A strong jet of water knocks most aphids off. Repeat every few days; encourage ladybirds and lacewings.",
        urgency: "now",
      },
      {
        title: "Water at the base, in the morning",
        detail:
          "Keep foliage dry. Mulch to stop soil splash. Prune the centre of the bush for airflow.",
        urgency: "soon",
      },
      {
        title: "Spray a fungicide on a preventive schedule",
        detail:
          "Once new clean growth appears, a sulfur or myclobutanil spray every 7-14 days protects it. Follow the label; sulfur can burn in heat.",
        urgency: "soon",
      },
    ],
    prevention: [
      "Plant disease-resistant rose varieties.",
      "Give roses full sun and space for air to move.",
      "Clean up all fallen leaves in autumn.",
      "Feed and mulch so the plant can outgrow minor damage.",
    ],
    care: {
      light: "Full sun, 6+ hours.",
      water: "About 4-5 cm per week at the base; more in heat.",
      soil: "Fertile, well-drained, pH 6.0-6.8, generous compost.",
      humidity: "Open, airy sites. Still, humid corners worsen fungal disease.",
      temperature: "Hardy in most temperate zones; mulch the crown for winter.",
    },
    disclaimer:
      "This is an automated visual estimate, not a substitute for local expert diagnosis.",
  },
];

const SAMPLES_ZH: AnalysisResult[] = [
  {
    isPlant: true,
    identification: {
      commonName: "番茄",
      scientificName: "Solanum lycopersicum",
      confidence: "medium",
      notes:
        "叶形和锯齿状叶缘符合菜园番茄的特征。若能提供整株植物的全景照片，可提高识别可信度。",
    },
    health: {
      status: "serious_issues",
      summary: "下部叶片很可能已开始感染早疫病。及时处理可避免蔓延到果实。",
      recovery: "uncertain",
    },
    issues: [
      {
        name: "早疫病（链格孢菌）",
        type: "disease",
        severity: "high",
        confidence: "medium",
        description:
          "一种常见真菌病害，通常先在较老的下部叶片发病，在温暖潮湿的天气里向上蔓延。",
        evidence:
          "照片中下部叶片出现带同心轮纹的褐色病斑（“靶心”状），周围有黄色晕圈。",
      },
      {
        name: "可能缺镁",
        type: "deficiency",
        severity: "low",
        confidence: "low",
        description: "老叶脉间发黄可能提示缺镁，盆栽尤其容易出现。",
        evidence: "一片叶子有轻微的脉间黄化，但与早疫病症状有所重叠。",
      },
    ],
    treatment: [
      {
        title: "摘除并丢弃病叶",
        detail:
          "剪掉所有带病斑的叶片以及接触土壤的叶片。丢入垃圾桶，不要堆肥。每剪一刀后对剪刀消毒。",
        urgency: "now",
      },
      {
        title: "改善通风，保持叶片干燥",
        detail:
          "为植株搭架或立支撑，与相邻植株拉开间距，早晨在根部浇水，让叶片尽快干燥。",
        urgency: "now",
      },
      {
        title: "在土表覆盖覆盖物",
        detail: "铺一层约 5 厘米厚的稻草或木屑，防止孢子随土壤溅到叶片上。",
        urgency: "soon",
      },
      {
        title: "若持续蔓延，喷施保护性杀菌剂",
        detail:
          "可用铜制剂或百菌清，按标签说明每 7-10 天喷一次。这是最后手段——务必阅读并遵循产品说明。",
        urgency: "soon",
      },
    ],
    prevention: [
      "每年将番茄和马铃薯轮作到新的地块。",
      "尽量选择抗病品种。",
      "早晨在土面浇水，不要从头顶淋浇。",
      "生长季结束后清除所有植株残体。",
    ],
    care: {
      light: "全日照，每天至少 6-8 小时。",
      water:
        "浇透且均匀——每周约 2.5 厘米水量。两次浇水之间让表层 2-3 厘米土壤变干。",
      soil: "肥沃、排水良好的壤土，pH 6.2-6.8，混入充足堆肥。",
      humidity: "中等。高湿加上叶片潮湿容易诱发真菌病害。",
      temperature: "18-29℃ 生长最佳；高于 32℃ 时坐果率下降。",
    },
    disclaimer: "这是基于图像的自动估计，不能替代当地专家的诊断。",
  },
  {
    isPlant: true,
    identification: {
      commonName: "白掌（和平芋）",
      scientificName: "Spathiphyllum wallisii",
      confidence: "high",
      notes: "有光泽的披针形叶片和白色佛焰苞是白掌属的典型特征。",
    },
    health: {
      status: "minor_issues",
      summary: "总体健康，但叶尖出现了典型的浇水与湿度不当造成的胁迫迹象。",
      recovery: "likely",
    },
    issues: [
      {
        name: "叶尖褐化",
        type: "environmental",
        severity: "low",
        confidence: "high",
        description:
          "白掌叶尖干枯发褐通常意味着浇水不均、空气湿度偏低，或自来水中矿物质累积。",
        evidence:
          "多片叶子的叶尖干枯呈深褐色，并有一条狭窄的黄色过渡带，而叶片中部仍为绿色。",
      },
    ],
    treatment: [
      {
        title: "让浇水更规律",
        detail:
          "当表层 2-3 厘米土壤变干时浇水，浇到排水孔流出为止。切勿让花盆长期泡在托盘的积水中。",
        urgency: "soon",
      },
      {
        title: "提高空气湿度",
        detail:
          "与其他植物摆放在一起，或将花盆放在装有卵石和水的托盘上。目标湿度 50% 以上。",
        urgency: "ongoing",
      },
      {
        title: "冲洗盆土",
        detail:
          "每隔一两个月，用水冲淋盆土约一分钟，洗去累积的盐分。若自来水偏硬，使用过滤水或雨水更好。",
        urgency: "ongoing",
      },
      {
        title: "修剪受损叶尖",
        detail:
          "顺着叶片自然形状剪去褐色叶尖。这只是外观处理——叶尖不会重新长出。",
        urgency: "ongoing",
      },
    ],
    prevention: [
      "保持规律的浇水节奏，避免长期干旱后又一次浇透。",
      "尽量使用室温的过滤水。",
      "远离冷风和暖气出风口。",
    ],
    care: {
      light: "明亮的散射光。可耐受弱光，但开花会减少。",
      water: "保持微湿；缺水时会明显下垂，补水后可恢复。",
      soil: "疏松、排水良好、以泥炭为主的盆栽基质。",
      humidity: "偏好 50-60%。室内空气干燥会导致叶尖发褐。",
      temperature: "18-27℃。避免低于 12℃。",
    },
    disclaimer: "这是基于图像的自动估计，不能替代当地专家的诊断。",
  },
  {
    isPlant: true,
    identification: {
      commonName: "月季（玫瑰）",
      scientificName: "Rosa sp.",
      confidence: "medium",
      notes:
        "羽状复叶、小叶带锯齿、茎上有刺，表明是庭院月季；仅凭枝叶无法确定具体品种。",
    },
    health: {
      status: "serious_issues",
      summary: "黑斑病已明显发生。月季很少能在无人干预下自行痊愈。",
      recovery: "likely",
    },
    issues: [
      {
        name: "黑斑病（蔷薇双壳菌）",
        type: "disease",
        severity: "high",
        confidence: "high",
        description:
          "一种在温暖潮湿条件下迅速发展的真菌病害，可在仲夏使月季落光叶片。",
        evidence: "多片小叶上有边缘呈羽状的圆形黑色病斑，周围叶组织发黄。",
      },
      {
        name: "蚜虫",
        type: "pest",
        severity: "medium",
        confidence: "medium",
        description: "刺吸式害虫，聚集在新梢和花蕾上，分泌黏腻的蜜露。",
        evidence: "在最嫩的枝条上可见淡绿色小虫成群，其下方叶片有一层反光的黏液。",
      },
    ],
    treatment: [
      {
        title: "摘除并丢弃病叶",
        detail:
          "把植株上和地面上的病叶都清理掉。不要堆肥。之后对修枝剪消毒。",
        urgency: "now",
      },
      {
        title: "用水冲掉蚜虫",
        detail:
          "用较强的水流可冲掉大部分蚜虫。每隔几天重复一次；招引瓢虫和草蛉等天敌。",
        urgency: "now",
      },
      {
        title: "早晨在根部浇水",
        detail:
          "保持叶片干燥。覆盖地面防止土壤溅起。适当修剪灌丛中心以改善通风。",
        urgency: "soon",
      },
      {
        title: "按预防性周期喷施杀菌剂",
        detail:
          "待长出洁净新叶后，每 7-14 天喷一次硫制剂或腈菌唑可起保护作用。遵循标签说明；高温下硫制剂可能灼伤叶片。",
        urgency: "soon",
      },
    ],
    prevention: [
      "选栽抗病的月季品种。",
      "给月季全日照和足够的通风空间。",
      "秋季清理所有落叶。",
      "施肥并覆盖地面，让植株能靠自身长势盖过轻微损伤。",
    ],
    care: {
      light: "全日照，每天 6 小时以上。",
      water: "每周在根部约 4-5 厘米水量；高温时增加。",
      soil: "肥沃、排水良好，pH 6.0-6.8，混入充足堆肥。",
      humidity: "开阔通风处。静滞潮湿的角落会加重真菌病害。",
      temperature: "在多数温带地区可露地越冬；冬季在根颈处覆盖保温。",
    },
    disclaimer: "这是基于图像的自动估计，不能替代当地专家的诊断。",
  },
];

const SAMPLES: Record<Lang, AnalysisResult[]> = {
  en: SAMPLES_EN,
  zh: SAMPLES_ZH,
};

export function mockAnalyze(seed: number, lang: Lang = "en"): AnalysisResult {
  const set = SAMPLES[lang] ?? SAMPLES_EN;
  const index = Math.abs(Math.floor(seed)) % set.length;
  return set[index];
}
