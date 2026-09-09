import type { Lang } from "../i18n";
import data from "./photos.json";

// Lightweight list for the demo picker in the UI. The heavy saved diagnoses
// live in results.json (server-only) — see results.ts. Both files are written
// by `npm run fixtures`.

export interface DemoPhoto {
  id: string;
  /** Path under /public, e.g. "/demo/powdery-mildew.jpg". */
  image: string;
  label: Record<Lang, string>;
}

export const DEMO_PHOTOS = data as DemoPhoto[];

export function demoPhotoLabel(p: DemoPhoto, lang: Lang): string {
  return p.label[lang] ?? p.label.en;
}
