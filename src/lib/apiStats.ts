export interface ApiStat {
  calls: number;
  errors: number;
  lastCallAt: number;
  lastResponseMs: number;
}

export const apiStats: Record<'krx' | 'naver', ApiStat> = {
  krx:   { calls: 0, errors: 0, lastCallAt: 0, lastResponseMs: 0 },
  naver: { calls: 0, errors: 0, lastCallAt: 0, lastResponseMs: 0 },
};

export function recordCall(
  key: 'krx' | 'naver',
  ms: number,
  isError = false
) {
  const s = apiStats[key];
  s.calls += 1;
  s.lastCallAt = Date.now();
  s.lastResponseMs = ms;
  if (isError) s.errors += 1;
}
