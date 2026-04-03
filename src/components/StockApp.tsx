"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import StockRow from "./StockRow";
import StockModal from "./StockModal";
import { findLatestDate, fetchPage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { StockItem, SortKey } from "@/lib/types";

const MARKETS = [
  { label: "전체", value: "" },
  { label: "KOSPI", value: "KOSPI" },
  { label: "KOSDAQ", value: "KOSDAQ" },
  { label: "KONEX", value: "KONEX" },
] as const;

const SORT_COLS: { label: string; key: SortKey; left?: boolean }[] = [
  { label: "종목", key: "itmsNm", left: true },
  { label: "시장", key: "mrktCtg", left: true },
  { label: "종가", key: "clpr" },
  { label: "전일대비", key: "vs" },
  { label: "등락률", key: "fltRt" },
  { label: "거래량", key: "trqu" },
];

function SortBtn({
  label,
  sortKey,
  currentKey,
  dir,
  onSort,
  left,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey | "";
  dir: 1 | -1;
  onSort: (k: SortKey) => void;
  left?: boolean;
}) {
  const active = currentKey === sortKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={`inline-flex items-center gap-1 font-mono text-xs tracking-widest uppercase cursor-pointer border-none bg-transparent p-0 w-full transition-colors ${
        left ? "justify-start" : "justify-end"
      } ${active ? "text-(--text)" : "text-(--text-dim) hover:text-(--text-mid)"}`}
    >
      {label}
      <i className={`not-italic text-xs ${active ? "opacity-100" : "opacity-50"}`}>
        {active ? (dir === 1 ? "▲" : "▼") : ""}
      </i>
    </button>
  );
}

export default function StockApp() {
  const [allLoaded, setAllLoaded] = useState<StockItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [latestDate, setLatestDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [marketFilter, setMarketFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | "">("");
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);

  useEffect(() => {
    findLatestDate()
      .then(({ date, total }) => {
        setLatestDate(date);
        setTotalCount(total);
        return fetchPage(date, 1);
      })
      .then((items) => {
        setAllLoaded(items);
        setCurrentPage(1);
        setPageLoading(false);
      })
      .catch((err) => {
        setInitError(err instanceof Error ? err.message : "오류 발생");
        setPageLoading(false);
      });
  }, []);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 1 ? -1 : 1));
      } else {
        setSortDir(key === "itmsNm" || key === "mrktCtg" ? 1 : -1);
      }
      return key;
    });
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let result = allLoaded;
    if (marketFilter)
      result = result.filter(
        (d) => (d.mrktCtg || "").toUpperCase() === marketFilter,
      );
    if (q)
      result = result.filter(
        (d) =>
          (d.itmsNm || "").toLowerCase().includes(q) ||
          (d.srtnCd || "").includes(q),
      );
    if (sortKey) {
      const isStr = sortKey === "itmsNm" || sortKey === "mrktCtg";
      result = [...result].sort((a, b) => {
        const av = isStr ? (a[sortKey] ?? "") : Number(a[sortKey]);
        const bv = isStr ? (b[sortKey] ?? "") : Number(b[sortKey]);
        if (av < bv) return -sortDir;
        if (av > bv) return sortDir;
        return 0;
      });
    }
    return result;
  }, [allLoaded, searchQuery, marketFilter, sortKey, sortDir]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const more = await fetchPage(latestDate, nextPage);
      setAllLoaded((prev) => [...prev, ...more]);
      setCurrentPage(nextPage);
    } finally {
      setLoadingMore(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-screen font-mono text-sm text-(--text-dim) tracking-widest">
        데이터 로딩 중
        <motion.span
          className="inline-block w-1 h-4 bg-(--text-dim) ml-2.5"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear", times: [0, 0.49, 0.51] }}
        />
      </div>
    );
  }

  if (initError) {
    return (
      <div className="flex items-center justify-center h-screen font-mono text-sm text-(--up) tracking-widest">
        오류: {initError}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* List column — full width normally, half on desktop when modal open */}
      <div className={`flex flex-col min-w-0 transition-all duration-300 ${selectedStock ? "hidden lg:flex lg:w-1/2" : "w-full"}`}>

        {/* Header */}
        <motion.div
          className="flex items-end justify-between gap-6 flex-wrap px-6 lg:px-12 pt-12 pb-8"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight">주식 시세</h1>
            <p className="font-mono text-base text-(--text-dim) mt-2">
              KRX · {formatDate(latestDate)} 기준
            </p>
          </div>
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <span className="font-mono text-sm text-(--text-dim) whitespace-nowrap">
              {filtered.length.toLocaleString()} / {totalCount.toLocaleString()}개
            </span>
            <input
              type="text"
              className="font-mono text-sm bg-(--surface2) border border-(--border) text-(--text) px-4 py-2.5 outline-none flex-1 lg:w-64 lg:flex-none focus:border-(--text-mid) placeholder:text-(--text-dim) transition-colors"
              placeholder="종목명 / 코드 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Tab bar */}
        <div className="flex border-b border-(--border) px-6 lg:px-12">
          {MARKETS.map((mkt) => (
            <button
              key={mkt.value}
              onClick={() => setMarketFilter(mkt.value)}
              className={`font-mono text-sm tracking-widest px-5 py-3.5 border-b-2 -mb-px transition-colors cursor-pointer bg-transparent ${
                marketFilter === mkt.value
                  ? "text-(--text) border-(--text)"
                  : "text-(--text-dim) border-transparent hover:text-(--text-mid)"
              }`}
            >
              {mkt.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 pb-16">
          {/* Column header — desktop only */}
          <div className="hidden lg:grid grid-cols-[2.5fr_80px_120px_110px_90px_120px] px-6 lg:px-12 py-4 border-b border-(--border) sticky top-0 bg-(--bg) z-10">
            {SORT_COLS.map((col) => (
              <span key={col.key} className={col.left ? "" : "flex justify-end"}>
                <SortBtn
                  label={col.label}
                  sortKey={col.key}
                  currentKey={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                  left={col.left}
                />
              </span>
            ))}
          </div>

          {/* Rows */}
          <div>
            {filtered.map((stock, i) => (
              <StockRow
                key={stock.isinCd + stock.basDt}
                stock={stock}
                index={i}
                onClick={() => setSelectedStock(stock)}
              />
            ))}
          </div>

          {/* Load more */}
          {allLoaded.length < totalCount && (
            <div className="flex justify-center py-10">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="font-mono text-sm tracking-widest px-8 py-3 border border-(--border) text-(--text-dim) transition-all hover:border-(--text-mid) hover:text-(--text-mid) disabled:opacity-40 disabled:cursor-default cursor-pointer bg-transparent"
              >
                {loadingMore
                  ? "로딩 중..."
                  : `더 보기 (${allLoaded.length.toLocaleString()} / ${totalCount.toLocaleString()})`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal / Side panel */}
      <AnimatePresence>
        {selectedStock && (
          <StockModal
            key={selectedStock.isinCd}
            stock={selectedStock}
            latestDate={latestDate}
            onClose={() => setSelectedStock(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
