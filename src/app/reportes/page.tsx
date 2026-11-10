'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { MeasurementWithApt, ReportData } from '@/lib/types';
import { MONTHS } from '@/lib/constants';
import { API_URL } from '@/lib/utils';

type Period = 'current' | 'prev' | '3m' | '6m' | '12m' | 'custom';

function getDateRange(period: Period, customStart: string, customEnd: string): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;

  const toISO = (yr: number, mo: number) => `${yr}-${String(mo).padStart(2, '0')}-01`;

  const subtractMonths = (yr: number, mo: number, n: number) => {
    let newMo = mo - n;
    let newYr = yr;
    while (newMo < 1) { newMo += 12; newYr--; }
    return { yr: newYr, mo: newMo };
  };

  switch (period) {
    case 'current':
      return { start: toISO(y, m), end: toISO(y, m) };
    case 'prev': {
      const prev = subtractMonths(y, m, 1);
      return { start: toISO(prev.yr, prev.mo), end: toISO(prev.yr, prev.mo) };
    }
    case '3m': {
      const from = subtractMonths(y, m, 2);
      return { start: toISO(from.yr, from.mo), end: toISO(y, m) };
    }
    case '6m': {
      const from = subtractMonths(y, m, 5);
      return { start: toISO(from.yr, from.mo), end: toISO(y, m) };
    }
    case '12m': {
      const from = subtractMonths(y, m, 11);
      return { start: toISO(from.yr, from.mo), end: toISO(y, m) };
    }
    case 'custom':
      return { start: customStart, end: customEnd };
    default:
      return { start: toISO(y, m), end: toISO(y, m) };
  }
}

