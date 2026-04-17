'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Clock, Wallet, Package, ShoppingCart, AlertTriangle, Inbox } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrencyFormat } from '@/hooks/useCurrencyFormat';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

// ── Theme Constants ──────────────────────────────────────────────
const THEME = {
  bg: '#000000',
  surface: '#121212',
  primary: '#BB86FC',
  secondary: '#03DAC6',
  destructive: '#CF6679',
  warning: '#F9A825',
  muted: '#9E9E9E',
  border: 'rgba(255,255,255,0.08)',
  borderHover: 'rgba(255,255,255,0.15)',
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
} as const;

// ── Types ────────────────────────────────────────────────────────
interface DashboardData {
  totalRevenue: number;
  pendingRevenue: number;
  totalProducts: number;
  totalSales: number;
  kasBesarTotal: number;
  kasKecilTotal: number;
  pengeluaranTotal: number;
  netCashFlow: number;
  recentSales: any[];
  lowStockProducts: any[];
  topSellingProducts: any[];
  monthlySalesTrend: any[];
}

interface BisnisDashboardProps {
  businessId: string;
  businessName: string;
}

// ── Stat Card Component ──────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendValue,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl p-4 sm:p-5 transition-all duration-200 relative overflow-hidden group"
      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
    >
      <div className="absolute inset-0 hidden lg:block rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `inset 0 0 0 1px ${color}25, 0 0 24px ${color}10` }}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg grid place-items-center [&>*]:block leading-none"
            style={{ background: `${color}15` }}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color }} />
          </div>
          {trend && trendValue && (
            <div
              className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: trend === 'up' ? `${THEME.secondary}15` : trend === 'down' ? `${THEME.destructive}15` : `${THEME.muted}15`,
                color: trend === 'up' ? THEME.secondary : trend === 'down' ? THEME.destructive : THEME.muted,
              }}
            >
              {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : trend === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
              {trendValue}
            </div>
          )}
        </div>
        <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider mb-1" style={{ color: THEME.muted }}>
          {label}
        </p>
        <p className="text-base sm:text-lg lg:text-xl font-bold truncate" style={{ color: THEME.text }}>
          {value}
        </p>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
