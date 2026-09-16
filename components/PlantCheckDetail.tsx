"use client";

import {
  CATEGORY_LABEL,
  FARM_UI,
  RECOVERY_LABEL,
  RECOVERY_TONE,
  SEVERITY_LABEL,
  SEVERITY_TONE,
  formatDateTime,
  text,
  type PlantCheck,
} from "@/lib/farm/model";
import type { Lang } from "@/lib/i18n";

export default function PlantCheckDetail({
  check,
  lang,
  onClose,
}: {
  check: PlantCheck;
  lang: Lang;
  onClose: () => void;
}) {
  const f = FARM_UI[lang];

  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="dialog dialog-wide card" onClick={(e) => e.stopPropagation()}>
        <h2 className="section-title">{text(check.plant, lang)}</h2>
        <p className="muted">
          {check.unit} · {formatDateTime(check.checkedAt, lang)}
        </p>

        <div className="plant-detail-grid">
          {check.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="preview-img plant-detail-photo"
              src={check.photoUrl}
              alt={text(check.plant, lang)}
            />
          )}

          <div className="plant-detail-text">
            <div className="issue-chips">
              <span className="chip chip-neutral">{CATEGORY_LABEL[lang][check.category]}</span>
              <span className={`chip chip-${SEVERITY_TONE[check.severity]}`}>
                {SEVERITY_LABEL[lang][check.severity]}
              </span>
              <span className={`chip chip-${RECOVERY_TONE[check.recovery]}`}>
                {RECOVERY_LABEL[lang][check.recovery]}
              </span>
            </div>

            <p className="issue-title">{text(check.issueTitle, lang)}</p>
            <p>{text(check.issueSummary, lang)}</p>
          </div>
        </div>

        <div className="button-row">
          <button className="btn btn-ghost" onClick={onClose}>
            {f.close}
          </button>
        </div>
      </div>
    </div>
  );
}
