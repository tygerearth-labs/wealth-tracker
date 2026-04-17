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
    const category = searchParams.get('category');
    const active = searchParams.get('active');

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
    if (category) {
      whereClause.category = category;
    }
    if (active !== null && active !== undefined && active !== '') {
      whereClause.active = active === 'true';
    }

    const products = await db.product.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { sales: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
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
    const { name, type, category, description, price, cost, stock, sku, unit, businessId } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    if (!type || !['barang', 'jasa'].includes(type)) {
      return NextResponse.json(
        { error: 'Product type must be barang or jasa' },
        { status: 400 }
      );
    }

    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      return NextResponse.json(
        { error: 'Product category is required' },
        { status: 400 }
      );
    }

    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
      return NextResponse.json(
        { error: 'Valid price is required' },
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

    // Check SKU uniqueness if provided
    if (sku) {
      const existingSku = await db.product.findUnique({ where: { sku } });
      if (existingSku) {
        return NextResponse.json(
          { error: 'SKU already exists' },
          { status: 400 }
        );
      }
    }

    const product = await db.product.create({
      data: {
        name: name.trim(),
        type,
        category: category.trim(),
        description: description || null,
        price: Number(price),
        cost: cost !== undefined && cost !== null ? Number(cost) : null,
        stock: stock !== undefined && stock !== null ? Number(stock) : null,
        sku: sku || null,
        unit: unit || 'pcs',
        businessId,
        userId: uid,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Product POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
