import type { DartCompany, DartDisclosure, NaverNewsItem, StockContext } from './contextTypes';
import { toDateStr } from './format';

async function dartGet<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  const q = new URLSearchParams({ endpoint, ...params });
  const res = await fetch(`/api/dart?${q}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  if (json.status && json.status !== '000') throw new Error(json.message ?? 'DART error');
  return json as T;
}

async function fetchDartCompany(stockCode: string): Promise<DartCompany> {
  return dartGet<DartCompany>('company.json', { stock_code: stockCode });
}

async function fetchDartDisclosures(corpCode: string): Promise<DartDisclosure[]> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 90); // 최근 90일

  const json = await dartGet<{ list?: DartDisclosure[] }>('list.json', {
    corp_code: corpCode,
    bgn_de: toDateStr(start),
    end_de: toDateStr(end),
    page_count: '20',
  });
  return json.list ?? [];
}

async function fetchNaverNews(query: string): Promise<NaverNewsItem[]> {
  const params = new URLSearchParams({ query, display: '7', sort: 'date' });
  const res = await fetch(`/api/naver?${params}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return (json.items ?? []) as NaverNewsItem[];
}

export async function fetchStockContext(
  srtnCd: string,
  itmsNm: string
): Promise<StockContext> {
  let company: DartCompany | null = null;
  let companyError: string | null = null;
  let disclosures: DartDisclosure[] = [];
  let disclosureError: string | null = null;
  let news: NaverNewsItem[] = [];
  let newsError: string | null = null;

  // DART 기업개황 + 네이버 뉴스 병렬 호출
  const [dartResult, newsResult] = await Promise.allSettled([
    fetchDartCompany(srtnCd),
    fetchNaverNews(itmsNm),
  ]);

  if (dartResult.status === 'fulfilled') {
    company = dartResult.value;
  } else {
    companyError = dartResult.reason instanceof Error
      ? dartResult.reason.message
      : 'DART 연결 오류';
  }

  if (newsResult.status === 'fulfilled') {
    news = newsResult.value;
  } else {
    newsError = newsResult.reason instanceof Error
      ? newsResult.reason.message
      : '뉴스 연결 오류';
  }

  // 공시 목록은 corp_code가 있을 때만
  if (company?.corp_code) {
    const discResult = await Promise.allSettled([
      fetchDartDisclosures(company.corp_code),
    ]);
    if (discResult[0].status === 'fulfilled') {
      disclosures = discResult[0].value;
    } else {
      disclosureError = discResult[0].reason instanceof Error
        ? discResult[0].reason.message
        : '공시 조회 오류';
    }
  }

  return { company, disclosures, news, companyError, disclosureError, newsError };
}
