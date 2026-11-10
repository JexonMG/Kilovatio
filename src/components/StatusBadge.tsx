'use client';

import { Measurement, InvoiceStatus } from '@/lib/types';
import { getInvoiceStatus } from '@/lib/utils';

interface Props {
  measurement: Measurement;
  size?: 'sm' | 'md';
}

const LABELS: Record<InvoiceStatus, string> = {
  initial: 'Inicial',
  paid: '✓ Pagado',
  pending: 'Pendiente',
  overdue: 'NO PAGADO',
};

export default function StatusBadge({ measurement, size = 'md' }: Props) {
  const status = getInvoiceStatus(measurement);
  const fontSize = size === 'sm' ? '0.72rem' : '0.8rem';
  return (
    <span className={`status-badge status-${status}`} style={{ fontSize }}>
      {LABELS[status]}
    </span>
  );
}
