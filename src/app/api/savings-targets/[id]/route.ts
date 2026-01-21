import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET single savings target
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const savingsTarget = await db.savingsTarget.findUnique({
      where: { id },
      include: {
        savingsAllocations: true,
      },
    });

    if (!savingsTarget) {
      return NextResponse.json(
        { error: 'Savings target not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(savingsTarget);
  } catch (error) {
    console.error('Error fetching savings target:', error);
    return NextResponse.json(
      { error: 'Failed to fetch savings target' },
      { status: 500 }
    );
  }
}

// PUT update savings target
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, targetAmount, currentAmount, allocationPercentage, startDate, endDate, description } = body;

    const savingsTarget = await db.savingsTarget.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(targetAmount && { targetAmount: parseFloat(targetAmount) }),
        ...(currentAmount !== undefined && { currentAmount: parseFloat(currentAmount) }),
        ...(allocationPercentage !== undefined && { allocationPercentage: parseFloat(allocationPercentage) }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json(savingsTarget);
  } catch (error) {
    console.error('Error updating savings target:', error);
    return NextResponse.json(
      { error: 'Failed to update savings target' },
      { status: 500 }
    );
  }
}

// DELETE savings target
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.savingsTarget.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Savings target deleted successfully' });
  } catch (error) {
    console.error('Error deleting savings target:', error);
    return NextResponse.json(
      { error: 'Failed to delete savings target' },
      { status: 500 }
    );
  }
}
