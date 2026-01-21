import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all savings allocations with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    const savingsTargetId = searchParams.get('savingsTargetId');

    const where: any = {};

    if (profileId) {
      where.profileId = profileId;
    }

    if (savingsTargetId) {
      where.savingsTargetId = savingsTargetId;
    }

    const savingsAllocations = await db.savingsAllocation.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(savingsAllocations);
  } catch (error) {
    console.error('Error fetching savings allocations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch savings allocations' },
      { status: 500 }
    );
  }
}

// POST create savings allocation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileId, savingsTargetId, transactionId, amount, description } = body;

    if (!profileId || !savingsTargetId || !amount) {
      return NextResponse.json(
        { error: 'Profile ID, savings target ID, and amount are required' },
        { status: 400 }
      );
    }

    const allocation = await db.savingsAllocation.create({
      data: {
        profileId,
        savingsTargetId,
        transactionId: transactionId || null,
        amount: parseFloat(amount),
        description: description || null,
      },
    });

    // Update savings target current amount
    const savingsTarget = await db.savingsTarget.findUnique({
      where: { id: savingsTargetId },
    });

    if (savingsTarget) {
      await db.savingsTarget.update({
        where: { id: savingsTargetId },
        data: {
          currentAmount: savingsTarget.currentAmount + parseFloat(amount),
        },
      });
    }

    return NextResponse.json(allocation, { status: 201 });
  } catch (error) {
    console.error('Error creating savings allocation:', error);
    return NextResponse.json(
      { error: 'Failed to create savings allocation' },
      { status: 500 }
    );
  }
}
