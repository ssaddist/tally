import { useMemo, useState } from "react";
import { SubscriptionRow } from "../components/SubscriptionRow";
import { Card, EmptyState, LinkButton, PageHeader } from "../components/ui";
import { byNextPayment } from "../domain/reminders";
import { useI18n } from "../i18n/I18nProvider";
import { useAppData } from "../state/AppData";

const FILTERS = [
  { id: "all", label: "list.all" },
  { id: "active", label: "list.active" },
  { id: "paused", label: "list.paused" },
] as const;
type Filter = (typeof FILTERS)[number]["id"];

export function SubscriptionList() {
  const { subscriptions, today } = useAppData();
  const { t } = useI18n();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return subscriptions
      .filter((s) => (filter === "all" ? true : filter === "active" ? s.isActive : !s.isActive))
      .filter((s) => !q || s.name.toLowerCase().includes(q))
      .sort(byNextPayment);
  }, [subscriptions, filter, query]);

  const addButton = (
    <LinkButton to="/subscriptions/new" variant="primary">
      {t("list.add")}
    </LinkButton>
  );

  return (
    <>
      <PageHeader title={t("list.title")} actions={addButton} />
      {subscriptions.length === 0 ? (
        <Card>
          <EmptyState message={t("list.empty")} action={addButton} />
        </Card>
      ) : (
        <Card>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div role="radiogroup" aria-label={t("list.filter")} className="inline-flex rounded-[3px] border border-border p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  className={`cursor-pointer rounded-[2px] border-0 px-4 py-1 font-[inherit] text-body ${
                    filter === f.id ? "bg-surface-2 font-semibold text-text" : "bg-transparent text-muted hover:text-text"
                  }`}
                >
                  {t(f.label)}
                </button>
              ))}
            </div>
            <input
              type="search"
              className="field sm:max-w-[240px]"
              placeholder={t("list.search")}
              aria-label={t("list.search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {visible.length === 0 ? (
            <EmptyState
              message={
                query
                  ? t("list.noMatch", { q: query.trim() })
                  : filter === "paused"
                    ? t("list.noPaused")
                    : t("list.noActive")
              }
            />
          ) : (
            <ul className="m-0 list-none p-0">
              {visible.map((s) => (
                <SubscriptionRow key={s.id} sub={s} today={today} />
              ))}
            </ul>
          )}
        </Card>
      )}
    </>
  );
}
