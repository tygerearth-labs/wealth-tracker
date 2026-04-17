import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    if (!userId) return userId;

    const { id } = await params;

    const transaction = await db.businessTransaction.findFirst({
      where: { id, userId: userId as string },
      include: {
        business: {
          select: { id: true, name: true },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('Cashflow GET by ID error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    if (!userId) return userId;

    const uid = userId as string;
    const { id } = await params;

    // Check user plan
    const user = await db.user.findUnique({ where: { id: uid } });
    if (!user || user.plan !== 'pro') {
      return NextResponse.json(
        { error: 'Pro plan required for this feature' },
        { status: 403 }
      );
    }

    // Verify transaction belongs to user
    const existing = await db.businessTransaction.findFirst({
      where: { id, userId: uid },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { type, amount, description, category, date, referenceId } = body;

    if (type !== undefined && !['kas_besar', 'kas_kecil', 'pengeluaran'].includes(type)) {
      return NextResponse.json(
        { error: 'type must be kas_besar, kas_kecil, or pengeluaran' },
        { status: 400 }
      );
    }

    if (amount !== undefined && (isNaN(Number(amount)) || Number(amount) <= 0)) {
      return NextResponse.json(
        { error: 'Invalid amount (must be > 0)' },
        { status: 400 }
      );
    }

    const transaction = await db.businessTransaction.update({
      where: { id },
      data: {
        ...(type !== undefined ? { type } : {}),
        ...(amount !== undefined ? { amount: Number(amount) } : {}),
        ...(description !== undefined ? { description: description || null } : {}),
        ...(category !== undefined ? { category: category || null } : {}),
        ...(date !== undefined ? { date: date ? new Date(date) : undefined } : {}),
        ...(referenceId !== undefined ? { referenceId: referenceId || null } : {}),
      },
    });

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('Cashflow PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    if (!userId) return userId;

    const uid = userId as string;
    const { id } = await params;

    // Check user plan
    const user = await db.user.findUnique({ where: { id: uid } });
    if (!user || user.plan !== 'pro') {
      return NextResponse.json(
        { error: 'Pro plan required for this feature' },
        { status: 403 }
      );
    }

    // Verify transaction belongs to user
    const existing = await db.businessTransaction.findFirst({
      where: { id, userId: uid },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    await db.businessTransaction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cashflow DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}