const PERIOD_LABELS: Record<Period, string> = {
  current: 'Mes actual',
  prev: 'Mes anterior',
  '3m': 'Últimos 3 meses',
  '6m': 'Últimos 6 meses',
  '12m': 'Últimos 12 meses',
  custom: 'Rango personalizado',
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#f97316'];

export default function ReportesPage() {
  const [period, setPeriod] = useState<Period>('current');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [period, customStart, customEnd]);

  async function fetchReport() {
    if (period === 'custom' && (!customStart || !customEnd)) return;
    setLoading(true);
    try {
      const { start, end } = getDateRange(period, customStart, customEnd);
      const params = new URLSearchParams();
      if (start) params.set('startDate', start);
      if (end) params.set('endDate', end);
      const res = await fetch(`${API_URL}/api/reports?${params.toString()}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Aggregate per apartment (take total consumption per apt)
  const perApartment = useMemo(() => {
    if (!data) return [];
    const map: Record<string, { name: string; consumption: number; cost: number; count: number }> = {};
    data.measurements.forEach(m => {
      const key = String(m.apartmentId);
      if (!map[key]) {
        map[key] = { name: m.apartmentName || key, consumption: 0, cost: 0, count: 0 };
      }
      map[key].consumption += m.consumption ?? 0;
      map[key].cost += m.cost ?? 0;
      map[key].count++;
    });
    return Object.values(map).sort((a, b) => b.consumption - a.consumption);
  }, [data]);

  // Latest measurement per apartment for the table
  const latestPerApt = useMemo(() => {
    if (!data) return [];
    const map: Record<string, MeasurementWithApt> = {};
    data.measurements.forEach(m => {
      const key = String(m.apartmentId);
      if (!map[key] || (m.year * 12 + m.month) > (map[key].year * 12 + map[key].month)) {
        map[key] = m;
      }
    });
    return Object.values(map).sort((a, b) => (b.consumption ?? 0) - (a.consumption ?? 0));
  }, [data]);

  const { start, end } = getDateRange(period, customStart, customEnd);
  const periodLabel = period === 'custom'
    ? `${customStart} — ${customEnd}`
    : PERIOD_LABELS[period];

  const printReport = () => window.print();

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Reportes</div>
          <div className="page-subtitle">Reporte de uso de electricidad</div>
        </div>
        <button className="btn btn-secondary no-print" onClick={printReport}>
          🖨️ Imprimir / PDF
        </button>
      </div>

      {/* ── Period Filters ── */}
      <div className="glass mb-6 no-print">
        <div className="section-title">📅 Período de análisis</div>
        <div className="filters-bar">
          {(['current', 'prev', '3m', '6m', '12m', 'custom'] as Period[]).map(p => (
            <button
              key={p}
              className={`btn ${period === p ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              onClick={() => setPeriod(p)}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div className="grid-2" style={{ gap: '1rem', marginTop: '1rem', maxWidth: '500px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Desde (YYYY-MM-DD)</label>
              <input type="date" className="form-input" value={customStart}
                onChange={e => setCustomStart(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Hasta (YYYY-MM-DD)</label>
              <input type="date" className="form-input" value={customEnd}
                onChange={e => setCustomEnd(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="glass empty-state">Cargando datos del reporte…</div>
      ) : !data || data.measurements.length === 0 ? (
        <div className="glass empty-state">
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📊</div>
          No hay datos para el período seleccionado.
        </div>
      ) : (
        <>
          {/* Print header (only visible on print) */}
          <div style={{ display: 'none' }} className="print-only">
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>⚡ Reporte Uso de Electricidad</h1>
            <div style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Generado el {new Date().toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' })}
              {' · '}Período: {periodLabel}
            </div>
          </div>

          {/* ── Summary ── */}
          <div className="grid-4 mb-6">
            <div className="stat-card">
              <div className="stat-label">Apartamentos</div>
              <div className="stat-value blue">{data.summary.apartmentCount}</div>
              <div className="stat-sub">con mediciones</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Consumo Total</div>
              <div className="stat-value amber">{data.summary.totalConsumption.toLocaleString()}</div>
              <div className="stat-sub">kWh en el período</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Promedio por medición</div>
              <div className="stat-value blue">{Math.round(data.summary.avgConsumption).toLocaleString()}</div>
              <div className="stat-sub">kWh</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Costo Total</div>
              <div className="stat-value green">
                {data.summary.totalCost > 0 ? `₡${data.summary.totalCost.toFixed(2)}` : '—'}
              </div>
              <div className="stat-sub">{data.summary.totalCost > 0 ? 'calculado' : 'tarifa no definida'}</div>
            </div>
          </div>

          {/* ── Chart ── */}
          <div className="glass mb-6">
            <div className="section-title">📊 Comparación de consumo por apartamento</div>
            {perApartment.length === 0 ? (
              <div className="empty-state">Sin datos para graficar.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <div style={{ minWidth: Math.max(600, perApartment.length * 80) + 'px', height: '320px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={perApartment} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis
                        tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                        tickFormatter={v => `${v.toLocaleString()}`}
                        label={{ value: 'kWh', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--surface-solid)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          color: 'var(--text)',
                          fontSize: '0.85rem',
                        }}
                        formatter={(value) => [`${Number(value).toLocaleString()} kWh`, 'Consumo']}
                        labelStyle={{ fontWeight: 700, marginBottom: '0.25rem' }}
                      />
                      <Bar dataKey="consumption" radius={[6, 6, 0, 0]}>
                        {perApartment.map((_, idx) => (
                          <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          <div className="grid-2 mb-6">
            {/* ── Detail Table ── */}
            <div className="glass">
              <div className="section-title">📋 Detalle por apartamento</div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Apartamento</th>
                      <th>Última medición</th>
                      <th>Consumo kWh</th>
                      <th>Monto</th>
                      <th>Tarifa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestPerApt.map((m, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{m.apartmentName || '—'}</td>
                        <td style={{ fontSize: '0.82rem' }}>{MONTHS[(m.month ?? 1) - 1]} {m.year}</td>
                        <td><span className="badge badge-amber">{(m.consumption ?? 0).toLocaleString()} kWh</span></td>
                        <td style={{ color: 'var(--success)', fontWeight: 600 }}>
                          {m.cost != null && m.cost > 0 ? `₡${m.cost.toFixed(2)}` : '—'}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {m.tariffAtCreation > 0 ? `₡${m.tariffAtCreation}/kWh` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Ranking ── */}
            <div className="glass">
              <div className="section-title">🏆 Ranking de consumo</div>
              {perApartment.length === 0 ? (
                <div className="empty-state">Sin datos.</div>
              ) : (
                <>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
                      Mayor consumo
                    </div>
                    {perApartment.slice(0, 5).map((apt, i) => {
                      const max = perApartment[0].consumption;
                      const pct = max > 0 ? (apt.consumption / max) * 100 : 0;
                      return (
                        <div key={i} style={{ marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                            <span style={{ fontWeight: 600 }}>
                              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}{' '}
                              {apt.name}
                            </span>
                            <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
                              {apt.consumption.toLocaleString()} kWh
                            </span>
                          </div>
                          <div style={{ background: 'var(--border)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${pct}%`, height: '100%',
                              background: CHART_COLORS[i % CHART_COLORS.length],
                              borderRadius: '999px', transition: 'width 0.5s ease'
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {perApartment.length > 1 && (
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
                        Menor consumo
                      </div>
                      {[...perApartment].reverse().slice(0, 3).map((apt, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 500 }}>📉 {apt.name}</span>
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                            {apt.consumption.toLocaleString()} kWh
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
