import { NextResponse } from 'next/server';
import { getApartments, saveApartment, deleteApartment } from '@/lib/db';

export async function GET() {
  try { return NextResponse.json(getApartments()); }
  catch { return NextResponse.json({ error: 'Failed to fetch apartments' }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    return NextResponse.json(saveApartment(name.trim()), { status: 201 });
  } catch { return NextResponse.json({ error: 'Failed to create apartment' }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    deleteApartment(id);
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Failed to delete apartment' }, { status: 500 }); }
}
