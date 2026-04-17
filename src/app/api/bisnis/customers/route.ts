import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth();
    if (!userId) return userId;

    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('businessId');
    const search = searchParams.get('search');
    const paymentStatus = searchParams.get('paymentStatus');

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

    // Build base where clause
    const baseWhere: Record<string, unknown> = {
      businessId,
      userId: userId as string,
      active: true,
    };

    if (search) {
      baseWhere.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    let customers;

    if (paymentStatus === 'overdue') {
      // Customers with sales where paymentDueDate < now AND paymentStatus in ('pending','partial')
      customers = await db.customer.findMany({
        where: {
          ...baseWhere,
          sales: {
            some: {
              paymentStatus: { in: ['pending', 'partial'] },
              paymentDueDate: { lt: new Date() },
            },
          },
        },
        include: {
          _count: { select: { sales: true } },
          sales: {
            select: {
              paymentStatus: true,
              totalPrice: true,
              paidAmount: true,
              paymentDueDate: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    } else if (paymentStatus === 'pending') {
      // Customers with pending/partial sales that are NOT overdue
      customers = await db.customer.findMany({
        where: {
          ...baseWhere,
          sales: {
            some: {
              paymentStatus: { in: ['pending', 'partial'] },
            },
            none: {
              paymentStatus: { in: ['pending', 'partial'] },
              paymentDueDate: { lt: new Date() },
            },
          },
        },
        include: {
          _count: { select: { sales: true } },
          sales: {
            select: {
              paymentStatus: true,
              totalPrice: true,
              paidAmount: true,
              paymentDueDate: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    } else if (paymentStatus === 'paid') {
      // Customers where ALL sales are paid (or customer has no sales)
      customers = await db.customer.findMany({
        where: {
          ...baseWhere,
          sales: {
            every: {
              paymentStatus: 'paid',
            },
          },
        },
        include: {
          _count: { select: { sales: true } },
          sales: {
            select: {
              paymentStatus: true,
              totalPrice: true,
              paidAmount: true,
              paymentDueDate: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    } else {
      // "all" or no filter — return all active customers
      customers = await db.customer.findMany({
        where: baseWhere,
        include: {
          _count: { select: { sales: true } },
          sales: {
            select: {
              paymentStatus: true,
              totalPrice: true,
              paidAmount: true,
              paymentDueDate: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }

    // Compute aggregate data from sales
    const now = new Date();
    const customersWithAgg = customers.map((c) => {
      const totalSpent = c.sales
        .filter((s) => s.paymentStatus === 'paid')
        .reduce((sum, s) => sum + s.totalPrice, 0);

      const pendingAmount = c.sales
        .filter((s) => s.paymentStatus !== 'paid')
        .reduce((sum, s) => sum + (s.totalPrice - (s.paidAmount || 0)), 0);

      const overdueCount = c.sales.filter(
        (s) =>
          s.paymentDueDate &&
          new Date(s.paymentDueDate) < now &&
          s.paymentStatus !== 'paid'
      ).length;

      const { sales: _sales, ...customerWithoutSales } = c;

      return {
        ...customerWithoutSales,
        totalSpent,
        pendingAmount,
        overdueCount,
      };
    });

    return NextResponse.json({ customers: customersWithAgg });
  } catch (error) {
    console.error('Customers GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
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
    const { name, phone, email, address, notes, businessId } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Customer name is required' },
        { status: 400 }
      );
    }

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
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

    // Idempotent: check if customer with same phone + businessId already exists
    if (phone && typeof phone === 'string' && phone.trim().length > 0) {
      const existingCustomer = await db.customer.findFirst({
        where: {
          phone: phone.trim(),
          businessId,
        },
      });

      if (existingCustomer) {
        return NextResponse.json({ customer: existingCustomer }, { status: 201 });
      }
    }

    const customer = await db.customer.create({
      data: {
        name: name.trim(),
        phone: phone && typeof phone === 'string' && phone.trim().length > 0 ? phone.trim() : null,
        email: email && typeof email === 'string' && email.trim().length > 0 ? email.trim() : null,
        address: address && typeof address === 'string' && address.trim().length > 0 ? address.trim() : null,
        notes: notes && typeof notes === 'string' && notes.trim().length > 0 ? notes.trim() : null,
        businessId,
        userId: uid,
      },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error('Customer POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
