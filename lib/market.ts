export type Timeframe = '1m' | '5m' | '15m';
export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };
export type Prediction = { id: string; createdAt: number; targetTime: number; timeframe: Timeframe; direction: 'UP' | 'DOWN'; probability: number; outcome?: 'UP' | 'DOWN'; correct?: boolean };

export const frameSeconds: Record<Timeframe, number> = { '1m': 60, '5m': 300, '15m': 900 };

export function makeCandles(count: number, timeframe: Timeframe): Candle[] {
  const step = frameSeconds[timeframe];
  const now = Math.floor(Date.now() / 1000 / step) * step;
  let price = 67420;
  const data: Candle[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const open = price;
    const change = (Math.random() - 0.49) * 70;
    const close = Math.max(100, open + change);
    const wick = Math.random() * 25;
    data.push({ time: now - i * step, open, close, high: Math.max(open, close) + wick, low: Math.min(open, close) - wick, volume: 10 + Math.random() * 80 });
    price = close;
  }
  return data;
}

export function estimateUpProbability(candles: Candle[]) {
  if (candles.length < 2) return 50;
  const recent = candles.slice(-8);
  const upCount = recent.filter((candle) => candle.close >= candle.open).length;
  const ema = recent.reduce((sum, candle) => sum + candle.close, 0) / recent.length;
  const last = recent[recent.length - 1];
  return Math.min(78, Math.max(52, Math.round(50 + (upCount - 4) * 4 + (last.close > ema ? 5 : -2))));
}

export function calculateBacktest(candles: Candle[]) {
  let correct = 0;
  let trades = 0;
  for (let i = 12; i < candles.length - 1; i++) {
    const history = candles.slice(i - 12, i);
    const avg = history.reduce((sum, candle) => sum + candle.close, 0) / history.length;
    const signalUp = history[history.length - 1].close >= avg;
    const actualUp = candles[i].close >= candles[i].open;
    if (signalUp === actualUp) correct++;
    trades++;
  }
  return { trades, correct, accuracy: trades ? Math.round((correct / trades) * 100) : 0 };
}
