import { Measurement, InvoiceStatus } from './types';

export function parseDueDateParts(val: string | Date | null): { year: number; month: number; day: number } | null {
  if (!val) return null;
  if (typeof val === 'string') {
    // If ISO string like 2026-11-15T... or YYYY-MM-DD, extract UTC date parts to avoid timezone shift
    const match = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return {
        year: parseInt(match[1], 10),
        month: parseInt(match[2], 10),
        day: parseInt(match[3], 10),
      };
    }
  }
  const d = new Date(val);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

export function formatDueDate(
  val: string | Date | null,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }
): string {
  const parts = parseDueDateParts(val);
  if (!parts) return '—';
  // Use UTC Date object so Intl formatter renders exactly the intended calendar day
  const d = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  return d.toLocaleDateString('es-CR', { timeZone: 'UTC', ...options });
}

export function getInvoiceStatus(m: Measurement): InvoiceStatus {
  if (m.consumption === null) return 'initial';
  if (m.paid) return 'paid';
  if (!m.dueDate) return 'pending';

  const due = parseDueDateParts(m.dueDate);
  if (!due) return 'pending';

  const now = new Date();
  // Compare at calendar day level: overdue ONLY if today is strictly after the due day (e.g. day 16+)
  const todayOrdinal = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const dueOrdinal = due.year * 10000 + due.month * 100 + due.day;

  if (todayOrdinal > dueOrdinal) return 'overdue';
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

