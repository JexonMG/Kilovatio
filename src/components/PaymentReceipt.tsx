'use client';

import { Measurement } from '@/lib/types';
import { getInvoiceStatus } from '@/lib/utils';
import { MONTHS } from '@/lib/constants';

interface Props {
  measurement: Measurement;
  aptName: string;
  onClose: () => void;
}

export default function PaymentReceipt({ measurement, aptName, onClose }: Props) {
  const status = getInvoiceStatus(measurement);
  const isPaid = measurement.paid;
  const paidAtDate = measurement.paidAt ? new Date(measurement.paidAt) : null;
  const dueDate = measurement.dueDate ? new Date(measurement.dueDate) : null;
  const readingDate = new Date(measurement.createdAt);
  const issueDate = new Date();

  const fmt = (d: Date) => d.toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' });

  const tariff = measurement.tariffAtCreation || 0;
  const consumption = measurement.consumption;
  const cost = measurement.cost;

  return (
    <>
      <div className="receipt-overlay no-print" onClick={onClose} />
      <div className="receipt-modal">
        <button className="receipt-close no-print" onClick={onClose} aria-label="Cerrar">✕</button>
        <div className="receipt-body" id="receipt-print">

          {/* Header */}
          <div className="receipt-header">
            <div className="receipt-logo">⚡ Kilovatio</div>
            <div className="receipt-title">
              {isPaid ? 'COMPROBANTE DE PAGO' : 'RECIBO DE CONSUMO ELÉCTRICO'}
            </div>
          </div>

          {/* Status badge */}
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            {status === 'paid' && (
              <span className="status-badge status-paid" style={{ fontSize: '1rem', padding: '0.4rem 1.5rem' }}>
                ✓ PAGADO
              </span>
            )}
            {status === 'pending' && (
              <span className="status-badge status-pending" style={{ fontSize: '1rem', padding: '0.4rem 1.5rem' }}>
                ⏳ PENDIENTE DE PAGO
              </span>
            )}
            {status === 'overdue' && (
              <span className="status-badge status-overdue" style={{ fontSize: '1rem', padding: '0.4rem 1.5rem' }}>
                ✗ NO PAGADO
              </span>
            )}
          </div>

          {/* Meta */}
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
              <span className="receipt-meta-value">{fmt(readingDate)}</span>
            </div>
            <div className="receipt-meta-row">
              <span className="receipt-meta-label">Fecha de vencimiento:</span>
              <span className="receipt-meta-value" style={{ color: status === 'overdue' && !isPaid ? '#dc2626' : undefined }}>
                {dueDate ? fmt(dueDate) : '—'}
              </span>
            </div>
            {isPaid && paidAtDate && (
              <div className="receipt-meta-row">
                <span className="receipt-meta-label">Fecha de pago:</span>
                <span className="receipt-meta-value" style={{ color: '#059669', fontWeight: 700 }}>
                  {fmt(paidAtDate)}
                </span>
              </div>
            )}
            <div className="receipt-meta-row">
              <span className="receipt-meta-label">Fecha de emisión:</span>
              <span className="receipt-meta-value">{fmt(issueDate)}</span>
            </div>
          </div>

          <div className="receipt-divider" />

          {/* Detail table */}
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
              {consumption !== null ? (
                <>
                  <tr>
                    <td>Consumo del período</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{consumption.toLocaleString()} kWh</td>
                  </tr>
                  {tariff > 0 && (
                    <tr>
                      <td>Tarifa aplicada</td>
                      <td style={{ textAlign: 'right' }}>₡{tariff.toLocaleString()} / kWh</td>
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

          {/* Total */}
          {consumption !== null && cost !== null && cost > 0 && (
            <div className="receipt-total-box">
              <div className="receipt-total-label">TOTAL</div>
              <div className="receipt-total-amount">₡{cost.toFixed(2)}</div>
            </div>
          )}
          {consumption !== null && (!cost || cost === 0) && tariff === 0 && (
            <div className="receipt-total-box" style={{ border: '2px dashed #999', background: 'transparent', color: '#1d4ed8' }}>
              <div className="receipt-total-label">CONSUMO TOTAL</div>
              <div className="receipt-total-amount" style={{ color: '#1d4ed8' }}>{consumption.toLocaleString()} kWh</div>
            </div>
          )}

          <div className="receipt-divider" style={{ marginTop: '1.5rem' }} />
          <div className="receipt-footer">
            Emitido por el sistema Kilovatio · {fmt(issueDate)}
          </div>
        </div>

        <div className="no-print" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button className="btn btn-primary" style={{ padding: '0.75rem 2.5rem', fontSize: '1rem' }}
            onClick={() => window.print()}>
            🖨️ Imprimir Comprobante
          </button>
        </div>
      </div>
    </>
  );
}
