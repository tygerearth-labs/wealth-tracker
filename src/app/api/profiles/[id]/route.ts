import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET single profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const profile = await db.profile.findUnique({
      where: { id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT update profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { currentProfileId, name, pin, image } = body;

    // Get the existing profile to validate ownership
    const existingProfile = await db.profile.findUnique({
      where: { id },
    });

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Verify that user can only edit their own profile
    if (currentProfileId && existingProfile.id !== currentProfileId) {
      return NextResponse.json(
        { error: 'You can only edit your own profile' },
        { status: 403 }
      );
    }

    const profile = await db.profile.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(pin && { pin }),
        ...(image !== undefined && { image }),
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

// DELETE profile
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { currentProfileId } = body;

    // Get the profile to be deleted
    const profile = await db.profile.findUnique({
      where: { id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Verify that user can only delete their own active profile
    if (currentProfileId && profile.id !== currentProfileId) {
      return NextResponse.json(
        { error: 'You can only delete your own profile' },
        { status: 403 }
      );
    }

    await db.profile.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting profile:', error);
    return NextResponse.json(
      { error: 'Failed to delete profile' },
      { status: 500 }
    );
  }
}
