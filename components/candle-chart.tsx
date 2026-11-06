'use client';

import { useEffect, useRef } from 'react';
import { CandlestickSeries, ColorType, createChart, LineSeries, type IChartApi, type ISeriesApi, type Time, type CandlestickData, type LineData } from 'lightweight-charts';
import type { Candle } from '@/lib/market';

export default function CandleChart({ candles, ema }: { candles: Candle[]; ema: number }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const emaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    const chart = createChart(hostRef.current, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: '#111820' }, textColor: '#758391', fontFamily: 'Inter, ui-sans-serif, system-ui', fontSize: 11 },
      grid: { vertLines: { color: '#1b252e' }, horzLines: { color: '#1b252e' } },
      rightPriceScale: { borderColor: '#26313b' },
      timeScale: { borderColor: '#26313b', timeVisible: true, secondsVisible: false, rightOffset: 3 },
      crosshair: { vertLine: { color: '#647384', labelBackgroundColor: '#26313b' }, horzLine: { color: '#647384', labelBackgroundColor: '#26313b' } },
    });
    chartRef.current = chart;
    candleSeriesRef.current = chart.addSeries(CandlestickSeries, { upColor: '#26c995', downColor: '#f06572', borderUpColor: '#26c995', borderDownColor: '#f06572', wickUpColor: '#26c995', wickDownColor: '#f06572' });
    emaSeriesRef.current = chart.addSeries(LineSeries, { color: '#b99af6', lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
    const observer = new ResizeObserver(() => chart.timeScale().fitContent());
    observer.observe(hostRef.current);
    return () => { observer.disconnect(); chart.remove(); chartRef.current = null; candleSeriesRef.current = null; emaSeriesRef.current = null; };
  }, []);

  useEffect(() => {
    const candleSeries = candleSeriesRef.current;
    const emaSeries = emaSeriesRef.current;
    if (!candleSeries || !emaSeries || !candles.length) return;
    const candleData: CandlestickData<Time>[] = candles.map((candle) => ({ time: candle.time as Time, open: candle.open, high: candle.high, low: candle.low, close: candle.close }));
    candleSeries.setData(candleData);
    let value = candles[0].close;
    const alpha = 2 / 13;
    const emaData: LineData<Time>[] = candles.map((candle) => {
      value = alpha * candle.close + (1 - alpha) * value;
      return { time: candle.time as Time, value };
    });
    emaSeries.setData(emaData);
    chartRef.current?.timeScale().fitContent();
  }, [candles, ema]);

  return <div className="chart-canvas" ref={hostRef} aria-label="Interactive demo candlestick chart" />;
}
