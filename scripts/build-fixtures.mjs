// Build the local demo fixtures: run every photo in ./photo through the running
// app's /api/analyze (EN + 中文), copy the images into public/demo/, and write
//   lib/fixtures/photos.json   — id + image + label, for the UI picker
//   lib/fixtures/results.json  — the saved AnalysisResult per id per language
//
// Usage:
//   1. npm run dev              (in another terminal — the API must be reachable)
//   2. npm run fixtures
//
// Env:
//   BASE_URL   default http://localhost:3000
//   PHOTO_DIR  default photo
//
// The JSON files are plain data — after generating, edit them by hand to make
// each demo read exactly how you want. Re-running overwrites them.

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
  readdirSync,
} from "node:fs";
import { join, extname } from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const PHOTO_DIR = process.env.PHOTO_DIR || "photo";
const LANGS = ["en", "zh"];

// Known photos → a stable, readable id. Anything else gets an id from its
// filename. Add rows here as you drop more photos in.
const ID_BY_FILE = {
  "images (1).jpg": "camellia-leaf-spot",
  "images (3).jpg": "durian-leaf-blight",
  "images (4)(1).jpg": "powdery-mildew",
  "images (6).jpg": "hydrangea-leaf-spot",
  "images (8).jpg": "durian-leaf-scorch",
};

const MEDIA = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

const slug = (name) =>
  name
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "photo";

async function reachable() {
  try {
    await fetch(BASE, { method: "GET" });
    return true;
  } catch {
    return false;
  }
}

async function analyze(dataUrl, lang) {
  const res = await fetch(`${BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: dataUrl, lang }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

async function main() {
  if (!(await reachable())) {
    console.error(`Cannot reach ${BASE}. Start the app first:  npm run dev`);
    process.exit(1);
  }

  const files = readdirSync(PHOTO_DIR)
    .filter((f) => /\.(jpe?g|png|webp|gif)$/i.test(f))
    .sort();
  if (!files.length) {
    console.error(`No images found in ${PHOTO_DIR}/`);
    process.exit(1);
  }

  mkdirSync("public/demo", { recursive: true });
  mkdirSync("lib/fixtures", { recursive: true });

  const photos = [];
  const results = {};

  for (const file of files) {
    const id = ID_BY_FILE[file] || slug(file);
    const srcExt = extname(file).toLowerCase();
    const outExt = srcExt === ".jpeg" ? ".jpg" : srcExt;
    const outName = `${id}${outExt}`;
    copyFileSync(join(PHOTO_DIR, file), join("public/demo", outName));

    const bytes = readFileSync(join(PHOTO_DIR, file));
    const dataUrl = `data:${MEDIA[srcExt] || "image/jpeg"};base64,${bytes.toString("base64")}`;

    const label = {};
    results[id] = {};
    for (const lang of LANGS) {
      process.stdout.write(`  ${id}  ${lang} … `);
      const out = await analyze(dataUrl, lang);
      results[id][lang] = out.result;
      label[lang] = out.result?.identification?.commonName || id;
      console.log(out.demo ? "demo engine" : out.model || "ok");
    }
    photos.push({ id, image: `/demo/${outName}`, label });
  }

  writeFileSync(
    "lib/fixtures/photos.json",
    JSON.stringify(photos, null, 2) + "\n",
  );
  writeFileSync(
    "lib/fixtures/results.json",
    JSON.stringify(results, null, 2) + "\n",
  );

  console.log(
    `\n✓ ${photos.length} fixtures → lib/fixtures/*.json, images → public/demo/`,
  );
}

main().catch((e) => {
  console.error("\n" + (e?.message || e));
  process.exit(1);
});
