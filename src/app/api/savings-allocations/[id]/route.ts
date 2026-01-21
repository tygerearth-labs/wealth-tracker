import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET single savings allocation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const allocation = await db.savingsAllocation.findUnique({
      where: { id },
    });

    if (!allocation) {
      return NextResponse.json(
        { error: 'Savings allocation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(allocation);
  } catch (error) {
    console.error('Error fetching savings allocation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch savings allocation' },
      { status: 500 }
    );
  }
}

// PUT update savings allocation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, description } = body;

    const oldAllocation = await db.savingsAllocation.findUnique({
      where: { id },
    });

    if (!oldAllocation) {
      return NextResponse.json(
        { error: 'Savings allocation not found' },
        { status: 404 }
      );
    }

    const allocation = await db.savingsAllocation.update({
      where: { id },
      data: {
        ...(amount && { amount: parseFloat(amount) }),
        ...(description !== undefined && { description }),
      },
    });

    // Update savings target if amount changed
    if (amount) {
      const savingsTarget = await db.savingsTarget.findUnique({
        where: { id: oldAllocation.savingsTargetId },
      });

      if (savingsTarget) {
        const difference = parseFloat(amount) - oldAllocation.amount;
        await db.savingsTarget.update({
          where: { id: oldAllocation.savingsTargetId },
          data: {
            currentAmount: savingsTarget.currentAmount + difference,
          },
        });
      }
    }

    return NextResponse.json(allocation);
  } catch (error) {
    console.error('Error updating savings allocation:', error);
    return NextResponse.json(
      { error: 'Failed to update savings allocation' },
      { status: 500 }
    );
  }
}

// DELETE savings allocation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const allocation = await db.savingsAllocation.findUnique({
      where: { id },
    });

    if (allocation) {
      // Update savings target current amount
      const savingsTarget = await db.savingsTarget.findUnique({
        where: { id: allocation.savingsTargetId },
      });

      if (savingsTarget) {
        await db.savingsTarget.update({
          where: { id: allocation.savingsTargetId },
          data: {
            currentAmount: Math.max(0, savingsTarget.currentAmount - allocation.amount),
          },
        });
      }
    }

    await db.savingsAllocation.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Savings allocation deleted successfully' });
  } catch (error) {
    console.error('Error deleting savings allocation:', error);
    return NextResponse.json(
      { error: 'Failed to delete savings allocation' },
      { status: 500 }
    );
  }
}
