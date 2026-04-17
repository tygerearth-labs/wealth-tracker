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
interface CashFlowFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  defaultType?: string;
  onSuccess: () => void;
}

const TYPES = [
  { value: 'kas_besar', label: 'Kas Besar' },
  { value: 'kas_kecil', label: 'Kas Kecil' },
  { value: 'pengeluaran', label: 'Pengeluaran' },
];

// ── Main Component ───────────────────────────────────────────────
export function CashFlowForm({ open, onOpenChange, businessId, defaultType, onSuccess }: CashFlowFormProps) {
  const { t } = useTranslation();

  const [type, setType] = useState(defaultType || 'kas_besar');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (defaultType) setType(defaultType);
    setDate(new Date().toISOString().split('T')[0]);
  }, [defaultType, open]);

  const resetForm = () => {
    setType(defaultType || 'kas_besar');
    setAmount('');
    setDescription('');
    setCategory('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error(t('bisnis.amountRequired', { defaultValue: 'Jumlah harus lebih dari 0' }));
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/bisnis/cashflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          type,
          amount: Number(amount),
          description: description.trim() || undefined,
          category: category.trim() || undefined,
          date: date || undefined,
        }),
      });

      if (res.ok) {
        toast.success(t('bisnis.createTransactionSuccess', { defaultValue: 'Transaksi berhasil ditambahkan' }));
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

  const typeAccent =
    type === 'kas_besar' ? THEME.secondary :
    type === 'kas_kecil' ? THEME.primary :
    THEME.destructive;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent
        className="max-w-md"
        style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
      >
        <DialogHeader>
          <DialogTitle className="text-base font-semibold" style={{ color: THEME.text }}>
            {t('bisnis.addTransaction', { defaultValue: 'Tambah Transaksi' })}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Tipe */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium" style={labelStyle}>
              {t('bisnis.type', { defaultValue: 'Tipe' })}
            </Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-9 text-sm" style={inputStyle}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ background: '#1E1E1E', border: `1px solid ${THEME.border}` }}>
                {TYPES.map((tp) => (
                  <SelectItem key={tp.value} value={tp.value} style={{ color: THEME.text }}>
                    {tp.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Jumlah */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium" style={labelStyle}>
              {t('bisnis.amount', { defaultValue: 'Jumlah' })} *
            </Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="0"
              className="h-9 text-sm"
              style={inputStyle}
            />
          </div>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium" style={labelStyle}>
              {t('bisnis.description', { defaultValue: 'Deskripsi' })}
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('bisnis.descriptionPlaceholder', { defaultValue: 'Deskripsi transaksi (opsional)' })}
              rows={2}
              className="text-sm resize-none"
              style={{ ...inputStyle, minHeight: '60px' }}
            />
          </div>

          {/* Kategori */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium" style={labelStyle}>
              {t('bisnis.category', { defaultValue: 'Kategori' })}
            </Label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={t('bisnis.categoryPlaceholder', { defaultValue: 'Kategori (opsional)' })}
              className="h-9 text-sm"
              style={inputStyle}
            />
          </div>

          {/* Tanggal */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium" style={labelStyle}>
              {t('bisnis.date', { defaultValue: 'Tanggal' })}
            </Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 text-sm"
              style={inputStyle}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => { resetForm(); onOpenChange(false); }} className="flex-1 h-9 rounded-lg text-sm font-medium" style={{ color: THEME.muted }}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 h-9 rounded-lg text-sm font-semibold" style={{ background: typeAccent, color: type === 'pengeluaran' ? '#fff' : '#000' }}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
