import { NextResponse } from 'next/server';
import { getApartments, saveApartment, deleteApartment } from '@/lib/db';

export async function GET() {
  try {
    const apartments = getApartments();
    return NextResponse.json(apartments);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch apartments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }

    const newApartment = saveApartment(name.trim());
    return NextResponse.json(newApartment, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to save apartment' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 });
    }

    deleteApartment(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete apartment' }, { status: 500 });
  }
}
