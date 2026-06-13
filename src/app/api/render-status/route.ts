import { NextRequest, NextResponse } from 'next/server';
import { getShotstackConfig, mapShotstackHttpError } from '@/lib/shotstack';

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const shotstackConfig = getShotstackConfig();
    if (!shotstackConfig) {
      return NextResponse.json({ error: 'Shotstack is not configured' }, { status: 503 });
    }

    const response = await fetch(`${shotstackConfig.renderUrl}/${id}`, {
      headers: {
        'x-api-key': shotstackConfig.apiKey,
      },
    });

    const raw = await response.text();
    let data: {
      success?: boolean;
      response?: {
        status?: string;
        url?: string;
        completion?: number;
        progress?: number;
        percentage?: number;
        percent?: number;
      };
      message?: string;
      error?: string;
    };

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      return NextResponse.json({ error: 'Invalid Shotstack status response' }, { status: 502 });
    }

    if (data.success && data.response) {
      const status = data.response.status;
      const url = data.response.url;

      const rawPercent =
        data.response.completion ??
        data.response.progress ??
        data.response.percentage ??
        data.response.percent ??
        0;

      let percent = Number(rawPercent) || 0;
      if (percent > 0 && percent <= 1) percent = percent * 100;
      percent = Math.max(0, Math.min(100, percent));

      return NextResponse.json({
        status,
        url,
        percent,
      });
    }

    const message = data.message || data.error || `Shotstack status failed (${response.status})`;
    const mapped = mapShotstackHttpError(response.status, message, shotstackConfig.environment);
    return NextResponse.json({ error: mapped.error }, { status: mapped.httpStatus });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
