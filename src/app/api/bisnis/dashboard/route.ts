import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth();
    if (!userId) return userId;

    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('businessId');

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

    const uid = userId as string;

    // Run all queries in parallel for performance
    const [
      paidSalesAgg,
      pendingSalesAgg,
      productCount,
      salesCount,
      recentSales,
      kasBesarAgg,
      kasKecilAgg,
      pengeluaranAgg,
      lowStockProducts,
      topSellingProducts,
      monthlySalesData,
    ] = await Promise.all([
      // Total revenue from paid sales
      db.sale.aggregate({
        where: { businessId, userId: uid, paymentStatus: 'paid' },
        _sum: { totalPrice: true },
      }),

      // Pending revenue from pending/partial sales
      db.sale.aggregate({
        where: { businessId, userId: uid, paymentStatus: { in: ['pending', 'partial'] } },
        _sum: { totalPrice: true },
      }),

      // Active product count
      db.product.count({
        where: { businessId, userId: uid, active: true },
      }),

      // Total sales count
      db.sale.count({
        where: { businessId, userId: uid },
      }),

      // Recent 10 sales with product info
      db.sale.findMany({
        where: { businessId, userId: uid },
        include: {
          product: { select: { id: true, name: true, type: true, category: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Kas besar total
      db.businessTransaction.aggregate({
        where: { businessId, userId: uid, type: 'kas_besar' },
        _sum: { amount: true },
      }),

      // Kas kecil total
      db.businessTransaction.aggregate({
        where: { businessId, userId: uid, type: 'kas_kecil' },
        _sum: { amount: true },
      }),

      // Pengeluaran total
      db.businessTransaction.aggregate({
        where: { businessId, userId: uid, type: 'pengeluaran' },
        _sum: { amount: true },
      }),

      // Low stock products (barang with stock <= 5)
      db.product.findMany({
        where: {
          businessId,
          userId: uid,
          active: true,
          type: 'barang',
          stock: { lte: 5 },
        },
        orderBy: { stock: 'asc' },
      }),

      // Top 5 selling products by total sales amount
      db.sale.groupBy({
        by: ['productId'],
        where: { businessId, userId: uid },
        _sum: { totalPrice: true, quantity: true },
        orderBy: { _sum: { totalPrice: 'desc' } },
        take: 5,
      }),

      // Monthly sales trend: last 6 months
      (() => {
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        return db.sale.groupBy({
          by: ['createdAt'],
          where: {
            businessId,
            userId: uid,
            createdAt: { gte: sixMonthsAgo },
          },
          _sum: { totalPrice: true, quantity: true },
          orderBy: { createdAt: 'asc' },
        });
      })(),
    ]);

    // Enrich top selling products with product names
    const topSellingProductIds = topSellingProducts.map((p) => p.productId);
    const topProductsDetails = topSellingProductIds.length > 0
      ? await db.product.findMany({
          where: { id: { in: topSellingProductIds } },
          select: { id: true, name: true, type: true, category: true },
        })
      : [];

    const topSelling = topSellingProducts.map((item) => {
      const detail = topProductsDetails.find((p) => p.id === item.productId);
      return {
        productId: item.productId,
        name: detail?.name || 'Unknown',
        type: detail?.type || '',
        category: detail?.category || '',
        totalAmount: item._sum.totalPrice || 0,
        totalQuantity: item._sum.quantity || 0,
      };
    });

    // Aggregate monthly sales trend into monthly buckets
    const monthlySalesTrend: Array<{
      month: string;
      year: number;
      totalRevenue: number;
      totalQuantity: number;
      salesCount: number;
    }> = [];

    const monthMap = new Map<string, { totalRevenue: number; totalQuantity: number; salesCount: number }>();

    for (const sale of monthlySalesData) {
      const date = new Date(sale.createdAt);
      const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const existing = monthMap.get(key) || { totalRevenue: 0, totalQuantity: 0, salesCount: 0 };
      existing.totalRevenue += sale._sum.totalPrice || 0;
      existing.totalQuantity += sale._sum.quantity || 0;
      existing.salesCount += 1;
      monthMap.set(key, existing);
    }

    // Fill in last 6 months even if no data
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      const data = monthMap.get(key) || { totalRevenue: 0, totalQuantity: 0, salesCount: 0 };
      monthlySalesTrend.push({
        month: key,
        year: d.getFullYear(),
        totalRevenue: data.totalRevenue,
        totalQuantity: data.totalQuantity,
        salesCount: data.salesCount,
      });
    }

    const totalRevenue = paidSalesAgg._sum.totalPrice || 0;
    const pendingRevenue = pendingSalesAgg._sum.totalPrice || 0;
    const kasBesarTotal = kasBesarAgg._sum.amount || 0;
    const kasKecilTotal = kasKecilAgg._sum.amount || 0;
    const pengeluaranTotal = pengeluaranAgg._sum.amount || 0;

    return NextResponse.json({
      totalRevenue,
      pendingRevenue,
      totalProducts: productCount,
      totalSales: salesCount,
      recentSales,
      kasBesarTotal,
      kasKecilTotal,
      pengeluaranTotal,
      netCashFlow: kasBesarTotal - kasKecilTotal - pengeluaranTotal + totalRevenue,
      lowStockProducts,
      topSellingProducts: topSelling,
      monthlySalesTrend,
    });
  } catch (error) {
    console.error('Business Dashboard GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
