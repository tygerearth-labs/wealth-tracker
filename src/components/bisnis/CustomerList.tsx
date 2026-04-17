'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search, Inbox, Users, Clock, AlertTriangle, MessageCircle, ChevronDown, ChevronUp, X } from 'lucide-react';
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

// ── Types ────────────────────────────────────────────────────────
interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  totalPurchases: number;
  totalSpent: number;
  active: boolean;
  _count?: { sales: number };
  pendingAmount?: number;
  overdueCount?: number;
  createdAt: string;
}

interface Sale {
  id: string;
  invoiceNumber: string;
  totalPrice: number;
  paidAmount: number;
  paymentStatus: string;
  paymentDueDate?: string | null;
  product: { id: string; name: string } | null;
  customerName?: string | null;
  customerId?: string | null;
  createdAt: string;
}

// ── Helpers ──────────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#BB86FC', '#03DAC6', '#CF6679', '#F9A825', '#64B5F6',
  '#81C784', '#FF8A65', '#BA68C8', '#4DD0E1', '#FFD54F',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getPaymentStatusColor(status: string): string {
  switch (status) {
    case 'overdue': return THEME.destructive;
    case 'pending':
    case 'partial': return THEME.warning;
    case 'paid': return THEME.secondary;
    default: return THEME.muted;
  }
}

function getPaymentStatusLabel(status: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
  switch (status) {
    case 'overdue': return t('bisnis.overdue', { defaultValue: 'Jatuh Tempo' });
    case 'pending': return t('bisnis.pending', { defaultValue: 'Belum Bayar' });
    case 'partial': return t('bisnis.partial', { defaultValue: 'Sebagian' });
    case 'paid': return t('bisnis.paid', { defaultValue: 'Lunas' });
    default: return status;
  }
}

function toWhatsAppUrl(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+62')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('62')) {
    // already correct international format
  } else if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  return `https://wa.me/${cleaned}`;
}

// ── Status filter options ────────────────────────────────────────
const STATUS_FILTERS = [
  { value: '', label: 'Semua' },
  { value: 'pending', label: 'Belum Bayar' },
  { value: 'overdue', label: 'Jatuh Tempo' },
  { value: 'paid', label: 'Lunas' },
];

