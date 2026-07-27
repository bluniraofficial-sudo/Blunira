import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/advertisers - Get all advertisers
export async function GET(request: NextRequest) {
  try {
    const advertisers = await db.advertiser.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        companyName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        companyName: 'asc',
      },
    });

    return NextResponse.json({ advertisers });
  } catch (error: any) {
    console.error('Error fetching advertisers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advertisers', details: error.message },
      { status: 500 }
    );
  }
}
