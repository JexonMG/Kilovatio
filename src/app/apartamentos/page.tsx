'use client';

import { useState, useEffect } from 'react';
import { Apartment, Measurement } from '@/lib/types';
import { MONTHS } from '@/lib/constants';
import { API_URL } from '@/lib/utils';

export default function ApartamentosPage() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [meter, setMeter] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [initReading, setInitReading] = useState('');
  const [initYear, setInitYear] = useState(new Date().getFullYear());
  const [initMonth, setInitMonth] = useState(new Date().getMonth() + 1);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      setLoading(true);
      const [a, m] = await Promise.all([
        fetch(`${API_URL}/api/apartments`).then(r => r.json()),
        fetch(`${API_URL}/api/measurements`).then(r => r.json()),
      ]);
      setApartments(Array.isArray(a) ? a : []);
      setMeasurements(Array.isArray(m) ? m : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function resetForm() {
    setEditingId(null); setName(''); setMeter(''); setPaymentDate('');
    setInitReading(''); setInitYear(new Date().getFullYear()); setInitMonth(new Date().getMonth() + 1);
  }

  function handleEditClick(apt: Apartment) {
    setEditingId(apt.id);
    setName(apt.name);
    setMeter(apt.meter || '');
    setPaymentDate(apt.paymentDate || '');
    setInitReading('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`${API_URL}/api/apartments/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), meter: meter.trim(), paymentDate: paymentDate.trim() }),
        });
        if (res.ok) {
          setSuccess('Apartamento actualizado.');
          resetForm();
          await fetchAll();
        }
      } else {
        const res = await fetch(`${API_URL}/api/apartments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), meter: meter.trim(), paymentDate: paymentDate.trim() }),
        });
        if (res.ok) {
          const apt = await res.json();
          if (initReading.trim() !== '') {
            await fetch(`${API_URL}/api/measurements`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ apartmentId: apt.id, year: initYear, month: initMonth, reading: parseFloat(initReading) }),
            });
          }
          setSuccess('Apartamento creado exitosamente.');
          resetForm();
          await fetchAll();
        }
      }
      setTimeout(() => setSuccess(''), 3000);
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este apartamento y todas sus mediciones? Esta acción no se puede deshacer.')) return;
    await fetch(`${API_URL}/api/apartments/${id}`, { method: 'DELETE' });
    await fetchAll();
  }

  const measCount = (id: string) => measurements.filter(m => String(m.apartmentId) === String(id)).length;

  if (loading) return (
    <div className="page-content"><div className="glass empty-state" style={{ marginTop: '2rem' }}>Cargando…</div></div>
  );

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Apartamentos</div>
          <div className="page-subtitle">Gestión de unidades y medidores</div>
        </div>
      </div>

      <div className="grid-2">
        {/* ── Form ── */}
        <div className="glass">
          <div className="section-title">{editingId ? '✏️ Editar apartamento' : '➕ Nuevo apartamento'}</div>

          {success && (
            <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', color: 'var(--success)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.88rem', marginBottom: '1rem' }}>
              ✓ {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre del apartamento *</label>
              <input type="text" className="form-input" placeholder="Ej. Apto 101, Local 3, Bodega"
                value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Código de medidor</label>
              <input type="text" className="form-input" placeholder="Ej. MD-98234"
                value={meter} onChange={e => setMeter(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Fecha de pago habitual</label>
              <input type="text" className="form-input" placeholder="Ej. Los 5 de cada mes"
                value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
            </div>

            {!editingId && (
              <>
                <div className="form-group">
                  <label>
                    Lectura inicial (kWh) <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span>
                  </label>
                  <input type="number" className="form-input" placeholder="Ej. 85000" step="0.01"
                    value={initReading} onChange={e => setInitReading(e.target.value)} />
                </div>
                {initReading.trim() !== '' && (
                  <div className="grid-2" style={{ gap: '1rem' }}>
                    <div className="form-group">
                      <label>Año inicial</label>
                      <input type="number" className="form-input" value={initYear}
                        onChange={e => setInitYear(+e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Mes inicial</label>
                      <select className="form-input" value={initMonth} onChange={e => setInitMonth(+e.target.value)}>
                        {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                {saving ? 'Guardando…' : editingId ? '💾 Guardar cambios' : '➕ Crear apartamento'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ── List ── */}
        <div className="glass">
          <div className="section-title">{apartments.length} Apartamento{apartments.length !== 1 ? 's' : ''}</div>
          {apartments.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏢</div>
              Sin apartamentos. Crea el primero.
            </div>
          ) : (
            <div className="apt-list">
              {apartments.map(apt => (
                <div key={apt.id} className="apt-card">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="apt-card-name" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span>{apt.name}</span>
                      {apt.meter && (
                        <span style={{ fontSize: '0.72rem', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', padding: '0.1rem 0.4rem', borderRadius: '4px', color: 'var(--primary-hover)' }}>
                          {apt.meter}
                        </span>
                      )}
                    </div>
                    <div className="apt-card-meta">
                      {measCount(apt.id)} medición{measCount(apt.id) !== 1 ? 'es' : ''}
                      {apt.paymentDate && ` · ${apt.paymentDate}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                    <button className="btn btn-success" style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
                      onClick={() => handleEditClick(apt)}>✏️ Editar</button>
                    <button className="btn btn-danger" onClick={() => handleDelete(apt.id)}>Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
