import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all savings targets with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');

    const where: any = {};

    if (profileId) {
      where.profileId = profileId;
    }

    const savingsTargets = await db.savingsTarget.findMany({
      where,
      include: {
        savingsAllocations: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(savingsTargets);
  } catch (error) {
    console.error('Error fetching savings targets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch savings targets' },
      { status: 500 }
    );
  }
}

// POST create savings target
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileId, name, targetAmount, allocationPercentage, startDate, endDate, description } = body;

    if (!profileId || !name || !targetAmount || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Profile ID, name, target amount, start date, and end date are required' },
        { status: 400 }
      );
    }

    const savingsTarget = await db.savingsTarget.create({
      data: {
        profileId,
        name,
        targetAmount: parseFloat(targetAmount),
        allocationPercentage: allocationPercentage ? parseFloat(allocationPercentage) : 0,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description: description || null,
      },
    });

    return NextResponse.json(savingsTarget, { status: 201 });
  } catch (error) {
    console.error('Error creating savings target:', error);
    return NextResponse.json(
      { error: 'Failed to create savings target' },
      { status: 500 }
    );
  }
}
