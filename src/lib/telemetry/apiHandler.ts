import { NextRequest, NextResponse } from 'next/server';
import { getRequestIdFromHeaders, requestIdHeaderName } from './requestId';
import { getRequestDbQueryCount, recordHttpRequest } from './metrics';

type RouteHandler = (req: NextRequest, ctx?: unknown) => Promise<Response> | Response;

/** Wrap API route handlers with request ID, timing, and metrics. */
export function withTelemetry(handler: RouteHandler, routeLabel?: string): RouteHandler {
  return async (req, ctx) => {
    const started = performance.now();
    const requestId = getRequestIdFromHeaders(req.headers);
    let response: Response = NextResponse.json({ error: 'Unhandled' }, { status: 500 });

    try {
      response = await handler(req, ctx);
    } catch (err) {
      response = NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
      throw err;
    } finally {
      const durationMs = performance.now() - started;
      recordHttpRequest({
        route: routeLabel || req.nextUrl.pathname,
        method: req.method,
        status: response.status,
        durationMs,
        dbQueries: getRequestDbQueryCount(),
      });
    }

    const headers = new Headers(response.headers);
    headers.set(requestIdHeaderName(), requestId);
    headers.set('x-trace-id', requestId);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}
