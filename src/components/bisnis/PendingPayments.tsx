'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Clock, AlertTriangle, CheckCircle, MessageCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrencyFormat } from '@/hooks/useCurrencyFormat';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
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
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
} as const;

const WA_GREEN = '#25D366';

// ── Types ────────────────────────────────────────────────────────
interface PendingSale {
  id: string;
  invoiceNumber: string;
  product: { id: string; name: string };
  totalPrice: number;
  paidAmount: number;
  paymentStatus: string;
  paymentDueDate?: string | null;
  customerName?: string | null;
  customerContact?: string | null;
  customer?: { id: string; name: string; phone: string | null } | null;
  createdAt: string;
}

interface PendingPaymentsProps {
  businessId: string;
}

// ── Main Component ───────────────────────────────────────────────
export function PendingPayments({ businessId }: PendingPaymentsProps) {
  const { t } = useTranslation();
  const { formatAmount } = useCurrencyFormat();

  const [sales, setSales] = useState<PendingSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPending = useCallback(async () => {
    try {
      setIsLoading(true);
      const [pendingRes, partialRes] = await Promise.all([
        fetch(`/api/bisnis/sales?businessId=${businessId}&paymentStatus=pending`),
        fetch(`/api/bisnis/sales?businessId=${businessId}&paymentStatus=partial`),
      ]);

      const pendingData = pendingRes.ok ? await pendingRes.json() : { sales: [] };
      const partialData = partialRes.ok ? await partialRes.json() : { sales: [] };

      const allPending = [
        ...(pendingData.sales || []),
        ...(partialData.sales || []),
      ];

      setSales(allPending);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  }, [businessId, t]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleMarkPaid = async (sale: PendingSale) => {
    try {
      const res = await fetch(`/api/bisnis/sales/${sale.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus: 'paid',
          paidAmount: sale.totalPrice,
        }),
      });

      if (res.ok) {
        toast.success(t('bisnis.markPaidSuccess', { defaultValue: 'Pembayaran berhasil dicatat' }));
        fetchPending();
      } else {
        toast.error(t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  // ── WhatsApp Helper ─────────────────────────────────────────────
  const getWaReminder = (sale: PendingSale): string | null => {
    const phone = sale.customerContact || sale.customer?.phone;
    if (!phone) return null;
    const remaining = sale.totalPrice - (sale.paidAmount || 0);
    const name = sale.customerName || 'Pelanggan';
    const msg = encodeURIComponent(
      `Halo ${name}, ini pengingat pembayaran untuk invoice ${sale.invoiceNumber}. Sisa tagihan: Rp ${remaining.toLocaleString('id-ID')}. Mohon segera diselesaikan, terima kasih! 🙏`
    );
    const cleaned = phone.replace(/[^0-9]/g, '');
    const indo = cleaned.startsWith('0') ? '62' + cleaned.substring(1) : cleaned;
    return `https://wa.me/${indo}?text=${msg}`;
  };

  // ── Classify ───────────────────────────────────────────────────
  const now = new Date();
  const overdue = sales.filter((s) => s.paymentDueDate && new Date(s.paymentDueDate) < now);
  const upcoming = sales.filter((s) => !s.paymentDueDate || new Date(s.paymentDueDate) >= now);

  const totalPendingAmount = sales.reduce((sum, s) => sum + (s.totalPrice - (s.paidAmount || 0)), 0);

  const getDaysInfo = (sale: PendingSale) => {
    if (!sale.paymentDueDate) return { text: t('bisnis.noDueDate', { defaultValue: 'Tanpa tenggat' }), color: THEME.muted };
    const dueDate = new Date(sale.paymentDueDate);
    const diff = differenceInDays(dueDate, now);
    if (diff < 0) {
      return { text: `${Math.abs(diff)} ${t('bisnis.daysAgo', { defaultValue: 'hari lalu' })}`, color: THEME.destructive };
    } else if (diff === 0) {
      return { text: t('bisnis.dueToday', { defaultValue: 'Jatuh tempo hari ini' }), color: THEME.warning };
    } else if (diff <= 7) {
      return { text: `${diff} ${t('bisnis.daysLeft', { defaultValue: 'hari lagi' })}`, color: THEME.warning };
    } else {
      return { text: `${diff} ${t('bisnis.daysLeft', { defaultValue: 'hari lagi' })}`, color: THEME.muted };
    }
  };

  // ── Sale Item Component ─────────────────────────────────────────
  const SaleItem = ({ sale, isOverdue }: { sale: PendingSale; isOverdue: boolean }) => {
    const daysInfo = getDaysInfo(sale);
    const remaining = sale.totalPrice - (sale.paidAmount || 0);
    const waLink = getWaReminder(sale);

    return (
      <div
        className="flex items-center gap-3 rounded-lg px-3 py-2.5"
        style={{
          background: `${THEME.bg}60`,
          border: `1px solid ${THEME.border}`,
          borderLeft: isOverdue ? `3px solid ${THEME.destructive}` : undefined,
        }}
      >
        <div
          className="w-8 h-8 rounded-lg grid place-items-center shrink-0 [&>*]:block leading-none"
          style={{ background: isOverdue ? `${THEME.destructive}15` : `${THEME.warning}15` }}
        >
          {isOverdue ? (
            <AlertTriangle className="h-3.5 w-3.5" style={{ color: THEME.destructive }} />
          ) : (
            <Clock className="h-3.5 w-3.5" style={{ color: THEME.warning }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold truncate" style={{ color: THEME.text }}>{sale.invoiceNumber}</span>
            <span className="text-[10px] font-semibold" style={{ color: daysInfo.color }}>{daysInfo.text}</span>
          </div>
          <p className="text-[10px] truncate" style={{ color: THEME.muted }}>
            {sale.product?.name || '-'}
            {sale.customerName ? ` · ${sale.customerName}` : ''}
            {sale.paymentDueDate && ` · JT: ${format(new Date(sale.paymentDueDate), 'dd MMM yyyy', { locale: idLocale })}`}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs font-bold" style={{ color: THEME.text }}>{formatAmount(remaining)}</p>
          <div className="flex items-center gap-1.5 mt-1 justify-end">
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="h-7 px-2 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-opacity hover:opacity-80"
                style={{ background: `${WA_GREEN}20`, color: WA_GREEN }}
              >
                <MessageCircle className="h-3 w-3" />
                {t('bisnis.remind', { defaultValue: 'Ingatkan' })}
              </a>
            )}
            <Button
              onClick={() => handleMarkPaid(sale)}
              className="h-7 px-2.5 rounded-lg text-[10px] font-semibold"
              style={{ background: THEME.secondary, color: '#000' }}
            >
              {t('bisnis.pay', { defaultValue: 'Bayar' })}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // ── Loading ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: THEME.primary }} />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Summary ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div
          className="rounded-xl p-4 sm:p-5"
          style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl grid place-items-center [&>*]:block leading-none"
              style={{ background: `${THEME.warning}15` }}
            >
              <Clock className="h-5 w-5" style={{ color: THEME.warning }} />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: THEME.muted }}>
                {t('bisnis.totalPending', { defaultValue: 'Total Tertunda' })}
              </p>
              <p className="text-lg font-bold" style={{ color: THEME.warning }}>
                {formatAmount(totalPendingAmount)}
              </p>
            </div>
          </div>
        </div>
        <div
          className="rounded-xl p-4 sm:p-5"
          style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl grid place-items-center [&>*]:block leading-none"
              style={{ background: `${THEME.destructive}15` }}
            >
              <AlertTriangle className="h-5 w-5" style={{ color: THEME.destructive }} />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: THEME.muted }}>
                {t('bisnis.invoiceCount', { defaultValue: 'Invoice Tertunda' })}
              </p>
              <p className="text-lg font-bold" style={{ color: THEME.destructive }}>
                {sales.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Empty State ── */}
      {sales.length === 0 && (
        <div
          className="rounded-xl p-8 sm:p-12 flex flex-col items-center justify-center text-center"
          style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
        >
          <div className="w-14 h-14 rounded-2xl grid place-items-center mb-4 [&>*]:block leading-none" style={{ background: `${THEME.secondary}10` }}>
            <CheckCircle className="h-7 w-7" style={{ color: THEME.secondary, opacity: 0.5 }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: THEME.textSecondary }}>
            {t('bisnis.allPaid', { defaultValue: 'Semua Pembayaran Lunas' })}
          </p>
          <p className="text-xs" style={{ color: THEME.muted }}>
            {t('bisnis.noPendingDesc', { defaultValue: 'Tidak ada pembayaran yang tertunda saat ini' })}
          </p>
        </div>
      )}

      {/* ── Overdue ── */}
      {overdue.length > 0 && (
        <Card style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}>
          <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full" style={{ background: THEME.destructive }} />
              <CardTitle className="text-sm font-semibold" style={{ color: THEME.text }}>
                {t('bisnis.overdue', { defaultValue: 'Terlambat' })}
              </CardTitle>
              <Badge className="text-[9px] px-1.5 py-0 font-bold ml-auto" style={{ background: `${THEME.destructive}20`, color: THEME.destructive, border: 'none' }}>
                {overdue.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4">
            <div className="space-y-2">
              {overdue.map((sale) => (
                <SaleItem key={sale.id} sale={sale} isOverdue />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Upcoming ── */}
      {upcoming.length > 0 && (
        <Card style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}>
          <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full" style={{ background: THEME.warning }} />
              <CardTitle className="text-sm font-semibold" style={{ color: THEME.text }}>
                {t('bisnis.upcoming', { defaultValue: 'Akan Datang' })}
              </CardTitle>
              <Badge className="text-[9px] px-1.5 py-0 font-bold ml-auto" style={{ background: `${THEME.warning}20`, color: THEME.warning, border: 'none' }}>
                {upcoming.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4">
            <div className="space-y-2">
              {upcoming.map((sale) => (
                <SaleItem key={sale.id} sale={sale} isOverdue={false} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
