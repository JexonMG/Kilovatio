'use client';

import { useState, useEffect, useMemo } from 'react';

interface Measurement {
  id: string;
  apartmentId: string;
  year: number;
  month: number;
  reading: number;
  paid: boolean;
  createdAt: string;
}

interface ProcessedMeasurement extends Measurement {
  consumption: number | null;
  cost: number | null;
}

interface Apartment {
  id: string;
  name: string;
  meter: string;
  paymentDate: string;
  createdAt: string;
}

interface Settings {
  tariff: number;
}

type Tab = 'registro' | 'historial' | 'pagos' | 'atencion' | 'apartamentos' | 'ajustes';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: 'registro',      label: 'Registro',      icon: '✏️' },
  { id: 'historial',     label: 'Historial',      icon: '📊' },
  { id: 'pagos',         label: 'Pagos',          icon: '💵' },
  { id: 'atencion',      label: 'Atención',       icon: '⚠️' },
  { id: 'apartamentos',  label: 'Apartamentos',   icon: '🏠' },
  { id: 'ajustes',       label: 'Ajustes',        icon: '⚙️' },
];

// ─── RECEIPT MODAL ────────────────────────────────────────────────────────────
function ReceiptModal({
  measurement,
  aptName,
  tariff,
  onClose,
}: {
  measurement: ProcessedMeasurement;
  aptName: string;
  tariff: number;
  onClose: () => void;
}) {
  const issueDate = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  const readingDate = new Date(measurement.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <div className="receipt-overlay no-print" onClick={onClose} />
      <div className="receipt-modal">
        <button className="receipt-close no-print" onClick={onClose} aria-label="Cerrar">✕</button>
        <div className="receipt-body" id="receipt-print">
          <div className="receipt-header">
            <div className="receipt-logo">⚡ Kilovatio</div>
            <div className="receipt-title">RECIBO DE CONSUMO ELÉCTRICO</div>
          </div>

          <div className="receipt-meta">
            <div className="receipt-meta-row">
              <span className="receipt-meta-label">Número de unidad:</span>
              <span className="receipt-meta-value">{aptName}</span>
            </div>
            <div className="receipt-meta-row">
              <span className="receipt-meta-label">Período facturado:</span>
              <span className="receipt-meta-value">{MONTHS[measurement.month - 1]} {measurement.year}</span>
            </div>
            <div className="receipt-meta-row">
              <span className="receipt-meta-label">Fecha de lectura:</span>
              <span className="receipt-meta-value">{readingDate}</span>
            </div>
            <div className="receipt-meta-row">
              <span className="receipt-meta-label">Fecha de emisión:</span>
              <span className="receipt-meta-value">{issueDate}</span>
            </div>
          </div>

          <div className="receipt-divider" />

          <table className="receipt-table">
            <thead>
              <tr>
                <th>Descripción</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Lectura actual del medidor</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{measurement.reading.toLocaleString()} kWh</td>
              </tr>
              {measurement.consumption !== null ? (
                <>
                  <tr>
                    <td>Consumo del período</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{measurement.consumption.toLocaleString()} kWh</td>
                  </tr>
                  {tariff > 0 && (
                    <tr>
                      <td>Tarifa aplicada</td>
                      <td style={{ textAlign: 'right' }}>₡{tariff} / kWh</td>
                    </tr>
                  )}
                </>
              ) : (
                <tr>
                  <td colSpan={2} style={{ color: '#666', fontStyle: 'italic' }}>Lectura inicial — sin período anterior</td>
                </tr>
              )}
            </tbody>
          </table>

          {measurement.consumption !== null && tariff > 0 && (
            <div className="receipt-total-box">
              <div className="receipt-total-label">TOTAL A PAGAR</div>
              <div className="receipt-total-amount">₡{(measurement.consumption * tariff).toFixed(2)}</div>
            </div>
          )}
          {measurement.consumption !== null && tariff === 0 && (
            <div className="receipt-total-box" style={{ border: '2px dashed #999' }}>
              <div className="receipt-total-label">CONSUMO TOTAL</div>
              <div className="receipt-total-amount" style={{ color: '#1d4ed8' }}>{measurement.consumption.toLocaleString()} kWh</div>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <span style={{
              display: 'inline-block',
              padding: '0.3rem 1rem',
              borderRadius: '999px',
              fontWeight: 700,
              fontSize: '0.85rem',
              background: measurement.paid ? '#dcfce7' : '#fee2e2',
              color: measurement.paid ? '#166534' : '#991b1b',
              border: `2px solid ${measurement.paid ? '#86efac' : '#fca5a5'}`,
            }}>
              {measurement.paid ? '✓ PAGADO' : '⏳ PENDIENTE DE PAGO'}
            </span>
          </div>

          <div className="receipt-divider" style={{ marginTop: '1.5rem' }} />
          <div className="receipt-footer">
            Emitido por el sistema Kilovatio · {issueDate}
          </div>
        </div>

        <div className="no-print" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button className="btn btn-primary" style={{ padding: '0.75rem 2.5rem', fontSize: '1rem' }}
            onClick={() => window.print()}>
            🖨️ Imprimir Recibo
          </button>
        </div>
      </div>
    </>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function Home() {
  const [tab, setTab] = useState<Tab>('registro');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [settings, setSettings] = useState<Settings>({ tariff: 0 });
  const [loading, setLoading] = useState(true);

  // Recibo abierto
  const [receipt, setReceipt] = useState<ProcessedMeasurement | null>(null);

  // Registro/Medición
  const [regAptId, setRegAptId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [reading, setReading] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Apartamentos
  const [editingAptId, setEditingAptId] = useState<string | null>(null);
  const [newAptName, setNewAptName] = useState('');
  const [newAptMeter, setNewAptMeter] = useState('');
  const [newAptPaymentDate, setNewAptPaymentDate] = useState('');
  const [initialReading, setInitialReading] = useState('');
  const [aptYear, setAptYear] = useState(new Date().getFullYear());
  const [aptMonth, setAptMonth] = useState(new Date().getMonth() + 1);

  // Pestaña de Pagos
  const [paymentAptId, setPaymentAptId] = useState('');
  const [selectedMeasId, setSelectedMeasId] = useState('');
  const [paymentDateInput, setPaymentDateInput] = useState('');
  const [paying, setPaying] = useState(false);

  // Ajustes
  const [tariffInput, setTariffInput] = useState('');
  const [tariffOk, setTariffOk] = useState(false);

  // Historial filters
  const [fApt, setFApt] = useState('all');
  const [fYear, setFYear] = useState('');
  const [fMonth, setFMonth] = useState('');
  const [fPaid, setFPaid] = useState<'all' | 'unpaid' | 'paid'>('all');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

  // Effect to add/remove CSS class to body when printing receipt to avoid blank pages Chrome/Firefox
  useEffect(() => {
    if (receipt) {
      document.body.classList.add('receipt-open-print');
    } else {
      document.body.classList.remove('receipt-open-print');
    }
    return () => {
      document.body.classList.remove('receipt-open-print');
    };
  }, [receipt]);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      setLoading(true);
      const [a, s, m] = await Promise.all([
        fetch(`${API_URL}/api/apartments`).then(r => r.json()),
        fetch(`${API_URL}/api/settings`).then(r => r.json()),
        fetch(`${API_URL}/api/measurements`).then(r => r.json()),
      ]);
      const aptsList = Array.isArray(a) ? a : [];
      setApartments(aptsList);
      setSettings(s ?? { tariff: 0 });
      setMeasurements(Array.isArray(m) ? m : []);
      setTariffInput((s?.tariff ?? 0).toString());
      if (aptsList.length > 0) {
        setRegAptId(prev => prev || aptsList[0].id);
        setPaymentAptId(prev => prev || aptsList[0].id);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const processed = useMemo<ProcessedMeasurement[]>(() => {
    const grouped: Record<string, Measurement[]> = {};
    measurements.forEach(m => { (grouped[m.apartmentId] ??= []).push(m); });
    const result: ProcessedMeasurement[] = [];
    Object.values(grouped).forEach(list => {
      const sorted = [...list].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
      sorted.forEach((m, i) => {
        const consumption = i > 0 ? m.reading - sorted[i - 1].reading : null;
        const cost = consumption !== null && settings.tariff > 0 ? consumption * settings.tariff : null;
        result.push({ ...m, consumption, cost });
      });
    });
    return result.sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month);
  }, [measurements, settings.tariff]);

  const totalKwh = processed.reduce((s, m) => s + (m.consumption ?? 0), 0);
  const totalCost = processed.reduce((s, m) => s + (m.cost ?? 0), 0);
  const unpaidCount = processed.filter(m => !m.paid && m.consumption !== null).length;

  const filtered = processed.filter(m => {
    if (fApt !== 'all' && m.apartmentId !== fApt) return false;
    if (fYear && String(m.year) !== fYear) return false;
    if (fMonth && String(m.month) !== fMonth) return false;
    if (fPaid === 'unpaid' && (m.paid || m.consumption === null)) return false;
    if (fPaid === 'paid' && !m.paid) return false;
    return true;
  });

  // Filter unpaid measurements for selected apartment in the Pagos Tab
  const unpaidForApt = useMemo(() => {
    return processed.filter(m => m.apartmentId === paymentAptId && !m.paid && m.consumption !== null);
  }, [processed, paymentAptId]);

  const selectedAptDetails = useMemo(() => {
    return apartments.find(a => a.id === paymentAptId);
  }, [apartments, paymentAptId]);

  // Set default selected measurement when apartment changes in Pagos
  useEffect(() => {
    if (unpaidForApt.length > 0) {
      setSelectedMeasId(unpaidForApt[0].id);
    } else {
      setSelectedMeasId('');
    }
  }, [unpaidForApt]);

  // ── Alerta: Necesita Atención ─────────────────────────────────────────────
  const attentionApts = useMemo(() => {
    // Tomar base del tiempo actual: 17 de Julio de 2026 (local state o new Date())
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1; // 1-12
    const curDay = now.getDate();

    return apartments.map(a => {
      // Intentar buscar números en paymentDate
      const dayText = (a.paymentDate || '').match(/\d+/)?.[0];
      const paymentDay = dayText ? parseInt(dayText, 10) : 1; // Por defecto el día 1

      // Determinar período requerido de medición
      // Si el día de hoy ya es igual o mayor al de pago, la del mes actual ya debe estar hecha
      // Si es menor, la última obligatoria es la del mes anterior
      let reqYear = curYear;
      let reqMonth = curMonth;
      if (curDay < paymentDay) {
        reqMonth = curMonth - 1;
        if (reqMonth === 0) {
          reqMonth = 12;
          reqYear = curYear - 1;
        }
      }

      const aptMeasList = measurements.filter(m => m.apartmentId === a.id);
      if (aptMeasList.length === 0) {
        return {
          apartment: a,
          needsAttention: true,
          reason: 'Falta configurar medición inicial / ninguna registrada',
          monthsLate: 2,
          lastMeasurementText: 'Sin registros'
        };
      }

      // Medición más reciente
      const sortedMeas = [...aptMeasList].sort((x, y) => x.year !== y.year ? y.year - x.year : y.month - x.month);
      const lastMeas = sortedMeas[0];

      const reqTotalMonths = reqYear * 12 + reqMonth;
      const lastTotalMonths = lastMeas.year * 12 + lastMeas.month;
      const diff = reqTotalMonths - lastTotalMonths;

      if (diff > 0) {
        return {
          apartment: a,
          needsAttention: true,
          reason: diff === 1 ? 'Lleva 1 mes sin registros de consumo' : `Lleva ${diff} meses sin registros de consumo`,
          monthsLate: diff,
          lastMeasurementText: `${MONTHS[lastMeas.month - 1]} ${lastMeas.year} (Lectura: ${lastMeas.reading} kWh)`
        };
      }

      return {
        apartment: a,
        needsAttention: false,
        reason: 'Al día',
        monthsLate: 0,
        lastMeasurementText: `${MONTHS[lastMeas.month - 1]} ${lastMeas.year}`
      };
    }).filter(item => item.needsAttention);
  }, [apartments, measurements]);

  const attentionCount = attentionApts.length;

  const aptName = (id: string) => apartments.find(a => a.id === id)?.name ?? '—';
  const aptCount = (id: string) => measurements.filter(m => m.apartmentId === id).length;

  // Sync receipt details if data updates in background
  useEffect(() => {
    if (receipt) {
      const updated = processed.find(m => m.id === receipt.id);
      if (updated) setReceipt(updated);
    }
  }, [processed]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!reading || !regAptId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/measurements`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apartmentId: regAptId, year, month, reading: parseFloat(reading) }),
      });
      if (res.ok) {
        if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1);
        await fetchAll();
        setReading('');
        setPendingReceipt(true);
      }
    } finally { setSubmitting(false); }
  }

  const [pendingReceipt, setPendingReceipt] = useState(false);
  useEffect(() => {
    if (pendingReceipt && processed.length > 0) {
      setPendingReceipt(false);
      setReceipt(processed[0]); // most recent is first after sort
    }
  }, [pendingReceipt, processed]);

  async function handleCreateOrEditApt(e: React.FormEvent) {
    e.preventDefault();
    if (!newAptName.trim()) return;

    if (editingAptId) {
      // MODE: EDIT
      const res = await fetch(`${API_URL}/api/apartments/${editingAptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAptName.trim(),
          meter: newAptMeter.trim(),
          paymentDate: newAptPaymentDate.trim()
        }),
      });
      if (res.ok) {
        setEditingAptId(null);
        setNewAptName('');
        setNewAptMeter('');
        setNewAptPaymentDate('');
        await fetchAll();
      }
    } else {
      // MODE: CREATE NEW
      const res = await fetch(`${API_URL}/api/apartments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAptName.trim(),
          meter: newAptMeter.trim(),
          paymentDate: newAptPaymentDate.trim()
        }),
      });
      if (res.ok) {
        const apt = await res.json();
        if (initialReading.trim() !== '') {
          await fetch(`${API_URL}/api/measurements`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apartmentId: apt.id, year: aptYear, month: aptMonth, reading: parseFloat(initialReading) }),
          });
        }
        setNewAptName('');
        setNewAptMeter('');
        setNewAptPaymentDate('');
        setInitialReading('');
        await fetchAll();
      }
    }
  }

  function handleEditClick(apt: Apartment) {
    setEditingAptId(apt.id);
    setNewAptName(apt.name);
    setNewAptMeter(apt.meter || '');
    setNewAptPaymentDate(apt.paymentDate || '');
    setInitialReading('');
  }

  function handleCancelEdit() {
    setEditingAptId(null);
    setNewAptName('');
    setNewAptMeter('');
    setNewAptPaymentDate('');
    setInitialReading('');
  }

  async function handleDeleteApt(id: string) {
    if (!confirm('¿Eliminar este apartamento y todo su historial?')) return;
    await fetch(`${API_URL}/api/apartments/${id}`, { method: 'DELETE' });
    await fetchAll();
  }

  async function handleDeleteMeas(id: string) {
    if (!confirm('¿Eliminar esta medición?')) return;
    await fetch(`${API_URL}/api/measurements/${id}`, { method: 'DELETE' });
    await fetchAll();
  }

  async function handleTogglePaid(id: string, current: boolean) {
    setMeasurements(prev => prev.map(m => m.id === id ? { ...m, paid: !current } : m));
    try {
      await fetch(`${API_URL}/api/measurements/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paid: !current }),
      });
    } catch {
      setMeasurements(prev => prev.map(m => m.id === id ? { ...m, paid: current } : m));
    }
  }

  async function handleRegisterPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMeasId) return;
    setPaying(true);
    try {
      const res = await fetch(`${API_URL}/api/measurements/${selectedMeasId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paid: true }),
      });
      if (res.ok) {
        setPaymentDateInput('');
        await fetchAll();
      }
    } finally {
      setPaying(false);
    }
  }

  async function handleSaveTariff(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(tariffInput);
    if (isNaN(val)) return;
    const res = await fetch(`${API_URL}/api/settings`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tariff: val }),
    });
    if (res.ok) { await fetchAll(); setTariffOk(true); setTimeout(() => setTariffOk(false), 2500); }
  }

  function navigate(t: Tab) { setTab(t); setSidebarOpen(false); }

  // ── Sidebar ───────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <>
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <aside className={`sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-title">⚡ Kilovatio</div>
          <div className="sidebar-brand-sub">Control de consumo eléctrico</div>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(n => (
            <button key={n.id} className={`nav-item ${tab === n.id ? 'active' : ''}`} onClick={() => navigate(n.id)}>
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{n.icon}</span>
              <span style={{ flex: 1, textAlign: 'left' }}>{n.label}</span>
              {n.id === 'pagos' && unpaidCount > 0 && (
                <span className="nav-badge">{unpaidCount}</span>
              )}
              {n.id === 'atencion' && attentionCount > 0 && (
                <span className="nav-badge" style={{ background: attentionApts.some(x => x.monthsLate >= 2) ? 'var(--danger)' : 'var(--warning)', color: '#000' }}>{attentionCount}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="tariff-badge">
            <div className="tariff-badge-label">Tarifa actual</div>
            <div className="tariff-badge-value">
              {settings.tariff > 0 ? `₡${settings.tariff} / kWh` : 'No definida'}
            </div>
          </div>
        </div>
      </aside>
    </>
  );

  // ── Tab: Registro ─────────────────────────────────────────────────────────
  const TabRegistro = () => (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Registro</div>
          <div className="page-subtitle">Nueva lectura del medidor</div>
        </div>
      </div>

      <div className="grid-3 mb-6">
        <div className="stat-card">
          <div className="stat-label">Mediciones</div>
          <div className="stat-value blue">{measurements.length}</div>
          <div className="stat-sub">registradas</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Consumo Total</div>
          <div className="stat-value amber">{totalKwh.toLocaleString()}</div>
          <div className="stat-sub">kWh acumulados</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Costo Estimado</div>
          <div className="stat-value green">{settings.tariff > 0 ? `₡${totalCost.toFixed(2)}` : '—'}</div>
          <div className="stat-sub">{settings.tariff > 0 ? 'calculado' : 'configura tarifa'}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="glass">
          <div className="section-title">Nueva Medición</div>
          {apartments.length === 0 ? (
            <p style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>
              Primero crea un apartamento en{' '}
              <button onClick={() => navigate('apartamentos')} style={{ background: 'none', border: 'none', color: 'var(--primary-hover)', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
                Apartamentos
              </button>.
            </p>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label htmlFor="regApt">Apartamento</label>
                <select id="regApt" className="form-input" value={regAptId} onChange={e => setRegAptId(e.target.value)}>
                  {apartments.map(a => <option key={a.id} value={a.id} style={{ background: '#0a0f1e' }}>{a.name}</option>)}
                </select>
              </div>
              <div className="grid-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="year">Año</label>
                  <input type="number" id="year" className="form-input" value={year} onChange={e => setYear(+e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="month">Mes</label>
                  <select id="month" className="form-input" value={month} onChange={e => setMonth(+e.target.value)}>
                    {MONTHS.map((m, i) => <option key={m} value={i + 1} style={{ background: '#0a0f1e' }}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="reading">Lectura del medidor (kWh)</label>
                <input type="number" id="reading" className="form-input" value={reading}
                  onChange={e => setReading(e.target.value)} step="0.01" placeholder="Ej. 90000" required />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
                {submitting ? 'Guardando…' : '✏️ Registrar y Ver Recibo'}
              </button>
            </form>
          )}
        </div>

        <div className="glass">
          <div className="section-title">Últimas 6 Lecturas</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Apartamento</th><th>Fecha</th><th>Consumo</th></tr></thead>
              <tbody>
                {processed.slice(0, 6).map(m => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600 }}>{aptName(m.apartmentId)}</td>
                    <td>{MONTHS[m.month - 1]} {m.year}</td>
                    <td>
                      {m.consumption !== null
                        ? <span className="badge badge-amber">+{m.consumption.toLocaleString()} kWh</span>
                        : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Inicial</span>}
                    </td>
                  </tr>
                ))}
                {processed.length === 0 && <tr><td colSpan={3} className="empty-state">Sin datos aún</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Tab: Historial ────────────────────────────────────────────────────────
  const TabHistorial = () => (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="page-title">Historial</div>
          {unpaidCount > 0 && (
            <span className="unpaid-badge">{unpaidCount} sin pagar</span>
          )}
        </div>
        <button className="btn btn-success no-print" onClick={() => window.print()}>
          🖨️ Imprimir Historial
        </button>
      </div>
      <div className="glass">
        <div className="filters-bar no-print">
          <select className="form-input form-input-sm" style={{ width: 'auto' }} value={fApt} onChange={e => setFApt(e.target.value)}>
            <option value="all" style={{ background: '#0a0f1e' }}>Todos los apartamentos</option>
            {apartments.map(a => <option key={a.id} value={a.id} style={{ background: '#0a0f1e' }}>{a.name}</option>)}
          </select>
          <input type="number" className="form-input form-input-sm" style={{ width: '110px' }} placeholder="Año" value={fYear} onChange={e => setFYear(e.target.value)} />
          <select className="form-input form-input-sm" style={{ width: 'auto' }} value={fMonth} onChange={e => setFMonth(e.target.value)}>
            <option value="" style={{ background: '#0a0f1e' }}>Todos los meses</option>
            {MONTHS.map((m, i) => <option key={m} value={i + 1} style={{ background: '#0a0f1e' }}>{m}</option>)}
          </select>
          <select className="form-input form-input-sm" style={{ width: 'auto' }} value={fPaid} onChange={e => setFPaid(e.target.value as 'all' | 'unpaid' | 'paid')}>
            <option value="all" style={{ background: '#0a0f1e' }}>Todos los estados</option>
            <option value="unpaid" style={{ background: '#0a0f1e' }}>Sin pagar</option>
            <option value="paid" style={{ background: '#0a0f1e' }}>Pagados</option>
          </select>
          {(fApt !== 'all' || fYear || fMonth || fPaid !== 'all') && (
            <button className="btn btn-danger" onClick={() => { setFApt('all'); setFYear(''); setFMonth(''); setFPaid('all'); }}>
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
                <th>Mes</th>
                <th>Año</th>
                <th>Lectura (kWh)</th>
                <th>Consumo</th>
                {settings.tariff > 0 && <th>Costo</th>}
                <th className="no-print">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} style={{ opacity: m.paid ? 0.65 : 1 }}>
                  <td>
                    {m.consumption === null ? (
                      <span className="badge badge-blue">Inicial</span>
                    ) : (
                      <span className={`paid-label ${m.paid ? 'paid' : 'unpaid'}`}>
                        {m.paid ? '✓ Pagado' : 'Sin pagar'}
                      </span>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>{aptName(m.apartmentId)}</td>
                  <td>{MONTHS[m.month - 1]}</td>
                  <td>{m.year}</td>
                  <td style={{ fontFamily: 'monospace' }}>{m.reading.toLocaleString()}</td>
                  <td>
                    {m.consumption !== null
                      ? <span className="badge badge-amber">+{m.consumption.toLocaleString()} kWh</span>
                      : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>}
                  </td>
                  {settings.tariff > 0 && (
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>
                      {m.cost !== null ? `₡${m.cost.toFixed(2)}` : '—'}
                    </td>
                  )}
                  <td className="no-print">
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-success" style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}
                        onClick={() => setReceipt(m)}>
                        🧾 Recibo
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDeleteMeas(m.id)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="empty-state">Sin resultados con los filtros actuales.</td></tr>}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '2px dashed var(--border)', fontSize: '1.2rem', fontWeight: 600 }}>
            <span style={{ marginRight: '2rem', color: 'var(--text)' }}>
              Total de Consumo:{' '}
              <span style={{ color: 'var(--primary-hover)' }}>
                {filtered.reduce((sum, m) => sum + (m.consumption ?? 0), 0).toLocaleString()} kWh
              </span>
            </span>
            {settings.tariff > 0 && (
              <span style={{ color: 'var(--text)' }}>
                Total Costo:{' '}
                <span style={{ color: 'var(--success)' }}>
                  ₡{filtered.reduce((sum, m) => sum + (m.cost ?? 0), 0).toFixed(2)}
                </span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ── Tab: Pagos ─────────────────────────────────────────────────────────────
  const TabPagos = () => (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Control de Pagos</div>
          <div className="page-subtitle">Registrar recaudación eléctrica</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="glass">
          <div className="section-title">Buscar Apartamento</div>
          {apartments.length === 0 ? (
            <p className="empty-state">No hay apartamentos creados.</p>
          ) : (
            <form onSubmit={handleRegisterPayment}>
              <div className="form-group">
                <label htmlFor="paymentApt">Apartamento</label>
                <select id="paymentApt" className="form-input" value={paymentAptId} onChange={e => setPaymentAptId(e.target.value)}>
                  {apartments.map(a => <option key={a.id} value={a.id} style={{ background: '#0a0f1e' }}>{a.name}</option>)}
                </select>
              </div>

              {selectedAptDetails && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Medidor asignado</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>{selectedAptDetails.meter || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fecha programada de pago</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-hover)' }}>{selectedAptDetails.paymentDate || 'No definida'}</div>
                  </div>
                </div>
              )}

              {unpaidForApt.length === 0 ? (
                <div className="info-box" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7', textAlign: 'center', fontSize: '1.1rem', padding: '1.5rem', borderRadius: '8px', fontStyle: 'italic', fontWeight: 600 }}>
                  🎉 Pagos al dia
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="unpaidMeas">Seleccione Mes Pendiente</label>
                    <select id="unpaidMeas" className="form-input" value={selectedMeasId} onChange={e => setSelectedMeasId(e.target.value)}>
                      {unpaidForApt.map(m => {
                        const costText = m.cost !== null ? ` (₡${m.cost.toFixed(2)})` : '';
                        return (
                          <option key={m.id} value={m.id} style={{ background: '#0a0f1e' }}>
                            {MONTHS[m.month - 1]} {m.year} · +{m.consumption} kWh{costText}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="paymentDate">Fecha en la que pagó (Opcional)</label>
                    <input type="text" id="paymentDate" className="form-input" placeholder="Ej. Hoy, 15 de Julio, etc." value={paymentDateInput} onChange={e => setPaymentDateInput(e.target.value)} />
                  </div>

                  <button type="submit" className="btn btn-success btn-full" disabled={paying} style={{ marginTop: '0.5rem' }}>
                    {paying ? 'Procesando pago...' : '💵 Marcar Medicion como Pagado'}
                  </button>
                </>
              )}
            </form>
          )}
        </div>

        <div className="glass">
          <div className="section-title">Pendientes en este apartamento</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Consumo</th>
                  <th>Costo</th>
                </tr>
              </thead>
              <tbody>
                {unpaidForApt.map(m => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600 }}>{MONTHS[m.month - 1]} {m.year}</td>
                    <td><span className="badge badge-amber">+{m.consumption} kWh</span></td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{m.cost !== null ? `₡${m.cost.toFixed(2)}` : '—'}</td>
                  </tr>
                ))}
                {unpaidForApt.length === 0 && (
                  <tr>
                    <td colSpan={3} className="empty-state" style={{ color: 'var(--success)' }}>
                      No hay cobros pendientes para este apartamento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Tab: Atención ────────────────────────────────────────────────────────
  const TabAtencion = () => (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">⚠️ Requiere Atención</div>
          <div className="page-subtitle">Monitoreo de medidores sin lecturas registradas</div>
        </div>
      </div>

      <div className="glass">
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#fca5a5', padding: '1rem 1.25rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
          📢 <strong>Nota de uso:</strong> Esta página muestra únicamente las unidades que adeudan registro de medición para el mes en curso (o anteriores) de acuerdo a sus fechas programadas. <strong>No puedes modificar datos aquí.</strong> Para registrar una nueva medición, ve a la pestaña <strong>Registro</strong>.
        </div>

        {attentionApts.length === 0 ? (
          <div className="empty-state" style={{ padding: '3.5rem', color: 'var(--success)' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>🎉</span>
            <strong>¡Excelente! Todos los medidores tienen sus lecturas al día.</strong>
          </div>
        ) : (
          <div className="apt-list">
            {attentionApts.map(item => {
              const isTwoMonthsOrMore = item.monthsLate >= 2;
              return (
                <div key={item.apartment.id} className="apt-card" style={{ borderLeft: `5px solid ${isTwoMonthsOrMore ? 'var(--danger)' : 'var(--warning)'}` }}>
                  <div style={{ flex: 1 }}>
                    <div className="apt-card-name" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{item.apartment.name}</span>
                      {item.apartment.meter && (
                        <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.08)', padding: '0.15rem 0.5rem', borderRadius: '4px', color: 'var(--text-muted)' }}>
                          Medidor: {item.apartment.meter}
                        </span>
                      )}
                      {isTwoMonthsOrMore && (
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: 'rgba(239,68,68,0.2)', border: '1px solid var(--danger)', color: '#fca5a5', borderRadius: '4px', fontWeight: 700 }}>
                          URGENTE: +2 MESES SIN MEDIR
                        </span>
                      )}
                    </div>
                    
                    <div style={{ marginTop: '0.5rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                      <div>📅 <strong>Fecha programada:</strong> {item.apartment.paymentDate || 'Día 1 del mes'}</div>
                      <div>📡 <strong>Última lectura guardada:</strong> {item.lastMeasurementText}</div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className="badge" style={{
                      background: isTwoMonthsOrMore ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                      color: isTwoMonthsOrMore ? '#fca5a5' : '#fcd34d',
                      border: `1px solid ${isTwoMonthsOrMore ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                      padding: '0.5rem 1rem',
                      fontSize: '0.85rem',
                      fontWeight: 700
                    }}>
                      ⚠️ {item.reason}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ── Tab: Apartamentos ─────────────────────────────────────────────────────
  const TabApartamentos = () => (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Apartamentos</div>
          <div className="page-subtitle">Medidores y unidades</div>
        </div>
      </div>
      <div className="grid-2">
        <div className="glass">
          <div className="section-title">{editingAptId ? 'Editar Apartamento' : 'Nuevo Apartamento'}</div>
          <form onSubmit={handleCreateOrEditApt}>
            <div className="form-group">
              <label htmlFor="aptName">Nombre del apartamento / medidor</label>
              <input type="text" id="aptName" className="form-input" placeholder="Ej. Apto 1A, Bodega, Local 3"
                value={newAptName} onChange={e => setNewAptName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="aptMeter">Medidor / Código de Medidor</label>
              <input type="text" id="aptMeter" className="form-input" placeholder="Ej. MD-98234, Medidor Principal"
                value={newAptMeter} onChange={e => setNewAptMeter(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="paymentDateDay">Fecha de Pagos</label>
              <input type="text" id="paymentDateDay" className="form-input" placeholder="Ej. Los 5 de cada mes, Día 10"
                value={newAptPaymentDate} onChange={e => setNewAptPaymentDate(e.target.value)} />
            </div>
            
            {/* Show initial reading configuration only when creating a new apartment */}
            {!editingAptId && (
              <>
                <div className="form-group">
                  <label htmlFor="initReading">
                    Medición Inicial kWh <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span>
                  </label>
                  <input type="number" id="initReading" className="form-input" placeholder="Ej. 85000"
                    value={initialReading} onChange={e => setInitialReading(e.target.value)} step="0.01" />
                </div>
                {initialReading.trim() !== '' && (
                  <div className="grid-2" style={{ gap: '1rem' }}>
                    <div className="form-group">
                      <label htmlFor="aptYear">Año inicial</label>
                      <input type="number" id="aptYear" className="form-input" value={aptYear} onChange={e => setAptYear(+e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="aptMonth">Mes inicial</label>
                      <select id="aptMonth" className="form-input" value={aptMonth} onChange={e => setAptMonth(+e.target.value)}>
                        {MONTHS.map((m, i) => <option key={m} value={i + 1} style={{ background: '#0a0f1e' }}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                {editingAptId ? '💾 Guardar Cambios' : 'Añadir Apartamento'}
              </button>
              {editingAptId && (
                <button type="button" className="btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text)' }} onClick={handleCancelEdit}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="glass">
          <div className="section-title">{apartments.length} Apartamento{apartments.length !== 1 ? 's' : ''}</div>
          {apartments.length === 0
            ? <div className="empty-state">Sin apartamentos. Crea uno.</div>
            : (
              <div className="apt-list">
                {apartments.map(a => (
                  <div key={a.id} className="apt-card">
                    <div style={{ flex: 1 }}>
                      <div className="apt-card-name" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span>{a.name}</span>
                        {a.meter && (
                          <span style={{ fontSize: '0.72rem', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', padding: '0.1rem 0.4rem', borderRadius: '4px', color: 'var(--primary-hover)' }}>
                            Medidor: {a.meter}
                          </span>
                        )}
                      </div>
                      <div className="apt-card-meta">
                        {aptCount(a.id)} medición{aptCount(a.id) !== 1 ? 'es' : ''}
                        {a.paymentDate && ` · Pago: ${a.paymentDate}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-success" style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }} onClick={() => handleEditClick(a)}>
                        ✏️ Editar
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDeleteApt(a.id)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );

  // ── Tab: Ajustes ──────────────────────────────────────────────────────────
  const TabAjustes = () => (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Ajustes</div>
          <div className="page-subtitle">Configuración general</div>
        </div>
      </div>
      <div className="grid-2">
        <div className="glass">
          <div className="section-title">Tarifa Eléctrica</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
            Define el precio por kWh para calcular el costo en el historial.
          </p>
          <form onSubmit={handleSaveTariff}>
            <div className="form-group">
              <label htmlFor="tariff">Precio por kWh (₡)</label>
              <input type="number" id="tariff" className="form-input" value={tariffInput}
                onChange={e => setTariffInput(e.target.value)} step="0.0001" placeholder="Ej. 0.2500" required />
            </div>
            <button type="submit" className="btn btn-primary">
              {tariffOk ? '✓ Guardado' : 'Guardar Tarifa'}
            </button>
          </form>
        </div>

        <div className="glass">
          <div className="section-title">¿Cómo funciona el sistema?</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.7 }}>
            <p style={{ marginBottom: '1rem' }}>
              El medidor eléctrico es <strong style={{ color: 'var(--text)' }}>acumulativo</strong> y nunca se reinicia a cero.
              El sistema calcula el consumo real restando la lectura del mes anterior de la actual.
            </p>
            <div className="info-box">
              <div>Mes 1: 85,000 kWh (lectura)</div>
              <div>Mes 2: 90,000 kWh (lectura)</div>
              <div style={{ marginTop: '0.5rem', color: 'var(--success)', fontWeight: 600 }}>
                Consumo real = 5,000 kWh
              </div>
            </div>
            <p style={{ marginTop: '1rem' }}>
              Los datos están sincronizados en tiempo real y se almacenan de forma segura en la
              <strong style={{ color: 'var(--text)' }}> nube mediante MongoDB</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const TABS: Record<Tab, React.ReactNode> = {
    registro: TabRegistro(),
    historial: TabHistorial(),
    pagos: TabPagos(),
    atencion: TabAtencion(),
    apartamentos: TabApartamentos(),
    ajustes: TabAjustes(),
  };

  return (
    <>
      <div className="app-shell">
        <header className="mobile-header no-print">
          <div className="mobile-header-title">⚡ Kilovatio</div>
          <button className="hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Menú">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="2" y1="5" x2="18" y2="5" />
              <line x1="2" y1="10" x2="18" y2="10" />
              <line x1="2" y1="15" x2="18" y2="15" />
            </svg>
          </button>
        </header>

        {Sidebar()}

        <main className="main-content">
          {loading
            ? <div className="glass empty-state">Cargando datos…</div>
            : TABS[tab]}
        </main>
      </div>

      {/* Portal / Receipt modal (Rendered outside app-shell hierarchy) */}
      {receipt && (
        <ReceiptModal
          measurement={receipt}
          aptName={aptName(receipt.apartmentId)}
          tariff={settings.tariff}
          onClose={() => setReceipt(null)}
        />
      )}
    </>
  );
}
