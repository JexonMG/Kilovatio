import { NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/db';

export async function GET() {
  try { return NextResponse.json(getSettings()); }
  catch { return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const { tariff } = await request.json();
    if (typeof tariff !== 'number' || isNaN(tariff))
      return NextResponse.json({ error: 'Invalid tariff' }, { status: 400 });
    return NextResponse.json(saveSettings({ tariff }));
  } catch { return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 }); }
}
