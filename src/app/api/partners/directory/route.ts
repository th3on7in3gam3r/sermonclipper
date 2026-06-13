import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PartnerApplication from '@/models/PartnerApplication';

export async function GET() {
  await connectDB();
  const partners = await PartnerApplication.find({ status: 'approved' })
    .select('name agency website services affiliateCode')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return NextResponse.json({ partners });
}
