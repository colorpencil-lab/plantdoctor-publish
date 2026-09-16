"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import LangToggle from "@/components/LangToggle";
import PlantCheckDetail from "@/components/PlantCheckDetail";
import { UI, type Lang } from "@/lib/i18n";
import {
  CATEGORY_LABEL,
  FARM_UI,
  RECOVERY_LABEL,
  RECOVERY_TONE,
  SEVERITY_LABEL,
  SEVERITY_TONE,
  durationMinutes,
  formatCount,
  formatDateTime,
  sessionStatus,
  text,
  type PlantCheck,
  type ScanSession,
  type Severity,
} from "@/lib/farm/model";

type SevFilter = "all" | Severity;

const SEV_ORDER: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

export default function FarmDashboard({
  session,
  lang,
  setLang,
}: {
  session: ScanSession;
  /** Shared with the rest of the session detail page — not owned locally, so
   *  the language toggle here (and in PhotoUpload/EndSessionDialog above it)
   *  always stays in sync. */
  lang: Lang;
  setLang: (next: Lang) => void;
}) {
  const f = FARM_UI[lang];
  const [sev, setSev] = useState<SevFilter>("all");
  const [selected, setSelected] = useState<PlantCheck | null>(null);

  const rows = useMemo(() => {
    return session.checks
      .filter((c) => sev === "all" || c.severity === sev)
      .slice()
      .sort(
        (a, b) =>
          SEV_ORDER[a.severity] - SEV_ORDER[b.severity] ||
          a.checkedAt.localeCompare(b.checkedAt),
      );
  }, [session.checks, sev]);

  const minutes = durationMinutes(session.startedAt, session.finishedAt);
  const inProgress = sessionStatus(session) === "in_progress";

  const stats = [
    { label: f.statScanned, value: formatCount(session.plantsScanned) },
    { label: f.statHealthy, value: formatCount(session.plantsHealthy), tone: "good" },
    { label: f.statFlagged, value: formatCount(session.plantsFlagged), tone: "bad" },
    { label: f.statStart, value: formatDateTime(session.startedAt, lang) },
    {
      label: f.statEnd,
      value: session.finishedAt ? formatDateTime(session.finishedAt, lang) : f.notFinished,
    },
    { label: f.statDuration, value: minutes === null ? f.notFinished : f.minutes(minutes) },
  ];

  const sevFilters: SevFilter[] = ["all", "high", "medium", "low"];

  return (
    <main className="page dashboard-page">
      <header className="site-header">
        <div className="header-top">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              🌿
            </span>
            <span className="brand-name">{f.title}</span>
          </div>
          <LangToggle lang={lang} onChange={setLang} />
        </div>
        <p className="tagline">{f.subtitle}</p>
        <p className="header-nav">
          <Link href="/dashboard">{f.toSessions}</Link>
          {" · "}
          <Link href="/">{f.back}</Link>
        </p>
      </header>

      {inProgress && <p className="awaiting-device">{f.inProgressBanner}</p>}

      <section className="stat-grid" aria-label={f.title}>
        {stats.map((s) => (
          <div key={s.label} className={`stat ${s.tone ? `stat-${s.tone}` : ""}`}>
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </section>

      <div className="filter-bar" role="group" aria-label={f.filterLabel}>
        <span className="filter-label">{f.filterLabel}</span>
        {sevFilters.map((v) => (
          <button
            key={v}
            className={`filter-btn ${sev === v ? "is-active" : ""}`}
            aria-pressed={sev === v}
            onClick={() => setSev(v)}
          >
            {v === "all" ? f.filterAll : SEVERITY_LABEL[lang][v]}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="empty-state">{f.empty}</p>
      ) : (
        <div className="table-wrap">
          <table className="farm-table">
            <thead>
              <tr>
                <th>{f.colUnit}</th>
                <th>{f.colTime}</th>
                <th>{f.colPlant}</th>
                <th>{f.colIssue}</th>
                <th>{f.colCategory}</th>
                <th>{f.colSeverity}</th>
                <th>{f.colRecovery}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr
                  key={c.unit}
                  className="session-row"
                  tabIndex={0}
                  role="button"
                  onClick={() => setSelected(c)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setSelected(c);
                  }}
                >
                  <td className="cell-unit">{c.unit}</td>
                  <td className="cell-time">{formatDateTime(c.checkedAt, lang)}</td>
                  <td>{text(c.plant, lang)}</td>
                  <td className="cell-issue">
                    <span className="issue-title">{text(c.issueTitle, lang)}</span>
                    <span className="issue-sub">{text(c.issueSummary, lang)}</span>
                  </td>
                  <td>
                    <span className="chip chip-neutral">
                      {CATEGORY_LABEL[lang][c.category]}
                    </span>
                  </td>
                  <td>
                    <span className={`chip chip-${SEVERITY_TONE[c.severity]}`}>
                      {SEVERITY_LABEL[lang][c.severity]}
                    </span>
                  </td>
                  <td>
                    <span className={`chip chip-${RECOVERY_TONE[c.recovery]}`}>
                      {RECOVERY_LABEL[lang][c.recovery]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <footer className="site-footer">
        <p>{UI[lang].footer}</p>
      </footer>

      {selected && (
        <PlantCheckDetail check={selected} lang={lang} onClose={() => setSelected(null)} />
      )}
    </main>
  );
}
