import { isTauri } from "@tauri-apps/api/core";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";

export interface Notifier {
  ensurePermission(): Promise<boolean>;
  send(title: string, body: string): Promise<void>;
}

const tauriNotifier: Notifier = {
  async ensurePermission() {
    if (await isPermissionGranted()) return true;
    return (await requestPermission()) === "granted";
  },
  async send(title, body) {
    sendNotification({ title, body });
  },
};

const previewNotifier: Notifier = {
  async ensurePermission() {
    return true;
  },
  async send(title, body) {
    console.info(`[notification] ${title}: ${body}`);
  },
};

export function getNotifier(): Notifier {
  return isTauri() ? tauriNotifier : previewNotifier;
}
