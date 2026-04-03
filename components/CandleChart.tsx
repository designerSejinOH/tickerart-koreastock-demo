import { formatNum } from '@/lib/format';

interface CandleData {
  mkp: string;
  clpr: string;
  hipr: string;
  lopr: string;
}

interface CandleChartProps {
  today: CandleData;
  yesterday: CandleData | null;
}

export default function CandleChart({ today, yesterday }: CandleChartProps) {
  const days = yesterday ? [yesterday, today] : [today];
  const labels = yesterday ? ['어제', '오늘'] : ['오늘'];

  const allPrices = days.flatMap(d => [Number(d.lopr), Number(d.hipr)]);
  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const padding = (maxP - minP) * 0.1 || 1;
  const lo = minP - padding;
  const hi = maxP + padding;

  const W = 592;
  const H = 140;
  const pl = { top: 16, bottom: 28, left: 16, right: 72 };
  const cW = W - pl.left - pl.right;
  const cH = H - pl.top - pl.bottom;

  const yS = (v: number) => pl.top + (1 - (v - lo) / (hi - lo)) * cH;

  const gridLines = [0, 1, 2, 3].map(i => ({
    y: pl.top + (i / 3) * cH,
    val: hi - (i / 3) * (hi - lo),
  }));

  const barW = Math.min(52, (cW / days.length) * 0.45);
  const slot = cW / days.length;

  const candles = days.map((d, i) => {
    const x = pl.left + slot * (i + 0.5);
    const open = Number(d.mkp);
    const close = Number(d.clpr);
    const high = Number(d.hipr);
    const low = Number(d.lopr);
    const isUp = close >= open;
    const color = isUp ? '#e8534a' : '#4a90e8';
    const bodyTop = yS(Math.max(open, close));
    const bodyH = Math.max(2, Math.abs(yS(open) - yS(close)));
    return { x, high, low, color, bodyTop, bodyH, label: labels[i] };
  });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full border border-[var(--border)] mb-5"
      style={{ height: H, background: 'var(--surface2)' }}
    >
      {gridLines.map((gl, i) => (
        <g key={i}>
          <line
            x1={pl.left} y1={gl.y}
            x2={W - pl.right} y2={gl.y}
            stroke="#1c1c1c" strokeWidth={1}
          />
          <text
            x={W - pl.right + 6} y={gl.y + 3}
            fill="#3a3a3a"
            fontSize={9}
            fontFamily="var(--font-mono), 'IBM Plex Mono', monospace"
          >
            {formatNum(Math.round(gl.val))}
          </text>
        </g>
      ))}
      {candles.map((c, i) => (
        <g key={i}>
          <line
            x1={c.x} y1={yS(c.high)}
            x2={c.x} y2={yS(c.low)}
            stroke={c.color} strokeWidth={1.5}
          />
          <rect
            x={c.x - barW / 2}
            y={c.bodyTop}
            width={barW}
            height={c.bodyH}
            fill={c.color}
          />
          <text
            x={c.x} y={H - 8}
            fill="#555"
            fontSize={9}
            fontFamily="var(--font-mono), 'IBM Plex Mono', monospace"
            textAnchor="middle"
          >
            {c.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
