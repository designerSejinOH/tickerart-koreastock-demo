'use client';

import { motion } from 'motion/react';
import { formatNum } from '@/lib/format';
import { lookupTicker } from '@/lib/tickerMap';
import type { StockItem } from '@/lib/types';

function MarketBadge({ market }: { market: string }) {
  const m = market.toUpperCase();
  const styles: Record<string, string> = {
    KOSPI: 'bg-[rgba(0,0,0,0.06)] text-(--text-mid)',
    KOSDAQ: 'bg-[rgba(0,0,0,0.06)] text-(--text-mid)',
    KONEX: 'bg-[rgba(0,0,0,0.04)] text-(--text-dim)',
  };
  return (
    <span
      className={`inline-block font-mono text-xs tracking-wider px-2 py-1 rounded-sm ${
        styles[m] ?? 'bg-[rgba(0,0,0,0.04)] text-(--text-dim)'
      }`}
    >
      {market}
    </span>
  );
}

interface StockRowProps {
  stock: StockItem;
  index: number;
  tickerMap: Map<string, string>;
  onClick: () => void;
}

export default function StockRow({ stock, index, tickerMap, onClick }: StockRowProps) {
  const chg = Number(stock.vs);
  const pct = Number(stock.fltRt);
  const cls = chg > 0 ? 'text-(--up)' : chg < 0 ? 'text-(--down)' : 'text-(--text-mid)';
  const sign = chg > 0 ? '+' : '';
  const newTicker = lookupTicker(stock.srtnCd, tickerMap);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, delay: Math.min(index * 0.004, 0.3) }}
      onClick={onClick}
      className="border-b border-(--border) bg-(--surface) cursor-pointer transition-colors hover:bg-(--surface2)"
    >
      {/* Mobile layout */}
      <div className="flex lg:hidden items-center justify-between gap-4 px-6 py-4">
        <div className="flex-1 min-w-0">
          <div className="text-base font-medium truncate">{stock.itmsNm}</div>
          <div className="font-mono text-xs text-(--text-dim) mt-0.5 flex items-center gap-1.5">
            {newTicker && (
              <span className="text-(--text-mid) font-semibold">{newTicker}</span>
            )}
            {newTicker && <span>·</span>}
            <span>{stock.srtnCd}</span>
            <span>·</span>
            <span>{stock.mrktCtg}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-sm">{formatNum(stock.clpr)}</div>
          <div className={`font-mono text-xs ${cls}`}>
            {sign}{pct.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:grid grid-cols-[2.5fr_80px_120px_110px_90px_120px] px-6 lg:px-12 py-5 items-center">
        <span className="flex flex-col gap-0.5">
          <span className="text-base font-medium">{stock.itmsNm}</span>
          <span className="font-mono text-xs text-(--text-dim) tracking-wider flex items-center gap-1.5">
            {newTicker && (
              <span className="text-(--text-mid) font-semibold tracking-widest">{newTicker}</span>
            )}
            {newTicker && <span>·</span>}
            <span>{stock.srtnCd}</span>
          </span>
        </span>
        <span className="font-mono text-xs">
          <MarketBadge market={stock.mrktCtg} />
        </span>
        <span className="font-mono text-sm text-right">{formatNum(stock.clpr)}</span>
        <span className={`font-mono text-sm text-right ${cls}`}>{sign}{formatNum(stock.vs)}</span>
        <span className={`font-mono text-sm text-right ${cls}`}>{sign}{pct.toFixed(2)}%</span>
        <span className="font-mono text-sm text-right text-(--text-mid)">{formatNum(stock.trqu)}</span>
      </div>
    </motion.div>
  );
}
