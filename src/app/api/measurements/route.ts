import { NextResponse } from 'next/server';
import { getMeasurements, saveMeasurement, deleteMeasurement } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const apartmentId = searchParams.get('apartmentId') || undefined;
    const measurements = getMeasurements(apartmentId);
    return NextResponse.json(measurements);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch measurements' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { apartmentId, year, month, reading } = body;

    if (!apartmentId || !year || !month || typeof reading !== 'number') {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const newMeasurement = saveMeasurement({ apartmentId, year, month, reading });
    return NextResponse.json(newMeasurement, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to save measurement' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 });
    }

    deleteMeasurement(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete measurement' }, { status: 500 });
  }
}
