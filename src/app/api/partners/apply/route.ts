import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PartnerApplication from '@/models/PartnerApplication';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name || !body.agency) {
    return NextResponse.json({ error: 'Name and agency required' }, { status: 400 });
  }

  await connectDB();
  await PartnerApplication.create({
    name: body.name,
    agency: body.agency,
    website: body.website,
    churchesServed: body.churchesServed,
    services: body.services,
  });
  return NextResponse.json({ ok: true });
}
