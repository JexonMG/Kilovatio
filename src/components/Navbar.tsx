'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/',             label: 'Inicio',       icon: '🏠' },
  { href: '/mediciones',   label: 'Mediciones',   icon: '✏️' },
  { href: '/apartamentos', label: 'Apartamentos', icon: '🏢' },
  { href: '/pagos',        label: 'Pagos',        icon: '💵' },
  { href: '/reportes',     label: 'Reportes',     icon: '📊' },
  { href: '/ajustes',      label: 'Ajustes',      icon: '⚙️' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Desktop top bar */}
      <header className="navbar no-print">
        <div className="navbar-inner">
          <Link href="/" className="navbar-logo" onClick={() => setOpen(false)}>
            ⚡ Kilovatio
          </Link>
          <nav className="navbar-links">
            {NAV_ITEMS.map(n => (
              <Link
                key={n.href}
                href={n.href}
                className={`nav-link ${isActive(n.href) ? 'active' : ''}`}
              >
                <span className="nav-link-icon">{n.icon}</span>
                <span>{n.label}</span>
              </Link>
            ))}
          </nav>
          <button
            className="hamburger"
            onClick={() => setOpen(o => !o)}
            aria-label="Menú"
          >
            {open ? (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="4" y1="4" x2="16" y2="16" /><line x1="16" y1="4" x2="4" y2="16" />
              </svg>
            ) : (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="2" y1="5" x2="18" y2="5" /><line x1="2" y1="10" x2="18" y2="10" /><line x1="2" y1="15" x2="18" y2="15" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="mobile-overlay no-print" onClick={() => setOpen(false)} />
      )}
      <aside className={`mobile-drawer no-print ${open ? 'open' : ''}`}>
        <div className="mobile-drawer-brand">
          <Link href="/" className="navbar-logo" onClick={() => setOpen(false)}>
            ⚡ Kilovatio
          </Link>
        </div>
        <nav className="mobile-nav">
          {NAV_ITEMS.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className={`mobile-nav-link ${isActive(n.href) ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <span style={{ fontSize: '1.1rem' }}>{n.icon}</span>
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}

