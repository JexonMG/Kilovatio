import { NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/db';

export async function GET() {
  try {
    const settings = getSettings();
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tariff } = body;

    if (typeof tariff !== 'number' || isNaN(tariff)) {
      return NextResponse.json({ error: 'Invalid tariff value' }, { status: 400 });
    }

    const updatedSettings = saveSettings({ tariff });
    return NextResponse.json(updatedSettings, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
