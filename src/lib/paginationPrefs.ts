export function getGlobalPageSize(defaultSize = 10, allowed: number[] = [10, 25, 50, 100]): number {
  if (typeof window === 'undefined') return defaultSize;
  try {
    const raw = window.localStorage.getItem('globalPageSize');
    const n = raw ? parseInt(raw, 10) : NaN;
    return allowed.includes(n) ? n : defaultSize;
  } catch {
    return defaultSize;
  }
}

export function setGlobalPageSize(size: number) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem('globalPageSize', String(size));
  } catch {
    // ignore
  }
}

