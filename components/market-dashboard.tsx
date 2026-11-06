'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, BookOpen, Clock3, Menu, RefreshCw, ShieldAlert, Signal, Wifi, WifiOff, X } from 'lucide-react';
import CandleChart from '@/components/candle-chart';
import { calculateBacktest, estimateUpProbability, frameSeconds, makeCandles, type Candle, type Prediction, type Timeframe } from '@/lib/market';

const frames: Timeframe[] = ['1m', '5m', '15m'];
const money = (value: number) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
type Mode = 'demo' | 'live';

function getRsi(candles: Candle[]) {
  const recent = candles.slice(-15);
  let gains = 0, losses = 0;
  for (let i = 1; i < recent.length; i++) {
    const diff = recent[i].close - recent[i - 1].close;
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  return losses ? Math.round(100 - 100 / (1 + gains / losses)) : 70;
}
function emaSeries(candles: Candle[], period = 12) {
  if (!candles.length) return [];
  const alpha = 2 / (period + 1);
  let value = candles[0].close;
  return candles.map((candle, index) => {
    if (index) value = alpha * candle.close + (1 - alpha) * value;
    return { time: candle.time, value };
  });
}

export default function MarketDashboard() {
  const [timeframe, setTimeframe] = useState<Timeframe>('1m');
  const [mode, setMode] = useState<Mode>('demo');
  const [candles, setCandles] = useState<Candle[]>(() => makeCandles(100, '1m'));
  const [history, setHistory] = useState<Prediction[]>([]);
  const [page, setPage] = useState<'dashboard' | 'history' | 'backtest'>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [liveStatus, setLiveStatus] = useState('');
  const seenBucket = useRef<number | null>(null);

  const loadLive = useCallback(async () => {
    try {
      const response = await fetch(`/api/market?interval=${timeframe}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Live data unavailable');
      setCandles(data.candles as Candle[]);
      setLiveStatus('Connected to Binance public market data');
    } catch (error) {
      setLiveStatus(error instanceof Error ? error.message : 'Live data unavailable');
    }
  }, [timeframe]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('candlewise-predictions');
      if (stored) setHistory(JSON.parse(stored) as Prediction[]);
    } catch { /* use empty local history when storage is unavailable */ }
  }, []);

  useEffect(() => {
    if (mode === 'live') {
      void loadLive();
      const timer = window.setInterval(() => void loadLive(), 15000);
      return () => window.clearInterval(timer);
    }
    setLiveStatus('Simulated demo feed');
    setCandles(makeCandles(100, timeframe));
    const timer = window.setInterval(() => {
      setCandles((previous) => {
        if (!previous.length) return previous;
        const step = frameSeconds[timeframe];
        const bucket = Math.floor(Date.now() / 1000 / step) * step;
        const last = previous[previous.length - 1];
        if (bucket > last.time) {
          const open = last.close;
          const close = Math.max(100, open + (Math.random() - 0.49) * 30);
          const next = { time: bucket, open, close, high: Math.max(open, close) + Math.random() * 10, low: Math.min(open, close) - Math.random() * 10, volume: Math.random() * 50 };
          return [...previous.slice(-99), next];
        }
        const close = Math.max(100, last.close + (Math.random() - 0.49) * 8);
        return [...previous.slice(0, -1), { ...last, close, high: Math.max(last.high, close), low: Math.min(last.low, close), volume: last.volume + Math.random() }];
      });
    }, 2500);
    return () => window.clearInterval(timer);
  }, [mode, timeframe, loadLive]);

  useEffect(() => {
    if (candles.length < 2) return;
    const latest = candles[candles.length - 1];
    if (seenBucket.current === null) { seenBucket.current = latest.time; return; }
    if (latest.time === seenBucket.current) return;
    seenBucket.current = latest.time;
    const target = latest.time + frameSeconds[timeframe];
    setHistory((previous) => {
      const closed = candles.find((candle) => candle.time === latest.time);
      const resolved = previous.map((entry) => entry.targetTime <= latest.time && !entry.outcome && closed
        ? { ...entry, outcome: closed.close >= closed.open ? 'UP' as const : 'DOWN' as const, correct: entry.direction === (closed.close >= closed.open ? 'UP' : 'DOWN') }
        : entry);
      const probabilityUp = estimateUpProbability(candles.slice(0, -1));
      const next: Prediction = {
        id: `${mode}-${timeframe}-${latest.time}`,
        createdAt: Date.now(), targetTime: target, timeframe,
        direction: probabilityUp >= 56 ? 'UP' : 'DOWN',
        probability: probabilityUp >= 56 ? probabilityUp : 100 - probabilityUp,
      };
      const updated = [next, ...resolved].slice(0, 200);
      try { localStorage.setItem('candlewise-predictions', JSON.stringify(updated)); } catch { /* storage optional */ }
      return updated;
    });
  }, [candles, mode, timeframe]);

  const latest = candles[candles.length - 1];
  const prior = candles[candles.length - 2];
  const upProbability = useMemo(() => estimateUpProbability(candles), [candles]);
  const signalUp = upProbability >= 56;
  const rsi = useMemo(() => getRsi(candles), [candles]);
  const backtest = useMemo(() => calculateBacktest(candles), [candles]);
  const macdPositive = latest && prior ? latest.close - prior.close >= 0 : true;
  const emaData = useMemo(() => emaSeries(candles), [candles]);
  const resolved = history.filter((item) => item.outcome !== undefined);
  const historicAccuracy = resolved.length ? Math.round((resolved.filter((item) => item.correct).length / resolved.length) * 100) : null;

  return (
    <main className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#top"><span className="brand-mark"><BarChart3 size={21} /></span><span>Candle<span className="brand-light">wise</span></span></a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <button className={`nav-item ${page === 'dashboard' ? 'active' : ''}`} onClick={() => { setPage('dashboard'); setMenuOpen(false); }}><Activity size={18} />Dashboard</button>
          <button className={`nav-item ${page === 'history' ? 'active' : ''}`} onClick={() => { setPage('history'); setMenuOpen(false); }}><Clock3 size={18} />Prediction history</button>
          <button className={`nav-item ${page === 'backtest' ? 'active' : ''}`} onClick={() => { setPage('backtest'); setMenuOpen(false); }}><Signal size={18} />Backtesting</button>
        </nav>
        <div className="sidebar-bottom"><div className="learning-card"><BookOpen size={17} /><strong>Learning first</strong><p>Signals are estimates for educational use, not trade instructions.</p></div><div className="profile"><div className="avatar">D</div><div><strong>Personal workspace</strong><small>Market chart preview</small></div></div></div>
      </aside>

      <section className="main-area" id="top">
        <header className="topbar"><button className="icon-button menu-button" aria-label="Toggle navigation" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button><div className="breadcrumb">Workspace <span>/</span> <b>{page === 'dashboard' ? 'Dashboard' : page === 'history' ? 'Prediction history' : 'Backtesting'}</b></div><div className="topbar-right"><span className={`market-status ${mode}`}><i />{mode === 'live' ? 'Live data' : 'Demo mode'}</span><div className="top-avatar">D</div></div></header>
        <div className="content">
          <div className="page-heading"><div><div className="eyebrow">BTC / USD <span className="heading-separator">·</span> {mode === 'live' ? 'PUBLIC MARKET FEED' : 'SIMULATED FEED'}</div><h1>{page === 'dashboard' ? 'Market dashboard' : page === 'history' ? 'Prediction history' : 'Backtesting results'}</h1><p className="subheading">A clear market view, designed for learning.</p></div><div className="mode-switch" aria-label="Data mode"><button className={mode === 'demo' ? 'selected' : ''} onClick={() => setMode('demo')}>Demo</button><button className={mode === 'live' ? 'selected' : ''} onClick={() => setMode('live')}>Live</button></div></div>
          <div className={`mode-notice ${mode}`}><span className="notice-icon">{mode === 'live' ? <Wifi size={18} /> : <ShieldAlert size={18} />}</span><div><strong>{mode === 'live' ? 'Live public market data' : 'Demo mode is on'}</strong><p>{mode === 'live' ? `${liveStatus || 'Connecting…'} · Market data only; no broker or order connection.` : 'Simulated candles and estimates only. No account or exchange connection is active.'}</p></div><span className="demo-tag">{mode === 'live' ? 'MARKET DATA' : 'SIMULATED'}</span></div>

          {page === 'dashboard' && <>
            <div className="market-heading"><div className="asset-title"><div className="coin-icon">₿</div><div><div className="asset-name">Bitcoin <span>BTC / USDT</span></div><div className="asset-sub">Bitcoin · US Dollar Tether <span>•</span> {mode === 'live' ? 'Binance public spot feed' : 'Simulated market'}</div></div></div><span className="feed-label">{mode === 'live' ? <Wifi size={14} /> : <WifiOff size={14} />}{mode === 'live' ? 'PUBLIC FEED' : 'DEMO FEED'}</span></div>
            <div className="stats-grid"><section className="stat-card price-card"><div className="stat-label">CURRENT PRICE</div><div className="price-line"><strong>{latest ? `$${money(latest.close)}` : '—'}</strong><span className={`change-pill ${latest && prior && latest.close >= prior.close ? 'positive' : 'negative'}`}>{latest && prior && latest.close >= prior.close ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{latest && prior ? money(Math.abs(latest.close - prior.close)) : '—'}</span></div><div className="stat-foot">{mode === 'live' ? 'Provider updates approximately every 15 sec' : 'Simulated price updates every 2.5 sec'}</div></section>
              <SignalCard type="BUY" active={signalUp} probability={upProbability} />
              <SignalCard type="SELL" active={!signalUp} probability={100 - upProbability} />
            </div>
            <div className="dashboard-grid"><section className="panel chart-panel" id="chart"><div className="panel-header chart-header"><div><h2>Advanced candle chart</h2><p>Quotex-style chart layout · {mode === 'live' ? 'BTCUSDT public candles' : 'simulated candles'}</p></div><div className="timeframe-control" role="group" aria-label="Chart timeframe">{frames.map((frame) => <button key={frame} onClick={() => setTimeframe(frame)} className={timeframe === frame ? 'selected' : ''} aria-pressed={timeframe === frame}>{frame}</button>)}</div></div><div className="chart-legend"><span><i className="legend-candle" />Candles</span><span><i className="legend-ema" />EMA 12</span><span className="chart-live"><i />{mode === 'live' ? 'EXCHANGE DATA' : 'DEMO DATA'}</span></div><CandleChart candles={candles} ema={emaData} /><div className="chart-footer"><span>Interactive chart · {timeframe} timeframe</span><span>{candles.length} candles</span></div></section>
              <section className="panel indicators-panel"><div className="panel-header"><div><h2>Indicator snapshot</h2><p>Common technical indicators</p></div><Activity size={17} /></div><div className="indicator-row"><div className="indicator-symbol rsi-symbol">R</div><div className="indicator-info"><div><strong>RSI <span>(14)</span></strong><small>Relative strength</small></div><b className={rsi > 70 ? 'text-red' : rsi < 30 ? 'text-green' : ''}>{rsi}</b></div><div className="indicator-meter"><i style={{ left: `${rsi}%` }} /></div><div className="indicator-status"><span>{rsi > 70 ? 'Overbought zone' : rsi < 30 ? 'Oversold zone' : 'Neutral range'}</span><span>0 ─ 50 ─ 100</span></div></div><Indicator label="EMA (12)" description="Exponential moving average" value={latest && emaData.length ? `$${money(emaData[emaData.length - 1].value)}` : '—'} positive={!!latest && !!emaData.length && latest.close >= emaData[emaData.length - 1].value} /><Indicator label="MACD" description="Short-term momentum" value={macdPositive ? 'Positive' : 'Negative'} positive={macdPositive} /><div className="indicator-note">Indicators summarize past prices; they do not predict outcomes.</div></section></div>
            <div className="bottom-grid"><BacktestSummary trades={backtest.trades} accuracy={backtest.accuracy} /><HistorySummary history={history.slice(0, 5)} mode={mode} setPage={setPage} /></div>
          </>}

          {page === 'history' && <section className="panel history-page"><div className="panel-header"><div><h2>Recorded candle estimates</h2><p>Stored in this browser on this device. Resolved results compare the estimate with the following candle direction.</p></div><button className="quiet-button" onClick={() => { setHistory([]); localStorage.removeItem('candlewise-predictions'); }}><X size={14} />Clear history</button></div><div className="history-stats"><div><span>RECORDED</span><strong>{history.length}</strong></div><div><span>RESOLVED</span><strong>{resolved.length}</strong></div><div><span>OBSERVED HIT RATE</span><strong>{historicAccuracy === null ? '—' : `${historicAccuracy}%`}</strong></div></div><p className="history-caveat">Observed hit rate is descriptive only, may use a small sample, and is not evidence of future performance.</p><div className="history-table-wrap"><table><thead><tr><th>TIME</th><th>FRAME</th><th>ESTIMATE</th><th>PROBABILITY</th><th>RESULT</th></tr></thead><tbody>{history.map((item) => <tr key={item.id}><td>{new Date(item.createdAt).toLocaleString()}</td><td>{item.timeframe}</td><td><span className={`direction-badge ${item.direction === 'UP' ? 'direction-up' : 'direction-down'}`}>{item.direction}</span></td><td>{item.probability}%</td><td>{item.outcome ? <span className={`result ${item.correct ? 'text-green' : 'text-red'}`}>{item.correct ? 'Correct' : 'Incorrect'} · {item.outcome}</span> : <span className="pending">Pending</span>}</td></tr>)}</tbody></table>{!history.length && <div className="empty-state">No predictions recorded yet. New entries are added when a candle interval changes.</div>}</div></section>}

          {page === 'backtest' && <section className="panel backtest-page"><div className="panel-header"><div><h2>Historical rule simulation</h2><p>Simple walk-forward close-vs-average rule applied to the candles currently loaded in the chart.</p></div><button className="quiet-button" onClick={() => mode === 'live' ? void loadLive() : setCandles(makeCandles(100, timeframe))}><RefreshCw size={14} />Refresh sample</button></div><div className="backtest-stats"><div><span>OBSERVATIONS</span><strong>{backtest.trades}</strong></div><div><span>HISTORICAL MATCH RATE</span><strong>{backtest.trades ? `${backtest.accuracy}%` : '—'}</strong></div><div><span>DATA MODE</span><strong>{mode === 'live' ? 'Live feed' : 'Demo'}</strong></div></div><div className="backtest-explanation"><ShieldAlert size={18} /><div><strong>Important limitations</strong><p>This is a toy direction-only simulation, not a financial backtest. It excludes fees, spreads, slippage, execution timing and risk sizing. Demo candles are random. Live results use only the limited chart sample. Historical match rate is not a forecast and does not demonstrate profitability.</p></div></div><div className="backtest-method"><h3>Method</h3><ol><li>Walk through available candles in chronological order.</li><li>Compare the most recent close with a 12-candle mean to pick UP or DOWN.</li><li>Compare the rule direction to the next candle's open-to-close direction.</li></ol><p>Use a large, clean, out-of-sample dataset and independent review before making any performance claims.</p></div></section>}

          <footer className="disclaimer"><ShieldAlert size={15} /><span>Educational market-data tool only. No guaranteed accuracy or profits; not investment advice or a broker.</span></footer>
        </div>
      </section>
    </main>
  );
}

function SignalCard({ type, active, probability }: { type: 'BUY' | 'SELL'; active: boolean; probability: number }) {
  const buy = type === 'BUY';
  return <section className={`stat-card signal-card ${buy ? 'buy-card' : 'sell-card'} ${active ? 'signal-active' : ''}`}><div className="signal-top"><span className="stat-label">{buy ? 'BULLISH BIAS' : 'BEARISH BIAS'}</span><span className={`signal-dot ${buy ? 'green' : 'red'}`} /></div><div className={`signal-title ${buy ? 'text-green' : 'text-red'}`}>{buy ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}{type}<span className="bias-label">{active ? 'Current estimate' : 'Inactive'}</span></div><div className="probability-row"><span>Illustrative probability</span><strong>{probability}%</strong></div><div className="probability-track"><i className={buy ? 'buy-track' : 'sell-track'} style={{ width: `${probability}%` }} /></div><small className="signal-disclaimer">Not a trade instruction</small></section>;
}
function Indicator({ label, description, value, positive }: { label: string; description: string; value: string; positive: boolean }) {
  return <div className="indicator-row compact-indicator"><div className={`indicator-symbol ${label.startsWith('EMA') ? 'ema-symbol' : 'macd-symbol'}`}>{label[0]}</div><div className="indicator-info"><div><strong>{label}</strong><small>{description}</small></div><b className={positive ? 'text-green' : 'text-red'}>{value}</b></div></div>;
}
function BacktestSummary({ trades, accuracy }: { trades: number; accuracy: number }) {
  return <section className="panel summary-card"><div><h2>Backtest snapshot</h2><p>Simple direction-only historical simulation</p></div><div className="summary-numbers"><div><strong>{trades}</strong><span>observations</span></div><div><strong>{trades ? `${accuracy}%` : '—'}</strong><span>match rate</span></div></div><small>Not a live performance claim. See methodology & limitations in Backtesting.</small></section>;
}
function HistorySummary({ history, mode, setPage }: { history: Prediction[]; mode: Mode; setPage: (page: 'dashboard' | 'history' | 'backtest') => void }) {
  return <section className="panel summary-card"><div className="panel-header"><div><h2>Recent estimates</h2><p>{mode === 'live' ? 'Live-feed estimates' : 'Demo estimates'}</p></div><button className="text-button" onClick={() => setPage('history')}>Full history →</button></div>{history.length ? history.slice(0, 4).map((item) => <div className="recent-row" key={item.id}><span>{new Date(item.createdAt).toLocaleTimeString()}</span><b className={item.direction === 'UP' ? 'text-green' : 'text-red'}>{item.direction}</b><span>{item.probability}%</span><span>{item.outcome ? (item.correct ? 'Correct' : 'Incorrect') : 'Pending'}</span></div>) : <div className="empty-small">History begins when a new candle interval starts.</div>}</section>;
}
