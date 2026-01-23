import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST switch active profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileId, pin, ipAddress, userAgent } = body;

    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      );
    }

    const profile = await db.profile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Validate PIN
    if (pin && profile.pin !== pin) {
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 401 }
      );
    }

    // Validate IP and Device if they were recorded when profile was created
    if (profile.ipAddress || profile.userAgent) {
      const ipMatches = !profile.ipAddress || profile.ipAddress === ipAddress;
      const deviceMatches = !profile.userAgent || profile.userAgent === userAgent;

      if (!ipMatches || !deviceMatches) {
        return NextResponse.json(
          {
            error: 'DEVICE_MISMATCH',
            message: 'IP atau Device berbeda dari yang terdaftar di profil ini. Silakan buat profil baru.',
          },
          { status: 403 }
        );
      }
    }

    // Deactivate all profiles
    await db.profile.updateMany({
      data: { isActive: false },
    });

    // Activate selected profile
    const updatedProfile = await db.profile.update({
      where: { id: profileId },
      data: { isActive: true },
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error switching profile:', error);
    return NextResponse.json(
      { error: 'Failed to switch profile' },
      { status: 500 }
    );
  }
}
