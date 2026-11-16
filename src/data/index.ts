import { isTauri } from "@tauri-apps/api/core";
import { MemoryRepository } from "./memoryRepository";
import type { Repository } from "./repository";
import { SqliteRepository } from "./sqliteRepository";

export type { Repository } from "./repository";

export async function openRepository(): Promise<Repository> {
  return isTauri() ? SqliteRepository.open() : new MemoryRepository();
}