// ── Main Component ───────────────────────────────────────────────
export function CustomerList({ businessId }: { businessId: string }) {
  const { t } = useTranslation();
  const { formatAmount } = useCurrencyFormat();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [customerSales, setCustomerSales] = useState<Sale[]>([]);
  const [isLoadingSales, setIsLoadingSales] = useState(false);

  // ── Add Customer Form ──────────────────────────────────────────
  const [addForm, setAddForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Fetch Customers ────────────────────────────────────────────
  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ businessId });
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('paymentStatus', statusFilter);

      const res = await fetch(`/api/bisnis/customers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || data || []);
      } else {
        toast.error(t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  }, [businessId, searchQuery, statusFilter, t]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // ── Fetch Sales for Customer Detail ────────────────────────────
  const fetchCustomerSales = useCallback(async (customerId: string) => {
    try {
      setIsLoadingSales(true);
      const res = await fetch(`/api/bisnis/sales?businessId=${businessId}`);
      if (res.ok) {
        const data = await res.json();
        const sales = (data.sales || []).filter(
          (s: Sale) => s.customerId === customerId
        );
        setCustomerSales(sales);
      }
    } catch {
      // silent fail for detail
    } finally {
      setIsLoadingSales(false);
    }
  }, [businessId]);

  // ── Toggle Expand ──────────────────────────────────────────────
  const handleToggleExpand = (customerId: string) => {
    if (expandedCustomerId === customerId) {
      setExpandedCustomerId(null);
      setCustomerSales([]);
    } else {
      setExpandedCustomerId(customerId);
      fetchCustomerSales(customerId);
    }
  };

  // ── Add Customer ───────────────────────────────────────────────
  const handleAddCustomer = async () => {
    if (!addForm.name.trim()) {
      toast.error(t('bisnis.nameRequired', { defaultValue: 'Nama wajib diisi' }));
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/bisnis/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...addForm,
          businessId,
        }),
      });

      if (res.ok) {
        toast.success(t('bisnis.customerAdded', { defaultValue: 'Pelanggan berhasil ditambahkan' }));
        setAddForm({ name: '', phone: '', email: '', address: '', notes: '' });
        setIsAddDialogOpen(false);
        fetchCustomers();
      } else {
        const err = await res.json();
        toast.error(err.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Summary Stats ──────────────────────────────────────────────
  const summary = useMemo(() => {
    const total = customers.length;
    let belumBayarCount = 0;
    let belumBayarAmount = 0;
    let jatuhTempoCount = 0;
    let jatuhTempoAmount = 0;

    for (const c of customers) {
      const pending = (c as any).pendingAmount || 0;
      const overdue = (c as any).overdueCount || 0;
      if (pending > 0) {
        belumBayarCount++;
        belumBayarAmount += pending;
      }
      if (overdue > 0) {
        jatuhTempoCount++;
        jatuhTempoAmount += pending;
      }
    }

    return { total, belumBayarCount, belumBayarAmount, jatuhTempoCount, jatuhTempoAmount };
  }, [customers]);

  // ── Loading ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: THEME.primary }} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Filter Bar ── */}
      <div className="flex flex-col gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: THEME.muted }} />
          <Input
            placeholder={t('bisnis.searchCustomer', { defaultValue: 'Cari nama atau nomor telepon...' })}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm h-9"
            style={{
              background: THEME.surface,
              border: `1px solid ${THEME.border}`,
              color: THEME.text,
            }}
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((sf) => {
            const isActive = statusFilter === sf.value;
            return (
              <button
                key={sf.value}
                onClick={() => setStatusFilter(sf.value)}
                className="h-8 px-3 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: isActive ? THEME.primary : `${THEME.primary}10`,
                  color: isActive ? '#000' : THEME.primary,
                  border: 'none',
                }}
              >
                {sf.label}
              </button>
            );
          })}
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="h-8 px-3 rounded-lg text-xs font-semibold ml-auto"
            style={{ background: THEME.primary, color: '#000' }}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {t('bisnis.addCustomer', { defaultValue: 'Tambah Pelanggan' })}
          </Button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div
          className="rounded-xl p-3 sm:p-4"
          style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl grid place-items-center shrink-0 [&>*]:block leading-none"
              style={{ background: `${THEME.primary}15` }}
            >
              <Users className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: THEME.primary }} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider" style={{ color: THEME.muted }}>
                {t('bisnis.totalCustomers', { defaultValue: 'Total Pelanggan' })}
              </p>
              <p className="text-sm sm:text-lg font-bold" style={{ color: THEME.text }}>
                {summary.total}
              </p>
            </div>
          </div>
        </div>
        <div
          className="rounded-xl p-3 sm:p-4"
          style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl grid place-items-center shrink-0 [&>*]:block leading-none"
              style={{ background: `${THEME.warning}15` }}
            >
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: THEME.warning }} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider" style={{ color: THEME.muted }}>
                {t('bisnis.pending', { defaultValue: 'Belum Bayar' })}
              </p>
              <p className="text-xs sm:text-sm font-bold" style={{ color: THEME.warning }}>
                {summary.belumBayarCount}
              </p>
              <p className="text-[9px] sm:text-[10px] truncate" style={{ color: THEME.muted }}>
                {formatAmount(summary.belumBayarAmount)}
              </p>
            </div>
          </div>
        </div>
        <div
          className="rounded-xl p-3 sm:p-4"
          style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl grid place-items-center shrink-0 [&>*]:block leading-none"
              style={{ background: `${THEME.destructive}15` }}
            >
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: THEME.destructive }} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider" style={{ color: THEME.muted }}>
                {t('bisnis.overdue', { defaultValue: 'Jatuh Tempo' })}
              </p>
              <p className="text-xs sm:text-sm font-bold" style={{ color: THEME.destructive }}>
                {summary.jatuhTempoCount}
              </p>
              <p className="text-[9px] sm:text-[10px] truncate" style={{ color: THEME.muted }}>
                {formatAmount(summary.jatuhTempoAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Empty State ── */}
      {customers.length === 0 && (
        <div
          className="rounded-xl p-8 sm:p-12 flex flex-col items-center justify-center text-center"
          style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
        >
          <div className="w-14 h-14 rounded-2xl grid place-items-center mb-4 [&>*]:block leading-none" style={{ background: `${THEME.primary}10` }}>
            <Users className="h-7 w-7" style={{ color: THEME.primary, opacity: 0.5 }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: THEME.textSecondary }}>
            {searchQuery || statusFilter
              ? t('bisnis.noCustomersFound', { defaultValue: 'Pelanggan tidak ditemukan' })
              : t('bisnis.noCustomers', { defaultValue: 'Belum Ada Pelanggan' })}
          </p>
          <p className="text-xs" style={{ color: THEME.muted }}>
            {!searchQuery && !statusFilter
              ? t('bisnis.noCustomersHint', { defaultValue: 'Mulai dengan menambahkan pelanggan pertama Anda' })
              : t('bisnis.tryChangeFilter', { defaultValue: 'Coba ubah filter pencarian' })}
          </p>
        </div>
      )}

      {/* ── Desktop Table ── */}
      {customers.length > 0 && (
        <div className="hidden sm:block overflow-x-auto">
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: `${THEME.bg}80` }}>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>
                    {t('bisnis.customerName', { defaultValue: 'Pelanggan' })}
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>
                    {t('bisnis.contact', { defaultValue: 'Kontak' })}
                  </th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>
                    {t('bisnis.purchases', { defaultValue: 'Pembelian' })}
                  </th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>
                    {t('bisnis.totalSpent', { defaultValue: 'Total Belanja' })}
                  </th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>
                    {t('bisnis.pendingAmount', { defaultValue: 'Belum Bayar' })}
                  </th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>
                    {t('bisnis.actions', { defaultValue: 'Aksi' })}
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => {
                  const avatarColor = getAvatarColor(customer.name);
                  const initial = customer.name.charAt(0).toUpperCase();
                  const pendingAmount = (customer as any).pendingAmount || 0;
                  const overdueCount = (customer as any).overdueCount || 0;
                  const hasPending = pendingAmount > 0;
                  const hasOverdue = overdueCount > 0;
                  const isExpanded = expandedCustomerId === customer.id;

                  return (
                    <CustomerTableRow
                      key={customer.id}
                      customer={customer}
                      avatarColor={avatarColor}
                      initial={initial}
                      pendingAmount={pendingAmount}
                      overdueAmount={pendingAmount}
                      hasPending={hasPending}
                      hasOverdue={hasOverdue}
                      isExpanded={isExpanded}
                      customerSales={customerSales}
                      isLoadingSales={isLoadingSales}
                      onToggleExpand={() => handleToggleExpand(customer.id)}
                      t={t}
                      formatAmount={formatAmount}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Mobile Card List ── */}
      {customers.length > 0 && (
        <div className="flex sm:hidden space-y-2">
          {customers.map((customer) => {
            const avatarColor = getAvatarColor(customer.name);
            const initial = customer.name.charAt(0).toUpperCase();
            const pendingAmount = (customer as any).pendingAmount || 0;
            const overdueCount = (customer as any).overdueCount || 0;
            const hasPending = pendingAmount > 0;
            const hasOverdue = overdueCount > 0;
            const isExpanded = expandedCustomerId === customer.id;

            return (
              <div
                key={customer.id}
                className="rounded-xl transition-all duration-150"
                style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
              >
                <div className="p-3">
                  {/* Row 1: Avatar + Name + Actions */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full grid place-items-center shrink-0 text-sm font-bold"
                      style={{ background: `${avatarColor}20`, color: avatarColor }}
                    >
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: THEME.text }}>
                        {customer.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {customer.phone && (
                          <p className="text-[10px]" style={{ color: THEME.muted }}>{customer.phone}</p>
                        )}
                        {customer.email && (
                          <p className="text-[10px] truncate" style={{ color: THEME.muted }}>{customer.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {customer.phone && (
                        <a
                          href={toWhatsAppUrl(customer.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg transition-all hover:scale-110"
                          style={{ background: 'rgba(37,211,102,0.15)', color: '#25D366' }}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleToggleExpand(customer.id)}
                        className="p-2 rounded-lg transition-all"
                        style={{ background: `${THEME.primary}15`, color: THEME.primary }}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Stats */}
                  <div className="flex items-center justify-between gap-2 mt-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-[9px]" style={{ color: THEME.muted }}>{t('bisnis.purchases', { defaultValue: 'Pembelian' })}</p>
                        <p className="text-xs font-semibold" style={{ color: THEME.text }}>
                          {customer._count?.sales || customer.totalPurchases || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px]" style={{ color: THEME.muted }}>{t('bisnis.totalSpent', { defaultValue: 'Total Belanja' })}</p>
                        <p className="text-xs font-semibold" style={{ color: THEME.textSecondary }}>
                          {formatAmount(customer.totalSpent)}
                        </p>
                      </div>
                    </div>
                    {hasPending && (
                      <div className="text-right">
                        <p className="text-[9px]" style={{ color: hasOverdue ? THEME.destructive : THEME.warning }}>
                          {t('bisnis.pending', { defaultValue: 'Belum Bayar' })}
                        </p>
                        <p
                          className="text-xs font-bold"
                          style={{ color: hasOverdue ? THEME.destructive : THEME.warning }}
                        >
                          {formatAmount(pendingAmount)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Expanded Detail (Mobile) ── */}
                {isExpanded && (
                  <div
                    className="px-3 pb-3"
                    style={{ borderTop: `1px solid ${THEME.border}` }}
                  >
                    <div className="mt-3 space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>
                        {t('bisnis.recentTransactions', { defaultValue: 'Transaksi Terakhir' })}
                      </p>
                      {isLoadingSales ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin" style={{ color: THEME.primary }} />
                        </div>
                      ) : customerSales.length === 0 ? (
                        <p className="text-[10px] py-3 text-center" style={{ color: THEME.muted }}>
                          {t('bisnis.noTransactions', { defaultValue: 'Belum ada transaksi' })}
                        </p>
                      ) : (
                        <div className="space-y-1.5 mt-2">
                          {customerSales.slice(0, 10).map((sale) => (
                            <CustomerSaleRow key={sale.id} sale={sale} t={t} formatAmount={formatAmount} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add Customer Dialog ── */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setIsAddDialogOpen(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)' }} />
          <div
            className="relative w-full max-w-md rounded-2xl p-5 space-y-4"
            style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.06)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold" style={{ color: THEME.text }}>
                {t('bisnis.addCustomer', { defaultValue: 'Tambah Pelanggan' })}
              </h3>
              <button
                onClick={() => setIsAddDialogOpen(false)}
                className="p-1.5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.06)', color: THEME.muted }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: THEME.textSecondary }}>
                  {t('bisnis.name', { defaultValue: 'Nama' })} <span style={{ color: THEME.destructive }}>*</span>
                </label>
                <Input
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder={t('bisnis.customerNamePlaceholder', { defaultValue: 'Nama pelanggan' })}
                  className="text-sm h-9"
                  style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, color: THEME.text }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: THEME.textSecondary }}>
                  {t('bisnis.phone', { defaultValue: 'Telepon' })}
                </label>
                <Input
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                  className="text-sm h-9"
                  style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, color: THEME.text }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: THEME.textSecondary }}>
                  {t('bisnis.email', { defaultValue: 'Email' })}
                </label>
                <Input
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="email@example.com"
                  type="email"
                  className="text-sm h-9"
                  style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, color: THEME.text }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: THEME.textSecondary }}>
                  {t('bisnis.address', { defaultValue: 'Alamat' })}
                </label>
                <Input
                  value={addForm.address}
                  onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                  placeholder={t('bisnis.addressPlaceholder', { defaultValue: 'Alamat pelanggan' })}
                  className="text-sm h-9"
                  style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, color: THEME.text }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: THEME.textSecondary }}>
                  {t('bisnis.notes', { defaultValue: 'Catatan' })}
                </label>
                <textarea
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  placeholder={t('bisnis.notesPlaceholder', { defaultValue: 'Catatan tambahan...' })}
                  rows={2}
                  className="w-full text-sm rounded-lg px-3 py-2 resize-none outline-none"
                  style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, color: THEME.text }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button
                onClick={() => setIsAddDialogOpen(false)}
                className="flex-1 h-9 rounded-lg text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: 'none' }}
              >
                {t('common.cancel', { defaultValue: 'Batal' })}
              </Button>
              <Button
                onClick={handleAddCustomer}
                disabled={isSubmitting || !addForm.name.trim()}
                className="flex-1 h-9 rounded-lg text-sm font-semibold"
                style={{ background: THEME.primary, color: '#000' }}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t('common.save', { defaultValue: 'Simpan' })
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────

function CustomerTableRow({
  customer,
  avatarColor,
  initial,
  pendingAmount,
  overdueAmount,
  hasPending,
  hasOverdue,
  isExpanded,
  customerSales,
  isLoadingSales,
  onToggleExpand,
  t,
  formatAmount,
}: {
  customer: Customer;
  avatarColor: string;
  initial: string;
  pendingAmount: number;
  overdueAmount: number;
  hasPending: boolean;
  hasOverdue: boolean;
  isExpanded: boolean;
  customerSales: Sale[];
  isLoadingSales: boolean;
  onToggleExpand: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
  formatAmount: (val: number) => string;
}) {
  return (
    <>
      <tr
        className="transition-colors duration-150 cursor-pointer"
        style={{ borderTop: `1px solid ${THEME.border}` }}
        onClick={onToggleExpand}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full grid place-items-center shrink-0 text-xs font-bold"
              style={{ background: `${avatarColor}20`, color: avatarColor }}
            >
              {initial}
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: THEME.text }}>{customer.name}</p>
              {customer.email && (
                <p className="text-[10px] mt-0.5 truncate max-w-[160px]" style={{ color: THEME.muted }}>{customer.email}</p>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className="text-xs" style={{ color: THEME.textSecondary }}>
            {customer.phone || '-'}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <span className="text-xs font-semibold" style={{ color: THEME.text }}>
            {customer._count?.sales || customer.totalPurchases || 0}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <span className="text-xs font-semibold" style={{ color: THEME.text }}>
            {formatAmount(customer.totalSpent)}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          {hasPending ? (
            <span className="text-xs font-bold" style={{ color: hasOverdue ? THEME.destructive : THEME.warning }}>
              {formatAmount(pendingAmount)}
            </span>
          ) : (
            <span className="text-xs" style={{ color: THEME.muted }}>-</span>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-center gap-1.5">
            {customer.phone && (
              <a
                href={toWhatsAppUrl(customer.phone)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-lg transition-all hover:scale-110"
                style={{ background: 'rgba(37,211,102,0.15)', color: '#25D366' }}
              >
                <MessageCircle className="h-3.5 w-3.5" />
              </a>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
              className="p-2 rounded-lg transition-all"
              style={{ background: `${THEME.primary}15`, color: THEME.primary }}
            >
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </td>
      </tr>

      {/* ── Expanded Detail (Desktop) ── */}
      {isExpanded && (
        <tr>
          <td colSpan={6} className="px-4 py-3" style={{ background: `${THEME.bg}40`, borderTop: `1px solid ${THEME.border}` }}>
            <div className="max-w-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: THEME.muted }}>
                {t('bisnis.recentTransactions', { defaultValue: 'Transaksi Terakhir' })}
              </p>
              {isLoadingSales ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: THEME.primary }} />
                </div>
              ) : customerSales.length === 0 ? (
                <p className="text-[10px] py-3 text-center" style={{ color: THEME.muted }}>
                  {t('bisnis.noTransactions', { defaultValue: 'Belum ada transaksi' })}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {customerSales.slice(0, 10).map((sale) => (
                    <CustomerSaleRow key={sale.id} sale={sale} t={t} formatAmount={formatAmount} />
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function CustomerSaleRow({
  sale,
  t,
  formatAmount,
}: {
  sale: Sale;
  t: (key: string, opts?: Record<string, unknown>) => string;
  formatAmount: (val: number) => string;
}) {
  const remaining = sale.totalPrice - (sale.paidAmount || 0);
  const statusColor = getPaymentStatusColor(sale.paymentStatus);
  const statusLabel = getPaymentStatusLabel(sale.paymentStatus, t);

  const dueDateInfo = useMemo(() => {
    if (!sale.paymentDueDate) return null;
    const now = new Date();
    const dueDate = new Date(sale.paymentDueDate);
    const diff = differenceInDays(dueDate, now);
    if (diff < 0) {
      return { text: `${Math.abs(diff)} ${t('bisnis.daysAgo', { defaultValue: 'hari lalu' })}`, color: THEME.destructive };
    } else if (diff === 0) {
      return { text: t('bisnis.dueToday', { defaultValue: 'Jatuh tempo hari ini' }), color: THEME.warning };
    } else if (diff <= 7) {
      return { text: `${diff} ${t('bisnis.daysLeft', { defaultValue: 'hari lagi' })}`, color: THEME.warning };
    } else {
      return { text: format(dueDate, 'dd MMM yyyy', { locale: idLocale }), color: THEME.muted };
    }
  }, [sale.paymentDueDate, t]);

  return (
    <div
      className="flex items-center gap-3 rounded-lg px-3 py-2"
      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold truncate" style={{ color: THEME.text }}>
            {sale.invoiceNumber}
          </span>
          <Badge
            className="text-[9px] px-1.5 py-0 font-semibold shrink-0"
            style={{ background: `${statusColor}20`, color: statusColor, border: 'none' }}
          >
            {statusLabel}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] truncate" style={{ color: THEME.muted }}>
            {sale.product?.name || '-'}
          </span>
          {dueDateInfo && (
            <span className="text-[9px] font-medium shrink-0" style={{ color: dueDateInfo.color }}>
              · {dueDateInfo.text}
            </span>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[11px] font-bold" style={{ color: THEME.text }}>
          {formatAmount(sale.totalPrice)}
        </p>
        {remaining > 0 && sale.paymentStatus !== 'paid' && (
          <p className="text-[9px]" style={{ color: statusColor }}>
            {t('bisnis.remaining', { defaultValue: 'Sisa' })}: {formatAmount(remaining)}
          </p>
        )}
      </div>
    </div>
  );
}
