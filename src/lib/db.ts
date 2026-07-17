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

// Initialize the CSV and JSON files if they don't exist
export function initDb() {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  if (!fs.existsSync(measurementsFile)) {
    fs.writeFileSync(measurementsFile, 'id,apartmentId,year,month,reading,createdAt\n', 'utf-8');
  }
  if (!fs.existsSync(apartmentsFile)) {
    fs.writeFileSync(apartmentsFile, 'id,name,createdAt\n', 'utf-8');
    // Create a default apartment to avoid breaking existing logic
    saveApartment('Principal');
  }
  if (!fs.existsSync(settingsFile)) {
    fs.writeFileSync(settingsFile, JSON.stringify({ tariff: 0 }), 'utf-8');
  }
}

// ---- SETTINGS ----
export function getSettings(): Settings {
  initDb();
  const content = fs.readFileSync(settingsFile, 'utf-8');
  return JSON.parse(content);
}

export function saveSettings(settings: Settings): Settings {
  initDb();
  fs.writeFileSync(settingsFile, JSON.stringify(settings), 'utf-8');
  return settings;
}

// ---- APARTMENTS ----
export function getApartments(): Apartment[] {
  initDb();
  const content = fs.readFileSync(apartmentsFile, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim() !== '');
  
  const dataLines = lines.slice(1);
  return dataLines.map(line => {
    const [id, ...nameParts] = line.split(',');
    const createdAt = nameParts.pop() || '';
    const name = nameParts.join(','); // Join back in case name had commas
    return { id, name, createdAt };
  });
}

export function saveApartment(name: string): Apartment {
  initDb();
  const newApt: Apartment = {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString()
  };
  const line = `${newApt.id},${newApt.name},${newApt.createdAt}\n`;
  fs.appendFileSync(apartmentsFile, line, 'utf-8');
  return newApt;
}

export function deleteApartment(id: string) {
  const apartments = getApartments();
  const filtered = apartments.filter(a => a.id !== id);
  const header = 'id,name,createdAt\n';
  const lines = filtered.map(a => `${a.id},${a.name},${a.createdAt}\n`).join('');
  fs.writeFileSync(apartmentsFile, header + lines, 'utf-8');

  // Cascade delete measurements
  const measurements = getMeasurements();
  const filteredMeasurements = measurements.filter(m => m.apartmentId !== id);
  const mHeader = 'id,apartmentId,year,month,reading,createdAt\n';
  const mLines = filteredMeasurements.map(m => `${m.id},${m.apartmentId},${m.year},${m.month},${m.reading},${m.createdAt}\n`).join('');
  fs.writeFileSync(measurementsFile, mHeader + mLines, 'utf-8');
}

// ---- MEASUREMENTS ----
export function getMeasurements(apartmentIdFilter?: string): Measurement[] {
  initDb();
  const content = fs.readFileSync(measurementsFile, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim() !== '');
  
  const dataLines = lines.slice(1);
  
  let measurements: Measurement[] = dataLines.map(line => {
    // Check if the old format (id,year,month,reading,createdAt) is used by checking column count
    const parts = line.split(',');
    
    let id, apartmentId, year, month, reading, createdAt;
    
    if (parts.length === 6) {
      [id, apartmentId, year, month, reading, createdAt] = parts;
    } else {
      // Legacy format conversion
      [id, year, month, reading, createdAt] = parts;
      const apts = getApartments();
      apartmentId = apts.length > 0 ? apts[0].id : 'legacy';
    }

    return {
      id,
      apartmentId,
      year: parseInt(year, 10),
      month: parseInt(month, 10),
      reading: parseFloat(reading),
      createdAt
    };
  });

  if (apartmentIdFilter) {
    measurements = measurements.filter(m => m.apartmentId === apartmentIdFilter);
  }

  // Sort by year ascending, then month ascending
  return measurements.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
}

export function saveMeasurement(measurement: Omit<Measurement, 'id' | 'createdAt'>): Measurement {
  initDb();
  
  const newMeasurement: Measurement = {
    id: crypto.randomUUID(),
    apartmentId: measurement.apartmentId,
    year: measurement.year,
    month: measurement.month,
    reading: measurement.reading,
    createdAt: new Date().toISOString()
  };

  const line = `${newMeasurement.id},${newMeasurement.apartmentId},${newMeasurement.year},${newMeasurement.month},${newMeasurement.reading},${newMeasurement.createdAt}\n`;
  fs.appendFileSync(measurementsFile, line, 'utf-8');
  
  return newMeasurement;
}

export function deleteMeasurement(id: string) {
  const measurements = getMeasurements(); // gets all because no filter
  const filtered = measurements.filter(m => m.id !== id);
  
  const header = 'id,apartmentId,year,month,reading,createdAt\n';
  const lines = filtered.map(m => `${m.id},${m.apartmentId},${m.year},${m.month},${m.reading},${m.createdAt}\n`).join('');
  
  fs.writeFileSync(measurementsFile, header + lines, 'utf-8');
}
