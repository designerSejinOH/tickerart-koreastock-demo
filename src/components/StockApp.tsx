"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import StockRow from "./StockRow";
import StockModal from "./StockModal";
import { findLatestDate, fetchPage, fetchMarketCount } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { loadTickerMap } from "@/lib/tickerMap";
import type { StockItem, SortKey } from "@/lib/types";

const ITEMS_PER_PAGE = 50;

const BASE_MARKETS: { label: string; value: string }[] = [
  { label: "전체", value: "" },
  { label: "KOSPI", value: "KOSPI" },
  { label: "KOSDAQ", value: "KOSDAQ" },
];

const SORT_COLS: { label: string; key: SortKey; left?: boolean }[] = [
  { label: "종목", key: "itmsNm", left: true },
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
  onSort: (k: SortKey, d: 1 | -1) => void;
  left?: boolean;
}) {
  const active = currentKey === sortKey;
  const arrow = (d: 1 | -1, sym: string) => (
    <button
      key={d}
      onClick={(e) => { e.stopPropagation(); onSort(sortKey, d); }}
      className={`block leading-none text-[9px] cursor-pointer bg-transparent border-none p-0 transition-colors ${
        active && dir === d ? "text-(--text)" : "text-(--border) hover:text-(--text-mid)"
      }`}
    >
      {sym}
    </button>
  );
  return (
    <span className={`inline-flex items-center gap-1.5 ${left ? "" : "justify-end w-full"}`}>
      <span className={`font-mono text-xs tracking-widest uppercase transition-colors ${active ? "text-(--text)" : "text-(--text-dim)"}`}>
        {label}
      </span>
      <span className="flex flex-col gap-px shrink-0">
        {arrow(1, "▲")}
        {arrow(-1, "▼")}
      </span>
    </span>
  );
}

