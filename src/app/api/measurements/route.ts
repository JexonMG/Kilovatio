import { NextResponse } from 'next/server';
import { getMeasurements, saveMeasurement, deleteMeasurement } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const apartmentId = new URL(request.url).searchParams.get('apartmentId') ?? undefined;
    return NextResponse.json(getMeasurements(apartmentId));
  } catch { return NextResponse.json({ error: 'Failed to fetch measurements' }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const { apartmentId, year, month, reading } = await request.json();
    if (!apartmentId || !year || !month || typeof reading !== 'number')
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    return NextResponse.json(saveMeasurement({ apartmentId, year, month, reading }), { status: 201 });
  } catch { return NextResponse.json({ error: 'Failed to save measurement' }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    deleteMeasurement(id);
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Failed to delete measurement' }, { status: 500 }); }
}
