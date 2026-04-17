import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth();
    if (!userId) return userId;

    const businesses = await db.business.findMany({
      where: { userId: userId as string },
      include: {
        _count: {
          select: {
            products: { where: { active: true } },
            sales: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ businesses });
  } catch (error) {
    console.error('Businesses GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch businesses' },
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
    const { name, category, features, description, address, phone, email, logo } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Business name is required' },
        { status: 400 }
      );
    }

    const business = await db.business.create({
      data: {
        name: name.trim(),
        category: category || 'lainnya',
        features: features || 'dashboard,products,sales,cashflow,pending,import-export',
        description: description || null,
        address: address || null,
        phone: phone || null,
        email: email || null,
        logo: logo || null,
        userId: uid,
      },
    });

    return NextResponse.json({ business }, { status: 201 });
  } catch (error) {
    console.error('Business POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create business' },
      { status: 500 }
    );
  }
}
