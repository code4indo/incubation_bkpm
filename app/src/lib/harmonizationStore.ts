/**
 * SHARED HARMONIZATION STORE
 * In-memory cache of LLM translation results.
 * Allows AdminPage harmonization results to be reflected in ProjectDetail.
 */

export interface HarmonizedEntry {
  projectId: number;
  nameEn: string;
  descriptionEn: string;
  timestamp: number;
  model: string;
}

const store = new Map<number, HarmonizedEntry>();

export function setHarmonizedResult(entry: HarmonizedEntry): void {
  store.set(entry.projectId, entry);
}

export function getHarmonizedResult(projectId: number): HarmonizedEntry | undefined {
  return store.get(projectId);
}

export function getHarmonizedName(projectId: number): string | undefined {
  return store.get(projectId)?.nameEn;
}

export function getHarmonizedDescription(projectId: number): string | undefined {
  return store.get(projectId)?.descriptionEn;
}

export function clearStore(): void {
  store.clear();
}

export function getStoreSize(): number {
  return store.size;
}
