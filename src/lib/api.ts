import { toDateStr } from './format';
import type { StockItem, ItemInfo, CorpInfo } from './types';

const BASE = '/api/proxy?svc=GetStockSecuritiesInfoService&op=getStockPriceInfo';
const ITEM_INFO = '/api/proxy?svc=GetKrxListedInfoService&op=getItemInfo';
const CORP_INFO = '/api/proxy?svc=GetCorpBasicInfoService_V2&op=getCorpBasicInfo';

const PAGE_SIZE = 100;

function extractItems<T>(json: unknown): T[] {
  const items = (json as { response?: { body?: { items?: { item?: unknown } } } })
    ?.response?.body?.items?.item;
  if (!items) return [];
  return (Array.isArray(items) ? items : [items]) as T[];
}

export async function findLatestDate(): Promise<{ date: string; total: number }> {
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = toDateStr(d);
    const params = new URLSearchParams({ numOfRows: '1', pageNo: '1', basDt: dateStr });
    const res = await fetch(`${BASE}&${params}`);
    const json = await res.json();
    const count = Number(
      (json as { response?: { body?: { totalCount?: string } } })?.response?.body?.totalCount
    );
    if (count > 0) return { date: dateStr, total: count };
  }
  throw new Error('최근 거래일을 찾을 수 없습니다');
}

export async function fetchPage(date: string, page: number): Promise<StockItem[]> {
  const params = new URLSearchParams({
    numOfRows: String(PAGE_SIZE),
    pageNo: String(page),
    basDt: date,
  });
  const res = await fetch(`${BASE}&${params}`);
  const json = await res.json();
  return extractItems<StockItem>(json);
}

export async function fetchStockDetail(
  isinCd: string,
  latestDate: string
): Promise<{
  priceHistory: StockItem[];
  listingInfo: ItemInfo | null;
  corpInfo: CorpInfo | null;
  listingError: string | null;
}> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 14);

  const priceParams = new URLSearchParams({
    numOfRows: '14', pageNo: '1',
    beginBasDt: toDateStr(start), endBasDt: toDateStr(end),
    isinCd,
  });
  const infoParams = new URLSearchParams({
    numOfRows: '5', pageNo: '1',
    basDt: latestDate, isinCd,
  });

  const [priceRes, infoRes] = await Promise.all([
    fetch(`${BASE}&${priceParams}`),
    fetch(`${ITEM_INFO}&${infoParams}`).catch(() => null),
  ]);

  const priceJson = await priceRes.json();
  const allItems = extractItems<StockItem>(priceJson);
  const priceHistory = allItems
    .filter(d => (d.isinCd || '').trim() === isinCd)
    .sort((a, b) => a.basDt.localeCompare(b.basDt));

  let listingInfo: ItemInfo | null = null;
  let listingError: string | null = null;

  if (!infoRes || !infoRes.ok) {
    listingError = infoRes ? `HTTP ${infoRes.status}` : '네트워크 오류';
  } else {
    try {
      const infoJson = await infoRes.json();
      const items = extractItems<ItemInfo>(infoJson);
      listingInfo = items[0] ?? null;
    } catch (e) {
      listingError = e instanceof Error ? e.message : '파싱 오류';
    }
  }

  let corpInfo: CorpInfo | null = null;
  if (listingInfo?.crno) {
    try {
      const corpParams = new URLSearchParams({ numOfRows: '1', pageNo: '1', crno: listingInfo.crno });
      const corpRes = await fetch(`${CORP_INFO}&${corpParams}`);
      if (corpRes.ok) {
        const corpJson = await corpRes.json();
        const items = extractItems<CorpInfo>(corpJson);
        corpInfo = items[0] ?? null;
      }
    } catch (_) {}
  }

  return { priceHistory, listingInfo, corpInfo, listingError };
}
