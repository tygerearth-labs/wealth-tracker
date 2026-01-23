import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Track user visit and check if new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ipAddress, userAgent } = body;

    // Find existing visit by IP address
    const existingVisit = await db.userVisit.findUnique({
      where: { ipAddress },
    });

    if (existingVisit) {
      // Update existing visit
      const updatedVisit = await db.userVisit.update({
        where: { ipAddress },
        data: {
          userAgent: userAgent || existingVisit.userAgent,
          isNewUser: false,
          visitCount: existingVisit.visitCount + 1,
          lastVisit: new Date(),
        },
      });

      // Check if this IP has any profiles
      const profilesCount = await db.profile.count();

      return NextResponse.json({
        isNewUser: false,
        hasProfiles: profilesCount > 0,
        visitCount: updatedVisit.visitCount,
      });
    } else {
      // New user - create visit record
      const newVisit = await db.userVisit.create({
        data: {
          ipAddress,
          userAgent: userAgent || null,
          isNewUser: true,
          visitCount: 1,
          lastVisit: new Date(),
        },
      });

      return NextResponse.json({
        isNewUser: true,
        hasProfiles: false,
        visitCount: 1,
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error tracking user visit:', error);
    return NextResponse.json(
      { error: 'Failed to track user visit' },
      { status: 500 }
    );
  }
}

// Get user visit status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ipAddress = searchParams.get('ip');

    if (!ipAddress) {
      return NextResponse.json(
        { error: 'IP address is required' },
        { status: 400 }
      );
    }

    const visit = await db.userVisit.findUnique({
      where: { ipAddress },
    });

    if (!visit) {
      return NextResponse.json({
        isNewUser: true,
        hasProfiles: false,
        visitCount: 0,
      });
    }

    const profilesCount = await db.profile.count();

    return NextResponse.json({
      isNewUser: visit.isNewUser,
      hasProfiles: profilesCount > 0,
      visitCount: visit.visitCount,
    });
  } catch (error) {
    console.error('Error fetching user visit:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user visit' },
      { status: 500 }
    );
  }
}
