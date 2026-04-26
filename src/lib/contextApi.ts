import type { NaverNewsItem, StockContext } from './contextTypes';

async function fetchNaverNews(query: string): Promise<NaverNewsItem[]> {
  const params = new URLSearchParams({ query, display: '7', sort: 'date' });
  const res = await fetch(`/api/naver?${params}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return (json.items ?? []) as NaverNewsItem[];
}

export async function fetchStockContext(
  _srtnCd: string,
  itmsNm: string
): Promise<StockContext> {
  let news: NaverNewsItem[] = [];
  let newsError: string | null = null;

  try {
    news = await fetchNaverNews(itmsNm);
  } catch (err) {
    newsError = err instanceof Error ? err.message : '뉴스 연결 오류';
  }

  return { news, newsError };
}