export function BisnisDashboard({ businessId, businessName }: BisnisDashboardProps) {
  const { t } = useTranslation();
  const { formatAmount } = useCurrencyFormat();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/bisnis/dashboard?businessId=${businessId}`);
      if (res.ok) {
        const dashboardData = await res.json();
        setData(dashboardData);
      } else {
        toast.error(t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  }, [businessId, t]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: THEME.primary }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className="rounded-xl p-8 flex flex-col items-center justify-center text-center"
        style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
      >
        <Inbox className="h-8 w-8 mb-2" style={{ color: THEME.muted }} />
        <p className="text-sm" style={{ color: THEME.muted }}>{t('common.noData')}</p>
      </div>
    );
  }

  // ── Row 1: Key Metrics ──────────────────────────────────────────
  const row1Stats = [
    {
      icon: DollarSign,
      label: t('bisnis.totalRevenue', { defaultValue: 'Total Pendapatan' }),
      value: formatAmount(data.totalRevenue),
      color: THEME.secondary,
    },
    {
      icon: Clock,
      label: t('bisnis.pendingPayments', { defaultValue: 'Pembayaran Tertunda' }),
      value: formatAmount(data.pendingRevenue),
      color: THEME.warning,
    },
    {
      icon: Wallet,
      label: t('bisnis.netCashFlow', { defaultValue: 'Arus Kas Bersih' }),
      value: formatAmount(data.netCashFlow),
      color: data.netCashFlow >= 0 ? THEME.secondary : THEME.destructive,
      trend: data.netCashFlow >= 0 ? 'up' : 'down',
    },
  ];

  // ── Row 2: Summary ──────────────────────────────────────────────
  const row2Stats = [
    {
      icon: Package,
      label: t('bisnis.totalProducts', { defaultValue: 'Total Produk' }),
      value: data.totalProducts.toString(),
      color: THEME.primary,
    },
    {
      icon: ShoppingCart,
      label: t('bisnis.totalSales', { defaultValue: 'Total Penjualan' }),
      value: data.totalSales.toString(),
      color: THEME.secondary,
    },
    {
      icon: Wallet,
      label: t('bisnis.kasBesar', { defaultValue: 'Kas Besar' }),
      value: formatAmount(data.kasBesarTotal),
      color: THEME.secondary,
    },
  ];

  // ── Top Selling Max ─────────────────────────────────────────────
  const topSellingMax = data.topSellingProducts.length > 0
    ? Math.max(...data.topSellingProducts.map((p) => p.totalAmount))
    : 1;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Row 1 ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {row1Stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* ── Row 2 ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {row2Stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* ── Row 3: Recent Sales ── */}
      <Card style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}>
        <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full" style={{ background: `linear-gradient(180deg, ${THEME.primary}, ${THEME.secondary})` }} />
            <CardTitle className="text-sm font-semibold" style={{ color: THEME.text }}>
              {t('bisnis.recentSales', { defaultValue: 'Penjualan Terbaru' })}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4">
          {data.recentSales.length === 0 ? (
            <div className="py-6 text-center">
              <Inbox className="h-8 w-8 mx-auto mb-2" style={{ color: THEME.muted, opacity: 0.5 }} />
              <p className="text-xs" style={{ color: THEME.muted }}>{t('bisnis.noSales', { defaultValue: 'Belum ada penjualan' })}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.recentSales.slice(0, 5).map((sale: any) => {
                const statusColor = sale.paymentStatus === 'paid'
                  ? THEME.secondary
                  : sale.paymentStatus === 'partial'
                    ? THEME.primary
                    : THEME.warning;
                const statusLabel = sale.paymentStatus === 'paid'
                  ? t('bisnis.paid', { defaultValue: 'Lunas' })
                  : sale.paymentStatus === 'partial'
                    ? t('bisnis.partial', { defaultValue: 'Sebagian' })
                    : t('bisnis.pending', { defaultValue: 'Pending' });

                return (
                  <div
                    key={sale.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150"
                    style={{ background: `${THEME.bg}60`, border: `1px solid ${THEME.border}` }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg grid place-items-center shrink-0 [&>*]:block leading-none"
                      style={{ background: `${THEME.primary}10` }}
                    >
                      <ShoppingCart className="h-3.5 w-3.5" style={{ color: THEME.primary }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: THEME.text }}>
                        {sale.product?.name || '-'}
                      </p>
                      <p className="text-[10px]" style={{ color: THEME.muted }}>
                        {sale.invoiceNumber}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold" style={{ color: THEME.text }}>
                        {formatAmount(sale.totalPrice)}
                      </p>
                      <Badge
                        className="text-[9px] px-1.5 py-0 font-semibold"
                        style={{ background: `${statusColor}20`, color: statusColor, border: 'none' }}
                      >
                        {statusLabel}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Row 4 & 5: Low Stock + Top Selling ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Low Stock Alerts */}
        <Card style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}>
          <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full" style={{ background: THEME.warning }} />
              <CardTitle className="text-sm font-semibold" style={{ color: THEME.text }}>
                {t('bisnis.lowStock', { defaultValue: 'Stok Rendah' })}
              </CardTitle>
              {data.lowStockProducts.length > 0 && (
                <Badge
                  className="text-[9px] px-1.5 py-0 font-bold ml-auto"
                  style={{ background: `${THEME.warning}20`, color: THEME.warning, border: 'none' }}
                >
                  {data.lowStockProducts.length}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4">
            {data.lowStockProducts.length === 0 ? (
              <div className="py-6 text-center">
                <Package className="h-8 w-8 mx-auto mb-2" style={{ color: THEME.secondary, opacity: 0.5 }} />
                <p className="text-xs" style={{ color: THEME.muted }}>{t('bisnis.allStockOk', { defaultValue: 'Semua stok aman' })}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {data.lowStockProducts.map((product: any) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                    style={{ background: `${THEME.bg}60`, border: `1px solid ${THEME.border}` }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg grid place-items-center shrink-0 [&>*]:block leading-none"
                      style={{ background: `${THEME.warning}15` }}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" style={{ color: THEME.warning }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: THEME.text }}>
                        {product.name}
                      </p>
                      <p className="text-[10px]" style={{ color: THEME.muted }}>{product.category}</p>
                    </div>
                    <Badge
                      className="text-[10px] px-2 py-0.5 font-bold"
                      style={{
                        background: product.stock <= 0 ? `${THEME.destructive}20` : `${THEME.warning}20`,
                        color: product.stock <= 0 ? THEME.destructive : THEME.warning,
                        border: 'none',
                      }}
                    >
                      {product.stock <= 0
                        ? t('bisnis.outOfStock', { defaultValue: 'Habis' })
                        : `${product.stock} ${product.unit || 'pcs'}`}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Selling Products */}
        <Card style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}>
          <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full" style={{ background: `linear-gradient(180deg, ${THEME.secondary}, ${THEME.primary})` }} />
              <CardTitle className="text-sm font-semibold" style={{ color: THEME.text }}>
                {t('bisnis.topSelling', { defaultValue: 'Produk Terlaris' })}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4">
            {data.topSellingProducts.length === 0 ? (
              <div className="py-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2" style={{ color: THEME.muted, opacity: 0.5 }} />
                <p className="text-xs" style={{ color: THEME.muted }}>{t('bisnis.noSalesData', { defaultValue: 'Belum ada data penjualan' })}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.topSellingProducts.map((product: any, idx: number) => {
                  const pct = topSellingMax > 0 ? (product.totalAmount / topSellingMax) * 100 : 0;
                  return (
                    <div key={product.productId} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-5 h-5 rounded-md grid place-items-center text-[10px] font-bold shrink-0"
                            style={{ background: `${THEME.primary}15`, color: THEME.primary }}
                          >
                            {idx + 1}
                          </span>
                          <span className="text-xs font-medium truncate" style={{ color: THEME.text }}>
                            {product.name}
                          </span>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span className="text-xs font-bold" style={{ color: THEME.secondary }}>
                            {formatAmount(product.totalAmount)}
                          </span>
                          <span className="text-[10px] ml-1.5" style={{ color: THEME.muted }}>
                            ({product.totalQuantity}x)
                          </span>
                        </div>
                      </div>
                      <div
                        className="h-2 rounded-full overflow-hidden"
                        style={{ background: `${THEME.border}` }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(pct, 2)}%`,
                            background: `linear-gradient(90deg, ${THEME.secondary}, ${THEME.primary})`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
