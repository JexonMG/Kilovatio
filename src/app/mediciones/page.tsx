'use client';

import { useState, useEffect, useMemo } from 'react';
import { Measurement, Apartment, Settings } from '@/lib/types';
import { MONTHS } from '@/lib/constants';
import { getInvoiceStatus, API_URL } from '@/lib/utils';
import StatusBadge from '@/components/StatusBadge';
import PaymentReceipt from '@/components/PaymentReceipt';

export default function MedicionesPage() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [settings, setSettings] = useState<Settings>({ tariff: 0 });
  const [loading, setLoading] = useState(true);

  // Form state
  const [aptId, setAptId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [reading, setReading] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [fApt, setFApt] = useState('all');
  const [fYear, setFYear] = useState('');
  const [fMonth, setFMonth] = useState('');
  const [fStatus, setFStatus] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');

  // Receipt
  const [receipt, setReceipt] = useState<Measurement | null>(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      setLoading(true);
      const [a, s, m] = await Promise.all([
        fetch(`${API_URL}/api/apartments`).then(r => r.json()),
        fetch(`${API_URL}/api/settings`).then(r => r.json()),
        fetch(`${API_URL}/api/measurements`).then(r => r.json()),
      ]);
      const apts = Array.isArray(a) ? a : [];
      setApartments(apts);
      setSettings(s ?? { tariff: 0 });
      setMeasurements(Array.isArray(m) ? m : []);
      if (apts.length > 0 && !aptId) setAptId(apts[0].id);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  // Print effect for receipt
  useEffect(() => {
    if (receipt) document.body.classList.add('receipt-open-print');
    else document.body.classList.remove('receipt-open-print');
    return () => document.body.classList.remove('receipt-open-print');
  }, [receipt]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!aptId || !reading) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/measurements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apartmentId: aptId, year, month, reading: parseFloat(reading) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error === 'Already exists'
          ? 'Ya existe una medición para ese apartamento en ese mes.'
          : 'Error al guardar la medición.');
        return;
      }
      await fetchAll();
      setReading('');
      // Show receipt for the new measurement
      setReceipt(data);
    } catch {
      setError('Error de conexión con el servidor.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta medición? Esta acción no se puede deshacer.')) return;
    await fetch(`${API_URL}/api/measurements/${id}`, { method: 'DELETE' });
    await fetchAll();
  }

  const aptName = (id: string) =>
    apartments.find(a => String(a.id) === String(id))?.name ?? '—';

  // All measurements sorted newest first
  const sorted = useMemo(() =>
    [...measurements].sort((a, b) =>
      a.year !== b.year ? b.year - a.year : b.month - a.month
    ), [measurements]);

  const filtered = useMemo(() => sorted.filter(m => {
    if (fApt !== 'all' && String(m.apartmentId) !== fApt) return false;
    if (fYear && String(m.year) !== fYear) return false;
    if (fMonth && String(m.month) !== fMonth) return false;
    if (fStatus !== 'all' && getInvoiceStatus(m) !== fStatus) return false;
    return true;
  }), [sorted, fApt, fYear, fMonth, fStatus]);

  const totalConsumption = filtered.reduce((s, m) => s + (m.consumption ?? 0), 0);
  const totalCost = filtered.reduce((s, m) => s + (m.cost ?? 0), 0);

  if (loading) return (
    <div className="page-content">
      <div className="glass empty-state" style={{ marginTop: '2rem' }}>Cargando…</div>
    </div>
  );

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Mediciones</div>
          <div className="page-subtitle">Registrar lecturas del medidor eléctrico</div>
        </div>
        <button className="btn btn-secondary no-print" onClick={() => window.print()}>
          🖨️ Imprimir historial
        </button>
      </div>

      <div className="grid-2 mb-6">
        {/* ── Form ── */}
        <div className="glass">
          <div className="section-title">Nueva medición</div>
          {apartments.length === 0 ? (
            <p style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>
              Primero crea un apartamento en la sección{' '}
              <a href="/apartamentos" style={{ color: 'var(--primary-hover)', fontWeight: 700 }}>Apartamentos</a>.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Apartamento</label>
                <select className="form-input" value={aptId} onChange={e => setAptId(e.target.value)}>
                  {apartments.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="grid-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label>Año</label>
                  <input type="number" className="form-input" value={year}
                    onChange={e => setYear(+e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Mes</label>
                  <select className="form-input" value={month} onChange={e => setMonth(+e.target.value)}>
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Lectura del medidor (kWh)</label>
                <input type="number" className="form-input" value={reading}
                  onChange={e => setReading(e.target.value)} step="0.01"
                  placeholder="Ej. 90000" required />
              </div>
              {error && (
                <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.88rem', marginBottom: '1rem' }}>
                  ⚠️ {error}
                </div>
              )}
              <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
                {submitting ? 'Guardando…' : '✏️ Registrar medición'}
              </button>
            </form>
          )}
        </div>

        {/* ── Info ── */}
        <div className="glass">
          <div className="section-title">¿Cómo funciona?</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '1rem' }}>
            El medidor eléctrico es <strong style={{ color: 'var(--text)' }}>acumulativo</strong> y nunca se reinicia a cero.
            El sistema calcula el consumo real restando la lectura anterior de la actual.
          </p>
          <div className="info-box mb-4">
            <div>Mes 1: 85,000 kWh (lectura inicial)</div>
            <div>Mes 2: 90,000 kWh (nueva lectura)</div>
            <div style={{ marginTop: '0.5rem', color: 'var(--success)', fontWeight: 600 }}>
              Consumo real = 5,000 kWh
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <span className="status-badge status-paid">✓ Pagado</span>
              Pago registrado
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <span className="status-badge status-pending">Pendiente</span>
              Sin pagar, dentro del plazo
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <span className="status-badge status-overdue">NO PAGADO</span>
              Vencida (después del día 15)
            </div>
          </div>
        </div>
      </div>

      {/* ── Measurement History ── */}
      <div className="glass">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Historial de mediciones</div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{filtered.length} registros</span>
        </div>

        {/* Filters */}
        <div className="filters-bar no-print">
          <select className="form-input form-input-sm" style={{ width: 'auto' }} value={fApt} onChange={e => setFApt(e.target.value)}>
            <option value="all">Todos los apartamentos</option>
            {apartments.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <input type="number" className="form-input form-input-sm" style={{ width: '110px' }} placeholder="Año" value={fYear} onChange={e => setFYear(e.target.value)} />
          <select className="form-input form-input-sm" style={{ width: 'auto' }} value={fMonth} onChange={e => setFMonth(e.target.value)}>
            <option value="">Todos los meses</option>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select className="form-input form-input-sm" style={{ width: 'auto' }} value={fStatus} onChange={e => setFStatus(e.target.value as typeof fStatus)}>
            <option value="all">Todos los estados</option>
            <option value="paid">Pagados</option>
            <option value="pending">Pendientes</option>
            <option value="overdue">Vencidos</option>
          </select>
          {(fApt !== 'all' || fYear || fMonth || fStatus !== 'all') && (
            <button className="btn btn-danger" onClick={() => { setFApt('all'); setFYear(''); setFMonth(''); setFStatus('all'); }}>
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Estado</th>
                <th>Apartamento</th>
                <th>Período</th>
                <th>Lectura (kWh)</th>
                <th>Consumo</th>
                {settings.tariff > 0 && <th>Costo</th>}
                <th>Vencimiento</th>
                <th className="no-print">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const status = getInvoiceStatus(m);
                return (
                  <tr key={m.id} style={{ opacity: m.paid ? 0.7 : 1 }}>
                    <td><StatusBadge measurement={m} /></td>
                    <td style={{ fontWeight: 600 }}>{aptName(m.apartmentId)}</td>
                    <td>{MONTHS[m.month - 1]} {m.year}</td>
                    <td style={{ fontFamily: 'monospace' }}>{m.reading.toLocaleString()}</td>
                    <td>
                      {m.consumption !== null
                        ? <span className="badge badge-amber">+{m.consumption.toLocaleString()} kWh</span>
                        : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Inicial</span>}
                    </td>
                    {settings.tariff > 0 && (
                      <td style={{ fontWeight: 600, color: 'var(--success)' }}>
                        {m.cost !== null ? `₡${m.cost.toFixed(2)}` : '—'}
                      </td>
                    )}
                    <td style={{ fontSize: '0.82rem' }}>
                      {m.dueDate
                        ? <span style={{ color: status === 'overdue' && !m.paid ? 'var(--danger)' : 'var(--text-muted)' }}>
                          {new Date(m.dueDate).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td className="no-print">
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-success" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                          onClick={() => setReceipt(m)}>
                          🧾 Recibo
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDelete(m.id)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="empty-state">Sin resultados con los filtros actuales.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--border)', fontSize: '1rem', fontWeight: 600, display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <span>Consumo total: <span style={{ color: 'var(--warning)' }}>{totalConsumption.toLocaleString()} kWh</span></span>
            {settings.tariff > 0 && (
              <span>Costo total: <span style={{ color: 'var(--success)' }}>₡{totalCost.toFixed(2)}</span></span>
            )}
          </div>
        )}
      </div>

      {receipt && (
        <PaymentReceipt
          measurement={receipt}
          aptName={aptName(receipt.apartmentId)}
          onClose={() => setReceipt(null)}
        />
      )}
    </div>
  );
}
