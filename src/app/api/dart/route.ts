import { NextRequest, NextResponse } from 'next/server';
import { unzipSync } from 'fflate';
import { recordCall, dartCache } from '@/lib/apiStats';

const DART_BASE = 'https://opendart.fss.or.kr/api';

// 종목코드 → corp_code 매핑 (프로세스 메모리 캐시, 24시간)
let corpCodeCache: Map<string, string> | null = null;
let corpCodeCachedAt = 0;
const CORP_CACHE_TTL = 24 * 60 * 60 * 1000;

async function getCorpCodeMap(apiKey: string): Promise<Map<string, string>> {
  if (corpCodeCache && Date.now() - corpCodeCachedAt < CORP_CACHE_TTL) {
    return corpCodeCache;
  }

  const res = await fetch(`${DART_BASE}/corpCode.xml?crtfc_key=${apiKey}`);
  if (!res.ok) throw new Error(`corpCode.xml fetch failed: ${res.status}`);

  const zipBuf = new Uint8Array(await res.arrayBuffer());
  const unzipped = unzipSync(zipBuf);

  // ZIP 내부 파일명 찾기 — 대소문자·경로 무관하게 XML 파일 탐색
  const xmlKey = Object.keys(unzipped).find((k) =>
    k.toUpperCase().endsWith('.XML')
  );
  if (!xmlKey) throw new Error(`No XML in zip. Files: ${Object.keys(unzipped).join(', ')}`);

  const xml = new TextDecoder('utf-8').decode(unzipped[xmlKey]);

  const map = new Map<string, string>();
  // <list> 블록에서 corp_code와 stock_code 추출
  const listRe = /<list>([\s\S]*?)<\/list>/g;
  let listMatch;
  while ((listMatch = listRe.exec(xml)) !== null) {
    const block = listMatch[1];
    const corpCode = block.match(/<corp_code>(\d+)<\/corp_code>/)?.[1];
    const stockCode = block.match(/<stock_code>\s*(\d+)\s*<\/stock_code>/)?.[1]?.trim();
    if (corpCode && stockCode) map.set(stockCode, corpCode);
  }

  corpCodeCache = map;
  corpCodeCachedAt = Date.now();
  dartCache.size = map.size;
  dartCache.cachedAt = corpCodeCachedAt;
  return map;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json({ error: 'endpoint is required' }, { status: 400 });
  }

  const apiKey = process.env.DART_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'DART_API_KEY not configured' }, { status: 503 });
  }

  try {
    // stock_code → corp_code 변환 후 company.json 호출
    if (endpoint === 'company.json') {
      const stockCode = searchParams.get('stock_code');
      if (!stockCode) {
        return NextResponse.json({ error: 'stock_code is required' }, { status: 400 });
      }

      const t0 = Date.now();
      const map = await getCorpCodeMap(apiKey);
      const corpCode = map.get(stockCode.padStart(6, '0'));
      if (!corpCode) {
        recordCall('dart', Date.now() - t0, true);
        return NextResponse.json({ error: '종목코드에 해당하는 DART 기업 없음' }, { status: 404 });
      }

      const params = new URLSearchParams({ crtfc_key: apiKey, corp_code: corpCode });
      const res = await fetch(`${DART_BASE}/company.json?${params}`);
      const json = await res.json();
      recordCall('dart', Date.now() - t0);
      return NextResponse.json(
        { ...json, corp_code: corpCode },
        { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' } }
      );
    }

    // 기타 DART 엔드포인트는 그대로 프록시
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      if (key !== 'endpoint') params.set(key, value);
    });
    params.set('crtfc_key', apiKey);

    const t1 = Date.now();
    const res = await fetch(`${DART_BASE}/${endpoint}?${params}`);
    const json = await res.json();
    recordCall('dart', Date.now() - t1);
    return NextResponse.json(json, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' },
    });
  } catch (err) {
    recordCall('dart', 0, true);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
