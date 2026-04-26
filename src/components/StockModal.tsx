'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchStockDetail } from '@/lib/api';
import { fetchStockContext } from '@/lib/contextApi';
import { formatDate, formatNum, formatFieldValue, FIELD_LABELS } from '@/lib/format';
import CandleChart from './CandleChart';
import { lookupTicker } from '@/lib/tickerMap';
import type { StockItem, ItemInfo, CorpInfo } from '@/lib/types';
import type { NaverNewsItem } from '@/lib/contextTypes';

interface ModalDetailState {
  today: StockItem;
  yesterday: StockItem | null;
  listingInfo: ItemInfo | null;
  corpInfo: CorpInfo | null;
  listingError: string | null;
}

function ApiTable({ data }: { data: Record<string, string | undefined> | null }) {
  if (!data) return (
    <div className="p-4 font-mono text-sm text-(--text-dim) border border-(--border)">데이터 없음</div>
  );
  const entries = Object.entries(data).filter(([, v]) => v != null && v !== '');
  if (!entries.length) return (
    <div className="p-4 font-mono text-sm text-(--text-dim) border border-(--border)">데이터 없음</div>
  );
  return (
    <div className="border border-(--border)">
      {entries.map(([k, v]) => (
        <div
          key={k}
          className="flex justify-between items-baseline gap-3 px-4 py-2.5 border-b border-(--border) last:border-b-0 font-mono text-xs lg:text-sm"
        >
          <span className="text-(--text-dim) shrink-0">{FIELD_LABELS[k] ?? k}</span>
          <span className="text-right break-all">{formatFieldValue(k, v)}</span>
        </div>
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-xs tracking-widest text-(--text-dim) bg-(--surface2) border border-(--border) border-b-0 px-4 py-2.5 mt-8">
      {children}
    </div>
  );
}


function NewsSection({
  news,
  newsError,
  loading,
}: {
  news: NaverNewsItem[];
  newsError: string | null;
  loading: boolean;
}) {
  return (
    <>
      <SectionLabel>
        Naver 뉴스
        {newsError && <span className="text-(--up) ml-2">{newsError}</span>}
      </SectionLabel>
      <div className="border border-(--border)">
        {loading ? (
          <div className="px-4 py-3 font-mono text-xs text-(--text-dim)">로딩 중...</div>
        ) : news.length === 0 ? (
          <div className="px-4 py-3 font-mono text-xs text-(--text-dim)">뉴스 없음</div>
        ) : (
          news.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-3 border-b border-(--border) last:border-b-0 hover:bg-(--surface2) transition-colors group"
            >
              <div
                className="text-sm group-hover:text-(--text) transition-colors"
                dangerouslySetInnerHTML={{ __html: item.title }}
              />
              <div
                className="font-mono text-xs text-(--text-dim) mt-1 line-clamp-2"
                dangerouslySetInnerHTML={{ __html: item.description }}
              />
              <div className="font-mono text-xs text-(--text-dim) opacity-60 mt-1">
                {new Date(item.pubDate).toLocaleDateString('ko-KR')}
              </div>
            </a>
          ))
        )}
      </div>
    </>
  );
}

interface StockModalProps {
  stock: StockItem;
  latestDate: string;
  tickerMap: Map<string, string>;
  onClose: () => void;
}

export default function StockModal({ stock, latestDate, tickerMap, onClose }: StockModalProps) {
  const newTicker = lookupTicker(stock.srtnCd, tickerMap);
  const [detail, setDetail] = useState<ModalDetailState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<{ news: NaverNewsItem[]; newsError: string | null } | null>(null);
  const [contextLoading, setContextLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setError(null);
    setContext(null);
    setContextLoading(true);

    fetchStockDetail(stock.isinCd, latestDate)
      .then(({ priceHistory, listingInfo, corpInfo, listingError }) => {
        if (cancelled) return;
        if (!priceHistory.length) throw new Error('해당 종목 데이터가 없습니다');
        const today = priceHistory[priceHistory.length - 1];
        const yesterday = priceHistory.length >= 2 ? priceHistory[priceHistory.length - 2] : null;
        setDetail({ today, yesterday, listingInfo, corpInfo, listingError });
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err.message : '오류 발생');
      });

    fetchStockContext(stock.srtnCd, stock.itmsNm)
      .then(ctx => { if (!cancelled) setContext(ctx); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setContextLoading(false); });

    return () => { cancelled = true; };
  }, [stock.isinCd, stock.srtnCd, stock.itmsNm, latestDate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const chg = detail ? Number(detail.today.vs) : 0;
  const pct = detail ? Number(detail.today.fltRt) : 0;
  const sign = chg >= 0 ? '+' : '';
  const cls = chg > 0 ? 'text-(--up)' : chg < 0 ? 'text-(--down)' : 'text-(--text-mid)';

  const compareRows: [string, keyof StockItem][] = [
    ['시가', 'mkp'], ['고가', 'hipr'], ['저가', 'lopr'],
    ['종가', 'clpr'], ['거래량', 'trqu'], ['거래대금', 'trPrc'],
  ];

  return (
    <>
      {/* Mobile backdrop */}
      <motion.div
        className="lg:hidden fixed inset-0 bg-black/75 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />

      {/* Panel — mobile: fixed full screen, desktop: sticky side column */}
      <motion.div
        className="
          fixed top-0 left-0 right-0 bottom-0 z-50 overflow-y-auto bg-(--surface)
          lg:sticky lg:top-0 lg:left-auto lg:right-auto lg:bottom-auto lg:z-auto
          lg:w-1/2 lg:flex-none lg:h-screen lg:border-l lg:border-(--border)
        "
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* Sticky header */}
        <div className="sticky top-0 bg-(--surface) z-10 flex items-start justify-between px-6 lg:px-8 pt-6 pb-5 border-b border-(--border)">
          <div>
            <div className="text-2xl font-bold">{stock.itmsNm}</div>
            <div className="font-mono text-xs text-(--text-dim) tracking-widest mt-1.5 flex items-center gap-1.5 flex-wrap">
              {newTicker && (
                <span className="text-(--text) font-semibold tracking-widest">{newTicker}</span>
              )}
              {newTicker && <span>·</span>}
              <span>{stock.mrktCtg}</span>
              <span>·</span>
              <span>{stock.srtnCd}</span>
              <span>·</span>
              <span>{stock.isinCd}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-(--text-dim) hover:text-(--text) text-2xl leading-none pl-4 pt-0.5 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 lg:px-8 py-8">
          <AnimatePresence mode="wait">
            {error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-mono text-sm text-(--up) text-center py-16"
              >
                {error}
              </motion.div>
            ) : !detail ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-mono text-sm text-(--text-dim) text-center py-16 tracking-widest"
              >
                로딩 중...
              </motion.div>
            ) : (
              <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Price */}
                <div className="flex items-baseline gap-3 flex-wrap mb-6">
                  <span className="font-mono text-4xl font-medium">
                    {formatNum(detail.today.clpr)}
                    <span className="text-xl text-(--text-mid) ml-1">원</span>
                  </span>
                  <span className={`font-mono text-base ${cls}`}>
                    {sign}{formatNum(detail.today.vs)} ({sign}{pct.toFixed(2)}%)
                  </span>
                </div>

                {/* Chart */}
                <CandleChart today={detail.today} yesterday={detail.yesterday} />

                {/* Compare table */}
                <div className="font-mono text-xs tracking-widest uppercase text-(--text-dim) mt-8 mb-3">
                  전일 비교 ({detail.yesterday ? formatDate(detail.yesterday.basDt) : '—'} → {formatDate(detail.today.basDt)})
                </div>
                <div className="border border-(--border) overflow-hidden mb-1">
                  <div className="grid grid-cols-3 px-4 py-2.5 font-mono text-xs text-(--text-dim) tracking-wider bg-(--surface2) border-b border-(--border)">
                    <span></span>
                    <span className="text-right">{detail.yesterday ? formatDate(detail.yesterday.basDt) : '—'}</span>
                    <span className="text-right">{formatDate(detail.today.basDt)}</span>
                  </div>
                  {compareRows.map(([label, key]) => (
                    <div key={key} className="grid grid-cols-3 px-4 py-3 font-mono border-b border-(--border) last:border-b-0">
                      <span className="text-xs text-(--text-dim) tracking-widest uppercase self-center">{label}</span>
                      <span className="text-xs lg:text-sm text-right">{detail.yesterday ? formatFieldValue(key, detail.yesterday[key]) : '—'}</span>
                      <span className={`text-xs lg:text-sm text-right ${key === 'clpr' ? cls : ''}`}>{formatFieldValue(key, detail.today[key])}</span>
                    </div>
                  ))}
                </div>

                {/* Raw API data */}
                <div className="font-mono text-xs tracking-widest text-(--text-dim) bg-(--surface2) border border-(--border) border-b-0 px-4 py-2.5 mt-8">
                  GetStockSecuritiesInfoService · getStockPriceInfo
                </div>
                <ApiTable data={detail.today as unknown as Record<string, string>} />

                <div className="font-mono text-xs tracking-widest text-(--text-dim) bg-(--surface2) border border-(--border) border-b-0 px-4 py-2.5 mt-6">
                  GetKrxListedInfoService · getItemInfo
                  {detail.listingError && !detail.listingInfo && (
                    <span className="text-(--up) ml-2">{detail.listingError}</span>
                  )}
                </div>
                <ApiTable data={detail.listingInfo as Record<string, string | undefined> | null} />

                {detail.corpInfo && (
                  <>
                    <div className="font-mono text-xs tracking-widest text-(--text-dim) bg-(--surface2) border border-(--border) border-b-0 px-4 py-2.5 mt-6">
                      GetCorpBasicInfoService_V2 · getCorpBasicInfo
                    </div>
                    <ApiTable data={detail.corpInfo as Record<string, string | undefined>} />
                  </>
                )}

                {/* 뉴스 */}
                <NewsSection
                  news={context?.news ?? []}
                  newsError={context?.newsError ?? null}
                  loading={contextLoading}
                />

                <div className="pb-8" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
