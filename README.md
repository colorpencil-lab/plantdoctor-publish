# 🌿 PlantDoctor

Upload or snap a photo of a plant or a single leaf and get back:

- **Identification** — common + scientific name, with a stated confidence
- **Health check** — healthy / minor issues / needs attention
- **Diagnosis** — each visible problem, what in the photo shows it, how serious
- **Treatment plan** — concrete home-scale steps ordered by urgency
- **Prevention tips + a short species care guide**

One Next.js page, one API route. The AI engine is pluggable — **Google Gemini**
(free tier, no credit card) or **Anthropic Claude** — selected by env var, with
an offline demo analyzer when no key is set.

**Bilingual.** An **EN / 中文** toggle in the header switches all UI text and
asks the model to return the diagnosis in that language (Simplified Chinese).
The choice is remembered in `localStorage`; first visit follows the browser
language. Strings live in `lib/i18n.ts`.

**Responsive.** On a phone everything is a single vertical column. On a tablet
the detail sections (issues / treatment / prevention / care) flow into two
columns. On a desktop the capture pane pins to the left and the full diagnosis
fills the rest of the width, so it reads without a long scroll. All layout is
CSS in `app/globals.css` (`.analyzer`, `.results`), driven by a `has-output`
class on the analyzer.

## Run locally

```bash
npm install
cp .env.example .env.local     # add GEMINI_API_KEY (free) or ANTHROPIC_API_KEY
npm run dev                    # http://localhost:3000
```

**Free key:** get one at <https://aistudio.google.com/apikey> (no card,
~1500 requests/day) and put it in `GEMINI_API_KEY`. On the free tier Google may
use submitted images to improve their models.

**No key at all?** Everything still runs against a built-in demo engine that
returns canned diagnoses (a "demo" badge shows).

## Saved demo photos (offline, no API cost)

For a reliable demo, a set of photos can have their diagnosis **pre-saved** and
served instantly — no AI call, works offline, identical every time.

```bash
# 1. drop photos into  photo/
# 2. run the app in one terminal
npm run dev
# 3. generate fixtures in another terminal (calls the AI once per photo, EN + 中文)
npm run fixtures
```

This writes `lib/fixtures/photos.json` (picker list) and
`lib/fixtures/results.json` (the saved `AnalysisResult` per photo per language),
and copies the images to `public/demo/`. **Both JSON files are plain data — edit
them by hand to make each demo read exactly how you want.**

The saved photos appear as a **"try a sample photo"** strip under the upload box.
Picking one always shows its saved result (labelled *Saved demo result*);
normal uploads still go to the live AI. To add or refresh photos, drop them in
`photo/`, add an id in the `ID_BY_FILE` map in `scripts/build-fixtures.mjs`, and
re-run `npm run fixtures`.

## Farm dashboard (`/dashboard`)

A field camera unit is meant to do one pass over the farm, photographing every
plant. Healthy plants are just counted; a plant with a detected illness becomes
a row on the dashboard with its grid id (**`R1C4`** = Row 1, Count 4), scan
time, plant name, issue summary, **category** (真菌感染 / 日灼 / 缺少元素 /
缺水 …), severity, and recovery outlook. The header shows plants scanned, scan
start, scan end, and duration.

The device isn't connected yet, so the page shows a **sample scan** —
`lib/farm/demo-scan.json`, 1,000 plants scanned over 30 minutes with 19 flagged.
Regenerate it with `npm run farm-demo` (env: `PLANTS`, `ROWS`, `START`,
`DURATION`); edit the JSON by hand to tune the demo.

**Device endpoint (ready, not yet persisted):**

```
POST /api/ingest
{ "unit": "R1C4", "image": "data:image/jpeg;base64,...", "lang": "zh" }
→ { "unit": "R1C4", "healthy": false, "check": { …dashboard row… } }
```

It runs the same analysis pipeline and maps the result to a dashboard row
(`lib/farm/ingest.ts`). Wiring it to a stored scan session is the next step.

## How it works

```
browser (phone / laptop)
  /            upload or camera → in-browser downscale → POST /api/analyze
                                                              │
                                                              ▼
                                              lib/analyze  (Gemini / Claude / mock)
                                                              │
                                              AnalysisResult JSON → <Diagnosis />

field camera unit  → POST /api/ingest ─────────────────────────┘  → dashboard row
```

| Path | Role |
|---|---|
| `app/page.tsx` + `components/App.tsx` | Shell: EN / 中文 toggle, header, footer |
| `components/Analyzer.tsx` | Web UI: upload / drag-drop / live camera, in-browser downscale |
| `app/api/analyze/route.ts` | Accepts a base64 image + `lang` (or a `fixtureId`), returns an `AnalysisResult` |
| `app/api/ingest/route.ts` | Device endpoint — per-plant photo → healthy flag + dashboard row |
| `app/dashboard/page.tsx` + `components/FarmDashboard.tsx` | Farm scan list + summary stats |
| `lib/analyze.ts` | Provider selection + AI call + result normalisation |
| `lib/i18n.ts` + `lib/useLang.ts` | UI strings (en / zh), the prompt language line, shared language state |
| `lib/farm/` | Dashboard data model (`model.ts`), demo session (`demo.ts`), result→row mapper (`ingest.ts`) |
| `lib/fixtures/` | Saved demo photos — `photos.ts`/`results.ts` load the generated JSON |
| `scripts/build-fixtures.mjs` · `scripts/build-farm-demo.mjs` | `npm run fixtures` · `npm run farm-demo` |
| `lib/prompt.ts` / `lib/types.ts` | Botanist prompt + shared JSON contract |
| `lib/mockEngine.ts` | Offline demo analyzer (en + zh sample sets) |
| `components/Diagnosis.tsx` | Renders an `AnalysisResult` in the chosen language |

## Configuration

| Env var | Default | Purpose |
| --- | --- | --- |
| `PLANT_AI_PROVIDER` | `auto` | `auto` · `gemini` · `anthropic` · `mock` |
| `GEMINI_API_KEY` | _(none)_ | Free Google AI Studio key |
| `GEMINI_MODEL` | `gemini-3.6-flash` | Gemini model id |
| `ANTHROPIC_API_KEY` | _(none)_ | Anthropic key (needs account credit) |
| `PLANT_AI_MODEL` | `claude-opus-5` | Claude model. `claude-sonnet-5` is cheaper |

`auto` uses Gemini if `GEMINI_API_KEY` is set, else Claude if `ANTHROPIC_API_KEY`
is set, else the demo engine.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |

## Limitations

Diagnoses are an automated visual estimate from a single photo. For valuable or
edible crops, confirm with a local extension service before treating.
