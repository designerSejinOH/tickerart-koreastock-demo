'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchStockDetail } from '@/lib/api';
import { formatDate, formatNum, formatFieldValue, FIELD_LABELS } from '@/lib/format';
import CandleChart from './CandleChart';
import type { StockItem, ItemInfo, CorpInfo } from '@/lib/types';

interface ModalDetailState {
  today: StockItem;
  yesterday: StockItem | null;
  listingInfo: ItemInfo | null;
  corpInfo: CorpInfo | null;
  listingError: string | null;
}

function ApiTable({ data }: { data: Record<string, string | undefined> | null }) {
  if (!data) return <div className="p-3 font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-dim)] border border-[var(--border)]">데이터 없음</div>;
  const entries = Object.entries(data).filter(([, v]) => v != null && v !== '');
  if (!entries.length) return <div className="p-3 font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-dim)] border border-[var(--border)]">데이터 없음</div>;
  return (
    <div className="border border-[var(--border)]">
      {entries.map(([k, v]) => (
        <div key={k} className="flex justify-between items-baseline gap-3 px-3 py-[7px] border-b border-[var(--border)] last:border-b-0 font-[family-name:var(--font-mono)] text-[11px]">
          <span className="text-[var(--text-dim)] shrink-0">{FIELD_LABELS[k] ?? k}</span>
          <span className="text-right break-all">{formatFieldValue(k, v)}</span>
        </div>
      ))}
    </div>
  );
}

interface StockModalProps {
  stock: StockItem;
  latestDate: string;
  onClose: () => void;
}

export default function StockModal({ stock, latestDate, onClose }: StockModalProps) {
  const [detail, setDetail] = useState<ModalDetailState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setError(null);

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

    return () => { cancelled = true; };
  }, [stock.isinCd, latestDate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const chg = detail ? Number(detail.today.vs) : 0;
  const pct = detail ? Number(detail.today.fltRt) : 0;
  const sign = chg >= 0 ? '+' : '';
  const cls = chg > 0 ? 'text-[var(--up)]' : chg < 0 ? 'text-[var(--down)]' : 'text-[var(--text-mid)]';

  const compareRows: [string, keyof StockItem][] = [
    ['시가', 'mkp'], ['고가', 'hipr'], ['저가', 'lopr'],
    ['종가', 'clpr'], ['거래량', 'trqu'], ['거래대금', 'trPrc'],
  ];

  return (
    <motion.div
      className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-[640px] max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-[var(--border)]">
          <div>
            <div className="text-[18px] font-bold">{stock.itmsNm}</div>
            <div className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-dim)] tracking-widest mt-1">
              {stock.mrktCtg} · {stock.srtnCd} · {stock.isinCd}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-dim)] hover:text-[var(--text)] text-xl leading-none pl-4 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <AnimatePresence mode="wait">
            {error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-[family-name:var(--font-mono)] text-xs text-[var(--up)] text-center py-10"
              >
                {error}
              </motion.div>
            ) : !detail ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-dim)] text-center py-10 tracking-widest"
              >
                로딩 중...
              </motion.div>
            ) : (
              <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Price */}
                <div className="flex items-baseline gap-3 flex-wrap mb-5">
                  <span className="font-[family-name:var(--font-mono)] text-[28px] font-medium">
                    {formatNum(detail.today.clpr)}
                    <span className="text-[16px] text-[var(--text-mid)] ml-0.5">원</span>
                  </span>
                  <span className={`font-[family-name:var(--font-mono)] text-[13px] ${cls}`}>
                    {sign}{formatNum(detail.today.vs)} ({sign}{pct.toFixed(2)}%)
                  </span>
                </div>

                {/* Chart */}
                <CandleChart today={detail.today} yesterday={detail.yesterday} />

                {/* Compare table */}
                <div className="font-[family-name:var(--font-mono)] text-[10px] tracking-widest uppercase text-[var(--text-dim)] mt-6 mb-2.5">
                  전일 비교 ({detail.yesterday ? formatDate(detail.yesterday.basDt) : '—'} → {formatDate(detail.today.basDt)})
                </div>
                <div className="border border-[var(--border)] overflow-hidden mb-1">
                  <div className="grid grid-cols-3 px-3.5 py-2 font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-dim)] tracking-[0.08em] bg-[var(--surface2)] border-b border-[var(--border)]">
                    <span></span>
                    <span className="text-right">{detail.yesterday ? formatDate(detail.yesterday.basDt) : '—'}</span>
                    <span className="text-right">{formatDate(detail.today.basDt)}</span>
                  </div>
                  {compareRows.map(([label, key]) => (
                    <div key={key} className="grid grid-cols-3 px-3.5 py-2.5 font-[family-name:var(--font-mono)] text-xs border-b border-[var(--border)] last:border-b-0">
                      <span className="text-[10px] text-[var(--text-dim)] tracking-widest uppercase self-center">{label}</span>
                      <span className="text-right">{detail.yesterday ? formatFieldValue(key, detail.yesterday[key]) : '—'}</span>
                      <span className={`text-right ${key === 'clpr' ? cls : ''}`}>{formatFieldValue(key, detail.today[key])}</span>
                    </div>
                  ))}
                </div>

                {/* Raw API data */}
                <div className="font-[family-name:var(--font-mono)] text-[9px] tracking-widest text-[var(--text-dim)] bg-[var(--surface2)] border border-[var(--border)] border-b-0 px-3 py-1.5 mt-5">
                  GetStockSecuritiesInfoService · getStockPriceInfo
                </div>
                <ApiTable data={detail.today as unknown as Record<string, string>} />

                <div className="font-[family-name:var(--font-mono)] text-[9px] tracking-widest text-[var(--text-dim)] bg-[var(--surface2)] border border-[var(--border)] border-b-0 px-3 py-1.5 mt-5">
                  GetKrxListedInfoService · getItemInfo
                  {detail.listingError && !detail.listingInfo && (
                    <span className="text-[var(--up)] ml-2">{detail.listingError}</span>
                  )}
                </div>
                <ApiTable data={detail.listingInfo as Record<string, string | undefined> | null} />

                <div className="font-[family-name:var(--font-mono)] text-[9px] tracking-widest text-[var(--text-dim)] bg-[var(--surface2)] border border-[var(--border)] border-b-0 px-3 py-1.5 mt-5">
                  GetCorpBasicInfoService_V2 · getCorpBasicInfo
                </div>
                <ApiTable data={detail.corpInfo as Record<string, string | undefined> | null} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
