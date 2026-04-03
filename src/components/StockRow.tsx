'use client';

import { motion } from 'motion/react';
import { formatNum } from '@/lib/format';
import type { StockItem } from '@/lib/types';

function MarketBadge({ market }: { market: string }) {
  const m = market.toUpperCase();
  const styles: Record<string, string> = {
    KOSPI: 'bg-[rgba(232,83,74,0.12)] text-[#e8534a]',
    KOSDAQ: 'bg-[rgba(74,144,232,0.12)] text-[#4a90e8]',
    KONEX: 'bg-[rgba(180,180,180,0.1)] text-[var(--text-mid)]',
  };
  return (
    <span
      className={`inline-block font-[family-name:var(--font-mono)] text-[9px] tracking-[0.08em] px-1.5 py-0.5 rounded-sm ${
        styles[m] ?? 'bg-[rgba(180,180,180,0.1)] text-[var(--text-mid)]'
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
  const cls =
    chg > 0 ? 'text-[var(--up)]' : chg < 0 ? 'text-[var(--down)]' : 'text-[var(--text-mid)]';
  const sign = chg > 0 ? '+' : '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, delay: Math.min(index * 0.004, 0.3) }}
      className="grid grid-cols-[2.5fr_80px_120px_110px_90px_120px] px-4 py-[13px] border-b border-[var(--border)] bg-[var(--surface)] cursor-pointer transition-colors hover:bg-[var(--surface2)] items-center"
      onClick={onClick}
    >
      <span className="flex flex-col gap-0.5">
        <span className="text-[13px] font-medium">{stock.itmsNm}</span>
        <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-dim)] tracking-[0.08em]">
          {stock.srtnCd}
        </span>
      </span>

      <span className="font-[family-name:var(--font-mono)] text-[10px]">
        <MarketBadge market={stock.mrktCtg} />
      </span>

      <span className="font-[family-name:var(--font-mono)] text-xs text-right">
        {formatNum(stock.clpr)}
      </span>

      <span className={`font-[family-name:var(--font-mono)] text-xs text-right ${cls}`}>
        {sign}{formatNum(stock.vs)}
      </span>

      <span className={`font-[family-name:var(--font-mono)] text-xs text-right ${cls}`}>
        {sign}{pct.toFixed(2)}%
      </span>

      <span className="font-[family-name:var(--font-mono)] text-xs text-right text-[var(--text-mid)]">
        {formatNum(stock.trqu)}
      </span>
    </motion.div>
  );
}
