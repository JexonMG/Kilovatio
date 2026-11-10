'use client';

import { useState, useEffect, useMemo } from 'react';
import { Measurement, Apartment } from '@/lib/types';
import { MONTHS } from '@/lib/constants';
import { getInvoiceStatus, API_URL } from '@/lib/utils';
import StatusBadge from '@/components/StatusBadge';
import PaymentReceipt from '@/components/PaymentReceipt';

export default function PagosPage() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected apartment for payment
  const [selectedAptId, setSelectedAptId] = useState('');
  const [selectedMeasId, setSelectedMeasId] = useState('');
  const [paying, setPaying] = useState(false);

  // Receipt modal after payment
  const [receipt, setReceipt] = useState<Measurement | null>(null);

  // History filter
  const [historyAptId, setHistoryAptId] = useState('all');

  useEffect(() => { fetchAll(); }, []);

  // Print effect
  useEffect(() => {
    if (receipt) document.body.classList.add('receipt-open-print');
    else document.body.classList.remove('receipt-open-print');
    return () => document.body.classList.remove('receipt-open-print');
  }, [receipt]);

  async function fetchAll() {
    try {
      setLoading(true);
      const [a, m] = await Promise.all([
        fetch(`${API_URL}/api/apartments`).then(r => r.json()),
        fetch(`${API_URL}/api/measurements`).then(r => r.json()),
      ]);
      const apts = Array.isArray(a) ? a : [];
      setApartments(apts);
      setMeasurements(Array.isArray(m) ? m : []);
      if (apts.length > 0 && !selectedAptId) setSelectedAptId(apts[0].id);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  // ── Unpaid invoices for the selected apartment ──
  // CRITICAL FIX: filter STRICTLY by apartmentId
  const unpaidForApt = useMemo(() => {
    if (!selectedAptId) return [];
    return measurements
      .filter(m => {
        const aptMatch = String(m.apartmentId) === String(selectedAptId);
        const isUnpaid = !m.paid;
        const hasConsumption = m.consumption !== null;
        return aptMatch && isUnpaid && hasConsumption;
      })
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
  }, [measurements, selectedAptId]);

  // Auto-select first unpaid when apartment changes
  useEffect(() => {
    if (unpaidForApt.length > 0) {
      setSelectedMeasId(unpaidForApt[0].id);
    } else {
      setSelectedMeasId('');
    }
  }, [unpaidForApt]);

  const selectedApt = apartments.find(a => String(a.id) === String(selectedAptId));
  const selectedMeas = measurements.find(m => m.id === selectedMeasId);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMeasId) return;
    setPaying(true);
    try {
      const res = await fetch(`${API_URL}/api/measurements/${selectedMeasId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paid: true }),
      });
      if (res.ok) {
        const updated = await res.json();
        await fetchAll();
        // Show receipt with the returned measurement (has paidAt set by server)
        setReceipt(updated);
      }
    } finally {
      setPaying(false);
    }
  }

  // ── Payment history ──
  const paidMeasurements = useMemo(() => {
    return measurements
      .filter(m => {
        if (!m.paid) return false;
        if (historyAptId !== 'all' && String(m.apartmentId) !== historyAptId) return false;
        return true;
      })
      .sort((a, b) => {
        const da = a.paidAt ? new Date(a.paidAt).getTime() : 0;
        const db = b.paidAt ? new Date(b.paidAt).getTime() : 0;
        return db - da;
      });
  }, [measurements, historyAptId]);

  const aptName = (id: string) =>
    apartments.find(a => String(a.id) === String(id))?.name ?? '—';

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('es-CR', { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading) return (
    <div className="page-content"><div className="glass empty-state" style={{ marginTop: '2rem' }}>Cargando…</div></div>
  );

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Pagos</div>
          <div className="page-subtitle">Registrar y consultar pagos de electricidad</div>
        </div>
      </div>

      <div className="grid-2 mb-6">
        {/* ── Payment Form ── */}
        <div className="glass">
          <div className="section-title">Registrar pago</div>
          {apartments.length === 0 ? (
            <div className="empty-state">No hay apartamentos registrados.</div>
          ) : (
            <form onSubmit={handlePay}>
              <div className="form-group">
                <label>Apartamento</label>
                <select className="form-input" value={selectedAptId}
                  onChange={e => setSelectedAptId(e.target.value)}>
                  {apartments.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              {selectedApt && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'var(--input-bg)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Medidor</div>
                    <div style={{ fontWeight: 700 }}>{selectedApt.meter || '—'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Fecha habitual de pago</div>
                    <div style={{ fontWeight: 700 }}>{selectedApt.paymentDate || '—'}</div>
                  </div>
                </div>
              )}

              {unpaidForApt.length === 0 ? (
                <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', color: 'var(--success)', padding: '1.25rem', borderRadius: '8px', textAlign: 'center', fontWeight: 600, fontSize: '1rem' }}>
                  🎉 ¡Pagos al día!<br />
                  <span style={{ fontSize: '0.82rem', fontWeight: 400, marginTop: '0.25rem', display: 'block' }}>
                    Este apartamento no tiene facturas pendientes.
                  </span>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label>Factura pendiente</label>
                    <select className="form-input" value={selectedMeasId}
                      onChange={e => setSelectedMeasId(e.target.value)}>
                      {unpaidForApt.map(m => {
                        const status = getInvoiceStatus(m);
                        const statusLabel = status === 'overdue' ? ' ⚠️ VENCIDA' : '';
                        const costText = m.cost != null ? ` · ₡${m.cost.toFixed(2)}` : '';
                        return (
                          <option key={m.id} value={m.id}>
                            {MONTHS[m.month - 1]} {m.year}{costText}{statusLabel}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {selectedMeas && (
                    <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                        <div>
                          <div style={{ color: 'var(--text-muted)' }}>Período</div>
                          <div style={{ fontWeight: 700 }}>{MONTHS[selectedMeas.month - 1]} {selectedMeas.year}</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)' }}>Consumo</div>
                          <div style={{ fontWeight: 700 }}>{selectedMeas.consumption?.toLocaleString()} kWh</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)' }}>Tarifa aplicada</div>
                          <div style={{ fontWeight: 700 }}>
                            {selectedMeas.tariffAtCreation > 0 ? `₡${selectedMeas.tariffAtCreation}/kWh` : '—'}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)' }}>Total a pagar</div>
                          <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1rem' }}>
                            {selectedMeas.cost != null ? `₡${selectedMeas.cost.toFixed(2)}` : '—'}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)' }}>Vencimiento</div>
                          <div style={{ fontWeight: 700, color: getInvoiceStatus(selectedMeas) === 'overdue' ? 'var(--danger)' : 'var(--text)' }}>
                            {selectedMeas.dueDate
                              ? new Date(selectedMeas.dueDate).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '—'}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)' }}>Estado</div>
                          <StatusBadge measurement={selectedMeas} />
                        </div>
                      </div>
                    </div>
                  )}

                  <button type="submit" className="btn btn-success btn-full btn-lg" disabled={paying || !selectedMeasId}>
                    {paying ? 'Procesando…' : '💵 Confirmar pago'}
                  </button>
                </>
              )}
            </form>
          )}
        </div>

        {/* ── Unpaid list for apt ── */}
        <div className="glass">
          <div className="section-title">Facturas de {selectedApt?.name ?? 'este apartamento'}</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Período</th>
                  <th>Consumo</th>
                  <th>Monto</th>
                  <th>Vencimiento</th>
                </tr>
              </thead>
              <tbody>
                {measurements
                  .filter(m => String(m.apartmentId) === String(selectedAptId) && m.consumption !== null)
                  .sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month)
                  .slice(0, 10)
                  .map(m => (
                    <tr key={m.id}>
                      <td><StatusBadge measurement={m} size="sm" /></td>
                      <td style={{ fontWeight: 600 }}>{MONTHS[m.month - 1]} {m.year}</td>
                      <td><span className="badge badge-amber">{m.consumption?.toLocaleString()} kWh</span></td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>
                        {m.cost != null ? `₡${m.cost.toFixed(2)}` : '—'}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {m.dueDate ? new Date(m.dueDate).toLocaleDateString('es-CR', { day: '2-digit', month: 'short' }) : '—'}
                      </td>
                    </tr>
                  ))}
                {measurements.filter(m => String(m.apartmentId) === String(selectedAptId) && m.consumption !== null).length === 0 && (
                  <tr><td colSpan={5} className="empty-state">Sin facturas para este apartamento.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Payment History ── */}
      <div className="glass">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Historial de pagos</div>
          <select className="form-input form-input-sm" style={{ width: 'auto' }} value={historyAptId}
            onChange={e => setHistoryAptId(e.target.value)}>
            <option value="all">Todos los apartamentos</option>
            {apartments.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Apartamento</th>
                <th>Período</th>
                <th>Consumo</th>
                <th>Monto</th>
                <th>Tarifa</th>
                <th>Fecha de pago</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paidMeasurements.map(m => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 600 }}>{aptName(m.apartmentId)}</td>
                  <td>{MONTHS[m.month - 1]} {m.year}</td>
                  <td><span className="badge badge-amber">{m.consumption?.toLocaleString()} kWh</span></td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>
                    {m.cost != null ? `₡${m.cost.toFixed(2)}` : '—'}
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {m.tariffAtCreation > 0 ? `₡${m.tariffAtCreation}/kWh` : '—'}
                  </td>
                  <td style={{ fontSize: '0.82rem' }}>
                    {m.paidAt ? (
                      <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                        ✓ {fmt(m.paidAt)}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    <button className="btn btn-success" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                      onClick={() => setReceipt(m)}>
                      🧾 Comprobante
                    </button>
                  </td>
                </tr>
              ))}
              {paidMeasurements.length === 0 && (
                <tr><td colSpan={7} className="empty-state">Sin pagos registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
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
