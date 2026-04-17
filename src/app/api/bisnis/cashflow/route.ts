import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth();
    if (!userId) return userId;

    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('businessId');
    const type = searchParams.get('type');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId query parameter is required' },
        { status: 400 }
      );
    }

    // Verify business belongs to user
    const business = await db.business.findFirst({
      where: { id: businessId, userId: userId as string },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    const whereClause: Record<string, unknown> = {
      businessId,
      userId: userId as string,
    };

    if (type) {
      whereClause.type = type;
    }

    if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 1);
      whereClause.date = {
        gte: startDate,
        lt: endDate,
      };
    }

    const transactions = await db.businessTransaction.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Cashflow GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cashflow transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth();
    if (!userId) return userId;

    const uid = userId as string;

    // Check user plan
    const user = await db.user.findUnique({ where: { id: uid } });
    if (!user || user.plan !== 'pro') {
      return NextResponse.json(
        { error: 'Pro plan required for this feature' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { businessId, type, amount, description, category, date, referenceId } = body;

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      );
    }

    if (!type || !['kas_besar', 'kas_kecil', 'pengeluaran'].includes(type)) {
      return NextResponse.json(
        { error: 'type must be kas_besar, kas_kecil, or pengeluaran' },
        { status: 400 }
      );
    }

    if (amount === undefined || amount === null || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required (must be > 0)' },
        { status: 400 }
      );
    }

    // Verify business belongs to user
    const business = await db.business.findFirst({
      where: { id: businessId, userId: uid },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    const transaction = await db.businessTransaction.create({
      data: {
        businessId,
        userId: uid,
        type,
        amount: Number(amount),
        description: description || null,
        category: category || null,
        date: date ? new Date(date) : new Date(),
        referenceId: referenceId || null,
      },
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error('Cashflow POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create cashflow transaction' },
      { status: 500 }
    );
  }
}
