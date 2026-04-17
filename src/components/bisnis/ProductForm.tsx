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
interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  product?: any | null;
  onSuccess: () => void;
}

const CATEGORIES = [
  'Properti',
  'Kendaraan',
  'Elektronik',
  'Kursus',
  'Konsultasi',
  'Penyewaan',
  'Lainnya',
];

const UNITS = [
  { value: 'pcs', label: 'Pcs' },
  { value: 'unit', label: 'Unit' },
  { value: 'paket', label: 'Paket' },
  { value: 'set', label: 'Set' },
  { value: 'lembar', label: 'Lembar' },
  { value: 'jam', label: 'Jam' },
  { value: 'bulan', label: 'Bulan' },
];

// ── Main Component ───────────────────────────────────────────────
export function ProductForm({ open, onOpenChange, businessId, product, onSuccess }: ProductFormProps) {
  const { t } = useTranslation();
  const isEditing = !!product;

  const [name, setName] = useState('');
  const [type, setType] = useState('barang');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('');
  const [sku, setSku] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setType(product.type || 'barang');
      setCategory(product.category || '');
      setDescription(product.description || '');
      setPrice(product.price != null ? String(product.price) : '');
      setCost(product.cost != null ? String(product.cost) : '');
      setStock(product.stock != null ? String(product.stock) : '');
      setSku(product.sku || '');
      setUnit(product.unit || 'pcs');
    } else {
      resetForm();
    }
  }, [product, open]);

  const resetForm = () => {
    setName('');
    setType('barang');
    setCategory('');
    setDescription('');
    setPrice('');
    setCost('');
    setStock('');
    setSku('');
    setUnit('pcs');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t('bisnis.nameRequired', { defaultValue: 'Nama produk wajib diisi' }));
      return;
    }
    if (!category) {
      toast.error(t('bisnis.categoryRequired', { defaultValue: 'Kategori wajib dipilih' }));
      return;
    }
    if (!price || isNaN(Number(price)) || Number(price) < 0) {
      toast.error(t('bisnis.priceRequired', { defaultValue: 'Harga jual wajib diisi' }));
      return;
    }

    try {
      setIsSubmitting(true);
      const body: Record<string, unknown> = {
        name: name.trim(),
        type,
        category,
        description: description.trim() || undefined,
        price: Number(price),
        cost: cost ? Number(cost) : undefined,
        stock: type === 'barang' && stock ? Number(stock) : undefined,
        sku: sku.trim() || undefined,
        unit,
        businessId,
      };

      const url = isEditing ? `/api/bisnis/products/${product.id}` : '/api/bisnis/products';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(isEditing
          ? t('bisnis.updateProductSuccess', { defaultValue: 'Produk berhasil diperbarui' })
          : t('bisnis.createProductSuccess', { defaultValue: 'Produk berhasil ditambahkan' })
        );
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md max-h-[90vh] overflow-y-auto"
        style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
      >
        <DialogHeader>
          <DialogTitle className="text-base font-semibold" style={{ color: THEME.text }}>
            {isEditing
              ? t('bisnis.editProduct', { defaultValue: 'Edit Produk' })
              : t('bisnis.addProduct', { defaultValue: 'Tambah Produk' })}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Nama Produk */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium" style={labelStyle}>
              {t('bisnis.productName', { defaultValue: 'Nama Produk' })} *
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('bisnis.productNamePlaceholder', { defaultValue: 'Masukkan nama produk' })}
              className="h-9 text-sm"
              style={inputStyle}
            />
          </div>

          {/* Tipe + Kategori */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium" style={labelStyle}>
                {t('bisnis.type', { defaultValue: 'Tipe' })}
              </Label>
              <Select value={type} onValueChange={(val) => setType(val)}>
                <SelectTrigger className="h-9 text-sm" style={inputStyle}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: '#1E1E1E', border: `1px solid ${THEME.border}` }}>
                  <SelectItem value="barang" style={{ color: THEME.text }}>
                    {t('bisnis.goods', { defaultValue: 'Barang' })}
                  </SelectItem>
                  <SelectItem value="jasa" style={{ color: THEME.text }}>
                    {t('bisnis.services', { defaultValue: 'Jasa' })}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium" style={labelStyle}>
                {t('bisnis.category', { defaultValue: 'Kategori' })} *
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9 text-sm" style={inputStyle}>
                  <SelectValue placeholder={t('bisnis.selectCategory', { defaultValue: 'Pilih' })} />
                </SelectTrigger>
                <SelectContent style={{ background: '#1E1E1E', border: `1px solid ${THEME.border}` }}>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} style={{ color: THEME.text }}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium" style={labelStyle}>
              {t('bisnis.description', { defaultValue: 'Deskripsi' })}
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('bisnis.descriptionPlaceholder', { defaultValue: 'Deskripsi produk (opsional)' })}
              rows={2}
              className="text-sm resize-none"
              style={{ ...inputStyle, minHeight: '60px' }}
            />
          </div>

          {/* Harga + Modal */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium" style={labelStyle}>
                {t('bisnis.sellingPrice', { defaultValue: 'Harga Jual' })} *
              </Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                min="0"
                className="h-9 text-sm"
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium" style={labelStyle}>
                {t('bisnis.costPrice', { defaultValue: 'Harga Modal' })}
              </Label>
              <Input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0"
                min="0"
                className="h-9 text-sm"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Stok + SKU (only for barang) */}
          {type === 'barang' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={labelStyle}>
                  {t('bisnis.stock', { defaultValue: 'Stok' })}
                </Label>
                <Input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="h-9 text-sm"
                  style={inputStyle}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={labelStyle}>
                  SKU
                </Label>
                <Input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="SKU-001"
                  className="h-9 text-sm"
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          {/* Satuan */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium" style={labelStyle}>
              {t('bisnis.unit', { defaultValue: 'Satuan' })}
            </Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="h-9 text-sm" style={inputStyle}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ background: '#1E1E1E', border: `1px solid ${THEME.border}` }}>
                {UNITS.map((u) => (
                  <SelectItem key={u.value} value={u.value} style={{ color: THEME.text }}>
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-9 rounded-lg text-sm font-medium"
              style={{ color: THEME.muted }}
            >
              {t('common.cancel', { defaultValue: 'Batal' })}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
