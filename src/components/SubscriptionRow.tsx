import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Subscription } from "../domain/types";
import { useI18n } from "../i18n/I18nProvider";
import { Badge } from "./Badge";
import { DueLabel } from "./DueLabel";
import { ServiceAvatar } from "./ServiceAvatar";

export function SubscriptionRow({ sub, today, action }: { sub: Subscription; today: string; action?: ReactNode }) {
  const tr = useI18n();
  return (
    <li className="flex flex-wrap items-center gap-x-2 border-t border-border first:border-t-0 [&>*:last-child:not(a)]:mb-3 [&>*:last-child:not(a)]:ml-auto sm:flex-nowrap sm:[&>*:last-child:not(a)]:mb-0">
      <Link
        to={`/subscriptions/${sub.id}`}
        className={`-mx-2 flex min-w-0 flex-1 basis-[260px] items-center gap-4 rounded-[3px] px-2 py-3 text-text no-underline hover:bg-surface-2 ${
          sub.isActive ? "" : "opacity-60"
        }`}
      >
        <ServiceAvatar name={sub.name} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-semibold">
            {sub.name}
            {sub.trialEndsAt && <Badge tone="warning">{tr.t("badge.trial")}</Badge>}
            {!sub.autoRenew && <Badge>{tr.t("badge.manual")}</Badge>}
            {!sub.isActive && <Badge>{tr.t("badge.paused")}</Badge>}
          </span>
          <span className="truncate text-label text-muted">
            {tr.money(sub.amount, sub.currency)} {tr.t(`suffix.${sub.billingPeriod}`)}
            {sub.category ? ` · ${sub.category}` : ""}
          </span>
        </span>
        <DueLabel sub={sub} today={today} />
      </Link>
      {action}
    </li>
  );
}
