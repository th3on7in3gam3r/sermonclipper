import { NextRequest, NextResponse } from 'next/server';

const SHOTSTACK_SANDBOX_KEY = process.env.SHOTSTACK_SANDBOX_KEY;
const SHOTSTACK_PRODUCTION_KEY = process.env.SHOTSTACK_PRODUCTION_KEY;
const SHOTSTACK_API_KEY = SHOTSTACK_SANDBOX_KEY || SHOTSTACK_PRODUCTION_KEY;
const SHOTSTACK_BASE_URL = SHOTSTACK_SANDBOX_KEY
  ? 'https://api.shotstack.io/edit/stage/render'
  : 'https://api.shotstack.io/edit/v1/render';

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const response = await fetch(`${SHOTSTACK_BASE_URL}/${id}`, {
      headers: {
        'x-api-key': SHOTSTACK_API_KEY || ''
      }
    });

    const data = await response.json();

    if (data.success) {
      const status = data.response.status;
      const url = data.response.url;

      const rawPercent =
        data.response.completion ??
        data.response.progress ??
        data.response.percentage ??
        data.response.percent ??
        0;

      // Shotstack sometimes reports completion as 0..1; normalize to 0..100.
      let percent = Number(rawPercent) || 0;
      if (percent > 0 && percent <= 1) percent = percent * 100;
      percent = Math.max(0, Math.min(100, percent));

      return NextResponse.json({ 
        status, 
        url,
        percent
      });
    } else {
      return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
    }

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
