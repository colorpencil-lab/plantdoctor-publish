"use client";

import { UI, type Lang } from "@/lib/i18n";

export default function LangToggle({
  lang,
  onChange,
}: {
  lang: Lang;
  onChange: (next: Lang) => void;
}) {
  const t = UI[lang];
  return (
    <div className="lang-toggle" role="group" aria-label={t.languageLabel}>
      <button
        className={`lang-btn ${lang === "en" ? "is-active" : ""}`}
        aria-pressed={lang === "en"}
        onClick={() => onChange("en")}
      >
        {t.langNameEn}
      </button>
      <button
        className={`lang-btn ${lang === "zh" ? "is-active" : ""}`}
        aria-pressed={lang === "zh"}
        onClick={() => onChange("zh")}
      >
        {t.langNameZh}
      </button>
    </div>
  );
}
