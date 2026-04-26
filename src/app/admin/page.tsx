'use client';

import { useEffect, useState, useCallback } from 'react';

interface ApiStat {
  calls: number;
  errors: number;
  lastCallAt: number;
  lastResponseMs: number;
}

interface PingResult {
  ok: boolean;
  ms: number;
  error?: string;
}

interface ApiEntry {
  name: string;
  configured: boolean;
  ping: PingResult;
  stats: ApiStat;
  dailyLimit: number | string;
  cache?: { size: number; cachedAt: number };
  endpoints: string[];
}

interface StatusData {
  timestamp: number;
  apis: Record<string, ApiEntry>;
}

function StatusDot({ ok, configured }: { ok: boolean; configured: boolean }) {
  if (!configured) return <span className="inline-block w-2 h-2 rounded-full bg-(--border)" />;
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${ok ? 'bg-(--text)' : 'bg-(--text-dim)'}`}
    />
  );
}

function ms(n: number) {
  return `${n}ms`;
}

function ts(t: number) {
  if (!t) return '—';
  return new Date(t).toLocaleTimeString('ko-KR');
}

function ApiCard({ id, api }: { id: string; api: ApiEntry }) {
  const errorRate = api.stats.calls > 0
    ? ((api.stats.errors / api.stats.calls) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="border border-(--border) bg-(--surface)">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-(--border)">
        <div className="flex items-center gap-3">
          <StatusDot ok={api.ping.ok} configured={api.configured} />
          <span className="font-mono text-sm font-medium tracking-wide">{api.name}</span>
        </div>
        <span className={`font-mono text-xs tracking-widest px-2 py-0.5 border ${
          !api.configured
            ? 'border-(--border) text-(--text-dim)'
            : api.ping.ok
              ? 'border-(--text) text-(--text)'
              : 'border-(--text-dim) text-(--text-dim)'
        }`}>
          {!api.configured ? 'KEY 없음' : api.ping.ok ? 'ACTIVE' : 'ERROR'}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 border-b border-(--border)">
        {[
          ['세션 호출', api.stats.calls.toLocaleString()],
          ['오류', `${api.stats.errors} (${errorRate}%)`],
          ['응답시간', api.stats.lastResponseMs ? ms(api.stats.lastResponseMs) : '—'],
          ['마지막 호출', ts(api.stats.lastCallAt)],
        ].map(([label, value]) => (
          <div key={label} className="px-5 py-3 border-b border-r border-(--border) last:border-r-0 [&:nth-last-child(-n+2)]:border-b-0">
            <div className="font-mono text-xs text-(--text-dim) tracking-widest">{label}</div>
            <div className="font-mono text-sm mt-0.5">{value}</div>
          </div>
        ))}
      </div>

      {/* Ping */}
      <div className="px-5 py-3 border-b border-(--border) flex justify-between items-center">
        <span className="font-mono text-xs text-(--text-dim) tracking-widest">헬스체크</span>
        <span className="font-mono text-xs">
          {api.ping.error
            ? <span className="text-(--text-dim)">{api.ping.error}</span>
            : <span>{api.ping.ok ? '✓' : '✗'} {ms(api.ping.ms)}</span>
          }
        </span>
      </div>

      {/* Daily limit */}
      <div className="px-5 py-3 border-b border-(--border) flex justify-between items-center">
        <span className="font-mono text-xs text-(--text-dim) tracking-widest">일일 한도</span>
        <span className="font-mono text-xs">
          {typeof api.dailyLimit === 'number'
            ? api.dailyLimit.toLocaleString() + '건'
            : api.dailyLimit}
        </span>
      </div>

      {/* DART cache */}
      {api.cache && (
        <div className="px-5 py-3 border-b border-(--border) flex justify-between items-center">
          <span className="font-mono text-xs text-(--text-dim) tracking-widest">corp_code 캐시</span>
          <span className="font-mono text-xs">
            {api.cache.size > 0
              ? `${api.cache.size.toLocaleString()}개 · ${ts(api.cache.cachedAt)}`
              : '미로드'}
          </span>
        </div>
      )}

      {/* Endpoints */}
      <div className="px-5 py-3">
        <div className="font-mono text-xs text-(--text-dim) tracking-widest mb-2">엔드포인트</div>
        <div className="flex flex-col gap-1">
          {api.endpoints.map((ep) => (
            <span key={ep} className="font-mono text-xs text-(--text-dim) opacity-70">{ep}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<number>(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/status');
      const json = await res.json();
      setData(json);
      setLastRefreshed(Date.now());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <div className="min-h-screen bg-(--bg) text-(--text)">
      <div className="px-6 lg:px-12 pt-12 pb-16">
        {/* Header */}
        <div className="flex items-end justify-between gap-6 mb-10 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">API 대시보드</h1>
            <p className="font-mono text-base text-(--text-dim) mt-2">
              {lastRefreshed ? `${new Date(lastRefreshed).toLocaleTimeString('ko-KR')} 기준` : '—'}
              <span className="ml-3 opacity-50 text-xs">30초마다 자동 갱신</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="font-mono text-xs tracking-widest text-(--text-dim) hover:text-(--text) border border-(--border) px-3 py-1.5 bg-transparent transition-colors"
            >
              ← 메인
            </a>
            <button
              onClick={refresh}
              disabled={loading}
              className="font-mono text-xs tracking-widest text-(--text-dim) hover:text-(--text) border border-(--border) px-3 py-1.5 bg-transparent transition-colors cursor-pointer disabled:opacity-40"
            >
              {loading ? '갱신 중...' : '새로고침'}
            </button>
          </div>
        </div>

        {/* Summary bar */}
        {data && (
          <div className="grid grid-cols-3 border border-(--border) mb-8">
            {Object.values(data.apis).map((api) => (
              <div key={api.name} className="px-5 py-3 border-r border-(--border) last:border-r-0 flex items-center gap-2">
                <StatusDot ok={api.ping.ok} configured={api.configured} />
                <span className="font-mono text-xs">{api.name.split(' ')[0]}</span>
                <span className="font-mono text-xs text-(--text-dim) ml-auto">
                  {api.stats.calls > 0 ? `${api.stats.calls}회` : '대기'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* API Cards */}
        {loading && !data ? (
          <div className="font-mono text-sm text-(--text-dim) tracking-widest py-24 text-center">
            로딩 중...
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {Object.entries(data.apis).map(([id, api]) => (
              <ApiCard key={id} id={id} api={api} />
            ))}
          </div>
        ) : null}

        {/* Session note */}
        <p className="font-mono text-xs text-(--text-dim) opacity-50 mt-8 text-center tracking-widest">
          세션 통계는 서버 프로세스 시작 이후 누적값 · 재시작 시 초기화
        </p>
      </div>
    </div>
  );
}
