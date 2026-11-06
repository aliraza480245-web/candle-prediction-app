# Candlewise — educational candle dashboard

A mobile-friendly Next.js chart dashboard. It supports simulated demo candles and a **read-only public Binance spot market-data feed** for BTC/USDT. It does not connect to Quotex, any broker, or trading account, and cannot place orders. The Quotex-style reference describes only the chart presentation and timeframe controls.

## Run locally

1. Install Node.js 20.9 or newer.
2. Clone this repository and run `npm install`.
3. Run `npm run dev`, then open http://localhost:3000.
4. Check types with `npm run typecheck`; build with `npm run build`.

## Deploy free on Vercel

1. Push this repository to GitHub (the current branch is `main`).
2. Sign in at https://vercel.com using GitHub and authorize Vercel to access `aliraza480245-web/candle-prediction-app`.
3. In Vercel choose **Add New → Project**, import this repository, and keep the detected Next.js framework settings.
4. No environment variables or API keys are required for demo mode or the public Binance candle endpoint.
5. Select **Deploy**. When complete, open the Vercel `.vercel.app` URL in Chrome on Android. Use Chrome's **Add to Home screen** if you want an app-like shortcut; installation is optional.
6. Later commits to `main` trigger automatic redeploys.

## Market data and limitations

The Live toggle requests the app's `/api/market` route, which fetches the latest 100 BTCUSDT klines from Binance's unauthenticated public market API. This is public exchange data, not a guaranteed low-latency feed. Provider availability, regional access and rate limits may vary. If it is unavailable, the UI shows an error; switch to Demo for simulated candles. Never put private credentials in client-side code. No API credentials are used here.

Prediction estimates are simple illustrative heuristics, not validated forecasts. History is kept in local browser storage and results are resolved when the next interval is observed. Backtesting is a small direction-only educational simulation; it excludes fees, spread, slippage, execution, and risk. Percentages and historical match rates are not promises of accuracy or profit and are not investment advice. The app does not interact with Quotex or provide trade execution.
