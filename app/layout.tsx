import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Candlewise — Market demo dashboard',
  description: 'A beginner-friendly candle analysis dashboard. Demo data only; not financial advice.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
