import { isTauri } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { MAX_BACKUP_BYTES } from "../domain/backup";

const FILTERS = [{ name: "Tally backup", extensions: ["json"] }];

export function defaultBackupName(today: string): string {
  return `tally-backup-${today}.json`;
}

export async function saveBackupFile(json: string, fileName: string): Promise<string | null> {
  if (isTauri()) {
    const path = await save({ defaultPath: fileName, filters: FILTERS });
    if (!path) return null;
    await writeTextFile(path, json);
    return path;
  }
  const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
  return fileName;
}

export async function readBackupFile(): Promise<string | null> {
  if (isTauri()) {
    const path = await open({ multiple: false, directory: false, filters: FILTERS });
    if (typeof path !== "string") return null;
    return readTextFile(path);
  }
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      if (file.size > MAX_BACKUP_BYTES) return reject(new Error("File is too large (max 5 MB)."));
      file.text().then(resolve, reject);
    };
    input.click();
  });
}
