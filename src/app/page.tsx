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

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const NAV_ITEMS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'registro',
    label: 'Registro',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    id: 'historial',
    label: 'Historial',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    id: 'apartamentos',
    label: 'Apartamentos',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'ajustes',
    label: 'Ajustes',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('registro');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [settings, setSettings] = useState<Settings>({ tariff: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Registration
  const [regAptId, setRegAptId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [reading, setReading] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Apartments
  const [newAptName, setNewAptName] = useState('');

  // Settings
  const [tariffInput, setTariffInput] = useState('');
  const [tariffSaved, setTariffSaved] = useState(false);

  // History filters
  const [searchApt, setSearchApt] = useState('all');
  const [searchYear, setSearchYear] = useState('');
  const [searchMonth, setSearchMonth] = useState('');

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      setIsLoading(true);
      const [aptRes, setRes, mesRes] = await Promise.all([
        fetch('/api/apartments'),
        fetch('/api/settings'),
        fetch('/api/measurements'),
      ]);
      const apts: Apartment[] = await aptRes.json();
      const stgs: Settings = await setRes.json();
      const meas: Measurement[] = await mesRes.json();

      setApartments(apts);
      setSettings(stgs);
      setMeasurements(meas);
      setTariffInput(stgs.tariff.toString());
      if (apts.length > 0) setRegAptId(prev => prev || apts[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  // ---- PROCESSED DATA ----
  const processed = useMemo<ProcessedMeasurement[]>(() => {
    const grouped: Record<string, Measurement[]> = {};
    measurements.forEach(m => {
      if (!grouped[m.apartmentId]) grouped[m.apartmentId] = [];
      grouped[m.apartmentId].push(m);
    });

    const result: ProcessedMeasurement[] = [];
    Object.keys(grouped).forEach(aptId => {
      const sorted = [...grouped[aptId]].sort((a, b) =>
        a.year !== b.year ? a.year - b.year : a.month - b.month,
      );
      sorted.forEach((m, i) => {
        const consumption = i > 0 ? m.reading - sorted[i - 1].reading : null;
        const cost = consumption !== null && settings.tariff > 0
          ? consumption * settings.tariff : null;
        result.push({ ...m, consumption, cost });
      });
    });

    return result.sort((a, b) =>
      a.year !== b.year ? b.year - a.year : b.month - a.month,
    );
  }, [measurements, settings.tariff]);

  // Stats
  const totalConsumption = processed.reduce((s, m) => s + (m.consumption ?? 0), 0);
  const totalCost = processed.reduce((s, m) => s + (m.cost ?? 0), 0);
  const lastReading = processed[0];

  // Filtered history
  const filtered = processed.filter(m => {
    if (searchApt !== 'all' && m.apartmentId !== searchApt) return false;
    if (searchYear && m.year.toString() !== searchYear) return false;
    if (searchMonth && m.month.toString() !== searchMonth) return false;
    return true;
  });

  const getAptName = (id: string) => apartments.find(a => a.id === id)?.name ?? '—';
  const aptMeasCount = (id: string) => measurements.filter(m => m.apartmentId === id).length;

  // ---- HANDLERS ----
  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reading || !regAptId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apartmentId: regAptId, year, month, reading: parseFloat(reading) }),
      });
      if (res.ok) {
        setReading('');
        setMonth(prev => prev === 12 ? 1 : prev + 1);
        if (month === 12) setYear(y => y + 1);
        await fetchAll();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateApt(e: React.FormEvent) {
    e.preventDefault();
    if (!newAptName.trim()) return;
    const res = await fetch('/api/apartments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tariff: val }),
    });
    if (res.ok) {
      await fetchAll();
      setTariffSaved(true);
      setTimeout(() => setTariffSaved(false), 2000);
    }
  }

  function navigate(tab: Tab) {
    setActiveTab(tab);
    setSidebarOpen(false);
  }

  // ─── RENDER HELPERS ───
  function renderSidebar() {
    return (
      <>
        <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
        <aside className={`sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-brand">
            <div className="sidebar-brand-title">⚡ Kilovatio</div>
            <div className="sidebar-brand-sub">Control de consumo eléctrico</div>
          </div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => navigate(item.id)}
              >
                {item.icon}
                {item.label}
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
  }

  // ─── TABS ───
  function renderRegistro() {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <div className="page-title">Registro de Medición</div>
            <div className="page-subtitle">Ingresa la lectura actual del medidor</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div className="stat-label">Total registrado</div>
            <div className="stat-value blue">{measurements.length}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>mediciones</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Consumo acumulado</div>
            <div className="stat-value amber">{totalConsumption.toLocaleString()}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>kWh</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Costo total estimado</div>
            <div className="stat-value green">{settings.tariff > 0 ? `$${totalCost.toFixed(2)}` : 'N/A'}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              {settings.tariff > 0 ? 'calculado' : 'configura tarifa'}
            </div>
          </div>
        </div>

        <div className="grid-2">
          <div className="glass">
            <div className="section-title">Nueva Medición</div>
            {apartments.length === 0 ? (
              <p style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>
                Primero crea un apartamento en la sección{' '}
                <button style={{ background: 'none', border: 'none', color: 'var(--primary-hover)', cursor: 'pointer', fontWeight: 700 }} onClick={() => navigate('apartamentos')}>Apartamentos</button>.
              </p>
            ) : (
              <form onSubmit={handleRegisterSubmit}>
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
                  <input type="number" id="reading" className="form-input" value={reading} onChange={e => setReading(e.target.value)} step="0.01" placeholder="Ej. 90000" required />
                </div>

                <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting} style={{ marginTop: '0.5rem' }}>
                  {isSubmitting ? 'Guardando...' : 'Registrar Medición'}
                </button>
              </form>
            )}
          </div>

          <div className="glass">
            <div className="section-title">Últimos Registros</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Apartamento</th>
                    <th>Fecha</th>
                    <th>Consumo</th>
                  </tr>
                </thead>
                <tbody>
                  {processed.slice(0, 6).map(m => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 500 }}>{getAptName(m.apartmentId)}</td>
                      <td>{MONTHS[m.month - 1]} {m.year}</td>
                      <td>
                        {m.consumption !== null
                          ? <span className="badge badge-amber">+{m.consumption.toLocaleString()} kWh</span>
                          : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Inicial</span>}
                      </td>
                    </tr>
                  ))}
                  {processed.length === 0 && (
                    <tr><td colSpan={3} className="empty-state">Sin datos aún</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {lastReading && (
              <div style={{ marginTop: '1.25rem', padding: '0.85rem 1rem', background: 'rgba(10,15,30,0.4)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Última lectura registrada</div>
                <div style={{ fontWeight: 700, fontSize: '1.4rem', color: 'var(--primary-hover)' }}>
                  {lastReading.reading.toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>kWh</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{MONTHS[lastReading.month - 1]} {lastReading.year} · {getAptName(lastReading.apartmentId)}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderHistorial() {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <div className="page-title">Historial</div>
            <div className="page-subtitle">{filtered.length} registros encontrados</div>
          </div>
          <button className="btn btn-success no-print" onClick={() => window.print()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Imprimir Reporte
          </button>
        </div>

        <div className="glass">
          <div className="filters-bar no-print">
            <select className="form-input form-input-sm" style={{ width: 'auto' }} value={searchApt} onChange={e => setSearchApt(e.target.value)}>
              <option value="all" style={{ background: '#0a0f1e' }}>Todos los apartamentos</option>
              {apartments.map(a => <option key={a.id} value={a.id} style={{ background: '#0a0f1e' }}>{a.name}</option>)}
            </select>
            <input type="number" className="form-input form-input-sm" style={{ width: '110px' }} placeholder="Año" value={searchYear} onChange={e => setSearchYear(e.target.value)} />
            <select className="form-input form-input-sm" style={{ width: 'auto' }} value={searchMonth} onChange={e => setSearchMonth(e.target.value)}>
              <option value="" style={{ background: '#0a0f1e' }}>Todos los meses</option>
              {MONTHS.map((m, i) => <option key={m} value={i + 1} style={{ background: '#0a0f1e' }}>{m}</option>)}
            </select>
            {(searchApt !== 'all' || searchYear || searchMonth) && (
              <button className="btn btn-danger" onClick={() => { setSearchApt('all'); setSearchYear(''); setSearchMonth(''); }}>
                Limpiar
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
                  <th>Lectura</th>
                  <th>Consumo</th>
                  {settings.tariff > 0 && <th>Costo</th>}
                  <th className="no-print">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600 }}>{getAptName(m.apartmentId)}</td>
                    <td>{MONTHS[m.month - 1]}</td>
                    <td>{m.year}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.95rem' }}>{m.reading.toLocaleString()}</td>
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
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="empty-state">No se encontraron registros con los filtros aplicados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  function renderApartamentos() {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <div className="page-title">Apartamentos</div>
            <div className="page-subtitle">Administra tus medidores y unidades</div>
          </div>
        </div>

        <div className="grid-2">
          <div className="glass">
            <div className="section-title">Nuevo Apartamento</div>
            <form onSubmit={handleCreateApt}>
              <div className="form-group">
                <label htmlFor="aptName">Nombre del apartamento / medidor</label>
                <input type="text" id="aptName" className="form-input" placeholder="Ej. Apto 1A, Bodega, Oficina" value={newAptName} onChange={e => setNewAptName(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary btn-full">Añadir Apartamento</button>
            </form>
          </div>

          <div className="glass">
            <div className="section-title">{apartments.length} Apartamento{apartments.length !== 1 ? 's' : ''} registrado{apartments.length !== 1 ? 's' : ''}</div>
            {apartments.length === 0 ? (
              <div className="empty-state">Ningún apartamento registrado aún. Crea uno.</div>
            ) : (
              <div className="apt-list">
                {apartments.map(a => {
                  const count = aptMeasCount(a.id);
                  return (
                    <div key={a.id} className="apt-card">
                      <div>
                        <div className="apt-card-name">{a.name}</div>
                        <div className="apt-card-meta">{count} medición{count !== 1 ? 'es' : ''}</div>
                      </div>
                      <button className="btn btn-danger" onClick={() => handleDeleteApt(a.id)}>Eliminar</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderAjustes() {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <div className="page-title">Ajustes</div>
            <div className="page-subtitle">Configura la tarifa eléctrica</div>
          </div>
        </div>

        <div className="grid-2">
          <div className="glass">
            <div className="section-title">Tarifa Eléctrica</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              Define el precio por kilovatio-hora (kWh). Esto permite calcular el costo estimado en el historial.
            </p>
            <form onSubmit={handleSaveTariff}>
              <div className="form-group">
                <label htmlFor="tariff">Precio por kWh ($)</label>
                <input type="number" id="tariff" className="form-input" value={tariffInput} onChange={e => setTariffInput(e.target.value)} step="0.0001" placeholder="Ej. 0.2500" required />
              </div>
              <button type="submit" className="btn btn-primary">
                {tariffSaved ? '✓ Guardado' : 'Guardar Tarifa'}
              </button>
            </form>
          </div>

          <div className="glass">
            <div className="section-title">Acerca del Sistema</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
              <div>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>¿Cómo funciona?</span>
                <p style={{ marginTop: '0.3rem' }}>El medidor eléctrico es acumulativo y nunca se reinicia. El sistema calcula el consumo real restando la lectura anterior de la actual.</p>
              </div>
              <div style={{ background: 'rgba(10,15,30,0.4)', borderRadius: '8px', padding: '0.85rem', border: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--text)' }}>
                  <div>Mes 1: 85,000 kWh (lectura)</div>
                  <div>Mes 2: 90,000 kWh (lectura)</div>
                  <div style={{ marginTop: '0.5rem', color: 'var(--success)' }}>Consumo real = 5,000 kWh</div>
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>Base de datos</span>
                <p style={{ marginTop: '0.3rem' }}>Los datos se guardan localmente en archivos CSV en la carpeta <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0 4px', borderRadius: '3px' }}>/data</code>.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabContent: Record<Tab, React.ReactNode> = {
    registro: renderRegistro(),
    historial: renderHistorial(),
    apartamentos: renderApartamentos(),
    ajustes: renderAjustes(),
  };

  return (
    <div className="app-shell">
      {/* Mobile header */}
      <header className="mobile-header no-print">
        <div className="mobile-header-title">⚡ Kilovatio</div>
        <button className="hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Menú">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </header>

      {renderSidebar()}

      <main className="main-content">
        {isLoading
          ? <div className="glass" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando datos…</div>
          : tabContent[activeTab]}
      </main>
    </div>
  );
}
