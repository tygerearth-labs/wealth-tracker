'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Lock, Crown, Building2, Plus, ChevronDown, LayoutDashboard, Package, ShoppingCart, Wallet, Clock, ArrowUpDown, Check, Sparkles, Store, UtensilsCrossed, Briefcase, Home, Cpu, GraduationCap, Shirt, MoreHorizontal, Users } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/store/useAuthStore';
import { BisnisDashboard } from '@/components/bisnis/BisnisDashboard';
import { ProductList } from '@/components/bisnis/ProductList';
import { SalesList } from '@/components/bisnis/SalesList';
import { CashFlowView } from '@/components/bisnis/CashFlowView';
import { PendingPayments } from '@/components/bisnis/PendingPayments';
import { ImportExportView } from '@/components/bisnis/ImportExportView';
import { BusinessFormDialog } from '@/components/bisnis/BusinessFormDialog';
import { CustomerList } from '@/components/bisnis/CustomerList';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

// ── Business Categories ──────────────────────────────────────────
const BUSINESS_CATEGORIES = [
  { value: 'ritel', label: 'Ritel / Toko', icon: Store },
  { value: 'fnb', label: 'F&B / Kuliner', icon: UtensilsCrossed },
  { value: 'jasa', label: 'Jasa', icon: Briefcase },
  { value: 'properti', label: 'Properti', icon: Home },
  { value: 'elektronik', label: 'Elektronik', icon: Cpu },
  { value: 'pendidikan', label: 'Pendidikan', icon: GraduationCap },
  { value: 'fashion', label: 'Fashion', icon: Shirt },
  { value: 'lainnya', label: 'Lainnya', icon: MoreHorizontal },
] as const;

// ── Feature Options ──────────────────────────────────────────────
const FEATURE_OPTIONS = [
  { key: 'dashboard', label: 'Dashboard', desc: 'Ringkasan performa bisnis', icon: LayoutDashboard },
  { key: 'products', label: 'Produk & Layanan', desc: 'Kelola katalog produk dan jasa', icon: Package },
  { key: 'sales', label: 'Penjualan & Invoice', desc: 'Catat penjualan dan invoice', icon: ShoppingCart },
  { key: 'customers', label: 'Pelanggan', desc: 'Data pelanggan & ingatkan bayar via WA', icon: Users },
  { key: 'cashflow', label: 'Kas & Keuangan', desc: 'Kas besar, kas kecil, pengeluaran', icon: Wallet },
  { key: 'pending', label: 'Pembayaran Tertunda', desc: 'Lacak tagihan yang belum lunas', icon: Clock },
  { key: 'import-export', label: 'Import / Export', desc: 'Export Excel/PDF, import preview', icon: ArrowUpDown },
] as const;

// ── Types ────────────────────────────────────────────────────────
interface Business {
  id: string;
  name: string;
  category?: string;
  description?: string | null;
  features?: string;
  _count?: { products: number; sales: number };
}

type TabKey = 'dashboard' | 'products' | 'sales' | 'customers' | 'cashflow' | 'pending' | 'import-export';

