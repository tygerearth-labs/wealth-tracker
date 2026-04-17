'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, Search, Eye, Pencil, ShoppingCart, Inbox, UserCheck, ArrowRightLeft } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrencyFormat } from '@/hooks/useCurrencyFormat';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { SaleForm } from '@/components/bisnis/SaleForm';

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
interface Sale {
  id: string;
  invoiceNumber: string;
  product: { id: string; name: string; type: string; category: string };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paymentStatus: string;
  paidAmount: number;
  paymentDueDate?: string | null;
  customerName?: string | null;
  customerContact?: string | null;
  createdAt: string;
  personalAllocated?: boolean;
}

interface SalesListProps {
  businessId: string;
}

// ── Main Component ───────────────────────────────────────────────
export function SalesList({ businessId }: SalesListProps) {
  const { t } = useTranslation();
  const { formatAmount } = useCurrencyFormat();

  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string }>({ open: false, id: '' });
  const [allocateDialog, setAllocateDialog] = useState<{ open: boolean; id: string; sale: Sale | null }>({ open: false, id: '', sale: null });
  const [editStatusDialog, setEditStatusDialog] = useState<{ open: boolean; id: string; sale: Sale | null }>({ open: false, id: '', sale: null });
  const [editStatus, setEditStatus] = useState('pending');
  const [editPaidAmount, setEditPaidAmount] = useState('');

  const fetchSales = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ businessId });
      if (paymentFilter) params.append('paymentStatus', paymentFilter);
      if (monthFilter && yearFilter) {
        params.append('month', monthFilter);
        params.append('year', yearFilter);
      }

      const res = await fetch(`/api/bisnis/sales?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSales(data.sales || []);
      } else {
        toast.error(t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  }, [businessId, paymentFilter, monthFilter, yearFilter, t]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/bisnis/sales/${deleteDialog.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('bisnis.deleteSaleSuccess', { defaultValue: 'Penjualan berhasil dihapus' }));
        setDeleteDialog({ open: false, id: '' });
        fetchSales();
      } else {
        const err = await res.json();
        toast.error(err.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleAllocate = async () => {
    if (!allocateDialog.sale) return;
    try {
      const res = await fetch('/api/bisnis/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleId: allocateDialog.id,
          amount: allocateDialog.sale.paidAmount,
        }),
      });
      if (res.ok) {
        toast.success(t('bisnis.allocateSuccess', { defaultValue: 'Berhasil dialokasikan ke pribadi' }));
        setAllocateDialog({ open: false, id: '', sale: null });
        fetchSales();
      } else {
        const err = await res.json();
        toast.error(err.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleUpdateStatus = async () => {
    if (!editStatusDialog.sale) return;
    try {
      const res = await fetch(`/api/bisnis/sales/${editStatusDialog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus: editStatus,
          paidAmount: editPaidAmount ? Number(editPaidAmount) : editStatusDialog.sale.paidAmount,
        }),
      });
      if (res.ok) {
        toast.success(t('bisnis.updateStatusSuccess', { defaultValue: 'Status berhasil diperbarui' }));
        setEditStatusDialog({ open: false, id: '', sale: null });
        fetchSales();
      } else {
        const err = await res.json();
        toast.error(err.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  // ── Filter ──────────────────────────────────────────────────────
  const filtered = sales.filter((s) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !s.invoiceNumber.toLowerCase().includes(q) &&
        !s.product.name.toLowerCase().includes(q) &&
        !(s.customerName || '').toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  // ── Year/Month Options ──────────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i);
  const months = [
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return { color: THEME.secondary, label: t('bisnis.paid', { defaultValue: 'Lunas' }) };
      case 'partial':
        return { color: THEME.primary, label: t('bisnis.partial', { defaultValue: 'Sebagian' }) };
      default:
        return { color: THEME.warning, label: t('bisnis.pending', { defaultValue: 'Pending' }) };
    }
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
    <div className="space-y-4">
      {/* ── Filter Bar ── */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: THEME.muted }} />
          <Input
            placeholder={t('bisnis.searchSales', { defaultValue: 'Cari invoice, produk, pelanggan...' })}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm h-9"
            style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, color: THEME.text }}
          />
        </div>
        <Select value={paymentFilter} onValueChange={(val) => setPaymentFilter(val === 'all' ? '' : val)}>
          <SelectTrigger className="w-full sm:w-36 h-9 text-sm" style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, color: THEME.text }}>
            <SelectValue placeholder={t('bisnis.paymentStatus', { defaultValue: 'Status' })} />
          </SelectTrigger>
          <SelectContent style={{ background: '#1E1E1E', border: `1px solid ${THEME.border}` }}>
            <SelectItem value="all" style={{ color: THEME.text }}>{t('bisnis.all', { defaultValue: 'Semua' })}</SelectItem>
            <SelectItem value="pending" style={{ color: THEME.text }}>{t('bisnis.pending', { defaultValue: 'Pending' })}</SelectItem>
            <SelectItem value="partial" style={{ color: THEME.text }}>{t('bisnis.partial', { defaultValue: 'Sebagian' })}</SelectItem>
            <SelectItem value="paid" style={{ color: THEME.text }}>{t('bisnis.paid', { defaultValue: 'Lunas' })}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-full sm:w-32 h-9 text-sm" style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, color: THEME.text }}>
            <SelectValue placeholder={t('bisnis.month', { defaultValue: 'Bulan' })} />
          </SelectTrigger>
          <SelectContent style={{ background: '#1E1E1E', border: `1px solid ${THEME.border}` }}>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value} style={{ color: THEME.text }}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-full sm:w-28 h-9 text-sm" style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, color: THEME.text }}>
            <SelectValue placeholder={t('bisnis.year', { defaultValue: 'Tahun' })} />
          </SelectTrigger>
          <SelectContent style={{ background: '#1E1E1E', border: `1px solid ${THEME.border}` }}>
            {years.map((y) => (
              <SelectItem key={String(y)} value={String(y)} style={{ color: THEME.text }}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="h-9 px-4 rounded-lg text-sm font-semibold shrink-0"
          style={{ background: THEME.primary, color: '#000' }}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">{t('bisnis.addSale', { defaultValue: 'Tambah Penjualan' })}</span>
          <span className="sm:hidden">{t('common.add', { defaultValue: 'Tambah' })}</span>
        </Button>
      </div>

      {/* ── Empty State ── */}
      {filtered.length === 0 && (
        <div className="rounded-xl p-8 sm:p-12 flex flex-col items-center justify-center text-center"
          style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
        >
          <div className="w-14 h-14 rounded-2xl grid place-items-center mb-4 [&>*]:block leading-none" style={{ background: `${THEME.primary}10` }}>
            <ShoppingCart className="h-7 w-7" style={{ color: THEME.primary, opacity: 0.5 }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: THEME.textSecondary }}>
            {t('bisnis.noSales', { defaultValue: 'Belum Ada Penjualan' })}
          </p>
          <p className="text-xs" style={{ color: THEME.muted }}>{t('bisnis.noSalesHint', { defaultValue: 'Mulai dengan menambahkan penjualan pertama Anda' })}</p>
        </div>
      )}

      {/* ── Desktop Table ── */}
      {filtered.length > 0 && (
        <div className="hidden lg:block overflow-x-auto">
          <div className="rounded-xl overflow-hidden" style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: `${THEME.bg}80` }}>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>Invoice</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>{t('bisnis.product', { defaultValue: 'Produk' })}</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>Qty</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>{t('bisnis.total', { defaultValue: 'Total' })}</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>{t('bisnis.paymentStatus', { defaultValue: 'Pembayaran' })}</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>{t('bisnis.customer', { defaultValue: 'Pelanggan' })}</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>{t('bisnis.date', { defaultValue: 'Tanggal' })}</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>{t('bisnis.actions', { defaultValue: 'Aksi' })}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sale) => {
                  const status = getStatusBadge(sale.paymentStatus);
                  return (
                    <tr key={sale.id} className="transition-colors duration-150" style={{ borderTop: `1px solid ${THEME.border}` }}>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono font-semibold" style={{ color: THEME.primary }}>{sale.invoiceNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium" style={{ color: THEME.text }}>{sale.product?.name || '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs" style={{ color: THEME.textSecondary }}>{sale.quantity}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs font-bold" style={{ color: THEME.text }}>{formatAmount(sale.totalPrice)}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className="text-[10px] px-2 py-0.5 font-semibold" style={{ background: `${status.color}20`, color: status.color, border: 'none' }}>
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: THEME.textSecondary }}>{sale.customerName || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: THEME.muted }}>
                          {format(new Date(sale.createdAt), 'dd MMM yyyy', { locale: idLocale })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditStatusDialog({ open: true, id: sale.id, sale })}
                            className="p-2 rounded-lg transition-all hover:scale-110"
                            style={{ background: `${THEME.primary}15`, color: THEME.primary }}
                            title={t('bisnis.editStatus', { defaultValue: 'Edit Status' })}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {(sale.paymentStatus === 'paid' || sale.paymentStatus === 'partial') && !sale.personalAllocated && (
                            <button
                              onClick={() => setAllocateDialog({ open: true, id: sale.id, sale })}
                              className="p-2 rounded-lg transition-all hover:scale-110"
                              style={{ background: `${THEME.secondary}15`, color: THEME.secondary }}
                              title={t('bisnis.allocateToPersonal', { defaultValue: 'Alokasi ke Pribadi' })}
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteDialog({ open: true, id: sale.id })}
                            className="p-2 rounded-lg transition-all hover:scale-110"
                            style={{ background: `${THEME.destructive}15`, color: THEME.destructive }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Mobile Card List ── */}
      {filtered.length > 0 && (
        <div className="lg:hidden space-y-2">
          {filtered.map((sale) => {
            const status = getStatusBadge(sale.paymentStatus);
            return (
              <div key={sale.id} className="rounded-xl p-3" style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono font-semibold" style={{ color: THEME.primary }}>{sale.invoiceNumber}</span>
                      <Badge className="text-[9px] px-1.5 py-0 font-semibold" style={{ background: `${status.color}20`, color: status.color, border: 'none' }}>
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold truncate" style={{ color: THEME.text }}>{sale.product?.name || '-'}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setEditStatusDialog({ open: true, id: sale.id, sale })} className="p-2 rounded-lg" style={{ background: `${THEME.primary}15`, color: THEME.primary }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {(sale.paymentStatus === 'paid' || sale.paymentStatus === 'partial') && !sale.personalAllocated && (
                      <button onClick={() => setAllocateDialog({ open: true, id: sale.id, sale })} className="p-2 rounded-lg" style={{ background: `${THEME.secondary}15`, color: THEME.secondary }}>
                        <UserCheck className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button onClick={() => setDeleteDialog({ open: true, id: sale.id })} className="p-2 rounded-lg" style={{ background: `${THEME.destructive}15`, color: THEME.destructive }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-[10px]" style={{ color: THEME.muted }}>{t('bisnis.total', { defaultValue: 'Total' })}</p>
                      <p className="text-xs font-bold" style={{ color: THEME.text }}>{formatAmount(sale.totalPrice)}</p>
                    </div>
                    <div>
                      <p className="text-[10px]" style={{ color: THEME.muted }}>Qty</p>
                      <p className="text-xs" style={{ color: THEME.textSecondary }}>{sale.quantity}</p>
                    </div>
                    {sale.customerName && (
                      <div>
                        <p className="text-[10px]" style={{ color: THEME.muted }}>{t('bisnis.customer', { defaultValue: 'Pelanggan' })}</p>
                        <p className="text-xs" style={{ color: THEME.textSecondary }}>{sale.customerName}</p>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px]" style={{ color: THEME.muted }}>
                    {format(new Date(sale.createdAt), 'dd MMM', { locale: idLocale })}
                  </span>
                </div>
                {sale.personalAllocated && (
                  <div className="mt-2 pt-2 flex items-center gap-1.5" style={{ borderTop: `1px solid ${THEME.border}` }}>
                    <UserCheck className="h-3 w-3" style={{ color: THEME.secondary }} />
                    <span className="text-[10px] font-medium" style={{ color: THEME.secondary }}>
                      {t('bisnis.allocatedToPersonal', { defaultValue: 'Sudah dialokasikan ke pribadi' })}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Sale Form Dialog ── */}
      <SaleForm open={isFormOpen} onOpenChange={setIsFormOpen} businessId={businessId} onSuccess={fetchSales} />

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.06)' }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: THEME.text }}>{t('bisnis.deleteSale', { defaultValue: 'Hapus Penjualan' })}</AlertDialogTitle>
            <AlertDialogDescription style={{ color: THEME.textSecondary }}>
              {t('bisnis.deleteSaleDesc', { defaultValue: 'Data penjualan yang dihapus tidak dapat dikembalikan. Stok produk akan dikembalikan.' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: 'none' }}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} style={{ background: THEME.destructive, color: '#fff', border: 'none' }}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Allocate to Personal Dialog ── */}
      <AlertDialog open={allocateDialog.open} onOpenChange={(open) => setAllocateDialog({ ...allocateDialog, open })}>
        <AlertDialogContent style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.06)' }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: THEME.text }}>{t('bisnis.allocateTitle', { defaultValue: 'Alokasi ke Pribadi' })}</AlertDialogTitle>
            <AlertDialogDescription style={{ color: THEME.textSecondary }}>
              {t('bisnis.allocateDesc', { defaultValue: 'Alokasikan pendapatan dari penjualan ini ke keuangan pribadi Anda sebagai pemasukan.' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2 px-1" style={{ background: `${THEME.bg}40`, borderRadius: '8px', border: `1px solid ${THEME.border}` }}>
            <p className="text-xs" style={{ color: THEME.muted }}>{t('bisnis.invoice', { defaultValue: 'Invoice' })}</p>
            <p className="text-sm font-semibold" style={{ color: THEME.primary }}>{allocateDialog.sale?.invoiceNumber}</p>
            <p className="text-xs mt-1" style={{ color: THEME.muted }}>{t('bisnis.amount', { defaultValue: 'Jumlah' })}</p>
            <p className="text-sm font-bold" style={{ color: THEME.text }}>
              {formatAmount(allocateDialog.sale?.paidAmount || 0)}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: 'none' }}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleAllocate} style={{ background: THEME.secondary, color: '#000', border: 'none' }}>
              {t('bisnis.allocate', { defaultValue: 'Alokasi' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Edit Status Dialog ── */}
      <Dialog open={editStatusDialog.open} onOpenChange={(open) => setEditStatusDialog({ ...editStatusDialog, open })}>
        <DialogContent className="max-w-sm" style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}>
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold" style={{ color: THEME.text }}>
              {t('bisnis.editStatus', { defaultValue: 'Edit Status Pembayaran' })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1.5">
              <p className="text-xs font-medium" style={{ color: THEME.textSecondary }}>{t('bisnis.paymentStatus', { defaultValue: 'Status Pembayaran' })}</p>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger className="h-9 text-sm" style={{ background: '#0D0D0D', border: `1px solid ${THEME.border}`, color: THEME.text }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: '#1E1E1E', border: `1px solid ${THEME.border}` }}>
                  <SelectItem value="pending" style={{ color: THEME.text }}>{t('bisnis.pending', { defaultValue: 'Pending' })}</SelectItem>
                  <SelectItem value="partial" style={{ color: THEME.text }}>{t('bisnis.partial', { defaultValue: 'Sebagian' })}</SelectItem>
                  <SelectItem value="paid" style={{ color: THEME.text }}>{t('bisnis.paid', { defaultValue: 'Lunas' })}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium" style={{ color: THEME.textSecondary }}>{t('bisnis.paidAmount', { defaultValue: 'Jumlah Dibayar' })}</p>
              <Input
                type="number"
                value={editPaidAmount}
                onChange={(e) => setEditPaidAmount(e.target.value)}
                placeholder={String(editStatusDialog.sale?.paidAmount || 0)}
                className="h-9 text-sm"
                style={{ background: '#0D0D0D', border: `1px solid ${THEME.border}`, color: THEME.text }}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditStatusDialog({ open: false, id: '', sale: null })} className="flex-1 h-9 rounded-lg text-sm" style={{ color: THEME.muted }}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleUpdateStatus} className="flex-1 h-9 rounded-lg text-sm font-semibold" style={{ background: THEME.primary, color: '#000' }}>
                {t('common.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
