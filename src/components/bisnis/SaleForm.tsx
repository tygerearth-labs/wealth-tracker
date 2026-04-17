'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrencyFormat } from '@/hooks/useCurrencyFormat';
import { toast } from 'sonner';

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
interface SaleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  onSuccess: () => void;
}

// ── Main Component ───────────────────────────────────────────────
export function SaleForm({ open, onOpenChange, businessId, onSuccess }: SaleFormProps) {
  const { t } = useTranslation();
  const { formatAmount } = useCurrencyFormat();

  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentDueDate, setPaymentDueDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Fetch products and customers when dialog opens
  useEffect(() => {
    if (open) {
      fetchProducts();
      fetchCustomers();
    }
  }, [open]);

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const res = await fetch(`/api/bisnis/products?businessId=${businessId}&active=true`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch {
      // silent
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`/api/bisnis/customers?businessId=${businessId}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch {
      // silent
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    if (!customerId) {
      setCustomerName('');
      setCustomerContact('');
      setCustomerAddress('');
      return;
    }
    const cust = customers.find((c) => c.id === customerId);
    if (cust) {
      setCustomerName(cust.name || '');
      setCustomerContact(cust.phone || '');
      setCustomerAddress(cust.address || '');
    }
  };

  // Auto-fill unit price when product selected
  useEffect(() => {
    if (selectedProductId) {
      const product = products.find((p) => p.id === selectedProductId);
      if (product) {
        setUnitPrice(String(product.price));
      }
    }
  }, [selectedProductId, products]);

  const totalPrice = (Number(quantity) || 0) * (Number(unitPrice) || 0);

  const resetForm = () => {
    setSelectedProductId('');
    setQuantity('1');
    setUnitPrice('');
    setPaymentStatus('pending');
    setPaidAmount('');
    setPaymentDueDate('');
    setCustomerName('');
    setCustomerContact('');
    setCustomerAddress('');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      toast.error(t('bisnis.selectProduct', { defaultValue: 'Pilih produk terlebih dahulu' }));
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      toast.error(t('bisnis.quantityRequired', { defaultValue: 'Kuantitas harus lebih dari 0' }));
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/bisnis/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          businessId,
          quantity: Number(quantity),
          unitPrice: Number(unitPrice),
          paymentStatus,
          paidAmount: paidAmount ? Number(paidAmount) : 0,
          paymentDueDate: paymentDueDate || undefined,
          customerName: customerName.trim() || undefined,
          customerContact: customerContact.trim() || undefined,
          customerAddress: customerAddress.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      if (res.ok) {
        toast.success(t('bisnis.createSaleSuccess', { defaultValue: 'Penjualan berhasil ditambahkan' }));
        resetForm();
        onSuccess();
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

  const inputStyle = {
    background: '#0D0D0D',
    border: `1px solid ${THEME.border}`,
    color: THEME.text,
  };

  const labelStyle = {
    color: THEME.textSecondary,
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent
        className="max-w-md max-h-[90vh] overflow-y-auto"
        style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
      >
        <DialogHeader>
          <DialogTitle className="text-base font-semibold" style={{ color: THEME.text }}>
            {t('bisnis.addSale', { defaultValue: 'Tambah Penjualan' })}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Produk */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium" style={labelStyle}>
              {t('bisnis.product', { defaultValue: 'Produk' })} *
            </Label>
            {isLoadingProducts ? (
              <div className="flex items-center gap-2 h-9">
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: THEME.muted }} />
                <span className="text-xs" style={{ color: THEME.muted }}>{t('common.loading', { defaultValue: 'Memuat...' })}</span>
              </div>
            ) : (
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="h-9 text-sm" style={inputStyle}>
                  <SelectValue placeholder={t('bisnis.selectProduct', { defaultValue: 'Pilih produk' })} />
                </SelectTrigger>
                <SelectContent style={{ background: '#1E1E1E', border: `1px solid ${THEME.border}` }}>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id} style={{ color: THEME.text }}>
                      <div className="flex items-center justify-between gap-4">
                        <span>{p.name}</span>
                        <span className="text-[10px] opacity-60">{formatAmount(p.price)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Kuantitas + Harga Satuan */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium" style={labelStyle}>
                {t('bisnis.quantity', { defaultValue: 'Kuantitas' })}
              </Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                className="h-9 text-sm"
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium" style={labelStyle}>
                {t('bisnis.unitPrice', { defaultValue: 'Harga Satuan' })}
              </Label>
              <Input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0"
                min="0"
                className="h-9 text-sm"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Total Harga (auto-calculated) */}
          <div
            className="flex items-center justify-between px-3 py-2.5 rounded-lg"
            style={{ background: `${THEME.primary}08`, border: `1px solid ${THEME.primary}15` }}
          >
            <span className="text-xs font-medium" style={{ color: THEME.textSecondary }}>
              {t('bisnis.totalPrice', { defaultValue: 'Total Harga' })}
            </span>
            <span className="text-sm font-bold" style={{ color: THEME.primary }}>
              {formatAmount(totalPrice)}
            </span>
          </div>

          {/* Status + Jumlah Dibayar */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium" style={labelStyle}>
                {t('bisnis.paymentStatus', { defaultValue: 'Status Pembayaran' })}
              </Label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger className="h-9 text-sm" style={inputStyle}>
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
              <Label className="text-xs font-medium" style={labelStyle}>
                {t('bisnis.paidAmount', { defaultValue: 'Jumlah Dibayar' })}
              </Label>
              <Input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0"
                min="0"
                className="h-9 text-sm"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Tanggal Jatuh Tempo */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium" style={labelStyle}>
              {t('bisnis.dueDate', { defaultValue: 'Tanggal Jatuh Tempo' })}
            </Label>
            <Input
              type="date"
              value={paymentDueDate}
              onChange={(e) => setPaymentDueDate(e.target.value)}
              className="h-9 text-sm"
              style={inputStyle}
            />
          </div>

          {/* Customer Info */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>
              {t('bisnis.customerInfo', { defaultValue: 'Info Pelanggan' })}
            </p>
            {customers.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={labelStyle}>
                  {t('bisnis.selectCustomer', { defaultValue: 'Pilih Pelanggan' })}
                </Label>
                <Select onValueChange={handleCustomerSelect}>
                  <SelectTrigger className="h-9 text-sm" style={inputStyle}>
                    <SelectValue placeholder={t('bisnis.selectOrNewCustomer', { defaultValue: 'Pilih pelanggan atau isi baru' })} />
                  </SelectTrigger>
                  <SelectContent style={{ background: '#1E1E1E', border: `1px solid ${THEME.border}` }}>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id} style={{ color: THEME.text }}>
                        <div className="flex items-center gap-2">
                          <span>{c.name}</span>
                          {c.phone && <span className="text-[10px] opacity-50">{c.phone}</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium" style={labelStyle}>
                {t('bisnis.customerName', { defaultValue: 'Nama Pelanggan' })}
              </Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t('bisnis.customerNamePlaceholder', { defaultValue: 'Nama pelanggan' })}
                className="h-9 text-sm"
                style={inputStyle}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={labelStyle}>
                  {t('bisnis.contact', { defaultValue: 'Kontak' })}
                </Label>
                <Input
                  value={customerContact}
                  onChange={(e) => setCustomerContact(e.target.value)}
                  placeholder="08xxx"
                  className="h-9 text-sm"
                  style={inputStyle}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={labelStyle}>
                  {t('bisnis.address', { defaultValue: 'Alamat' })}
                </Label>
                <Input
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder={t('bisnis.addressPlaceholder', { defaultValue: 'Alamat' })}
                  className="h-9 text-sm"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Catatan */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium" style={labelStyle}>
              {t('bisnis.notes', { defaultValue: 'Catatan' })}
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('bisnis.notesPlaceholder', { defaultValue: 'Catatan tambahan (opsional)' })}
              rows={2}
              className="text-sm resize-none"
              style={{ ...inputStyle, minHeight: '60px' }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => { resetForm(); onOpenChange(false); }} className="flex-1 h-9 rounded-lg text-sm font-medium" style={{ color: THEME.muted }}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 h-9 rounded-lg text-sm font-semibold" style={{ background: THEME.primary, color: '#000' }}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
