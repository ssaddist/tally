import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-text text-bg border-text hover:bg-accent hover:border-accent hover:text-on-accent",
  secondary: "bg-transparent text-text border-border hover:border-text",
  danger: "bg-transparent text-danger border-danger hover:bg-danger hover:text-bg",
  ghost: "bg-transparent text-muted border-transparent underline decoration-1 underline-offset-4 hover:text-text",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-[3px] border px-4 py-2 text-body font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

export function Button({
  variant = "secondary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function IconButton({
  label,
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[3px] border border-border bg-transparent text-muted hover:border-text hover:text-text disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export const Chevron = ({ dir }: { dir: "left" | "right" }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d={dir === "left" ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Cross = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export function LinkButton({
  to,
  variant = "secondary",
  children,
}: {
  to: string;
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <Link to={to} className={`${base} ${variants[variant]} no-underline`}>
      {children}
    </Link>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>;
}

export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 pt-2 md:mb-10 md:pt-6">
      <h1 className="m-0 text-h1">{title}</h1>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="m-0 mb-4 text-h2">{children}</h2>;
}

export function Label({ children }: { children: ReactNode }) {
  return <span className="text-label text-muted">{children}</span>;
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-4 py-4">
      <p className="m-0 text-muted">{message}</p>
      {action}
    </div>
  );
}
