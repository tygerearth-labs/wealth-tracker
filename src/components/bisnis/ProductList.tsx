'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, Plus, Pencil, Trash2, Search, Inbox, Package } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrencyFormat } from '@/hooks/useCurrencyFormat';
import { toast } from 'sonner';
import { ProductForm } from '@/components/bisnis/ProductForm';

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
interface Product {
  id: string;
  name: string;
  type: string;
  category: string;
  description?: string | null;
  price: number;
  cost?: number | null;
  stock?: number | null;
  sku?: string | null;
  unit: string;
  active: boolean;
  _count?: { sales: number };
  createdAt: string;
}

interface ProductListProps {
  businessId: string;
}

const CATEGORIES = [
  { value: '', label: 'Semua' },
  { value: 'Properti', label: 'Properti' },
  { value: 'Kendaraan', label: 'Kendaraan' },
  { value: 'Elektronik', label: 'Elektronik' },
  { value: 'Kursus', label: 'Kursus' },
  { value: 'Konsultasi', label: 'Konsultasi' },
  { value: 'Penyewaan', label: 'Penyewaan' },
  { value: 'Lainnya', label: 'Lainnya' },
];

// ── Main Component ───────────────────────────────────────────────
export function ProductList({ businessId }: ProductListProps) {
  const { t } = useTranslation();
  const { formatAmount } = useCurrencyFormat();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string }>({ open: false, id: '' });

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ businessId });
      if (typeFilter) params.append('type', typeFilter);
      if (categoryFilter) params.append('category', categoryFilter);

      const res = await fetch(`/api/bisnis/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      } else {
        toast.error(t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  }, [businessId, typeFilter, categoryFilter, t]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/bisnis/products/${deleteDialog.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('bisnis.deleteProductSuccess', { defaultValue: 'Produk berhasil dihapus' }));
        setDeleteDialog({ open: false, id: '' });
        fetchProducts();
      } else {
        const err = await res.json();
        toast.error(err.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
    fetchProducts();
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const openCreate = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  // ── Filter ──────────────────────────────────────────────────────
  const filtered = products.filter((p) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.sku?.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

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
            placeholder={t('bisnis.searchProduct', { defaultValue: 'Cari produk...' })}
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
        <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val === 'all' ? '' : val)}>
          <SelectTrigger className="w-full sm:w-36 h-9 text-sm" style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, color: THEME.text }}>
            <SelectValue placeholder={t('bisnis.type', { defaultValue: 'Tipe' })} />
          </SelectTrigger>
          <SelectContent style={{ background: '#1E1E1E', border: `1px solid ${THEME.border}` }}>
            <SelectItem value="all" style={{ color: THEME.text }}>{t('bisnis.all', { defaultValue: 'Semua' })}</SelectItem>
            <SelectItem value="barang" style={{ color: THEME.text }}>{t('bisnis.goods', { defaultValue: 'Barang' })}</SelectItem>
            <SelectItem value="jasa" style={{ color: THEME.text }}>{t('bisnis.services', { defaultValue: 'Jasa' })}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val === '' ? '' : val)}>
          <SelectTrigger className="w-full sm:w-40 h-9 text-sm" style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, color: THEME.text }}>
            <SelectValue placeholder={t('bisnis.category', { defaultValue: 'Kategori' })} />
          </SelectTrigger>
          <SelectContent style={{ background: '#1E1E1E', border: `1px solid ${THEME.border}` }}>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value} style={{ color: THEME.text }}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={openCreate}
          className="h-9 px-4 rounded-lg text-sm font-semibold shrink-0"
          style={{ background: THEME.primary, color: '#000' }}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">{t('bisnis.addProduct', { defaultValue: 'Tambah Produk' })}</span>
          <span className="sm:hidden">{t('common.add', { defaultValue: 'Tambah' })}</span>
        </Button>
      </div>

      {/* ── Empty State ── */}
      {filtered.length === 0 && (
        <div
          className="rounded-xl p-8 sm:p-12 flex flex-col items-center justify-center text-center"
          style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
        >
          <div className="w-14 h-14 rounded-2xl grid place-items-center mb-4 [&>*]:block leading-none" style={{ background: `${THEME.primary}10` }}>
            <Package className="h-7 w-7" style={{ color: THEME.primary, opacity: 0.5 }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: THEME.textSecondary }}>
            {searchQuery || typeFilter || categoryFilter
              ? t('bisnis.noProductsFound', { defaultValue: 'Produk tidak ditemukan' })
              : t('bisnis.noProducts', { defaultValue: 'Belum Ada Produk' })}
          </p>
          <p className="text-xs" style={{ color: THEME.muted }}>
            {!searchQuery && !typeFilter && !categoryFilter
              ? t('bisnis.noProductsHint', { defaultValue: 'Mulai dengan menambahkan produk pertama Anda' })
              : t('bisnis.tryChangeFilter', { defaultValue: 'Coba ubah filter pencarian' })}
          </p>
        </div>
      )}

      {/* ── Desktop Table ── */}
      {filtered.length > 0 && (
        <div className="hidden lg:block overflow-x-auto">
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: `${THEME.bg}80` }}>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>
                    {t('bisnis.productName', { defaultValue: 'Nama' })}
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>
                    {t('bisnis.type', { defaultValue: 'Tipe' })}
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>
                    {t('bisnis.category', { defaultValue: 'Kategori' })}
                  </th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>
                    {t('bisnis.price', { defaultValue: 'Harga Jual' })}
                  </th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>
                    {t('bisnis.cost', { defaultValue: 'Modal' })}
                  </th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>
                    {t('bisnis.stock', { defaultValue: 'Stok' })}
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>
                    SKU
                  </th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>
                    {t('bisnis.actions', { defaultValue: 'Aksi' })}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const typeColor = product.type === 'barang' ? THEME.secondary : THEME.primary;
                  const typeLabel = product.type === 'barang'
                    ? t('bisnis.goods', { defaultValue: 'Barang' })
                    : t('bisnis.services', { defaultValue: 'Jasa' });

                  return (
                    <tr
                      key={product.id}
                      className="transition-colors duration-150"
                      style={{ borderTop: `1px solid ${THEME.border}` }}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-sm" style={{ color: THEME.text }}>{product.name}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: THEME.muted }}>
                            {product._count?.sales || 0} {t('bisnis.sales', { defaultValue: 'penjualan' })}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className="text-[10px] px-2 py-0.5 font-semibold"
                          style={{ background: `${typeColor}20`, color: typeColor, border: 'none' }}
                        >
                          {typeLabel}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: THEME.textSecondary }}>{product.category}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs font-semibold" style={{ color: THEME.text }}>{formatAmount(product.price)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs" style={{ color: THEME.textSecondary }}>
                          {product.cost != null ? formatAmount(product.cost) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {product.type === 'barang' ? (
                          <span
                            className="text-xs font-semibold"
                            style={{
                              color: (product.stock ?? 0) <= 5 ? THEME.warning : THEME.text,
                            }}
                          >
                            {product.stock ?? 0} {product.unit}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: THEME.muted }}>-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono" style={{ color: THEME.muted }}>{product.sku || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEdit(product)}
                            className="p-2 rounded-lg transition-all hover:scale-110"
                            style={{ background: `${THEME.primary}15`, color: THEME.primary }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteDialog({ open: true, id: product.id })}
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
          {filtered.map((product) => {
            const typeColor = product.type === 'barang' ? THEME.secondary : THEME.primary;
            const typeLabel = product.type === 'barang'
              ? t('bisnis.goods', { defaultValue: 'Barang' })
              : t('bisnis.services', { defaultValue: 'Jasa' });

            return (
              <div
                key={product.id}
                className="rounded-xl p-3 transition-all duration-150"
                style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold truncate" style={{ color: THEME.text }}>{product.name}</p>
                      <Badge
                        className="text-[9px] px-1.5 py-0 font-semibold shrink-0"
                        style={{ background: `${typeColor}20`, color: typeColor, border: 'none' }}
                      >
                        {typeLabel}
                      </Badge>
                    </div>
                    <p className="text-[10px] mb-2" style={{ color: THEME.muted }}>
                      {product.category}
                      {product.sku ? ` · ${product.sku}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(product)}
                      className="p-2 rounded-lg"
                      style={{ background: `${THEME.primary}15`, color: THEME.primary }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteDialog({ open: true, id: product.id })}
                      className="p-2 rounded-lg"
                      style={{ background: `${THEME.destructive}15`, color: THEME.destructive }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-[10px]" style={{ color: THEME.muted }}>{t('bisnis.price', { defaultValue: 'Harga' })}</p>
                      <p className="text-xs font-bold" style={{ color: THEME.text }}>{formatAmount(product.price)}</p>
                    </div>
                    {product.cost != null && (
                      <div>
                        <p className="text-[10px]" style={{ color: THEME.muted }}>{t('bisnis.cost', { defaultValue: 'Modal' })}</p>
                        <p className="text-xs" style={{ color: THEME.textSecondary }}>{formatAmount(product.cost)}</p>
                      </div>
                    )}
                  </div>
                  {product.type === 'barang' && (
                    <div className="text-right">
                      <p className="text-[10px]" style={{ color: THEME.muted }}>{t('bisnis.stock', { defaultValue: 'Stok' })}</p>
                      <p
                        className="text-xs font-semibold"
                        style={{ color: (product.stock ?? 0) <= 5 ? THEME.warning : THEME.text }}
                      >
                        {product.stock ?? 0} {product.unit}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Product Form Dialog ── */}
      <ProductForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        businessId={businessId}
        product={editingProduct}
        onSuccess={handleFormSuccess}
      />

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.06)' }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: THEME.text }}>
              {t('bisnis.deleteProduct', { defaultValue: 'Hapus Produk' })}
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: THEME.textSecondary }}>
              {t('bisnis.deleteProductDesc', { defaultValue: 'Produk yang dihapus tidak dapat dikembalikan. Jika sudah ada penjualan, produk akan dinonaktifkan.' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: 'none' }}>
              {t('common.cancel', { defaultValue: 'Batal' })}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} style={{ background: THEME.destructive, color: '#fff', border: 'none' }}>
              {t('common.delete', { defaultValue: 'Hapus' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
