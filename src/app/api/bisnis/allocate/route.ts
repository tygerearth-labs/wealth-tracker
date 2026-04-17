import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

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
    const { saleId, amount, categoryId } = body;

    if (!saleId) {
      return NextResponse.json(
        { error: 'saleId is required' },
        { status: 400 }
      );
    }

    if (amount === undefined || amount === null || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required (must be > 0)' },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);

    // Verify sale belongs to user and check payment status
    const sale = await db.sale.findFirst({
      where: { id: saleId, userId: uid },
      include: {
        product: { select: { id: true, name: true } },
        business: { select: { id: true, name: true } },
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }

    if (!['paid', 'partial'].includes(sale.paymentStatus)) {
      return NextResponse.json(
        { error: 'Sale must be paid or partially paid to allocate' },
        { status: 400 }
      );
    }

    // Check that amount doesn't exceed paid amount
    if (numAmount > sale.paidAmount) {
      return NextResponse.json(
        { error: `Allocation amount (${numAmount}) cannot exceed paid amount (${sale.paidAmount})` },
        { status: 400 }
      );
    }

    // Find or create category
    let category;
    if (categoryId) {
      category = await db.category.findFirst({
        where: { id: categoryId, userId: uid },
      });
      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }
    } else {
      // Find or create "Pendapatan Bisnis" income category
      category = await db.category.findFirst({
        where: {
          name: 'Pendapatan Bisnis',
          type: 'income',
          userId: uid,
        },
      });

      if (!category) {
        category = await db.category.create({
          data: {
            name: 'Pendapatan Bisnis',
            type: 'income',
            color: '#10b981',
            icon: 'Briefcase',
            userId: uid,
          },
        });
      }
    }

    // Create personal transaction and update sale in a transaction
    const result = await db.$transaction(async (tx) => {
      const personalTx = await tx.transaction.create({
        data: {
          type: 'income',
          amount: numAmount,
          description: `Alokasi pendapatan dari penjualan ${sale.product.name} - ${sale.invoiceNumber} (${sale.business.name})`,
          categoryId: category.id,
          userId: uid,
          date: new Date(),
        },
        include: {
          category: true,
        },
      });

      const updatedSale = await tx.sale.update({
        where: { id: saleId },
        data: {
          personalAllocated: true,
          personalAmount: numAmount,
          personalTxId: personalTx.id,
        },
      });

      return { personalTx, sale: updatedSale };
    });

    return NextResponse.json({
      success: true,
      transaction: result.personalTx,
      sale: result.sale,
    }, { status: 201 });
  } catch (error) {
    console.error('Allocate POST error:', error);
    return NextResponse.json(
      { error: 'Failed to allocate sale to personal finance' },
      { status: 500 }
    );
  }
}
