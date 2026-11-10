import { Measurement, InvoiceStatus } from './types';

export function getInvoiceStatus(m: Measurement): InvoiceStatus {
  if (m.consumption === null) return 'initial';
  if (m.paid) return 'paid';
  if (!m.dueDate) return 'pending';
  const due = new Date(m.dueDate);
  const now = new Date();
  // Compare at day level: overdue if today is AFTER the 15th (day 16+)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  if (today > dueDay) return 'overdue';
  return 'pending';
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

