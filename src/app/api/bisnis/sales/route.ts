import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

function generateInvoiceNumber(): string {
  const now = new Date();
  const yyyymmdd = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${yyyymmdd}-${random}`;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth();
    if (!userId) return userId;

    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('businessId');
    const paymentStatus = searchParams.get('paymentStatus');
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

    if (paymentStatus) {
      whereClause.paymentStatus = paymentStatus;
    }

    if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 1);
      whereClause.createdAt = {
        gte: startDate,
        lt: endDate,
      };
    }

    const sales = await db.sale.findMany({
      where: whereClause,
      include: {
        product: {
          select: { id: true, name: true, type: true, category: true },
        },
        customer: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ sales });
  } catch (error) {
    console.error('Sales GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
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
    const {
      productId,
      businessId,
      quantity,
      unitPrice,
      paymentStatus,
      paidAmount,
      paymentDueDate,
      customerName,
      customerContact,
      customerAddress,
      notes,
    } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      );
    }

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      );
    }

    const numQuantity = Number(quantity);
    const numUnitPrice = Number(unitPrice);

    if (isNaN(numQuantity) || numQuantity <= 0) {
      return NextResponse.json(
        { error: 'Valid quantity is required (must be > 0)' },
        { status: 400 }
      );
    }

    if (isNaN(numUnitPrice) || numUnitPrice < 0) {
      return NextResponse.json(
        { error: 'Valid unitPrice is required (must be >= 0)' },
        { status: 400 }
      );
    }

    // Verify product belongs to user and same business
    const product = await db.product.findFirst({
      where: { id: productId, userId: uid, businessId },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check stock for barang type
    if (product.type === 'barang' && product.stock !== null) {
      if (product.stock < numQuantity) {
        return NextResponse.json(
          { error: `Insufficient stock. Available: ${product.stock}, Requested: ${numQuantity}` },
          { status: 400 }
        );
      }
    }

    const totalPrice = numQuantity * numUnitPrice;

    // Generate unique invoice number
    let invoiceNumber = generateInvoiceNumber();
    let attempts = 0;
    while (await db.sale.findUnique({ where: { invoiceNumber } }) && attempts < 10) {
      invoiceNumber = generateInvoiceNumber();
      attempts++;
    }

    // Use a transaction to create sale, decrement stock, and auto-link customer atomically
    const sale = await db.$transaction(async (tx) => {
      const createdSale = await tx.sale.create({
        data: {
          invoiceNumber,
          productId,
          businessId,
          userId: uid,
          quantity: numQuantity,
          unitPrice: numUnitPrice,
          totalPrice,
          paymentStatus: paymentStatus || 'pending',
          paidAmount: paidAmount !== undefined && paidAmount !== null ? Number(paidAmount) : 0,
          paymentDueDate: paymentDueDate ? new Date(paymentDueDate) : null,
          customerName: customerName || null,
          customerContact: customerContact || null,
          customerAddress: customerAddress || null,
          notes: notes || null,
        },
        include: {
          product: {
            select: { id: true, name: true, type: true, category: true },
          },
          customer: {
            select: { id: true, name: true, phone: true },
          },
        },
      });

      // Auto-decrement stock for barang type
      if (product.type === 'barang' && product.stock !== null) {
        await tx.product.update({
          where: { id: productId },
          data: { stock: { decrement: numQuantity } },
        });
      }

      // Auto-link customer if customerName and/or customerContact provided
      let linkedCustomerId: string | null = null;

      if (customerContact && typeof customerContact === 'string' && customerContact.trim().length > 0) {
        // Step 1: Find existing customer by phone + businessId
        const existingByPhone = await tx.customer.findFirst({
          where: { phone: customerContact.trim(), businessId, active: true },
        });

        if (existingByPhone) {
          linkedCustomerId = existingByPhone.id;
          await tx.customer.update({
            where: { id: linkedCustomerId },
            data: {
              totalPurchases: { increment: 1 },
              totalSpent: { increment: totalPrice },
            },
          });
        } else if (customerName && typeof customerName === 'string' && customerName.trim().length > 0) {
          // Step 3: Not found by phone, create new customer
          const newCustomer = await tx.customer.create({
            data: {
              name: customerName.trim(),
              phone: customerContact.trim(),
              email: null,
              address: customerAddress || null,
              businessId,
              userId: uid,
              totalPurchases: 1,
              totalSpent: totalPrice,
            },
          });
          linkedCustomerId = newCustomer.id;
        }
      } else if (customerName && typeof customerName === 'string' && customerName.trim().length > 0) {
        // Step 4: Only customerName, no phone — find by name + businessId
        const existingByName = await tx.customer.findFirst({
          where: { name: customerName.trim(), businessId, active: true },
        });

        if (existingByName) {
          linkedCustomerId = existingByName.id;
          await tx.customer.update({
            where: { id: linkedCustomerId },
            data: {
              totalPurchases: { increment: 1 },
              totalSpent: { increment: totalPrice },
            },
          });
        } else {
          // Create new customer without phone
          const newCustomer = await tx.customer.create({
            data: {
              name: customerName.trim(),
              phone: null,
              email: null,
              address: customerAddress || null,
              businessId,
              userId: uid,
              totalPurchases: 1,
              totalSpent: totalPrice,
            },
          });
          linkedCustomerId = newCustomer.id;
        }
      }

      // Link sale to customer if one was found/created
      if (linkedCustomerId) {
        const updatedSale = await tx.sale.update({
          where: { id: createdSale.id },
          data: { customerId: linkedCustomerId },
          include: {
            product: {
              select: { id: true, name: true, type: true, category: true },
            },
            customer: {
              select: { id: true, name: true, phone: true },
            },
          },
        });
        return updatedSale;
      }

      return createdSale;
    });

    return NextResponse.json({ sale }, { status: 201 });
  } catch (error) {
    console.error('Sale POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create sale' },
      { status: 500 }
    );
  }
}
