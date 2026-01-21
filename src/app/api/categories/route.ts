import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all categories with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    const type = searchParams.get('type'); // INCOME or EXPENSE

    const where: any = {};

    if (profileId) {
      where.profileId = profileId;
    }

    if (type) {
      where.type = type;
    }

    const categories = await db.category.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST create category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileId, name, type, color, icon } = body;

    if (!profileId || !name || !type) {
      return NextResponse.json(
        { error: 'Profile ID, name, and type are required' },
        { status: 400 }
      );
    }

    const category = await db.category.create({
      data: {
        profileId,
        name,
        type,
        color: color || '#000000',
        icon: icon || null,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
