import { useEffect, useRef, type ReactNode } from "react";
import { useI18n } from "../i18n/I18nProvider";
import { Button } from "./ui";

interface Props {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  confirmDisabled?: boolean;
  onConfirm(): void;
  onCancel(): void;
}

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  danger,
  busy,
  confirmDisabled,
  onConfirm,
  onCancel,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className="card m-auto w-[min(440px,calc(100vw-32px))] p-6 text-text backdrop:bg-[#1d1c1a]/40"
      aria-labelledby="confirm-title"
    >
      <h2 id="confirm-title" className="m-0 mb-2 text-h2 font-semibold">
        {title}
      </h2>
      <div className="mb-6 text-muted">{children}</div>
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel} disabled={busy}>
          {t("common.cancel")}
        </Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} disabled={busy || confirmDisabled}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
