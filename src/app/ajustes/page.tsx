'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { API_URL } from '@/lib/utils';

export default function AjustesPage() {
  const { theme, fontSize, setTheme, setFontSize } = useTheme();
  const [savedTariff, setSavedTariff] = useState(0);
  const [tariffInput, setTariffInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTariff(); }, []);

  async function fetchTariff() {
    try {
      const s = await fetch(`${API_URL}/api/settings`).then(r => r.json());
      setSavedTariff(s.tariff ?? 0);
      setTariffInput(String(s.tariff ?? 0));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const tariffChanged = !isNaN(parseFloat(tariffInput)) && parseFloat(tariffInput) !== savedTariff;

  async function handleSaveTariff(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(tariffInput);
    if (isNaN(val) || val === savedTariff) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tariff: val }),
      });
      if (res.ok) {
        setSavedTariff(val);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally { setSaving(false); }
  }

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Ajustes</div>
          <div className="page-subtitle">Personalización y configuración del sistema</div>
        </div>
      </div>

      <div className="grid-2">
        {/* ── Left column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Theme */}
          <div className="glass">
            <div className="section-title">🎨 Tema de la aplicación</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              Selecciona el tema visual. Se aplicará en toda la aplicación y se guardará automáticamente.
            </p>
            <div className="theme-toggle">
              <button
                className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => setTheme('dark')}
              >
                🌙 Modo oscuro
              </button>
              <button
                className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => setTheme('light')}
              >
                ☀️ Modo claro
              </button>
            </div>
          </div>

          {/* Font size */}
          <div className="glass">
            <div className="section-title">🔤 Tamaño de letra</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              Ajusta el tamaño de la tipografía. El cambio afecta a toda la aplicación de forma proporcional.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', width: '24px', textAlign: 'center' }}>A</span>
              <input
                type="range"
                min="12"
                max="22"
                step="1"
                value={fontSize}
                onChange={e => setFontSize(+e.target.value)}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', width: '24px', textAlign: 'center' }}>A</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Tamaño actual: {fontSize}px</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" style={{ padding: '0.3rem 0.7rem', fontSize: '0.82rem' }}
                  onClick={() => setFontSize(fontSize - 1)}>−</button>
                <button className="btn btn-secondary" style={{ padding: '0.3rem 0.7rem', fontSize: '0.82rem' }}
                  onClick={() => setFontSize(fontSize + 1)}>+</button>
                <button className="btn btn-ghost" style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }}
                  onClick={() => setFontSize(16)}>Restablecer</button>
              </div>
            </div>
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--input-bg)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '1em' }}>Texto normal</span>
              {' · '}
              <strong style={{ fontSize: '1.1em' }}>Texto destacado</strong>
              {' · '}
              <span style={{ fontSize: '0.85em' }}>Texto secundario</span>
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Tariff */}
          <div className="glass">
            <div className="section-title">⚡ Tarifa eléctrica</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              Define el precio por kWh utilizado para calcular el costo de las facturas.
              Las facturas ya emitidas <strong style={{ color: 'var(--text)' }}>conservan su tarifa original</strong>.
            </p>

            {!loading && (
              <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Tarifa actualmente guardada</div>
                <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1.1rem' }}>
                  {savedTariff > 0 ? `₡${savedTariff.toLocaleString()} / kWh` : 'No definida'}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveTariff}>
              <div className="form-group">
                <label htmlFor="tariff">Nueva tarifa (₡ por kWh)</label>
                <input
                  id="tariff"
                  type="number"
                  className="form-input"
                  value={tariffInput}
                  onChange={e => setTariffInput(e.target.value)}
                  step="0.0001"
                  placeholder="Ej. 100.50"
                />
              </div>

              {saved && (
                <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', color: 'var(--success)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.88rem', marginBottom: '1rem' }}>
                  ✓ Tarifa actualizada correctamente.
                </div>
              )}

              {tariffChanged && (
                <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
                  {saving ? 'Guardando…' : `✓ Confirmar nueva tarifa: ₡${parseFloat(tariffInput).toLocaleString()} / kWh`}
                </button>
              )}

              {!tariffChanged && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
                  Modifica el valor para habilitar el botón de confirmación.
                </p>
              )}
            </form>
          </div>

          {/* System info */}
          <div className="glass">
            <div className="section-title">ℹ️ Cómo funciona el sistema</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.7 }}>
              <p style={{ marginBottom: '1rem' }}>
                El medidor eléctrico es <strong style={{ color: 'var(--text)' }}>acumulativo</strong>. El sistema calcula el consumo
                restando la lectura anterior de la actual.
              </p>
              <div className="info-box mb-4">
                <div>Mes 1: 85,000 kWh (lectura)</div>
                <div>Mes 2: 90,000 kWh (lectura)</div>
                <div style={{ marginTop: '0.5rem', color: 'var(--success)', fontWeight: 600 }}>
                  Consumo real = 5,000 kWh
                </div>
              </div>
              <p>
                Los datos se almacenan en <strong style={{ color: 'var(--text)' }}>MongoDB</strong> en la nube.
                La tarifa guardada en cada factura <strong style={{ color: 'var(--text)' }}>no cambia</strong> aunque
                se modifique la tarifa actual.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

