import { isTauri } from "@tauri-apps/api/core";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";

export const autostartSupported = (): boolean => isTauri();

export async function getAutostart(): Promise<boolean> {
  return autostartSupported() ? isEnabled() : false;
}

export async function setAutostart(on: boolean): Promise<void> {
  if (!autostartSupported()) return;
  if (on) await enable();
  else await disable();
}
