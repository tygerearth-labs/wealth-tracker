'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus, Trash2, Wallet, TrendingDown, Inbox } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrencyFormat } from '@/hooks/useCurrencyFormat';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { CashFlowForm } from '@/components/bisnis/CashFlowForm';

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
interface CashFlowTransaction {
  id: string;
  type: string;
  amount: number;
  description?: string | null;
  category?: string | null;
  date: string;
}

type SubTab = 'kas_besar' | 'kas_kecil' | 'pengeluaran';

interface CashFlowViewProps {
  businessId: string;
}

const SUB_TABS: { key: SubTab; label: string; icon: any; accent: string }[] = [
  { key: 'kas_besar', label: 'Kas Besar', icon: Wallet, accent: '#03DAC6' },
  { key: 'kas_kecil', label: 'Kas Kecil', icon: Wallet, accent: '#BB86FC' },
  { key: 'pengeluaran', label: 'Pengeluaran', icon: TrendingDown, accent: '#CF6679' },
];

// ── Main Component ───────────────────────────────────────────────
export function CashFlowView({ businessId }: CashFlowViewProps) {
  const { t } = useTranslation();
  const { formatAmount } = useCurrencyFormat();

  const [transactions, setTransactions] = useState<CashFlowTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('kas_besar');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [defaultFormType, setDefaultFormType] = useState<SubTab>('kas_besar');

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/bisnis/cashflow?businessId=${businessId}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
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
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/bisnis/cashflow/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('bisnis.deleteTransactionSuccess', { defaultValue: 'Transaksi berhasil dihapus' }));
        fetchTransactions();
      } else {
        toast.error(t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const openAddForm = (type?: SubTab) => {
    setDefaultFormType(type || activeSubTab);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchTransactions();
  };

  // Filter by sub-tab
  const filtered = transactions.filter((tx) => tx.type === activeSubTab);
  const totalAmount = filtered.reduce((sum, tx) => sum + tx.amount, 0);

  const currentTab = SUB_TABS.find((st) => st.key === activeSubTab)!;

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
      {/* ── Sub Tabs ── */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
        {SUB_TABS.map((tab) => {
          const isActive = activeSubTab === tab.key;
          const tabTotal = transactions
            .filter((tx) => tx.type === tab.key)
            .reduce((sum, tx) => sum + tx.amount, 0);
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition-all duration-200"
              style={{
                background: isActive ? `${tab.accent}15` : `${THEME.surface}`,
                border: `1px solid ${isActive ? `${tab.accent}30` : THEME.border}`,
                color: isActive ? tab.accent : THEME.muted,
              }}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              <span className="text-[10px] font-bold ml-1" style={{ color: isActive ? tab.accent : THEME.muted, opacity: 0.7 }}>
                {formatAmount(tabTotal)}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Summary Card ── */}
      <div
        className="rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden"
        style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
      >
        <div
          className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ background: currentTab.accent }}
        />
        <div className="flex items-center gap-3 relative z-10">
          <div
            className="w-10 h-10 rounded-xl grid place-items-center [&>*]:block leading-none"
            style={{ background: `${currentTab.accent}15` }}
          >
            <currentTab.icon className="h-5 w-5" style={{ color: currentTab.accent }} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: THEME.muted }}>
              {t('bisnis.total', { defaultValue: 'Total' })} {currentTab.label}
            </p>
            <p className="text-xl font-bold" style={{ color: currentTab.accent }}>
              {formatAmount(totalAmount)}
            </p>
          </div>
        </div>
        <Button
          onClick={() => openAddForm()}
          className="h-9 px-4 rounded-lg text-sm font-semibold shrink-0 relative z-10"
          style={{ background: currentTab.accent, color: '#000' }}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          {t('common.add', { defaultValue: 'Tambah' })}
        </Button>
      </div>

      {/* ── Empty State ── */}
      {filtered.length === 0 && (
        <div
          className="rounded-xl p-8 flex flex-col items-center justify-center text-center"
          style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
        >
          <Inbox className="h-8 w-8 mb-2" style={{ color: THEME.muted, opacity: 0.5 }} />
          <p className="text-xs" style={{ color: THEME.muted }}>{t('bisnis.noTransactions', { defaultValue: 'Belum ada transaksi' })}</p>
        </div>
      )}

      {/* ── Desktop Table ── */}
      {filtered.length > 0 && (
        <div className="hidden lg:block">
          <div className="rounded-xl overflow-hidden" style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: `${THEME.bg}80` }}>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>
                    {t('bisnis.date', { defaultValue: 'Tanggal' })}
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>
                    {t('bisnis.description', { defaultValue: 'Deskripsi' })}
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>
                    {t('bisnis.category', { defaultValue: 'Kategori' })}
                  </th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>
                    {t('bisnis.amount', { defaultValue: 'Jumlah' })}
                  </th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: THEME.muted }}>
                    {t('bisnis.actions', { defaultValue: 'Aksi' })}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <tr key={tx.id} className="transition-colors duration-150" style={{ borderTop: `1px solid ${THEME.border}` }}>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: THEME.muted }}>
                        {format(new Date(tx.date), 'dd MMM yyyy', { locale: idLocale })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium" style={{ color: THEME.text }}>{tx.description || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      {tx.category ? (
                        <Badge className="text-[10px] px-2 py-0.5 font-medium" style={{ background: `${currentTab.accent}15`, color: currentTab.accent, border: 'none' }}>
                          {tx.category}
                        </Badge>
                      ) : (
                        <span className="text-xs" style={{ color: THEME.muted }}>-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-bold" style={{ color: currentTab.accent }}>
                        {formatAmount(tx.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="p-2 rounded-lg transition-all hover:scale-110"
                        style={{ background: `${THEME.destructive}15`, color: THEME.destructive }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Mobile Card List ── */}
      {filtered.length > 0 && (
        <div className="lg:hidden space-y-2">
          {filtered.map((tx) => (
            <div
              key={tx.id}
              className="rounded-xl p-3 transition-all duration-150"
              style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs" style={{ color: THEME.muted }}>
                      {format(new Date(tx.date), 'dd MMM yyyy', { locale: idLocale })}
                    </span>
                    {tx.category && (
                      <Badge className="text-[9px] px-1.5 py-0 font-medium" style={{ background: `${currentTab.accent}15`, color: currentTab.accent, border: 'none' }}>
                        {tx.category}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs font-medium truncate" style={{ color: THEME.text }}>
                    {tx.description || '-'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-bold" style={{ color: currentTab.accent }}>
                    {formatAmount(tx.amount)}
                  </span>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="p-1.5 rounded-lg"
                    style={{ background: `${THEME.destructive}15`, color: THEME.destructive }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Cash Flow Form Dialog ── */}
      <CashFlowForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        businessId={businessId}
        defaultType={defaultFormType}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
