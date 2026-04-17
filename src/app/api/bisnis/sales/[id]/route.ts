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

    const sale = await db.sale.findFirst({
      where: { id, userId: userId as string },
      include: {
        product: true,
        business: {
          select: { id: true, name: true },
        },
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ sale });
  } catch (error) {
    console.error('Sale GET by ID error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sale' },
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

    // Verify sale belongs to user
    const existing = await db.sale.findFirst({
      where: { id, userId: uid },
      include: {
        product: { select: { id: true, name: true, type: true, businessId: true } },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      paymentStatus,
      paidAmount,
      paymentDueDate,
      customerName,
      customerContact,
      customerAddress,
      notes,
    } = body;

    const updateData: Record<string, unknown> = {};

    if (paymentStatus !== undefined) {
      if (!['pending', 'partial', 'paid'].includes(paymentStatus)) {
        return NextResponse.json(
          { error: 'paymentStatus must be pending, partial, or paid' },
          { status: 400 }
        );
      }
      updateData.paymentStatus = paymentStatus;
    }

    if (paidAmount !== undefined) {
      updateData.paidAmount = Number(paidAmount);
    }

    if (paymentDueDate !== undefined) {
      updateData.paymentDueDate = paymentDueDate ? new Date(paymentDueDate) : null;
    }

    if (customerName !== undefined) {
      updateData.customerName = customerName || null;
    }

    if (customerContact !== undefined) {
      updateData.customerContact = customerContact || null;
    }

    if (customerAddress !== undefined) {
      updateData.customerAddress = customerAddress || null;
    }

    if (notes !== undefined) {
      updateData.notes = notes || null;
    }

    // Execute update + potential personal allocation in a transaction
    const sale = await db.$transaction(async (tx) => {
      const updatedSale = await tx.sale.update({
        where: { id },
        data: updateData,
        include: {
          product: { select: { id: true, name: true, type: true, businessId: true } },
          business: { select: { id: true, name: true } },
        },
      });

      // If paymentStatus changed to 'paid' and personalAllocated is true and personalAmount > 0
      // Create a personal Transaction record
      if (
        paymentStatus === 'paid' &&
        existing.personalAllocated &&
        existing.personalAmount &&
        existing.personalAmount > 0 &&
        !existing.personalTxId
      ) {
        // Find or create "Pendapatan Bisnis" income category
        let category = await tx.category.findFirst({
          where: {
            name: 'Pendapatan Bisnis',
            type: 'income',
            userId: uid,
          },
        });

        if (!category) {
          category = await tx.category.create({
            data: {
              name: 'Pendapatan Bisnis',
              type: 'income',
              color: '#10b981',
              icon: 'Briefcase',
              userId: uid,
            },
          });
        }

        const personalTx = await tx.transaction.create({
          data: {
            type: 'income',
            amount: existing.personalAmount,
            description: `Pendapatan dari penjualan ${existing.product.name} - ${existing.invoiceNumber}`,
            categoryId: category.id,
            userId: uid,
            date: new Date(),
          },
        });

        // Update sale with personalTxId
        await tx.sale.update({
          where: { id },
          data: { personalTxId: personalTx.id },
        });

        updatedSale.personalTxId = personalTx.id;
      }

      return updatedSale;
    });

    return NextResponse.json({ sale });
  } catch (error) {
    console.error('Sale PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update sale' },
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

    // Verify sale belongs to user
    const existing = await db.sale.findFirst({
      where: { id, userId: uid },
      include: {
        product: { select: { id: true, type: true } },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }

    await db.$transaction(async (tx) => {
      // If product is barang, restore stock
      if (existing.product.type === 'barang') {
        await tx.product.update({
          where: { id: existing.productId },
          data: { stock: { increment: existing.quantity } },
        });
      }

      // If there's a personal transaction linked, delete it
      if (existing.personalTxId) {
        await tx.transaction.delete({
          where: { id: existing.personalTxId },
        });
      }

      // Delete the sale
      await tx.sale.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sale DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete sale' },
      { status: 500 }
    );
  }
}
