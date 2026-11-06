'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, Bell, ChevronDown, CircleHelp, Clock3, Menu, Settings2, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';
import CandleChart from '@/components/candle-chart';
import { makeCandles, type Candle, type Timeframe } from '@/lib/market';

const frames: Timeframe[] = ['1m', '5m', '15m'];
const money = (value: number) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function getRsi(candles: Candle[]) {
  const recent = candles.slice(-15);
  let gains = 0;
  let losses = 0;
  for (let i = 1; i < recent.length; i++) {
    const diff = recent[i].close - recent[i - 1].close;
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  if (!losses) return 70;
  return Math.round(100 - 100 / (1 + gains / losses));
}

function average(candles: Candle[], period: number) {
  const tail = candles.slice(-period);
  return tail.reduce((sum, candle) => sum + candle.close, 0) / Math.max(tail.length, 1);
}

export default function MarketDashboard() {
  const [timeframe, setTimeframe] = useState<Timeframe>('1m');
  const [candles, setCandles] = useState<Candle[]>(() => makeCandles(80, '1m'));
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    setCandles(makeCandles(80, timeframe));
  }, [timeframe]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCandles((previous) => {
        if (!previous.length) return previous;
        const last = previous[previous.length - 1];
        const nextPrice = Math.max(100, last.close + (Math.random() - 0.49) * 32);
        const next = { ...last, high: Math.max(last.high, nextPrice), low: Math.min(last.low, nextPrice), close: nextPrice, volume: last.volume + Math.random() * 2 };
        return [...previous.slice(0, -1), next];
      });
    }, 2500);
    return () => window.clearInterval(timer);
  }, []);

  const latest = candles[candles.length - 1];
  const prior = candles[candles.length - 2];
  const delta = latest && prior ? latest.close - prior.close : 0;
  const bullish = delta >= 0;
  const rsi = useMemo(() => getRsi(candles), [candles]);
  const ema = useMemo(() => average(candles, 12), [candles]);
  const recent = candles.slice(-8);
  const upCount = recent.filter((candle) => candle.close >= candle.open).length;
  const upProbability = Math.min(78, Math.max(52, 50 + (upCount - 4) * 4 + (latest && latest.close > ema ? 5 : -2)));
  const predictionUp = upProbability >= 56;
  const history = candles.slice(-5).reverse();

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#top" aria-label="Candlewise home"><span className="brand-mark"><BarChart3 size={21} /></span><span>Candle<span className="brand-light">wise</span></span></a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <a className="nav-item active" href="#dashboard"><Activity size={18} />Dashboard</a>
          <a className="nav-item" href="#chart"><TrendingUp size={18} />Live chart<span className="nav-live-dot" /></a>
          <a className="nav-item" href="#history"><Clock3 size={18} />Signal history</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="learning-card"><div className="learning-icon"><Sparkles size={16} /></div><strong>New to trading?</strong><p>Learn how indicators work before using signals.</p><a href="#learn">Explore quick guide <span>↗</span></a></div>
          <a className="nav-item muted" href="#settings"><Settings2 size={18} />Settings</a>
          <div className="profile"><div className="avatar">D</div><div><strong>Demo workspace</strong><small>Free preview</small></div><ChevronDown size={16} className="profile-chevron" /></div>
        </div>
      </aside>

      <section className="main-area" id="top">
        <header className="topbar">
          <button className="icon-button menu-button" aria-label="Toggle navigation" onClick={() => setMobileMenu((open) => !open)}><Menu size={20} /></button>
          <div className="breadcrumb">Workspace <span>/</span> <b>Dashboard</b></div>
          <div className="topbar-right"><span className="market-status"><i />Demo market</span><button className="icon-button notification" aria-label="Notifications"><Bell size={18} /><i /></button><div className="top-avatar">D</div></div>
        </header>

        <div className="content" id="dashboard">
          <div className="page-heading"><div><div className="eyebrow">MARKET OVERVIEW <span className="heading-separator">·</span> DEMO</div><h1>Your trading dashboard</h1><p className="subheading">A clear view of the market, made for learning.</p></div><button className="outline-button"><CircleHelp size={16} />How it works</button></div>
          <div className="demo-notice"><span className="notice-icon"><ShieldAlert size={18} /></span><div><strong>Demo mode is on</strong><p>Prices and signals are simulated for demonstration. Connect a market data provider to view live data.</p></div><span className="demo-tag">SIMULATED</span></div>

          <div className="market-heading"><div className="asset-title"><div className="coin-icon">₿</div><div><div className="asset-name">Bitcoin <span>BTC / USD</span></div><div className="asset-sub">Bitcoin · US Dollar <span className="dot-separator">•</span> Spot market</div></div></div><button className="asset-select">BTC / USD <ChevronDown size={15} /></button></div>

          <div className="stats-grid">
            <section className="stat-card price-card"><div className="stat-label">CURRENT PRICE <span className="live-pulse" /></div><div className="price-line"><strong>${latest ? money(latest.close) : '—'}</strong><span className={`change-pill ${bullish ? 'positive' : 'negative'}`}>{bullish ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{Math.abs(delta).toFixed(2)} <small>({bullish ? '+' : '-'}0.42%)</small></span></div><div className="stat-foot">Simulated price <span>·</span> updates every 2.5 sec</div></section>
            <section className="stat-card"><div className="stat-label">MARKET TREND <span className="tiny-info">i</span></div><div className="trend-value"><span className={`trend-dot ${bullish ? 'green' : 'red'}`} />{bullish ? 'Bullish' : 'Bearish'}<span className="trend-caption">short-term</span></div><div className="mini-bars" aria-hidden="true">{recent.map((candle, index) => <i key={index} className={candle.close >= candle.open ? 'bar-up' : 'bar-down'} style={{ height: `${18 + (index % 4) * 4}px` }} />)}</div></section>
            <section className="stat-card prediction-card"><div className="stat-label">NEXT CANDLE ESTIMATE <span className="tiny-info">i</span></div><div className={`prediction-value ${predictionUp ? 'text-green' : 'text-red'}`}><span className="prediction-arrow">{predictionUp ? '↗' : '↘'}</span>{predictionUp ? 'UP' : 'DOWN'}<span className="estimate-pill">DEMO ESTIMATE</span></div><div className="probability-row"><span>Estimated probability</span><strong>{predictionUp ? upProbability : 100 - upProbability}%</strong></div><div className="probability-track"><i style={{ width: `${predictionUp ? upProbability : 100 - upProbability}%` }} /></div></section>
          </div>

          <div className="dashboard-grid">
            <section className="panel chart-panel" id="chart">
              <div className="panel-header chart-header"><div><h2>Price action</h2><p>BTC / USD <span>·</span> Demo feed</p></div><div className="timeframe-control" role="group" aria-label="Chart timeframe">{frames.map((frame) => <button key={frame} onClick={() => setTimeframe(frame)} className={timeframe === frame ? 'selected' : ''} aria-pressed={timeframe === frame}>{frame}</button>)}</div></div>
              <div className="chart-legend"><span><i className="legend-candle" />Candles</span><span><i className="legend-ema" />EMA 12</span><span className="chart-live"><i />SIMULATED FEED</span></div>
              <CandleChart candles={candles} ema={ema} />
              <div className="chart-footer"><span>Chart updates automatically <i>·</i> {timeframe} view</span><span>Sample data only</span></div>
            </section>
            <section className="panel indicators-panel"><div className="panel-header"><div><h2>Indicator snapshot</h2><p>Simple tools, helpful context</p></div><button className="more-button" aria-label="Indicator settings"><Settings2 size={17} /></button></div>
              <div className="indicator-row"><div className="indicator-symbol rsi-symbol">R</div><div className="indicator-info"><div><strong>RSI <span>(14)</span></strong><small>Relative strength</small></div><b className={rsi > 70 ? 'text-red' : rsi < 30 ? 'text-green' : ''}>{rsi}</b></div><div className="indicator-meter"><i className={rsi > 70 ? 'meter-red' : rsi < 30 ? 'meter-green' : ''} style={{ left: `${rsi}%` }} /></div><div className="indicator-status"><span>{rsi > 70 ? 'Overbought zone' : rsi < 30 ? 'Oversold zone' : 'Neutral range'}</span><span className="meter-labels"><i>0</i><i>50</i><i>100</i></span></div></div>
              <div className="indicator-row compact-indicator"><div className="indicator-symbol ema-symbol">E</div><div className="indicator-info"><div><strong>EMA <span>(12)</span></strong><small>Exponential moving avg.</small></div><b className="indicator-number">${money(ema)}</b></div><div className="indicator-badge">{latest && latest.close >= ema ? 'Above EMA' : 'Below EMA'}</div></div>
              <div className="indicator-row compact-indicator"><div className="indicator-symbol macd-symbol">M</div><div className="indicator-info"><div><strong>MACD</strong><small>Momentum indicator</small></div><b className={bullish ? 'text-green' : 'text-red'}>{bullish ? 'Positive' : 'Negative'}</b></div><div className="macd-bars"><i className="macd-positive" /><i className="macd-positive" /><i className="macd-negative" /><i className="macd-negative" /><i className="macd-positive" /></div></div>
              <div className="indicator-note"><CircleHelp size={14} />Indicators are calculated from simulated candles.</div>
            </section>
          </div>

          <section className="panel history-panel" id="history"><div className="panel-header"><div><h2>Recent candle activity</h2><p>Latest simulated price movements</p></div><button className="text-button">View history <span>→</span></button></div><div className="history-table-wrap"><table><thead><tr><th>TIME</th><th>OPEN</th><th>CLOSE</th><th>CHANGE</th><th>DIRECTION</th></tr></thead><tbody>{history.map((candle, index) => {const up = candle.close >= candle.open; return <tr key={`${candle.time}-${index}`}><td>{index === 0 ? 'Now' : `${index * 2} sec ago`}</td><td>${money(candle.open)}</td><td>${money(candle.close)}</td><td className={up ? 'text-green' : 'text-red'}>{up ? '+' : '−'}${Math.abs(candle.close - candle.open).toFixed(2)}</td><td><span className={`direction-badge ${up ? 'direction-up' : 'direction-down'}`}>{up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{up ? 'UP' : 'DOWN'}</span></td></tr>;})}</tbody></table></div></section>
          <footer className="disclaimer"><ShieldAlert size={15} /><span>For education only. Demo data and estimates are not financial advice and do not guarantee future results.</span><a href="#learn">Learn about risk</a></footer>
        </div>
      </section>
    </main>
  );
}