// ── Main Component ───────────────────────────────────────────────
export function BisnisLayout() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPro, setIsPro] = useState(false);

  // ── Create Business Form State ──────────────────────────────────
  const [formStep, setFormStep] = useState<0 | 1>(0);
  const [bizName, setBizName] = useState('');
  const [bizCategory, setBizCategory] = useState('ritel');
  const [bizDescription, setBizDescription] = useState('');
  const [bizAddress, setBizAddress] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [bizEmail, setBizEmail] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['dashboard', 'products', 'sales', 'customers', 'cashflow', 'pending', 'import-export']);
  const [isCreating, setIsCreating] = useState(false);

  const fetchBusinesses = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/bisnis');
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data.businesses || []);
        if (data.businesses?.length > 0) {
          setSelectedBusinessId((prev) => prev || data.businesses[0].id);
        }
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (user?.plan === 'pro') {
      setIsPro(true);
    } else {
      setIsPro(false);
    }
  }, [user?.plan]);

  useEffect(() => {
    if (isPro) {
      fetchBusinesses();
    }
  }, [isPro, fetchBusinesses]);

  const handleBusinessCreated = (newBusiness: Business) => {
    setBusinesses((prev) => [newBusiness, ...prev]);
    setSelectedBusinessId(newBusiness.id);
    setIsCreateDialogOpen(false);
    toast.success(t('bisnis.createSuccess', { defaultValue: 'Bisnis berhasil dibuat!' }));
  };

  const toggleFeature = (key: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizName.trim()) {
      toast.error(t('bisnis.businessNameRequired', { defaultValue: 'Nama bisnis wajib diisi' }));
      return;
    }
    if (selectedFeatures.length === 0) {
      toast.error(t('bisnis.selectAtLeastOneFeature', { defaultValue: 'Pilih minimal 1 fitur' }));
      return;
    }

    try {
      setIsCreating(true);
      const res = await fetch('/api/bisnis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: bizName.trim(),
          category: bizCategory,
          description: bizDescription.trim() || undefined,
          features: selectedFeatures.join(','),
          address: bizAddress.trim() || undefined,
          phone: bizPhone.trim() || undefined,
          email: bizEmail.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        handleBusinessCreated(data.business);
      } else {
        const err = await res.json();
        toast.error(err.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsCreating(false);
    }
  };

  // ── PRO Gate ────────────────────────────────────────────────────
  if (!isPro) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-12">
        <div
          className="rounded-2xl p-8 sm:p-12 flex flex-col items-center text-center relative overflow-hidden"
          style={{
            background: THEME.surface,
            border: `1px solid ${THEME.border}`,
          }}
        >
          <div
            className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl opacity-10 pointer-events-none"
            style={{ background: THEME.primary }}
          />
          <div
            className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full blur-3xl opacity-10 pointer-events-none"
            style={{ background: THEME.secondary }}
          />
          <div className="relative z-10">
            <div
              className="w-20 h-20 rounded-2xl grid place-items-center mx-auto mb-6 [&>*]:block leading-none"
              style={{ background: `${THEME.primary}15` }}
            >
              <Lock className="h-10 w-10" style={{ color: THEME.primary }} />
            </div>
            <div className="flex items-center justify-center gap-2 mb-3">
              <Crown className="h-5 w-5" style={{ color: THEME.primary }} />
              <Badge
                className="px-3 py-1 text-xs font-bold"
                style={{ background: `${THEME.primary}20`, color: THEME.primary, border: 'none' }}
              >
                PRO
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: THEME.text }}>
              {t('bisnis.proRequired', { defaultValue: 'Fitur Bisnis Pro' })}
            </h2>
            <p className="text-sm mb-6 max-w-md" style={{ color: THEME.textSecondary }}>
              {t('bisnis.proDesc', {
                defaultValue: 'Kelola bisnis Anda dengan fitur lengkap: produk, penjualan, kas, dan laporan keuangan bisnis.',
              })}
            </p>
            <Button
              className="px-6 py-3 rounded-xl font-semibold text-sm"
              style={{ background: THEME.primary, color: '#000' }}
            >
              <Crown className="h-4 w-4 mr-2" />
              {t('bisnis.upgradeToPro', { defaultValue: 'Upgrade ke PRO' })}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: THEME.primary }} />
      </div>
    );
  }

  // ── Create Business Form (Full Page when no business) ───────────
  if (businesses.length === 0) {
    const selectedCat = BUSINESS_CATEGORIES.find((c) => c.value === bizCategory);
    const SelectedCatIcon = selectedCat?.icon || Store;

    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* ── Header ── */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl grid place-items-center mx-auto mb-4 [&>*]:block leading-none"
            style={{ background: `${THEME.primary}15` }}
          >
            <Sparkles className="h-8 w-8" style={{ color: THEME.primary }} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: THEME.text }}>
            {t('bisnis.setupBusiness', { defaultValue: 'Buat Bisnis Pertama Kamu' })}
          </h1>
          <p className="text-sm max-w-md mx-auto" style={{ color: THEME.textSecondary }}>
            {t('bisnis.setupDesc', {
              defaultValue: 'Mulai kelola keuangan bisnis secara profesional. Isi data bisnis dan pilih fitur yang kamu butuhkan.',
            })}
          </p>
        </div>

        {/* ── Step Indicator ── */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full grid place-items-center text-xs font-bold"
              style={{
                background: formStep >= 0 ? THEME.primary : 'transparent',
                color: formStep >= 0 ? '#000' : THEME.muted,
                border: `2px solid ${formStep >= 0 ? THEME.primary : THEME.border}`,
              }}
            >
              {formStep > 0 ? <Check className="h-3.5 w-3.5" /> : '1'}
            </div>
            <span className="text-xs font-medium" style={{ color: formStep >= 0 ? THEME.text : THEME.muted }}>
              {t('bisnis.businessInfo', { defaultValue: 'Info Bisnis' })}
            </span>
          </div>
          <div className="w-8 h-[2px] rounded-full" style={{ background: formStep >= 1 ? THEME.primary : THEME.border }} />
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full grid place-items-center text-xs font-bold"
              style={{
                background: formStep >= 1 ? THEME.primary : 'transparent',
                color: formStep >= 1 ? '#000' : THEME.muted,
                border: `2px solid ${formStep >= 1 ? THEME.primary : THEME.border}`,
              }}
            >
              2
            </div>
            <span className="text-xs font-medium" style={{ color: formStep >= 1 ? THEME.text : THEME.muted }}>
              {t('bisnis.chooseFeatures', { defaultValue: 'Pilih Fitur' })}
            </span>
          </div>
        </div>

        {/* ── Form Card ── */}
        <div
          className="rounded-2xl p-5 sm:p-8 relative overflow-hidden"
          style={{
            background: THEME.surface,
            border: `1px solid ${THEME.border}`,
          }}
        >
          {/* Decorative glow */}
          <div
            className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-[0.06] pointer-events-none"
            style={{ background: THEME.primary }}
          />
          <div
            className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-[0.06] pointer-events-none"
            style={{ background: THEME.secondary }}
          />

          <form onSubmit={handleCreateBusiness} className="relative z-10 space-y-6">
            {/* ═══ STEP 0: Business Info ═══ */}
            {formStep === 0 && (
              <>
                {/* Business Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium" style={{ color: THEME.textSecondary }}>
                    {t('bisnis.businessName', { defaultValue: 'Nama Bisnis' })} *
                  </Label>
                  <Input
                    value={bizName}
                    onChange={(e) => setBizName(e.target.value)}
                    placeholder={t('bisnis.businessNamePlaceholder', { defaultValue: 'Contoh: Toko Sejahtera' })}
                    className="h-11 text-sm"
                    style={{
                      background: '#0D0D0D',
                      border: `1px solid ${THEME.border}`,
                      color: THEME.text,
                    }}
                    autoFocus
                  />
                </div>

                {/* Category Grid */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium" style={{ color: THEME.textSecondary }}>
                    {t('bisnis.category', { defaultValue: 'Kategori Bisnis' })}
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {BUSINESS_CATEGORIES.map((cat) => {
                      const CatIcon = cat.icon;
                      const isSelected = bizCategory === cat.value;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setBizCategory(cat.value)}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-center transition-all duration-200"
                          style={{
                            background: isSelected ? `${THEME.primary}12` : '#0D0D0D',
                            border: `1.5px solid ${isSelected ? THEME.primary : THEME.border}`,
                          }}
                        >
                          <CatIcon
                            className="h-5 w-5"
                            style={{ color: isSelected ? THEME.primary : THEME.muted }}
                          />
                          <span
                            className="text-[10px] leading-tight font-medium"
                            style={{ color: isSelected ? THEME.primary : THEME.muted }}
                          >
                            {cat.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium" style={{ color: THEME.textSecondary }}>
                    {t('bisnis.description', { defaultValue: 'Deskripsi' })}
                  </Label>
                  <Textarea
                    value={bizDescription}
                    onChange={(e) => setBizDescription(e.target.value)}
                    placeholder={t('bisnis.descriptionPlaceholder', { defaultValue: 'Deskripsi singkat bisnis kamu (opsional)' })}
                    rows={2}
                    className="text-sm resize-none"
                    style={{
                      background: '#0D0D0D',
                      border: `1px solid ${THEME.border}`,
                      color: THEME.text,
                    }}
                  />
                </div>

                {/* Contact Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium" style={{ color: THEME.textSecondary }}>
                      {t('bisnis.address', { defaultValue: 'Alamat' })}
                    </Label>
                    <Input
                      value={bizAddress}
                      onChange={(e) => setBizAddress(e.target.value)}
                      placeholder={t('bisnis.addressPlaceholder', { defaultValue: 'Alamat bisnis' })}
                      className="h-10 text-sm"
                      style={{
                        background: '#0D0D0D',
                        border: `1px solid ${THEME.border}`,
                        color: THEME.text,
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium" style={{ color: THEME.textSecondary }}>
                      {t('bisnis.phone', { defaultValue: 'Telepon' })}
                    </Label>
                    <Input
                      value={bizPhone}
                      onChange={(e) => setBizPhone(e.target.value)}
                      placeholder="08xxx"
                      className="h-10 text-sm"
                      style={{
                        background: '#0D0D0D',
                        border: `1px solid ${THEME.border}`,
                        color: THEME.text,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium" style={{ color: THEME.textSecondary }}>
                    {t('bisnis.businessEmail', { defaultValue: 'Email Bisnis' })}
                  </Label>
                  <Input
                    type="email"
                    value={bizEmail}
                    onChange={(e) => setBizEmail(e.target.value)}
                    placeholder="email@bisnis.com"
                    className="h-10 text-sm"
                    style={{
                      background: '#0D0D0D',
                      border: `1px solid ${THEME.border}`,
                      color: THEME.text,
                    }}
                  />
                </div>

                {/* Next Button */}
                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={() => setFormStep(1)}
                    disabled={!bizName.trim()}
                    className="w-full h-11 rounded-xl font-semibold text-sm"
                    style={{
                      background: bizName.trim() ? THEME.primary : `${THEME.primary}40`,
                      color: '#000',
                    }}
                  >
                    {t('bisnis.next', { defaultValue: 'Selanjutnya — Pilih Fitur' })}
                    <ChevronDown className="h-4 w-4 ml-2 rotate-[-90deg]" />
                  </Button>
                </div>
              </>
            )}

            {/* ═══ STEP 1: Feature Selection ═══ */}
            {formStep === 1 && (
              <>
                {/* Selected Category Summary */}
                <div
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: `${THEME.primary}08`, border: `1px solid ${THEME.primary}20` }}
                >
                  <div
                    className="w-10 h-10 rounded-xl grid place-items-center shrink-0 [&>*]:block leading-none"
                    style={{ background: `${THEME.primary}15` }}
                  >
                    <SelectedCatIcon className="h-5 w-5" style={{ color: THEME.primary }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: THEME.text }}>
                      {bizName}
                    </p>
                    <p className="text-xs" style={{ color: THEME.textSecondary }}>
                      {selectedCat?.label} • {bizDescription || 'Tidak ada deskripsi'}
                    </p>
                  </div>
                </div>

                {/* Features Grid */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium" style={{ color: THEME.textSecondary }}>
                    {t('bisnis.selectFeatures', { defaultValue: 'Pilih fitur yang ingin digunakan' })} ({selectedFeatures.length}/7)
                  </Label>
                  <div className="space-y-2">
                    {FEATURE_OPTIONS.map((feat) => {
                      const isSelected = selectedFeatures.includes(feat.key);
                      const FeatIcon = feat.icon;
                      return (
                        <button
                          key={feat.key}
                          type="button"
                          onClick={() => toggleFeature(feat.key)}
                          className="w-full flex items-start gap-3 p-3.5 rounded-xl text-left transition-all duration-200"
                          style={{
                            background: isSelected ? `${THEME.secondary}08` : '#0D0D0D',
                            border: `1.5px solid ${isSelected ? THEME.secondary : THEME.border}`,
                          }}
                        >
                          <div
                            className="w-9 h-9 rounded-lg grid place-items-center shrink-0 mt-0.5 [&>*]:block leading-none"
                            style={{
                              background: isSelected ? `${THEME.secondary}15` : 'rgba(255,255,255,0.04)',
                            }}
                          >
                            <FeatIcon
                              className="h-4 w-4"
                              style={{ color: isSelected ? THEME.secondary : THEME.muted }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span
                                className="text-sm font-medium"
                                style={{ color: isSelected ? THEME.text : THEME.muted }}
                              >
                                {feat.label}
                              </span>
                              <div
                                className="w-5 h-5 rounded-md grid place-items-center shrink-0 [&>*]:block leading-none"
                                style={{
                                  background: isSelected ? THEME.secondary : 'transparent',
                                  border: `1.5px solid ${isSelected ? THEME.secondary : THEME.border}`,
                                }}
                              >
                                {isSelected && <Check className="h-3 w-3" style={{ color: '#000' }} />}
                              </div>
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: THEME.textSecondary }}>
                              {feat.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setFormStep(0)}
                    className="h-11 px-4 rounded-xl text-sm font-medium shrink-0"
                    style={{ color: THEME.muted }}
                  >
                    <ChevronDown className="h-4 w-4 mr-1 rotate-90" />
                    {t('common.back', { defaultValue: 'Kembali' })}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating || selectedFeatures.length === 0}
                    className="flex-1 h-11 rounded-xl font-semibold text-sm"
                    style={{
                      background: selectedFeatures.length > 0 && !isCreating ? THEME.secondary : `${THEME.secondary}40`,
                      color: '#000',
                    }}
                  >
                    {isCreating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        {t('bisnis.createStart', { defaultValue: 'Buat Bisnis & Mulai' })}
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>

        {/* PRO Badge */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <Crown className="h-3.5 w-3.5" style={{ color: THEME.primary }} />
          <span className="text-[10px] font-medium tracking-wider" style={{ color: THEME.muted }}>
            PRO BUSINESS FEATURES
          </span>
        </div>
      </div>
    );
  }

  // ── Tabs Config ─────────────────────────────────────────────────
  const selectedBusiness = businesses.find((b) => b.id === selectedBusinessId);
  const businessFeatures = selectedBusiness?.features?.split(',').map((f) => f.trim()) || [];

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'dashboard', label: t('bisnis.dashboard', { defaultValue: 'Dashboard' }), icon: LayoutDashboard },
    { key: 'products', label: t('bisnis.products', { defaultValue: 'Produk' }), icon: Package },
    { key: 'sales', label: t('bisnis.sales', { defaultValue: 'Penjualan' }), icon: ShoppingCart },
    { key: 'customers', label: t('bisnis.customers', { defaultValue: 'Pelanggan' }), icon: Users },
    { key: 'cashflow', label: t('bisnis.cashflow', { defaultValue: 'Kas' }), icon: Wallet },
    { key: 'pending', label: t('bisnis.pendingPayments', { defaultValue: 'Tertunda' }), icon: Clock },
    { key: 'import-export', label: t('bisnis.importExport', { defaultValue: 'Import/Export' }), icon: ArrowUpDown },
  ].filter((tab) => businessFeatures.includes(tab.key));

  // ── Main Layout ─────────────────────────────────────────────────
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* ── Header: Business Selector + PRO Badge ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-9 h-9 rounded-xl grid place-items-center shrink-0 [&>*]:block leading-none"
            style={{ background: `${THEME.primary}15` }}
          >
            <Building2 className="h-4.5 w-4.5" style={{ color: THEME.primary }} />
          </div>
          <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
            <SelectTrigger
              className="w-full max-w-xs text-sm font-medium truncate"
              style={{
                background: THEME.surface,
                border: `1px solid ${THEME.border}`,
                color: THEME.text,
              }}
            >
              <SelectValue placeholder={t('bisnis.selectBusiness', { defaultValue: 'Pilih Bisnis' })} />
            </SelectTrigger>
            <SelectContent style={{ background: '#1E1E1E', border: `1px solid ${THEME.border}` }}>
              {businesses.map((biz) => (
                <SelectItem
                  key={biz.id}
                  value={biz.id}
                  className="text-sm cursor-pointer"
                  style={{ color: THEME.text }}
                >
                  {biz.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider"
            style={{
              background: `${THEME.primary}20`,
              color: THEME.primary,
              border: 'none',
            }}
          >
            PRO
          </Badge>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            variant="ghost"
            size="sm"
            className="h-8 px-3 rounded-lg text-xs font-medium"
            style={{ color: THEME.textSecondary }}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {t('bisnis.addBusiness', { defaultValue: 'Bisnis Baru' })}
          </Button>
        </div>
      </div>

      {/* ── Horizontal Scrollable Tabs ── */}
      <div className="relative">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-all duration-200 relative"
                style={{
                  background: isActive ? `${THEME.primary}15` : 'transparent',
                  color: isActive ? THEME.primary : THEME.muted,
                }}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {isActive && (
                  <div
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                    style={{ background: THEME.primary }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div
          className="mt-3 h-[1px] w-full rounded-full"
          style={{ background: THEME.border }}
        />
      </div>

      {/* ── Tab Content ── */}
      <div className="min-h-[400px]">
        {activeTab === 'dashboard' && selectedBusinessId && (
          <BisnisDashboard businessId={selectedBusinessId} businessName={selectedBusiness?.name || ''} />
        )}
        {activeTab === 'products' && selectedBusinessId && (
          <ProductList businessId={selectedBusinessId} />
        )}
        {activeTab === 'sales' && selectedBusinessId && (
          <SalesList businessId={selectedBusinessId} />
        )}
        {activeTab === 'customers' && selectedBusinessId && (
          <CustomerList businessId={selectedBusinessId} />
        )}
        {activeTab === 'cashflow' && selectedBusinessId && (
          <CashFlowView businessId={selectedBusinessId} />
        )}
        {activeTab === 'pending' && selectedBusinessId && (
          <PendingPayments businessId={selectedBusinessId} />
        )}
        {activeTab === 'import-export' && selectedBusinessId && (
          <ImportExportView businessId={selectedBusinessId} />
        )}
      </div>

      {/* ── Dialogs ── */}
      <BusinessFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreated={handleBusinessCreated}
      />
    </div>
  );
}
