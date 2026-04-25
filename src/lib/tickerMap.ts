let cached: Map<string, string> | null = null;

export async function loadTickerMap(): Promise<Map<string, string>> {
  if (cached) return cached;

  const res = await fetch('/data/TickerName_Korea_v2.csv');
  const text = await res.text();

  const map = new Map<string, string>();
  const lines = text.replace(/^﻿/, '').split('\n');

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].trim().split(',');
    if (cols.length < 2) continue;
    const newTicker = cols[0].trim();
    const origTicker = cols[1].trim();
    if (newTicker && origTicker) {
      map.set(origTicker, newTicker);
    }
  }

  cached = map;
  return map;
}

// Strip leading zeros so "005930" → "5930" to match CSV keys
export function lookupTicker(srtnCd: string, map: Map<string, string>): string | undefined {
  const key = srtnCd.replace(/^0+/, '') || srtnCd;
  return map.get(key);
}
