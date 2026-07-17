import fs from 'fs';
import path from 'path';

export interface Measurement {
  id: string;
  apartmentId: string;
  year: number;
  month: number;
  reading: number;
  createdAt: string;
}

export interface Apartment {
  id: string;
  name: string;
  createdAt: string;
}

export interface Settings {
  tariff: number;
}

const dbDir = path.join(process.cwd(), 'data');
const measurementsFile = path.join(dbDir, 'measurements.csv');
const apartmentsFile = path.join(dbDir, 'apartments.csv');
const settingsFile = path.join(dbDir, 'settings.json');

export function initDb() {
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  if (!fs.existsSync(measurementsFile)) fs.writeFileSync(measurementsFile, 'id,apartmentId,year,month,reading,createdAt\n', 'utf-8');
  if (!fs.existsSync(apartmentsFile)) {
    fs.writeFileSync(apartmentsFile, 'id,name,createdAt\n', 'utf-8');
    const id = crypto.randomUUID();
    fs.appendFileSync(apartmentsFile, `${id},Principal,${new Date().toISOString()}\n`, 'utf-8');
  }
  if (!fs.existsSync(settingsFile)) fs.writeFileSync(settingsFile, JSON.stringify({ tariff: 0 }), 'utf-8');
}

export function getSettings(): Settings {
  initDb();
  return JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
}

export function saveSettings(s: Settings): Settings {
  initDb();
  fs.writeFileSync(settingsFile, JSON.stringify(s), 'utf-8');
  return s;
}

export function getApartments(): Apartment[] {
  initDb();
  const lines = fs.readFileSync(apartmentsFile, 'utf-8').split('\n').filter(Boolean).slice(1);
  return lines.map(line => {
    const parts = line.split(',');
    const id = parts[0];
    const createdAt = parts[parts.length - 1];
    const name = parts.slice(1, parts.length - 1).join(',');
    return { id, name, createdAt };
  });
}

export function saveApartment(name: string): Apartment {
  initDb();
  const apt: Apartment = { id: crypto.randomUUID(), name, createdAt: new Date().toISOString() };
  fs.appendFileSync(apartmentsFile, `${apt.id},${apt.name},${apt.createdAt}\n`, 'utf-8');
  return apt;
}

export function deleteApartment(id: string) {
  const filtered = getApartments().filter(a => a.id !== id);
  fs.writeFileSync(apartmentsFile, 'id,name,createdAt\n' + filtered.map(a => `${a.id},${a.name},${a.createdAt}\n`).join(''), 'utf-8');
  const meas = getMeasurements().filter(m => m.apartmentId !== id);
  fs.writeFileSync(measurementsFile, 'id,apartmentId,year,month,reading,createdAt\n' + meas.map(m => `${m.id},${m.apartmentId},${m.year},${m.month},${m.reading},${m.createdAt}\n`).join(''), 'utf-8');
}

export function getMeasurements(apartmentIdFilter?: string): Measurement[] {
  initDb();
  const lines = fs.readFileSync(measurementsFile, 'utf-8').split('\n').filter(Boolean).slice(1);
  let data: Measurement[] = lines.map(line => {
    const parts = line.split(',');
    const [id, apartmentId, year, month, reading, createdAt] = parts.length >= 6 ? parts : [parts[0], getApartments()[0]?.id ?? '', parts[1], parts[2], parts[3], parts[4]];
    return { id, apartmentId, year: +year, month: +month, reading: +reading, createdAt };
  });
  if (apartmentIdFilter) data = data.filter(m => m.apartmentId === apartmentIdFilter);
  return data.sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
}

export function saveMeasurement(m: Omit<Measurement, 'id' | 'createdAt'>): Measurement {
  initDb();
  const meas: Measurement = { id: crypto.randomUUID(), ...m, createdAt: new Date().toISOString() };
  fs.appendFileSync(measurementsFile, `${meas.id},${meas.apartmentId},${meas.year},${meas.month},${meas.reading},${meas.createdAt}\n`, 'utf-8');
  return meas;
}

export function deleteMeasurement(id: string) {
  const filtered = getMeasurements().filter(m => m.id !== id);
  fs.writeFileSync(measurementsFile, 'id,apartmentId,year,month,reading,createdAt\n' + filtered.map(m => `${m.id},${m.apartmentId},${m.year},${m.month},${m.reading},${m.createdAt}\n`).join(''), 'utf-8');
}
