import { isTauri } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { isHttpUrl } from "../domain/validation";

export async function openExternal(url: string): Promise<void> {
  if (!isHttpUrl(url)) throw new Error("Only http(s) links can be opened.");
  if (isTauri()) await openUrl(url);
  else window.open(url, "_blank", "noopener,noreferrer");
}
