'use client';

import { motion } from 'motion/react';
import { formatNum } from '@/lib/format';
import type { StockItem } from '@/lib/types';

function MarketBadge({ market }: { market: string }) {
  const m = market.toUpperCase();
  const styles: Record<string, string> = {
    KOSPI: 'bg-[rgba(232,83,74,0.12)] text-[#e8534a]',
    KOSDAQ: 'bg-[rgba(74,144,232,0.12)] text-[#4a90e8]',
    KONEX: 'bg-[rgba(180,180,180,0.1)] text-(--text-mid)',
  };
  return (
    <span
      className={`inline-block font-mono text-xs tracking-wider px-2 py-1 rounded-sm ${
        styles[m] ?? 'bg-[rgba(180,180,180,0.1)] text-(--text-mid)'
      }`}
    >
      {market}
    </span>
  );
}

interface StockRowProps {
  stock: StockItem;
  index: number;
  onClick: () => void;
}

export default function StockRow({ stock, index, onClick }: StockRowProps) {
  const chg = Number(stock.vs);
  const pct = Number(stock.fltRt);
  const cls = chg > 0 ? 'text-(--up)' : chg < 0 ? 'text-(--down)' : 'text-(--text-mid)';
  const sign = chg > 0 ? '+' : '';

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
          <div className="font-mono text-xs text-(--text-dim) mt-0.5">
            {stock.srtnCd} · {stock.mrktCtg}
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
          <span className="font-mono text-xs text-(--text-dim) tracking-wider">{stock.srtnCd}</span>
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
