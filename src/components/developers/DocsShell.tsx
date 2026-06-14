'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DEVELOPER_NAV } from '@/content/developers';

export default function DocsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ minHeight: '100vh', background: '#050508', color: '#fff' }}>
      <header
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link href="/" style={{ fontWeight: 900, letterSpacing: '0.12em', color: '#fff', textDecoration: 'none' }}>
          <span style={{ color: '#8B5CF6' }}>VES</span>PER <span style={{ opacity: 0.5 }}>DEVELOPERS</span>
        </Link>
        <Link href="/dashboard/settings" className="vesper-btn-outline" style={{ padding: '8px 16px', fontSize: '12px' }}>
          Account Settings → Developer
        </Link>
      </header>
      <div style={{ display: 'flex', maxWidth: '1200px', margin: '0 auto' }}>
        <nav
          style={{
            width: '220px',
            padding: '32px 24px',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            position: 'sticky',
            top: 0,
            alignSelf: 'flex-start',
          }}
        >
          {DEVELOPER_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'block',
                padding: '10px 12px',
                marginBottom: '4px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: pathname === item.href ? '#8B5CF6' : '#A1A1AA',
                background: pathname === item.href ? 'rgba(139,92,246,0.1)' : 'transparent',
                fontWeight: pathname === item.href ? 800 : 500,
                fontSize: '14px',
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <main style={{ flex: 1, padding: '40px 48px', maxWidth: '900px' }}>{children}</main>
      </div>
    </div>
  );
}
