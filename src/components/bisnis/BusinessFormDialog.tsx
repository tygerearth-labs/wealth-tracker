'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Check, Store, UtensilsCrossed, Briefcase, Home, Cpu, GraduationCap, Shirt, MoreHorizontal } from 'lucide-react';
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
  borderHover: 'rgba(255,255,255,0.15)',
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
} as const;

// ── Business Categories ──────────────────────────────────────────
const BUSINESS_CATEGORIES = [
  { value: 'ritel', label: 'Ritel', icon: Store },
  { value: 'fnb', label: 'F&B', icon: UtensilsCrossed },
  { value: 'jasa', label: 'Jasa', icon: Briefcase },
  { value: 'properti', label: 'Properti', icon: Home },
  { value: 'elektronik', label: 'Elektronik', icon: Cpu },
  { value: 'pendidikan', label: 'Pendidikan', icon: GraduationCap },
  { value: 'fashion', label: 'Fashion', icon: Shirt },
  { value: 'lainnya', label: 'Lainnya', icon: MoreHorizontal },
] as const;

// ── Types ────────────────────────────────────────────────────────
interface BusinessFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (business: any) => void;
}

// ── Main Component ───────────────────────────────────────────────
export function BusinessFormDialog({ open, onOpenChange, onCreated }: BusinessFormDialogProps) {
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('ritel');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setCategory('ritel');
      setDescription('');
      setAddress('');
      setPhone('');
      setEmail('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t('bisnis.businessNameRequired', { defaultValue: 'Nama bisnis wajib diisi' }));
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/bisnis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category,
          description: description.trim() || undefined,
          address: address.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onCreated(data.business);
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
            {t('bisnis.createBusiness', { defaultValue: 'Buat Bisnis Baru' })}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Nama Bisnis */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium" style={labelStyle}>
              {t('bisnis.businessName', { defaultValue: 'Nama Bisnis' })} *
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('bisnis.businessNamePlaceholder', { defaultValue: 'Contoh: Toko Sejahtera' })}
              className="h-9 text-sm"
              style={inputStyle}
              autoFocus
            />
          </div>

          {/* Kategori */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium" style={labelStyle}>
              {t('bisnis.category', { defaultValue: 'Kategori' })}
            </Label>
            <div className="grid grid-cols-4 gap-1.5">
              {BUSINESS_CATEGORIES.map((cat) => {
                const CatIcon = cat.icon;
                const isSelected = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg text-center transition-all duration-200"
                    style={{
                      background: isSelected ? `${THEME.primary}12` : '#0D0D0D',
                      border: `1.5px solid ${isSelected ? THEME.primary : THEME.border}`,
                    }}
                  >
                    <CatIcon
                      className="h-4 w-4"
                      style={{ color: isSelected ? THEME.primary : THEME.muted }}
                    />
                    <span
                      className="text-[9px] leading-tight font-medium"
                      style={{ color: isSelected ? THEME.primary : THEME.muted }}
                    >
                      {cat.label}
                    </span>
                  </button>
                );
              })}
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
              placeholder={t('bisnis.descriptionPlaceholder', { defaultValue: 'Deskripsi bisnis Anda (opsional)' })}
              rows={2}
              className="text-sm resize-none"
              style={{ ...inputStyle, minHeight: '60px' }}
            />
          </div>

          {/* Alamat */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium" style={labelStyle}>
              {t('bisnis.address', { defaultValue: 'Alamat' })}
            </Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t('bisnis.addressPlaceholder', { defaultValue: 'Alamat bisnis' })}
              className="h-9 text-sm"
              style={inputStyle}
            />
          </div>

          {/* Telepon + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium" style={labelStyle}>
                {t('bisnis.phone', { defaultValue: 'Telepon' })}
              </Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxx"
                className="h-9 text-sm"
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium" style={labelStyle}>
                {t('bisnis.businessEmail', { defaultValue: 'Email Bisnis' })}
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                className="h-9 text-sm"
                style={inputStyle}
              />
            </div>
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
