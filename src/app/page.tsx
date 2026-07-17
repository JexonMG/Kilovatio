'use client';

import { useState, useEffect, useMemo } from 'react';

interface Measurement {
  id: string;
  apartmentId: string;
  year: number;
  month: number;
  reading: number;
  createdAt: string;
}

interface ProcessedMeasurement extends Measurement {
  consumption: number | null;
  cost: number | null;
}

interface Apartment {
  id: string;
  name: string;
  createdAt: string;
}

interface Settings {
  tariff: number;
}

type Tab = 'registro' | 'historial' | 'apartamentos' | 'ajustes';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: 'registro',      label: 'Registro',      icon: '✏️' },
  { id: 'historial',     label: 'Historial',      icon: '📊' },
  { id: 'apartamentos',  label: 'Apartamentos',   icon: '🏠' },
  { id: 'ajustes',       label: 'Ajustes',        icon: '⚙️' },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>('registro');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [settings, setSettings] = useState<Settings>({ tariff: 0 });
  const [loading, setLoading] = useState(true);

  // Registro
  const [regAptId, setRegAptId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [reading, setReading] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Apartamentos
  const [newAptName, setNewAptName] = useState('');

  // Ajustes
  const [tariffInput, setTariffInput] = useState('');
  const [tariffOk, setTariffOk] = useState(false);

  // Historial filters
  const [fApt, setFApt] = useState('all');
  const [fYear, setFYear] = useState('');
  const [fMonth, setFMonth] = useState('');

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      setLoading(true);
      const [a, s, m] = await Promise.all([
        fetch('/api/apartments').then(r => r.json()),
        fetch('/api/settings').then(r => r.json()),
        fetch('/api/measurements').then(r => r.json()),
      ]);
      setApartments(a);
      setSettings(s);
      setMeasurements(m);
      setTariffInput(s.tariff.toString());
      if (a.length > 0) setRegAptId(prev => prev || a[0].id);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const processed = useMemo<ProcessedMeasurement[]>(() => {
    const grouped: Record<string, Measurement[]> = {};
    measurements.forEach(m => {
      (grouped[m.apartmentId] ??= []).push(m);
    });
    const result: ProcessedMeasurement[] = [];
    Object.values(grouped).forEach(list => {
      const sorted = [...list].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
      sorted.forEach((m, i) => {
        const consumption = i > 0 ? m.reading - sorted[i-1].reading : null;
        const cost = consumption !== null && settings.tariff > 0 ? consumption * settings.tariff : null;
        result.push({ ...m, consumption, cost });
      });
    });
    return result.sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month);
  }, [measurements, settings.tariff]);

  const totalKwh = processed.reduce((s, m) => s + (m.consumption ?? 0), 0);
  const totalCost = processed.reduce((s, m) => s + (m.cost ?? 0), 0);

  const filtered = processed.filter(m => {
    if (fApt !== 'all' && m.apartmentId !== fApt) return false;
    if (fYear && String(m.year) !== fYear) return false;
    if (fMonth && String(m.month) !== fMonth) return false;
    return true;
  });

  const aptName = (id: string) => apartments.find(a => a.id === id)?.name ?? '—';
  const aptCount = (id: string) => measurements.filter(m => m.apartmentId === id).length;

  // ── Handlers ─────────────────────────────────────────────────────────────
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!reading || !regAptId) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/measurements', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apartmentId: regAptId, year, month, reading: parseFloat(reading) }),
      });
      if (res.ok) {
        setReading('');
        if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1);
        await fetchAll();
      }
    } finally { setSubmitting(false); }
  }

  async function handleCreateApt(e: React.FormEvent) {
    e.preventDefault();
    if (!newAptName.trim()) return;
    const res = await fetch('/api/apartments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newAptName.trim() }),
    });
    if (res.ok) { setNewAptName(''); await fetchAll(); }
  }

  async function handleDeleteApt(id: string) {
    if (!confirm('¿Eliminar este apartamento y todo su historial?')) return;
    await fetch(`/api/apartments?id=${id}`, { method: 'DELETE' });
    await fetchAll();
  }

  async function handleDeleteMeas(id: string) {
    if (!confirm('¿Eliminar esta medición?')) return;
    await fetch(`/api/measurements?id=${id}`, { method: 'DELETE' });
    await fetchAll();
  }

  async function handleSaveTariff(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(tariffInput);
    if (isNaN(val)) return;
    const res = await fetch('/api/settings', {
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
              {n.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="tariff-badge">
            <div className="tariff-badge-label">Tarifa actual</div>
            <div className="tariff-badge-value">
              {settings.tariff > 0 ? `$${settings.tariff} / kWh` : 'No definida'}
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
          <div className="stat-value green">{settings.tariff > 0 ? `$${totalCost.toFixed(2)}` : '—'}</div>
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
                    {MONTHS.map((m,i) => <option key={m} value={i+1} style={{ background: '#0a0f1e' }}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="reading">Lectura del medidor (kWh)</label>
                <input type="number" id="reading" className="form-input" value={reading}
                  onChange={e => setReading(e.target.value)} step="0.01" placeholder="Ej. 90000" required />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
                {submitting ? 'Guardando…' : 'Registrar Medición'}
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
                    <td>{MONTHS[m.month-1]} {m.year}</td>
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
          {processed[0] && (
            <div className="info-box" style={{ marginTop: '1.25rem', color: 'var(--text)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Última lectura</div>
              <strong style={{ fontSize: '1.4rem', color: 'var(--primary-hover)' }}>{processed[0].reading.toLocaleString()} kWh</strong>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {MONTHS[processed[0].month-1]} {processed[0].year} · {aptName(processed[0].apartmentId)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── Tab: Historial ────────────────────────────────────────────────────────
  const TabHistorial = () => (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Historial</div>
          <div className="page-subtitle">{filtered.length} registros encontrados</div>
        </div>
        <button className="btn btn-success no-print" onClick={() => window.print()}>
          🖨️ Imprimir Reporte
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
            {MONTHS.map((m,i) => <option key={m} value={i+1} style={{ background: '#0a0f1e' }}>{m}</option>)}
          </select>
          {(fApt !== 'all' || fYear || fMonth) && (
            <button className="btn btn-danger" onClick={() => { setFApt('all'); setFYear(''); setFMonth(''); }}>
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Apartamento</th>
                <th>Mes</th>
                <th>Año</th>
                <th>Lectura (kWh)</th>
                <th>Consumo</th>
                {settings.tariff > 0 && <th>Costo</th>}
                <th className="no-print">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 600 }}>{aptName(m.apartmentId)}</td>
                  <td>{MONTHS[m.month-1]}</td>
                  <td>{m.year}</td>
                  <td style={{ fontFamily: 'monospace' }}>{m.reading.toLocaleString()}</td>
                  <td>
                    {m.consumption !== null
                      ? <span className="badge badge-amber">+{m.consumption.toLocaleString()} kWh</span>
                      : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Inicial</span>}
                  </td>
                  {settings.tariff > 0 && (
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>
                      {m.cost !== null ? `$${m.cost.toFixed(2)}` : '—'}
                    </td>
                  )}
                  <td className="no-print">
                    <button className="btn btn-danger" onClick={() => handleDeleteMeas(m.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="empty-state">Sin resultados con los filtros actuales.</td></tr>}
            </tbody>
          </table>
        </div>
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
          <div className="section-title">Nuevo Apartamento</div>
          <form onSubmit={handleCreateApt}>
            <div className="form-group">
              <label htmlFor="aptName">Nombre del apartamento / medidor</label>
              <input type="text" id="aptName" className="form-input" placeholder="Ej. Apto 1A, Bodega, Local 3"
                value={newAptName} onChange={e => setNewAptName(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary btn-full">Añadir Apartamento</button>
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
                    <div>
                      <div className="apt-card-name">{a.name}</div>
                      <div className="apt-card-meta">{aptCount(a.id)} medición{aptCount(a.id) !== 1 ? 'es' : ''}</div>
                    </div>
                    <button className="btn btn-danger" onClick={() => handleDeleteApt(a.id)}>Eliminar</button>
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
              <label htmlFor="tariff">Precio por kWh ($)</label>
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
              Los datos se guardan localmente en archivos CSV dentro de la carpeta{' '}
              <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: '4px' }}>/data</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const TABS: Record<Tab, React.ReactNode> = {
    registro: <TabRegistro />,
    historial: <TabHistorial />,
    apartamentos: <TabApartamentos />,
    ajustes: <TabAjustes />,
  };

  return (
    <div className="app-shell">
      {/* Mobile top bar */}
      <header className="mobile-header no-print">
        <div className="mobile-header-title">⚡ Kilovatio</div>
        <button className="hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Menú">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="2" y1="5" x2="18" y2="5"/>
            <line x1="2" y1="10" x2="18" y2="10"/>
            <line x1="2" y1="15" x2="18" y2="15"/>
          </svg>
        </button>
      </header>

      <Sidebar />

      <main className="main-content">
        {loading
          ? <div className="glass empty-state">Cargando datos…</div>
          : TABS[tab]}
      </main>
    </div>
  );
}
