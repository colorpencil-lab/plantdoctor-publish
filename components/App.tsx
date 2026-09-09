"use client";

import Link from "next/link";
import Analyzer from "@/components/Analyzer";
import LangToggle from "@/components/LangToggle";
import { useLang } from "@/lib/useLang";
import { UI } from "@/lib/i18n";

export default function App() {
  const [lang, setLang] = useLang();
  const t = UI[lang];

  return (
    <main className="page checker-page">
      <header className="site-header">
        <div className="header-top">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              🌿
            </span>
            <span className="brand-name">PlantDoctor</span>
          </div>
          <LangToggle lang={lang} onChange={setLang} />
        </div>
        <p className="tagline">{t.tagline}</p>
        <p className="header-nav">
          <Link href="/dashboard">{t.dashboardLink}</Link>
        </p>
      </header>

      <Analyzer lang={lang} />

      <footer className="site-footer">
        <p>{t.footer}</p>
      </footer>
    </main>
  );
}
