"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import LangToggle from "@/components/LangToggle";
import NewSessionDialog from "@/components/NewSessionDialog";
import { useLang } from "@/lib/useLang";
import { UI } from "@/lib/i18n";
import {
  SESSION_UI,
  durationMinutes,
  formatCount,
  formatDateTime,
  sessionStatus,
  type SessionSummary,
} from "@/lib/farm/model";

export default function SessionList({ sessions }: { sessions: SessionSummary[] }) {
  const [lang, setLang] = useLang();
  const f = SESSION_UI[lang];
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);

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
          <Link href="/">{f.back}</Link>
        </p>
      </header>

      <div className="button-row session-actions">
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>
          {f.newSession}
        </button>
      </div>

      {sessions.length === 0 ? (
        <p className="empty-state">{f.empty}</p>
      ) : (
        <div className="table-wrap">
          <table className="farm-table session-table">
            <thead>
              <tr>
                <th>{f.colStarted}</th>
                <th>{f.colFinished}</th>
                <th>{f.colStatus}</th>
                <th>{f.colDuration}</th>
                <th>{f.colScanned}</th>
                <th>{f.colFlagged}</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const status = sessionStatus(s);
                const minutes = durationMinutes(s.startedAt, s.finishedAt);
                return (
                  <tr
                    key={s.id}
                    className="session-row"
                    tabIndex={0}
                    role="link"
                    onClick={() => router.push(`/dashboard/${s.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") router.push(`/dashboard/${s.id}`);
                    }}
                  >
                    <td>{formatDateTime(s.startedAt, lang)}</td>
                    <td>{s.finishedAt ? formatDateTime(s.finishedAt, lang) : f.notStarted}</td>
                    <td>
                      <span className={`chip ${status === "completed" ? "chip-good" : "chip-warn"}`}>
                        {status === "completed" ? f.statusCompleted : f.statusInProgress}
                      </span>
                    </td>
                    <td>{minutes === null ? f.notStarted : f.minutes(minutes)}</td>
                    <td>{formatCount(s.plantsScanned)}</td>
                    <td>{formatCount(s.plantsFlagged)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showNew && <NewSessionDialog lang={lang} onClose={() => setShowNew(false)} />}

      <footer className="site-footer">
        <p>{UI[lang].footer}</p>
      </footer>
    </main>
  );
}
