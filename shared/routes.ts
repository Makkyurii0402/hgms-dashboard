// No backend routes needed as data comes from Firebase directly.
export const api = {};
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  return path;
}
