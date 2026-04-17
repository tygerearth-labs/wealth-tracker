'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Download, Upload, FileSpreadsheet, AlertCircle, Lock, Table } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrencyFormat } from '@/hooks/useCurrencyFormat';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

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
interface ImportExportViewProps {
  businessId: string;
}

interface ProductRow {
  name: string;
  type: string;
  category: string;
  price: number;
  cost?: number | null;
  stock?: number | null;
  unit: string;
}

interface SaleRow {
  invoiceNumber: string;
  product: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paymentStatus: string;
  customerName?: string;
  date: string;
}

// ── Main Component ───────────────────────────────────────────────
export function ImportExportView({ businessId }: ImportExportViewProps) {
  const { t } = useTranslation();
  const { formatAmount } = useCurrencyFormat();

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [previewFileName, setPreviewFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [prodRes, saleRes] = await Promise.all([
        fetch(`/api/bisnis/products?businessId=${businessId}`),
        fetch(`/api/bisnis/sales?businessId=${businessId}`),
      ]);

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts((prodData.products || []).map((p: any) => ({
          name: p.name,
          type: p.type,
          category: p.category,
          price: p.price,
          cost: p.cost,
          stock: p.stock,
          unit: p.unit,
        })));
      }

      if (saleRes.ok) {
        const saleData = await saleRes.json();
        setSales((saleData.sales || []).map((s: any) => ({
          invoiceNumber: s.invoiceNumber,
          product: s.product?.name || '-',
          quantity: s.quantity,
          unitPrice: s.unitPrice,
          totalPrice: s.totalPrice,
          paymentStatus: s.paymentStatus,
          customerName: s.customerName || '',
          date: s.createdAt,
        })));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  }, [businessId, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Export Functions ────────────────────────────────────────────
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportProducts = async () => {
    try {
      setIsExporting('products');
      const wb = XLSX.utils.book_new();

      const data = products.map((p) => ({
        [t('bisnis.productName', { defaultValue: 'Nama' })]: p.name,
        [t('bisnis.type', { defaultValue: 'Tipe' })]: p.type === 'barang' ? t('bisnis.goods', { defaultValue: 'Barang' }) : t('bisnis.services', { defaultValue: 'Jasa' }),
        [t('bisnis.category', { defaultValue: 'Kategori' })]: p.category,
        [t('bisnis.price', { defaultValue: 'Harga Jual' })]: p.price,
        [t('bisnis.cost', { defaultValue: 'Harga Modal' })]: p.cost || '',
        [t('bisnis.stock', { defaultValue: 'Stok' })]: p.stock ?? '',
        [t('bisnis.unit', { defaultValue: 'Satuan' })]: p.unit,
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, t('bisnis.products', { defaultValue: 'Produk' }));
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      downloadBlob(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'Produk.xlsx');
      toast.success(t('bisnis.exportSuccess', { defaultValue: 'Export berhasil!' }));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsExporting(null);
    }
  };

  const exportSales = async () => {
    try {
      setIsExporting('sales');
      const wb = XLSX.utils.book_new();

      const data = sales.map((s) => ({
        [t('bisnis.invoice', { defaultValue: 'Invoice' })]: s.invoiceNumber,
        [t('bisnis.product', { defaultValue: 'Produk' })]: s.product,
        [t('bisnis.quantity', { defaultValue: 'Qty' })]: s.quantity,
        [t('bisnis.unitPrice', { defaultValue: 'Harga Satuan' })]: s.unitPrice,
        [t('bisnis.total', { defaultValue: 'Total' })]: s.totalPrice,
        [t('bisnis.paymentStatus', { defaultValue: 'Status' })]: s.paymentStatus,
        [t('bisnis.customer', { defaultValue: 'Pelanggan' })]: s.customerName || '',
        [t('bisnis.date', { defaultValue: 'Tanggal' })]: new Date(s.date).toLocaleDateString('id-ID'),
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, t('bisnis.sales', { defaultValue: 'Penjualan' }));
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      downloadBlob(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'Penjualan.xlsx');
      toast.success(t('bisnis.exportSuccess', { defaultValue: 'Export berhasil!' }));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsExporting(null);
    }
  };

  const exportAll = async () => {
    try {
      setIsExporting('all');
      const wb = XLSX.utils.book_new();

      // Products sheet
      const prodData = products.map((p) => ({
        'Nama': p.name,
        'Tipe': p.type === 'barang' ? 'Barang' : 'Jasa',
        'Kategori': p.category,
        'Harga Jual': p.price,
        'Harga Modal': p.cost || '',
        'Stok': p.stock ?? '',
        'Satuan': p.unit,
      }));
      const ws1 = XLSX.utils.json_to_sheet(prodData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Produk');

      // Sales sheet
      const saleData = sales.map((s) => ({
        'Invoice': s.invoiceNumber,
        'Produk': s.product,
        'Qty': s.quantity,
        'Harga Satuan': s.unitPrice,
        'Total': s.totalPrice,
        'Status': s.paymentStatus,
        'Pelanggan': s.customerName || '',
        'Tanggal': new Date(s.date).toLocaleDateString('id-ID'),
      }));
      const ws2 = XLSX.utils.json_to_sheet(saleData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Penjualan');

      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      downloadBlob(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'Data_Bisnis.xlsx');
      toast.success(t('bisnis.exportSuccess', { defaultValue: 'Export berhasil!' }));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsExporting(null);
    }
  };

  // ── Import Function ─────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewFileName(file.name);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1 });

        if (jsonData.length < 2) {
          toast.error(t('bisnis.emptyFile', { defaultValue: 'File kosong atau tidak valid' }));
          setIsUploading(false);
          return;
        }

        const headers = jsonData[0].map(String);
        const rows = jsonData.slice(1).filter((row) => row.some((cell) => cell !== undefined && cell !== '')).map((row) => row.map(String));
        setPreviewData({ headers, rows });
      } catch {
        toast.error(t('bisnis.fileReadError', { defaultValue: 'Gagal membaca file' }));
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsArrayBuffer(file);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const dt = new DataTransfer();
      dt.items.add(file);
      if (fileInputRef.current) {
        fileInputRef.current.files = dt.files;
        fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // ── Loading ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: THEME.primary }} />
      </div>
    );
  }

  const exportButtons = [
    { key: 'products', label: t('bisnis.exportProducts', { defaultValue: 'Export Produk (Excel)' }), onClick: exportProducts },
    { key: 'sales', label: t('bisnis.exportSales', { defaultValue: 'Export Penjualan (Excel)' }), onClick: exportSales },
    { key: 'all', label: t('bisnis.exportAll', { defaultValue: 'Export Semua (Excel)' }), onClick: exportAll },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Export Section ── */}
      <Card style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}>
        <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full" style={{ background: `linear-gradient(180deg, ${THEME.secondary}, ${THEME.primary})` }} />
            <CardTitle className="text-sm font-semibold" style={{ color: THEME.text }}>
              {t('bisnis.exportData', { defaultValue: 'Export Data' })}
            </CardTitle>
            <Badge className="text-[9px] px-1.5 py-0 font-bold ml-auto" style={{ background: `${THEME.secondary}15`, color: THEME.secondary, border: 'none' }}>
              {products.length} {t('bisnis.products', { defaultValue: 'Produk' })} · {sales.length} {t('bisnis.sales', { defaultValue: 'Penjualan' })}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            {exportButtons.map((btn) => (
              <Button
                key={btn.key}
                onClick={btn.onClick}
                disabled={isExporting !== null}
                className="h-10 rounded-lg text-sm font-medium"
                style={{
                  background: `${THEME.secondary}12`,
                  color: THEME.secondary,
                  border: `1px solid ${THEME.secondary}20`,
                }}
              >
                {isExporting === btn.key ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {btn.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Import Section ── */}
      <Card style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}>
        <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full" style={{ background: `linear-gradient(180deg, ${THEME.primary}, ${THEME.warning})` }} />
            <CardTitle className="text-sm font-semibold" style={{ color: THEME.text }}>
              {t('bisnis.importData', { defaultValue: 'Import Data' })}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 space-y-4">
          {/* Dropzone */}
          <div
            className="rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200"
            style={{
              background: `${THEME.bg}60`,
              border: `2px dashed ${THEME.border}`,
            }}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileUpload}
            />
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin mb-3" style={{ color: THEME.primary }} />
            ) : (
              <div className="w-12 h-12 rounded-xl grid place-items-center mb-3 [&>*]:block leading-none" style={{ background: `${THEME.primary}10` }}>
                <Upload className="h-6 w-6" style={{ color: THEME.primary }} />
              </div>
            )}
            <p className="text-sm font-medium mb-1" style={{ color: THEME.textSecondary }}>
              {t('bisnis.dragDrop', { defaultValue: 'Seret file ke sini atau klik untuk memilih' })}
            </p>
            <p className="text-[10px]" style={{ color: THEME.muted }}>
              .xlsx, .xls, .csv
            </p>
          </div>

          {/* Preview Table */}
          {previewData && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" style={{ color: THEME.primary }} />
                <span className="text-xs font-medium" style={{ color: THEME.text }}>
                  {previewFileName}
                </span>
                <Badge className="text-[9px] px-1.5 py-0 font-semibold" style={{ background: `${THEME.primary}15`, color: THEME.primary, border: 'none' }}>
                  {previewData.rows.length} {t('bisnis.rows', { defaultValue: 'baris' })} · {previewData.headers.length} {t('bisnis.columns', { defaultValue: 'kolom' })}
                </Badge>
              </div>

              {/* Column Names */}
              <div className="flex flex-wrap gap-1.5">
                {previewData.headers.map((h, i) => (
                  <Badge key={i} className="text-[10px] px-2 py-0.5 font-mono" style={{ background: `${THEME.bg}80`, color: THEME.textSecondary, border: `1px solid ${THEME.border}` }}>
                    {h}
                  </Badge>
                ))}
              </div>

              {/* Preview table */}
              <div className="overflow-x-auto max-h-64 overflow-y-auto rounded-lg" style={{ border: `1px solid ${THEME.border}` }}>
                <table className="w-full text-xs">
                  <thead style={{ background: `${THEME.bg}80`, position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      {previewData.headers.map((h, i) => (
                        <th key={i} className="px-3 py-2 text-left font-semibold" style={{ color: THEME.muted, borderBottom: `1px solid ${THEME.border}` }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.rows.slice(0, 20).map((row, rowIdx) => (
                      <tr key={rowIdx} style={{ borderTop: `1px solid ${THEME.border}` }}>
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="px-3 py-1.5 whitespace-nowrap" style={{ color: THEME.textSecondary }}>
                            {cell || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.rows.length > 20 && (
                  <p className="text-center py-2 text-[10px]" style={{ color: THEME.muted }}>
                    {t('bisnis.showingRows', { defaultValue: 'Menampilkan 20 dari' })} {previewData.rows.length} {t('bisnis.rows', { defaultValue: 'baris' })}
                  </p>
                )}
              </div>

              {/* Import button - disabled with tooltip */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="inline-block w-full">
                      <Button
                        disabled
                        className="w-full h-10 rounded-lg text-sm font-medium cursor-not-allowed"
                        style={{
                          background: `${THEME.muted}15`,
                          color: THEME.muted,
                          border: 'none',
                        }}
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        {t('bisnis.importData', { defaultValue: 'Import Data' })}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent style={{ background: '#1E1E1E', border: `1px solid ${THEME.border}`, color: THEME.textSecondary }} className="max-w-xs">
                    <p className="text-xs">
                      {t('bisnis.importDisabled', { defaultValue: 'Fitur import data tersimpan belum tersedia, data hanya preview saja' })}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
