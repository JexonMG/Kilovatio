'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DashboardData, Measurement, Apartment } from '@/lib/types';
import { MONTHS } from '@/lib/constants';
import { getInvoiceStatus, formatDueDate, API_URL } from '@/lib/utils';
import StatusBadge from '@/components/StatusBadge';

export default function HomePage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [dash, meas, apts] = await Promise.all([
        fetch(`${API_URL}/api/dashboard`).then(r => r.json()),
        fetch(`${API_URL}/api/measurements`).then(r => r.json()),
        fetch(`${API_URL}/api/apartments`).then(r => r.json()),
      ]);
      setDashboard(dash);
      setMeasurements(Array.isArray(meas) ? meas : []);
      setApartments(Array.isArray(apts) ? apts : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Build overdue alerts from local measurements
  const overdueAlerts = useMemo(() => {
    return measurements
      .filter(m => getInvoiceStatus(m) === 'overdue')
      .sort((a, b) => {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const db = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return da - db;
      })
      .slice(0, 5);
  }, [measurements]);

  const aptName = (id: string) => {
    const s = String(id);
    return apartments.find(a => a.id === s || String(a.id) === s)?.name ?? '—';
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('es-CR', { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading) {
    return (
      <div className="page-content">
        <div className="glass empty-state" style={{ marginTop: '2rem' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚡</div>
          Cargando datos…
        </div>
      </div>
    );
  }

  return (
    <div className="page-content fade-in">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <div className="page-title">⚡ Kilovatio</div>
          <div className="page-subtitle">Panel de control general</div>
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* ── A. Quick Actions ── */}
      <div className="grid-2 mb-6">
        <Link href="/mediciones" style={{ display: 'block' }}>
          <button className="cta-btn cta-btn-primary btn-full">
            <span className="cta-btn-icon">✏️</span>
            <div>
              <div style={{ fontWeight: 700 }}>Realizar nueva medición</div>
              <div style={{ fontSize: '0.82rem', opacity: 0.8, fontWeight: 400, marginTop: '0.15rem' }}>Registrar lectura del medidor</div>
            </div>
          </button>
        </Link>
        <Link href="/apartamentos" style={{ display: 'block' }}>
          <button className="cta-btn cta-btn-secondary btn-full">
            <span className="cta-btn-icon">🏢</span>
            <div>
              <div style={{ fontWeight: 700 }}>Crear nuevo apartamento</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 400, marginTop: '0.15rem' }}>Agregar unidad al sistema</div>
            </div>
          </button>
        </Link>
      </div>

      {/* ── B. Stats Summary ── */}
      <div className="grid-4 mb-6">
        <div className="stat-card">
          <div className="stat-label">Apartamentos</div>
          <div className="stat-value blue">{dashboard?.totalApartments ?? 0}</div>
          <div className="stat-sub">registrados</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pendientes</div>
          <div className="stat-value amber">{dashboard?.pendingInvoices ?? 0}</div>
          <div className="stat-sub">por pagar</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Vencidas</div>
          <div className="stat-value red">{dashboard?.overdueInvoices ?? 0}</div>
          <div className="stat-sub">sin pagar</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pagadas</div>
          <div className="stat-value green">{dashboard?.paidInvoices ?? 0}</div>
          <div className="stat-sub">completadas</div>
        </div>
      </div>

      <div className="grid-2 mb-6">
        {/* ── C. Recent Payments ── */}
        <div className="glass">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div className="section-title" style={{ marginBottom: 0 }}>Últimos pagos</div>
            <Link href="/pagos" style={{ fontSize: '0.82rem', color: 'var(--primary-hover)' }}>Ver todos →</Link>
          </div>
          {dashboard?.recentPayments && dashboard.recentPayments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {dashboard.recentPayments.map((p, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.85rem 1rem', background: 'var(--input-bg)',
                  borderRadius: '10px', border: '1px solid var(--border)', gap: '1rem'
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.apartmentName || '—'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      {MONTHS[(p.month ?? 1) - 1]} {p.year}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '0.95rem' }}>
                      {p.cost != null ? `₡${Number(p.cost).toFixed(2)}` : `${p.consumption ?? 0} kWh`}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      {p.paidAt ? fmt(p.paidAt) : '—'}
                    </div>
                  </div>
                  <span className="status-badge status-paid" style={{ fontSize: '0.72rem' }}>✓ Pagado</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💵</div>
              Aún no hay pagos registrados
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* ── D. Alerts ── */}
          <div className="glass">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div className="section-title" style={{ marginBottom: 0 }}>⚠️ Requieren atención</div>
              <Link href="/pagos" style={{ fontSize: '0.82rem', color: 'var(--primary-hover)' }}>Ir a Pagos →</Link>
            </div>
            {overdueAlerts.length === 0 ? (
              <div style={{
                background: 'var(--success-bg)', border: '1px solid var(--success-border)',
                borderRadius: '10px', padding: '1rem 1.25rem',
                color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem', textAlign: 'center'
              }}>
                🎉 Todo al día — sin facturas vencidas
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {overdueAlerts.map(m => (
                  <div key={m.id} className="alert-card danger" style={{ borderRadius: '8px' }}>
                    <span style={{ fontSize: '1.1rem' }}>🔴</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{aptName(m.apartmentId)}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {MONTHS[m.month - 1]} {m.year}
                        {m.dueDate && ` · Venció: ${formatDueDate(m.dueDate)}`}
                      </div>
                    </div>
                    <span className="status-badge status-overdue" style={{ fontSize: '0.7rem' }}>NO PAGADO</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── E. Tariff ── */}
          <div className="glass">
            <div className="section-title">Tarifa eléctrica actual</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)' }}>
                  {dashboard?.currentTariff && dashboard.currentTariff > 0
                    ? `₡${dashboard.currentTariff.toLocaleString()}`
                    : '—'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  por kWh consumido
                </div>
              </div>
              <Link href="/ajustes">
                <button className="btn btn-secondary" style={{ fontSize: '0.82rem' }}>
                  ⚙️ Modificar
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
