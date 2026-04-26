import { NextRequest, NextResponse } from 'next/server';
import { recordCall } from '@/lib/apiStats';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const svc = searchParams.get('svc');
  const op = searchParams.get('op');

  if (!svc || !op) {
    return NextResponse.json({ error: 'svc and op are required' }, { status: 400 });
  }

  const url = `https://apis.data.go.kr/1160100/service/${svc}/${op}`;
  const params = new URLSearchParams();
  searchParams.forEach((value, key) => {
    if (key !== 'svc' && key !== 'op') params.set(key, value);
  });
  params.set('serviceKey', process.env.API_KEY!);
  params.set('resultType', 'json');

  const t0 = Date.now();
  try {
    const upstream = await fetch(`${url}?${params}`);
    const json = await upstream.json();
    recordCall('krx', Date.now() - t0);
    return NextResponse.json(json, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate' },
    });
  } catch (err) {
    recordCall('krx', Date.now() - t0, true);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
