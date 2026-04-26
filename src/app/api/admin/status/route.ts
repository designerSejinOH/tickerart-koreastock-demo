import { NextResponse } from 'next/server';
import { apiStats } from '@/lib/apiStats';

async function ping(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; ms: number; error?: string }> {
  const t0 = Date.now();
  try {
    const res = await fetch(url, { ...options, signal: AbortSignal.timeout(5000) });
    return { ok: res.ok, ms: Date.now() - t0 };
  } catch (err) {
    return { ok: false, ms: Date.now() - t0, error: err instanceof Error ? err.message : 'error' };
  }
}

export async function GET() {
  const krxKey = process.env.API_KEY;
  const naverClientId = process.env.NAVER_CLIENT_ID;
  const naverSecret = process.env.NAVER_CLIENT_SECRET;

  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  const [krxPing, naverPing] = await Promise.all([
    krxKey
      ? ping(`https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo?serviceKey=${encodeURIComponent(krxKey)}&numOfRows=1&pageNo=1&basDt=${dateStr}&resultType=json`)
      : Promise.resolve({ ok: false, ms: 0, error: 'API_KEY not set' }),

    naverClientId && naverSecret
      ? ping('https://openapi.naver.com/v1/search/news.json?query=test&display=1', {
          headers: {
            'X-Naver-Client-Id': naverClientId,
            'X-Naver-Client-Secret': naverSecret,
          },
        })
      : Promise.resolve({ ok: false, ms: 0, error: 'Naver keys not set' }),
  ]);

  return NextResponse.json({
    timestamp: Date.now(),
    apis: {
      krx: {
        name: '공공데이터포털 (KRX)',
        configured: !!krxKey,
        ping: krxPing,
        stats: apiStats.krx,
        dailyLimit: '공공데이터포털 신청 기준',
        endpoints: [
          'GetStockSecuritiesInfoService/getStockPriceInfo',
          'GetKrxListedInfoService/getItemInfo',
          'GetCorpBasicInfoService_V2/getCorpBasicInfo',
        ],
      },
      naver: {
        name: 'Naver 검색 API',
        configured: !!(naverClientId && naverSecret),
        ping: naverPing,
        stats: apiStats.naver,
        dailyLimit: 25000,
        endpoints: ['news.json'],
      },
    },
  });
}
