import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all profiles
export async function GET() {
  try {
    const profiles = await db.profile.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(profiles);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profiles' },
      { status: 500 }
    );
  }
}

// POST create profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, pin, image, ipAddress, userAgent } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const profile = await db.profile.create({
      data: {
        name,
        pin: pin || '1234',
        image: image || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    console.error('Error creating profile:', error);
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    );
  }
}
