'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Lock, Timer } from 'lucide-react';

/* =========================
   PHASE CONFIG
========================= */

const PHASES = [
  {
    level: 1,
    name: 'Cacing',
    emoji: '🐛',
    min: 0,
    max: 1_000_000,
    narrative: 'Fase bertahan hidup. Disiplin lebih penting dari besar kecilnya uang.',
    advice: 'Catat semua pengeluaran. Tutup kebocoran.',
  },
  {
    level: 2,
    name: 'Semut',
    emoji: '🐜',
    min: 1_000_000,
    max: 5_000_000,
    narrative: 'Sedikit tapi konsisten. Pondasi sedang dibangun.',
    advice: 'Bangun dana darurat 3 bulan.',
  },
  {
    level: 3,
    name: 'Serigala',
    emoji: '🐺',
    min: 5_000_000,
    max: 50_000_000,
    narrative: 'Mulai berburu peluang. Multiple income terasa.',
    advice: 'Pisahkan tabungan, modal, dan gaya hidup.',
  },
  {
    level: 4,
    name: 'Singa',
    emoji: '🦁',
    min: 50_000_000,
    max: 250_000_000,
    narrative: 'Wilayah sudah luas. Kesalahan kecil mahal.',
    advice: 'Diversifikasi aset dan kelola risiko.',
  },
  {
    level: 5,
    name: 'Naga',
    emoji: '🐉',
    min: 250_000_000,
    max: Infinity,
    narrative: 'Penjaga kekayaan. Fokus strategi dan kontrol.',
    advice: 'Mainkan compounding dan capital preservation.',
  },
];

const formatIDR = (n: number) =>
  `Rp ${n.toLocaleString('id-ID')}`;

export default function DashboardPage() {
  const { activeProfile, isLoading } = useProfile();
  const [transactions, setTransactions] = useState<any[]>([]);

  /* =========================
     FETCH DATA
  ========================= */

  useEffect(() => {
    if (!activeProfile) return;

    fetch(`/api/transactions?profileId=${activeProfile.id}`)
      .then(res => res.json())
      .then(data => setTransactions(data))
      .catch(() => setTransactions([]));
  }, [activeProfile]);

  /* =========================
     DATA READY GATE
  ========================= */

  const dataReady =
    !isLoading &&
    activeProfile &&
    transactions.length > 0;

  /* =========================
     BALANCE (SOURCE OF TRUTH)
  ========================= */

  const totalIncome = useMemo(
    () =>
      transactions
        .filter(t => t.type === 'INCOME')
        .reduce((s, t) => s + t.amount, 0),
    [transactions]
  );

  const totalExpense = useMemo(
    () =>
      transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((s, t) => s + t.amount, 0),
    [transactions]
  );

  const balance = totalIncome - totalExpense;

  const avgMonthlySaving = Math.max(balance, 0);

  /* =========================
     CURRENT PHASE
  ========================= */

  const currentPhase = useMemo(() => {
    if (!dataReady) return null;
    return (
      PHASES.find(
        p => balance >= p.min && balance < p.max
      ) || PHASES[0]
    );
  }, [balance, dataReady]);

  const nextPhase = currentPhase
    ? PHASES.find(p => p.level === currentPhase.level + 1)
    : null;

  const phaseProgress =
    currentPhase && nextPhase
      ? ((balance - currentPhase.min) /
          (nextPhase.min - currentPhase.min)) *
        100
      : 0;

  /* =========================
     ETA TO NEXT PHASE
  ========================= */

  const etaMonths =
    nextPhase && avgMonthlySaving > 0
      ? Math.ceil((nextPhase.min - balance) / avgMonthlySaving)
      : null;

  /* =========================
     SAFE LEVEL UP CHECK
  ========================= */

  useEffect(() => {
    if (!currentPhase) return;

    const last = Number(
      localStorage.getItem('lastPhase') || 0
    );

    if (currentPhase.level > last) {
      localStorage.setItem(
        'lastPhase',
        currentPhase.level.toString()
      );
      // nanti ganti ke toast/modal
      console.info(
        `LEVEL UP: ${currentPhase.name}`
      );
    }
  }, [currentPhase]);

  /* =========================
     RENDER STATES
  ========================= */

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-gray-500">
          Menyiapkan dashboard...
        </div>
      </DashboardLayout>
    );
  }

  if (!activeProfile) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-gray-500">
          Pilih profil untuk mulai.
        </div>
      </DashboardLayout>
    );
  }

  if (!dataReady) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-gray-500">
          Menganalisa progres keuangan...
        </div>
      </DashboardLayout>
    );
  }

  /* =========================
     UI
  ========================= */

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* CURRENT PHASE */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              {currentPhase!.emoji} Fase {currentPhase!.name}
            </CardTitle>
            <p className="text-center text-sm text-gray-600">
              {currentPhase!.narrative}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="text-center font-bold text-xl">
              {formatIDR(balance)}
            </div>

            <Progress value={phaseProgress} />

            {nextPhase && (
              <p className="text-center text-sm text-gray-600">
                Menuju {nextPhase.emoji} {nextPhase.name}
              </p>
            )}

            {etaMonths && (
              <div className="flex justify-center gap-2 text-sm text-blue-700">
                <Timer className="h-4 w-4" />
                Estimasi naik level: {etaMonths} bulan
              </div>
            )}

            <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-900">
              <strong>Advice:</strong> {currentPhase!.advice}
            </div>

          </CardContent>
        </Card>

        {/* PHASE ROADMAP */}
        <Card>
          <CardHeader>
            <CardTitle>Roadmap Fase Keuangan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">

            {PHASES.map(p => {
              const locked = p.level > currentPhase!.level;

              return (
                <div
                  key={p.level}
                  className={`p-3 border rounded-md relative ${
                    locked
                      ? 'opacity-40 blur-[1px]'
                      : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="font-semibold">
                      {p.emoji} {p.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatIDR(p.min)}+
                    </div>
                  </div>

                  <p className="text-xs mt-1">
                    {p.narrative}
                  </p>

                  {locked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white px-3 py-1 rounded-full flex items-center gap-1 text-xs border">
                        <Lock className="h-3 w-3" />
                        Terkunci
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
