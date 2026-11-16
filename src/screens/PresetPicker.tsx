import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ServiceAvatar } from "../components/ServiceAvatar";
import { Card, EmptyState, PageHeader } from "../components/ui";
import { useI18n } from "../i18n/I18nProvider";
import { cheapestPlan, PRESET_CATEGORIES, searchPresets, type PresetCategory } from "../presets/catalog";

const tile =
  "card flex items-center gap-2 p-2 text-text no-underline hover:border-text focus-visible:border-accent min-w-0";

export function PresetPicker() {
  const tr = useI18n();
  const { t } = tr;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PresetCategory | "all">("all");
  const results = useMemo(() => searchPresets(query, category), [query, category]);

  const chip = (id: PresetCategory | "all", label: string) => (
    <button
      key={id}
      type="button"
      aria-pressed={category === id}
      onClick={() => setCategory(id)}
      className={`cursor-pointer whitespace-nowrap rounded-[3px] border px-2 py-1 font-[inherit] text-label ${
        category === id ? "border-text bg-surface-2 text-text" : "border-border bg-transparent text-muted hover:text-text"
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <PageHeader title={t("presets.title")} />
      <Card>
        <input
          type="search"
          className="field mb-4"
          placeholder={t("presets.search")}
          aria-label={t("presets.search")}
          value={query}
          autoFocus
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label={t("list.filter")}>
          {chip("all", t("presets.allCategories"))}
          {PRESET_CATEGORIES.map((c) => chip(c, t(`category.${c}`)))}
        </div>

        <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2 lg:grid-cols-3">
          <li>
            <Link to="/subscriptions/new/custom" className={`${tile} border-dashed`}>
              <span
                aria-hidden="true"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] border border-border text-h2 text-muted"
              >
                +
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-semibold">{t("presets.custom")}</span>
                <span className="truncate text-label text-muted">{t("presets.customHint")}</span>
              </span>
            </Link>
          </li>
          {results.map((p) => {
            const cheapest = cheapestPlan(p);
            const priceText = cheapest
              ? `${tr.money(cheapest.amount!, cheapest.currency)} ${t(`suffix.${cheapest.period}`)}`
              : t(`category.${p.category}`);
            return (
              <li key={p.id}>
                <Link to={`/subscriptions/new/${p.id}`} className={tile}>
                  <ServiceAvatar name={p.name} presetId={p.id} />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold">{p.name}</span>
                    <span className="truncate text-label text-muted">
                      {priceText}
                      {p.plans.length > 1 ? ` · ${t("presets.plans", { n: p.plans.length })}` : ""}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        {results.length === 0 && <EmptyState message={t("presets.noMatch", { q: query.trim() })} />}
      </Card>
    </>
  );
}
