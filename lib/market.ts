export type Timeframe = '1m' | '5m' | '15m';
export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };

const frameSeconds: Record<Timeframe, number> = { '1m': 60, '5m': 300, '15m': 900 };

export function makeCandles(count: number, timeframe: Timeframe): Candle[] {
  const step = frameSeconds[timeframe];
  const now = Math.floor(Date.now() / 1000 / step) * step;
  let price = 67420;
  const data: Candle[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const open = price;
    const change = (Math.random() - 0.48) * 72;
    const close = Math.max(100, open + change);
    const wick = Math.random() * 25;
    data.push({ time: now - i * step, open, close, high: Math.max(open, close) + wick, low: Math.min(open, close) - wick, volume: 10 + Math.random() * 80 });
    price = close;
  }
  return data;
}
