import { NavLink, Outlet } from "react-router-dom";
import { useI18n } from "../i18n/I18nProvider";
import type { MessageKey } from "../i18n/translate";
import { useAppData } from "../state/AppData";

const links: { to: string; label: MessageKey; end: boolean }[] = [
  { to: "/", label: "nav.dashboard", end: true },
  { to: "/subscriptions", label: "nav.subscriptions", end: false },
  { to: "/calendar", label: "nav.calendar", end: false },
  { to: "/settings", label: "nav.settings", end: false },
];

export function Layout() {
  const { status, error } = useAppData();
  const { t } = useI18n();
  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <nav
        aria-label={t("nav.main")}
        className="sticky top-0 z-10 flex shrink-0 items-center gap-1 border-b border-border bg-bg px-2 py-2 md:h-screen md:w-[208px] md:flex-col md:items-stretch md:gap-0 md:border-r md:border-b-0 md:px-6 md:py-6"
      >
        <span className="hidden pb-8 font-display text-h2 font-bold tracking-[-0.03em] md:block">{t("app.name")}</span>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `min-w-0 flex-auto truncate px-1 py-2 text-center md:flex-none md:px-0 md:text-left ${
                isActive
                  ? "font-semibold text-text underline decoration-1 underline-offset-[6px]"
                  : "text-muted no-underline hover:text-text"
              }`
            }
          >
            {t(l.label)}
          </NavLink>
        ))}
      </nav>
      <main className="mx-auto w-full max-w-[1040px] flex-1 px-4 py-6 md:px-12 md:py-8">
        {status === "loading" && <p className="text-muted">{t("common.loading")}</p>}
        {status === "error" && (
          <div className="panel border-danger" role="alert">
            <p className="m-0 mb-2 font-semibold text-danger">{t("common.dbError")}</p>
            <p className="m-0 text-label text-muted">{error}</p>
          </div>
        )}
        {status === "ready" && <Outlet />}
      </main>
    </div>
  );
}
