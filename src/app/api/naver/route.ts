import { NextRequest, NextResponse } from 'next/server';
import { recordCall } from '@/lib/apiStats';

const NAVER_BASE = 'https://openapi.naver.com/v1/search';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
    return NextResponse.json({ error: 'Naver API keys not configured' }, { status: 503 });
  }

  const params = new URLSearchParams();
  searchParams.forEach((value, key) => params.set(key, value));

  const t0 = Date.now();
  try {
    const res = await fetch(`${NAVER_BASE}/news.json?${params}`, {
      headers: {
        'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET,
      },
    });
    const json = await res.json();
    recordCall('naver', Date.now() - t0);
    return NextResponse.json(json, {
      headers: { 'Cache-Control': 's-maxage=600, stale-while-revalidate' },
    });
  } catch (err) {
    recordCall('naver', Date.now() - t0, true);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
