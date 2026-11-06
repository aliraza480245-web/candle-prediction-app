import { NextResponse } from 'next/server';

const intervals = new Set(['1m', '5m', '15m']);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const interval = searchParams.get('interval') ?? '1m';
  if (!intervals.has(interval)) {
    return NextResponse.json({ error: 'Supported intervals are 1m, 5m, and 15m.' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=100`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Market provider returned ${response.status}`);
    const rows: unknown[][] = await response.json();
    const candles = rows.map((row) => ({
      time: Math.floor(Number(row[0]) / 1000),
      open: Number(row[1]),
      high: Number(row[2]),
      low: Number(row[3]),
      close: Number(row[4]),
      volume: Number(row[5]),
    }));
    return NextResponse.json({ symbol: 'BTCUSDT', provider: 'Binance public market data', candles }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch {
    return NextResponse.json({ error: 'Live market data is temporarily unavailable.' }, { status: 502 });
  }
}
