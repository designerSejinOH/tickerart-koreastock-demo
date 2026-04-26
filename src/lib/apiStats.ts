// 서버 프로세스 수명 동안 유지되는 세션 통계
// (Next.js 개발 서버 단일 프로세스 기준)

export interface ApiStat {
  calls: number;
  errors: number;
  lastCallAt: number;   // unix ms
  lastResponseMs: number;
}

export const apiStats: Record<'krx' | 'dart' | 'naver', ApiStat> = {
  krx:   { calls: 0, errors: 0, lastCallAt: 0, lastResponseMs: 0 },
  dart:  { calls: 0, errors: 0, lastCallAt: 0, lastResponseMs: 0 },
  naver: { calls: 0, errors: 0, lastCallAt: 0, lastResponseMs: 0 },
};

export const dartCache = {
  size: 0,        // 매핑된 종목 수
  cachedAt: 0,    // unix ms
};

export function recordCall(
  key: 'krx' | 'dart' | 'naver',
  ms: number,
  isError = false
) {
  const s = apiStats[key];
  s.calls += 1;
  s.lastCallAt = Date.now();
  s.lastResponseMs = ms;
  if (isError) s.errors += 1;
}
