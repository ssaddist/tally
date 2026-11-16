import { useEffect, useRef, useState } from "react";
import type { Language } from "../domain/types";
import { useAppData } from "../state/AppData";

const OPTIONS: { code: Language; native: string; english: string }[] = [
  { code: "uk", native: "Українська", english: "Ukrainian" },
  { code: "ru", native: "Русский", english: "Russian" },
  { code: "en", native: "English", english: "English" },
];

export function LanguagePicker() {
  const { settings, updateSettings } = useAppData();
  const [saving, setSaving] = useState<Language | null>(null);
  const [error, setError] = useState<string | null>(null);
  const suggested = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    suggested.current?.focus();
  }, []);

  async function choose(language: Language) {
    setSaving(language);
    setError(null);
    try {
      await updateSettings({ language, languageChosen: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(null);
    }
  }

  return (
    <main lang="en" className="mx-auto flex min-h-full w-full max-w-[640px] flex-col justify-center px-6 py-12">
      <p className="m-0 mb-10 font-display text-h2 font-bold tracking-[-0.03em]">Tally</p>
      <h1 className="m-0 text-h1">Choose your language</h1>
      <p className="m-0 mt-3 text-muted">You can change it later in Settings.</p>

      <ul className="m-0 mt-10 list-none border-t border-border p-0" aria-label="Languages">
        {OPTIONS.map((o) => {
          const isSuggested = o.code === settings.language;
          return (
            <li key={o.code} className="border-b border-border">
              <button
                ref={isSuggested ? suggested : undefined}
                type="button"
                lang={o.code}
                disabled={saving !== null}
                onClick={() => void choose(o.code)}
                className="group -mx-2 flex w-[calc(100%+16px)] cursor-pointer items-baseline justify-between gap-4 rounded-[3px] border-0 bg-transparent px-2 py-5 text-left font-[inherit] text-text hover:bg-surface-2 disabled:cursor-wait"
              >
                <span className="text-h2 font-semibold">{o.native}</span>
                <span lang="en" className="text-label text-muted">
                  {isSuggested ? `${o.english} · matches your system` : o.english}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {error && (
        <p className="m-0 mt-6 text-danger" role="alert">
          Could not save the language: {error}
        </p>
      )}
    </main>
  );
}
