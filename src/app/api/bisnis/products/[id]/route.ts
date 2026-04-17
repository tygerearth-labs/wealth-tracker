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

    const product = await db.product.findFirst({
      where: { id, userId: userId as string },
      include: {
        sales: {
          orderBy: { createdAt: 'desc' },
        },
        business: {
          select: { id: true, name: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Product GET by ID error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
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

    // Verify product belongs to user
    const existing = await db.product.findFirst({
      where: { id, userId: uid },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, type, category, description, price, cost, stock, sku, unit } = body;

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Product name cannot be empty' },
        { status: 400 }
      );
    }

    if (type !== undefined && !['barang', 'jasa'].includes(type)) {
      return NextResponse.json(
        { error: 'Product type must be barang or jasa' },
        { status: 400 }
      );
    }

    if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0)) {
      return NextResponse.json(
        { error: 'Invalid price' },
        { status: 400 }
      );
    }

    // Check SKU uniqueness if provided and different from current
    if (sku && sku !== existing.sku) {
      const existingSku = await db.product.findUnique({ where: { sku } });
      if (existingSku) {
        return NextResponse.json(
          { error: 'SKU already exists' },
          { status: 400 }
        );
      }
    }

    const product = await db.product.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(category !== undefined ? { category: category.trim() } : {}),
        ...(description !== undefined ? { description: description || null } : {}),
        ...(price !== undefined ? { price: Number(price) } : {}),
        ...(cost !== undefined ? { cost: cost !== null ? Number(cost) : null } : {}),
        ...(stock !== undefined ? { stock: stock !== null ? Number(stock) : null } : {}),
        ...(sku !== undefined ? { sku: sku || null } : {}),
        ...(unit !== undefined ? { unit } : {}),
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Product PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
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

    // Verify product belongs to user and check sales
    const existing = await db.product.findFirst({
      where: { id, userId: uid },
      include: {
        _count: {
          select: { sales: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (existing._count.sales > 0) {
      // Soft delete: set active = false
      const product = await db.product.update({
        where: { id },
        data: { active: false },
      });
      return NextResponse.json({ product, softDeleted: true });
    } else {
      // Hard delete: no sales associated
      await db.product.delete({
        where: { id },
      });
      return NextResponse.json({ success: true, softDeleted: false });
    }
  } catch (error) {
    console.error('Product DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
