import type { ReactNode } from "react";

export function Badge({ tone = "muted", children }: { tone?: "muted" | "warning"; children: ReactNode }) {
  const color = tone === "warning" ? "text-warning border-warning" : "text-muted border-border";
  return (
    <span className={`ml-2 inline-block rounded-[2px] border px-1 align-[1px] text-label font-normal ${color}`}>{children}</span>
  );
}
