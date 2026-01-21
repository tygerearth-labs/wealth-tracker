import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all transactions with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    const type = searchParams.get('type'); // INCOME or EXPENSE
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};

    if (profileId) {
      where.profileId = profileId;
    }

    if (type) {
      where.type = type;
    }

    if (month && year) {
      where.date = {
        gte: new Date(parseInt(year), parseInt(month) - 1, 1),
        lt: new Date(parseInt(year), parseInt(month), 1),
      };
    } else if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const transactions = await db.transaction.findMany({
      where,
      include: {
        category: true,
        profile: true,
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

// POST create transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileId, type, amount, description, categoryId, date } = body;

    if (!profileId || !type || !amount || !categoryId) {
      return NextResponse.json(
        { error: 'Profile ID, type, amount, and category ID are required' },
        { status: 400 }
      );
    }

    const transaction = await db.transaction.create({
      data: {
        profileId,
        type,
        amount: parseFloat(amount),
        description,
        categoryId,
        date: date ? new Date(date) : new Date(),
      },
      include: {
        category: true,
        profile: true,
      },
    });

    // Auto-allocate savings for income transactions
    if (type === 'INCOME') {
      try {
        // Get all active savings targets with allocationPercentage > 0
        const savingsTargets = await db.savingsTarget.findMany({
          where: {
            profileId,
            allocationPercentage: {
              gt: 0,
            },
          },
        });

        // Create allocations for each target
        for (const target of savingsTargets) {
          const allocationAmount = (parseFloat(amount) * target.allocationPercentage) / 100;

          if (allocationAmount > 0) {
            await db.savingsAllocation.create({
              data: {
                profileId,
                savingsTargetId: target.id,
                transactionId: transaction.id,
                amount: allocationAmount,
                description: `Alokasi otomatis dari pemasukan`,
              },
            });

            // Update currentAmount of savings target
            await db.savingsTarget.update({
              where: { id: target.id },
              data: {
                currentAmount: {
                  increment: allocationAmount,
                },
              },
            });
          }
        }
      } catch (allocationError) {
        console.error('Error in auto-allocation:', allocationError);
        // Don't fail the transaction if allocation fails
      }
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
