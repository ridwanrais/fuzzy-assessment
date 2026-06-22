import type { ReactNode } from 'react';
import Link from 'next/link';
import Providers from './providers';

export const metadata = {
  title: 'Mini Outreach Sequencer',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, backgroundColor: '#f8fafc', color: '#0f172a' }}>
        <Providers>
          <nav
            style={{
              display: 'flex',
              gap: 16,
              padding: '16px 32px',
              backgroundColor: '#ffffff',
              borderBottom: '1px solid #e2e8f0',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}
          >
            <Link href="/" style={{ textDecoration: 'none', color: '#334155', fontWeight: 500 }}>Home</Link>
            <Link href="/contacts" style={{ textDecoration: 'none', color: '#334155', fontWeight: 500 }}>Contacts</Link>
            <Link href="/campaigns" style={{ textDecoration: 'none', color: '#334155', fontWeight: 500 }}>Campaigns</Link>
          </nav>
          <main style={{ padding: '32px', maxWidth: 1200, margin: '0 auto' }}>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
