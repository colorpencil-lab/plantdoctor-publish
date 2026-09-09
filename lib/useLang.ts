"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_LANG,
  UI,
  isLang,
  langFromNavigator,
  type Lang,
} from "./i18n";

const STORAGE_KEY = "plantdoctor.lang";

/**
 * Page-level language state, shared by every screen. Server render and the first
 * client render both use DEFAULT_LANG (avoids a hydration mismatch); the stored
 * or browser preference is applied in an effect, then persisted.
 */
export function useLang(): [Lang, (next: Lang) => void] {
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    let next: Lang | null = null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isLang(stored)) next = stored;
    } catch {
      /* localStorage unavailable — fall through to navigator */
    }
    if (!next) next = langFromNavigator(navigator.language);
    if (next !== lang) setLang(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.lang = UI[lang].htmlLang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore persistence failure */
    }
  }, [lang]);

  return [lang, setLang];
}
