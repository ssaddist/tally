import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { openRepository, type Repository } from "../data";
import { todayISO } from "../domain/dates";
import { renewSubscription } from "../domain/renewal";
import { rolloverSubscriptions, rolloverWithPayments } from "../domain/rollover";
import { byNextPayment } from "../domain/reminders";
import type { Payment, Settings, Subscription } from "../domain/types";
import { DEFAULT_SETTINGS } from "../domain/types";

type Status = "loading" | "ready" | "error";

interface AppDataValue {
  status: Status;
  error: string | null;
  subscriptions: Subscription[];
  payments: Payment[];
  settings: Settings;
  today: string;
  getSubscription(id: string): Subscription | undefined;
  saveSubscription(sub: Subscription): Promise<void>;
  deleteSubscription(id: string): Promise<void>;
  setActive(id: string, isActive: boolean): Promise<void>;
  renew(id: string, paidOn: string, amount: number): Promise<void>;
  deletePayment(id: string): Promise<void>;
  updateSettings(patch: Partial<Settings>): Promise<void>;
  replaceAll(settings: Settings, subs: Subscription[], payments: Payment[]): Promise<void>;
  runExclusive(task: (repo: Repository, today: string) => Promise<void>): Promise<void>;
}

const AppDataContext = createContext<AppDataValue | null>(null);

const newId = () => crypto.randomUUID();

function message(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [today, setToday] = useState(todayISO());
  const repoRef = useRef<Promise<Repository> | null>(null);
  const lockRef = useRef<Promise<void>>(Promise.resolve());

  const repo = useCallback((): Promise<Repository> => {
    repoRef.current ??= openRepository();
    return repoRef.current;
  }, []);

  const reload = useCallback(async (r: Repository) => {
    const [subs, s, pays] = await Promise.all([r.listSubscriptions(), r.getSettings(), r.listPayments()]);
    setSubscriptions(subs.sort(byNextPayment));
    setSettings(s);
    setPayments(pays);
  }, []);

  const exclusive = useCallback(
    <T,>(fn: () => Promise<T>): Promise<T> => {
      const run = lockRef.current.then(fn, fn);
      lockRef.current = run.then(
        () => undefined,
        () => undefined,
      );
      return run;
    },
    [],
  );

  const runExclusive = useCallback(
    (task: (repo: Repository, today: string) => Promise<void>) =>
      exclusive(async () => {
        const r = await repo();
        const now = todayISO();
        setToday(now);
        await task(r, now);
        await reload(r);
      }),
    [exclusive, repo, reload],
  );

  useEffect(() => {
    let cancelled = false;
    runExclusive(async (r, now) => {
      const { changed, payments: charged } = rolloverWithPayments(await r.listSubscriptions(), now, newId);
      if (changed.length) await r.saveSubscriptions(changed);
      if (charged.length) await r.addPayments(charged);
    })
      .then(() => !cancelled && setStatus("ready"))
      .catch((e) => {
        if (cancelled) return;
        setError(message(e));
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [runExclusive]);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  const value = useMemo<AppDataValue>(() => {
    const mutate = (fn: (r: Repository) => Promise<void>) =>
      exclusive(async () => {
        const r = await repo();
        await fn(r);
        await reload(r);
      });

    return {
      status,
      error,
      subscriptions,
      payments,
      settings,
      today,
      getSubscription: (id) => subscriptions.find((s) => s.id === id),
      saveSubscription: (sub) => mutate((r) => r.saveSubscription(sub)),
      deleteSubscription: (id) => mutate((r) => r.deleteSubscription(id)),
      setActive: (id, isActive) =>
        mutate(async (r) => {
          const sub = (await r.listSubscriptions()).find((s) => s.id === id);
          if (sub) await r.saveSubscription({ ...sub, isActive, updatedAt: new Date().toISOString() });
        }),
      renew: (id, paidOn, amount) =>
        mutate(async (r) => {
          const sub = (await r.listSubscriptions()).find((s) => s.id === id);
          if (!sub) throw new Error("Subscription not found");
          const result = renewSubscription(sub, paidOn, amount, newId);
          await r.saveSubscription(result.sub);
          await r.addPayments([result.payment]);
        }),
      deletePayment: (id) => mutate((r) => r.deletePayment(id)),
      updateSettings: (patch) =>
        mutate(async (r) => {
          const current = await r.getSettings();
          await r.saveSettings({ ...current, ...patch });
        }),
      replaceAll: (s, subs, pays) =>
        mutate(async (r) => {
          await r.replaceAll(s, subs, pays);
          const changed = rolloverSubscriptions(subs, todayISO());
          if (changed.length) await r.saveSubscriptions(changed);
        }),
      runExclusive,
    };
  }, [status, error, subscriptions, payments, settings, today, exclusive, repo, reload, runExclusive]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used inside AppDataProvider");
  return ctx;
}
