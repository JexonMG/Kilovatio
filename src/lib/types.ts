export interface Measurement {
  id: string;
  apartmentId: string;
  year: number;
  month: number;
  reading: number;
  paid: boolean;
  consumption: number | null;
  cost: number | null;
  tariffAtCreation: number;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface MeasurementWithApt extends Measurement {
  apartmentName?: string;
}

export interface Apartment {
  id: string;
  name: string;
  meter: string;
  paymentDate: string;
  createdAt: string;
}

export interface Settings {
  tariff: number;
}

export interface DashboardData {
  totalApartments: number;
  pendingInvoices: number;
  overdueInvoices: number;
  paidInvoices: number;
  recentPayments: MeasurementWithApt[];
  currentTariff: number;
}

export interface ReportData {
  measurements: MeasurementWithApt[];
  summary: {
    totalConsumption: number;
    totalCost: number;
    avgConsumption: number;
    apartmentCount: number;
  };
}

export type InvoiceStatus = 'initial' | 'paid' | 'pending' | 'overdue';

