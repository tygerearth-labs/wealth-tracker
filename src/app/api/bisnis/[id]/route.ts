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

    const business = await db.business.findFirst({
      where: { id, userId: userId as string },
      include: {
        _count: {
          select: {
            products: { where: { active: true } },
            sales: true,
            transactions: true,
          },
        },
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ business });
  } catch (error) {
    console.error('Business GET by ID error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business' },
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

    // Verify business belongs to user
    const existing = await db.business.findFirst({
      where: { id, userId: uid },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description, address, phone, email, logo } = body;

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Business name cannot be empty' },
        { status: 400 }
      );
    }

    const business = await db.business.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description || null } : {}),
        ...(address !== undefined ? { address: address || null } : {}),
        ...(phone !== undefined ? { phone: phone || null } : {}),
        ...(email !== undefined ? { email: email || null } : {}),
        ...(logo !== undefined ? { logo: logo || null } : {}),
      },
    });

    return NextResponse.json({ business });
  } catch (error) {
    console.error('Business PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update business' },
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

    // Verify business belongs to user
    const existing = await db.business.findFirst({
      where: { id, userId: uid },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    await db.business.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Business DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete business' },
      { status: 500 }
    );
  }
}
