import { createHmac, timingSafeEqual } from 'node:crypto';
export function verifyWebhook(payload, signatureHeader, secret) {
    if (!signatureHeader || !secret)
        return false;
    const body = typeof payload === 'string' ? payload : payload.toString('utf8');
    const expected = createHmac('sha256', secret).update(body).digest('hex');
    const provided = signatureHeader.replace(/^sha256=/i, '').trim();
    try {
        const a = Buffer.from(provided, 'hex');
        const b = Buffer.from(expected, 'hex');
        if (a.length !== b.length)
            return false;
        return timingSafeEqual(a, b);
    }
    catch {
        return false;
    }
}
