# Candlewise — Candle Prediction App

A mobile-friendly Next.js dashboard for learning about candlesticks and common technical indicators. It currently runs in **demo mode**: prices, candles, and estimates are generated in the browser and are not connected to a live exchange or broker.

## Run locally

1. Install Node.js 20.9 or newer.
2. Clone this repository and run `npm install`.
3. Start the development server with `npm run dev`.
4. Open [http://localhost:3000](http://localhost:3000).

Build for production with `npm run build`, then run `npm start`.

## What is included

- Responsive dark dashboard designed for desktop and Android-sized screens.
- Interactive candlestick chart with 1m, 5m, and 15m sample views.
- Simulated price updates approximately every 2.5 seconds.
- Illustrative UP/DOWN estimate, RSI, EMA, MACD snapshot, and recent candle activity.
- Persistent demo-mode notices and a no-guarantees / educational-use disclaimer.

## Data and risk notice

No live market API is configured. All data and estimates are simulated and are for educational demonstration only; they are not investment advice, trade instructions, or promises of accuracy or profit. A real feed requires a trusted data provider and appropriately secured server-side credentials. Prediction evaluation/backtesting should be built and labeled separately before presenting performance claims.