function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (p: number) => void;
}) {
  if (total <= 1) return null;

  const pages: (number | "…")[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < total - 2) pages.push("…");
    pages.push(total);
  }

  const btnBase =
    "font-mono text-xs tracking-widest px-3 py-2 border border-(--border) transition-colors cursor-pointer bg-transparent min-w-[2.25rem] text-center";

  return (
    <div className="flex items-center justify-center gap-1 py-10 flex-wrap">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className={`${btnBase} text-(--text-dim) hover:text-(--text) hover:border-(--text-mid) disabled:opacity-30 disabled:cursor-default`}
      >
        ←
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`el-${i}`} className="font-mono text-xs text-(--text-dim) px-1">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`${btnBase} ${
              p === page
                ? "text-(--text) border-(--text)"
                : "text-(--text-dim) hover:text-(--text-mid) hover:border-(--text-mid)"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === total}
        className={`${btnBase} text-(--text-dim) hover:text-(--text) hover:border-(--text-mid) disabled:opacity-30 disabled:cursor-default`}
      >
        →
      </button>
    </div>
  );
}

export default function StockApp() {
  const [allLoaded, setAllLoaded] = useState<StockItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [latestDate, setLatestDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [marketFilter, setMarketFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | "">("");
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [pageLoading, setPageLoading] = useState(true);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [tickerMap, setTickerMap] = useState<Map<string, string>>(new Map());
  const [markets, setMarkets] = useState<{ label: string; value: string }[]>([...BASE_MARKETS]);
  const [displayPage, setDisplayPage] = useState(1);

  useEffect(() => {
    setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
    loadTickerMap().then(setTickerMap).catch(() => {});
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  };

  // Reset to page 1 whenever filter/search/sort changes
  useEffect(() => {
    setDisplayPage(1);
  }, [marketFilter, searchQuery, sortKey, sortDir]);

  useEffect(() => {
    let cancelled = false;

    findLatestDate()
      .then(async ({ date, total }) => {
        if (cancelled) return;
        setLatestDate(date);
        setTotalCount(total);
        setIsLoadingAll(true);

        fetchMarketCount(date, "KONEX").then((count) => {
          if (!cancelled && count > 0)
            setMarkets([...BASE_MARKETS, { label: "KONEX", value: "KONEX" }]);
        });

        const firstPage = await fetchPage(date, 1);
        if (cancelled) return;
        let loaded = firstPage;
        setAllLoaded(loaded);
        setPageLoading(false);

        let apiPage = 2;
        while (loaded.length < total) {
          if (cancelled) return;
          const more = await fetchPage(date, apiPage++);
          if (cancelled) return;
          if (!more.length) break;
          loaded = [...loaded, ...more];
          setAllLoaded([...loaded]);
        }
        if (!cancelled) setIsLoadingAll(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setInitError(err instanceof Error ? err.message : "오류 발생");
          setPageLoading(false);
          setIsLoadingAll(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  const handleSort = useCallback((key: SortKey, d: 1 | -1) => {
    if (sortKey === key && sortDir === d) {
      setSortKey(""); // 같은 방향 재클릭 → 정렬 해제
    } else {
      setSortKey(key);
      setSortDir(d);
    }
  }, [sortKey, sortDir]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let result = allLoaded;
    if (marketFilter)
      result = result.filter((d) => (d.mrktCtg || "").toUpperCase() === marketFilter);
    if (q)
      result = result.filter(
        (d) =>
          (d.itmsNm || "").toLowerCase().includes(q) ||
          (d.srtnCd || "").includes(q)
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(displayPage, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

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
      <div
        className={`flex flex-col min-w-0 transition-all duration-300 ${
          selectedStock ? "hidden lg:flex lg:w-1/2" : "w-full"
        }`}
      >
        {/* Header */}
        <motion.div
          className="flex items-end justify-between gap-6 flex-wrap px-6 lg:px-12 pt-12 pb-8"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight">KOREA TICKER</h1>
            <p className="font-mono text-base text-(--text-dim) mt-2">
              KRX · {formatDate(latestDate)} 기준
            </p>
          </div>
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <button
              onClick={toggleTheme}
              className="font-mono text-xs tracking-widest text-(--text-dim) hover:text-(--text) border border-(--border) px-3 py-1.5 bg-transparent transition-colors cursor-pointer whitespace-nowrap"
            >
              {isDark ? "LIGHT" : "DARK"}
            </button>
            <span className="font-mono text-sm text-(--text-dim) whitespace-nowrap flex items-center gap-2">
              {sortKey ? (
                <button
                  onClick={() => setSortKey("")}
                  className="inline-flex items-center gap-1 font-mono text-xs tracking-widest border border-(--text-mid) text-(--text) px-2 py-0.5 bg-transparent cursor-pointer hover:border-(--text) transition-colors"
                >
                  {SORT_COLS.find((c) => c.key === sortKey)?.label}
                  {sortDir === 1 ? " ▲" : " ▼"}
                  <span className="ml-0.5 opacity-50">✕</span>
                </button>
              ) : (
                <span className="text-xs text-(--text-dim) opacity-50 tracking-widest">기본순</span>
              )}
              {isLoadingAll ? (
                <>
                  {filtered.length.toLocaleString()}
                  <span className="opacity-50">
                    {" "}/ {allLoaded.length.toLocaleString()} 로딩 중
                  </span>
                </>
              ) : (
                <>{filtered.length.toLocaleString()} / {totalCount.toLocaleString()}개</>
              )}
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
          {markets.map((mkt) => (
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
        <div className="flex-1">
          {/* Column header — desktop only */}
          <div className="hidden lg:grid grid-cols-[2.5fr_120px_110px_90px_120px] px-6 lg:px-12 py-4 border-b border-(--border) sticky top-0 bg-(--bg) z-10">
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
          {pageItems.length === 0 ? (
            <div className="flex items-center justify-center py-24 font-mono text-sm text-(--text-dim) tracking-widest">
              {isLoadingAll ? "로딩 중..." : "검색 결과 없음"}
            </div>
          ) : (
            <div>
              {pageItems.map((stock, i) => (
                <StockRow
                  key={stock.isinCd + stock.basDt}
                  stock={stock}
                  index={i}
                  tickerMap={tickerMap}
                  onClick={() => setSelectedStock(stock)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          <Pagination
            page={safePage}
            total={totalPages}
            onChange={(p) => {
              setDisplayPage(p);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      </div>

      {/* Modal / Side panel */}
      <AnimatePresence>
        {selectedStock && (
          <StockModal
            key={selectedStock.isinCd}
            stock={selectedStock}
            latestDate={latestDate}
            tickerMap={tickerMap}
            onClose={() => setSelectedStock(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
