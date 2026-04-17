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

    const customer = await db.customer.findFirst({
      where: { id, userId: userId as string },
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
        business: {
          select: { id: true, name: true },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Compute aggregate data from sales
    const now = new Date();
    const totalSpent = customer.sales
      .filter((s) => s.paymentStatus === 'paid')
      .reduce((sum, s) => sum + s.totalPrice, 0);

    const pendingAmount = customer.sales
      .filter((s) => s.paymentStatus !== 'paid')
      .reduce((sum, s) => sum + (s.totalPrice - (s.paidAmount || 0)), 0);

    const overdueCount = customer.sales.filter(
      (s) =>
        s.paymentDueDate &&
        new Date(s.paymentDueDate) < now &&
        s.paymentStatus !== 'paid'
    ).length;

    const { sales: _sales, ...customerWithoutSales } = customer;

    return NextResponse.json({
      customer: {
        ...customerWithoutSales,
        totalSpent,
        pendingAmount,
        overdueCount,
      },
    });
  } catch (error) {
    console.error('Customer GET by ID error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
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

    // Verify customer belongs to user
    const existing = await db.customer.findFirst({
      where: { id, userId: uid },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, phone, email, address, notes } = body;

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Customer name cannot be empty' },
        { status: 400 }
      );
    }

    // Check phone uniqueness if provided and different from current
    if (phone && typeof phone === 'string' && phone.trim().length > 0 && phone.trim() !== existing.phone) {
      const existingPhone = await db.customer.findFirst({
        where: {
          phone: phone.trim(),
          businessId: existing.businessId,
          id: { not: id },
        },
      });
      if (existingPhone) {
        return NextResponse.json(
          { error: 'A customer with this phone number already exists in this business' },
          { status: 400 }
        );
      }
    }

    const customer = await db.customer.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(phone !== undefined ? { phone: phone && typeof phone === 'string' && phone.trim().length > 0 ? phone.trim() : null } : {}),
        ...(email !== undefined ? { email: email && typeof email === 'string' && email.trim().length > 0 ? email.trim() : null } : {}),
        ...(address !== undefined ? { address: address && typeof address === 'string' && address.trim().length > 0 ? address.trim() : null } : {}),
        ...(notes !== undefined ? { notes: notes && typeof notes === 'string' && notes.trim().length > 0 ? notes.trim() : null } : {}),
      },
    });

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Customer PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
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

    // Verify customer belongs to user
    const existing = await db.customer.findFirst({
      where: { id, userId: uid },
      include: {
        _count: {
          select: { sales: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const hardDelete = searchParams.get('hard') === 'true';

    if (hardDelete) {
      // Hard delete — disconnect sales first (set customerId to null)
      await db.sale.updateMany({
        where: { customerId: id },
        data: { customerId: null },
      });
      await db.customer.delete({
        where: { id },
      });
      return NextResponse.json({ success: true, softDeleted: false });
    } else {
      // Soft delete — set active = false
      const customer = await db.customer.update({
        where: { id },
        data: { active: false },
      });
      return NextResponse.json({ customer, softDeleted: true });
    }
  } catch (error) {
    console.error('Customer DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
