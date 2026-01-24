'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Lock, TrendingUp, Target, Timer } from 'lucide-react';

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
    narrative: 'Bertahan hidup. Fokus disiplin dan kontrol bocor kecil.',
    advice: 'Catat semua pengeluaran. Jangan mikir investasi dulu.',
  },
  {
    level: 2,
    name: 'Semut',
    emoji: '🐜',
    min: 1_000_000,
    max: 5_000_000,
    narrative: 'Mulai konsisten. Sedikit tapi rutin.',
    advice: 'Bangun dana darurat 3 bulan.',
  },
  {
    level: 3,
    name: 'Serigala',
    emoji: '🐺',
    min: 5_000_000,
    max: 50_000_000,
    narrative: 'Berburu peluang. Multiple income mulai terasa.',
    advice: 'Pisahkan modal kerja dan tabungan.',
  },
  {
    level: 4,
    name: 'Singa',
    emoji: '🦁',
    min: 50_000_000,
    max: 250_000_000,
    narrative: 'Kuasai wilayah. Risiko harus terukur.',
    advice: 'Mulai diversifikasi aset & proteksi.',
  },
  {
    level: 5,
    name: 'Naga',
    emoji: '🐉',
    min: 250_000_000,
    max: Infinity,
    narrative: 'Penjaga kekayaan. Main di strategi & kontrol.',
    advice: 'Fokus compounding & capital preservation.',
  },
];

/* =========================
   HELPERS
========================= */

const formatIDR = (n: number) =>
  `Rp ${n.toLocaleString('id-ID')}`;

export default function DashboardPage() {
  /**
   * SIMULASI DATA
   * ganti nanti pakai data asli lu
   */
  const totalIncome = 25_000_000;
  const totalExpense = 18_000_000;
  const balance = totalIncome - totalExpense;

  const avgMonthlySaving = Math.max(balance, 0);

  /* =========================
     CURRENT PHASE
  ========================= */

  const currentPhase = useMemo(() => {
    return PHASES.find(
      (p) => balance >= p.min && balance < p.max
    ) || PHASES[0];
  }, [balance]);

  const nextPhase = PHASES.find(
    (p) => p.level === currentPhase.level + 1
  );

  const phaseProgress = nextPhase
    ? ((balance - currentPhase.min) /
        (nextPhase.min - currentPhase.min)) *
      100
    : 100;

  /* =========================
     ETA TO NEXT PHASE
  ========================= */

  const etaMonths =
    nextPhase && avgMonthlySaving > 0
      ? Math.ceil((nextPhase.min - balance) / avgMonthlySaving)
      : null;

  /* =========================
     UNLOCK BADGE (ONCE)
  ========================= */

  const [lastLevel, setLastLevel] = useState<number>(0);

  useEffect(() => {
    const saved = Number(localStorage.getItem('lastPhase') || 0);
    setLastLevel(saved);

    if (currentPhase.level > saved) {
      localStorage.setItem(
        'lastPhase',
        currentPhase.level.toString()
      );
      alert(
        `🏅 LEVEL UP!\nKamu masuk fase ${currentPhase.emoji} ${currentPhase.name}`
      );
    }
  }, [currentPhase.level]);

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* =========================
            PHASE CARD (MAIN)
        ========================= */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              {currentPhase.emoji} Fase {currentPhase.name}
            </CardTitle>
            <p className="text-center text-sm text-gray-600">
              {currentPhase.narrative}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="text-center font-bold text-xl">
              {formatIDR(balance)}
            </div>

            <Progress value={phaseProgress} />

            {nextPhase && (
              <div className="text-sm text-center text-gray-600">
                Menuju {nextPhase.emoji} {nextPhase.name}
              </div>
            )}

            {etaMonths && (
              <div className="flex justify-center gap-2 text-sm text-blue-700">
                <Timer className="h-4 w-4" />
                Estimasi naik level: {etaMonths} bulan
              </div>
            )}

            <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-900">
              <strong>Advice:</strong> {currentPhase.advice}
            </div>
          </CardContent>
        </Card>

        {/* =========================
            PHASE ROADMAP
        ========================= */}
        <Card>
          <CardHeader>
            <CardTitle>Roadmap Fase Keuangan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">

            {PHASES.map((p) => {
              const locked = p.level > currentPhase.level;

              return (
                <div
                  key={p.level}
                  className={`p-3 border rounded-md relative ${
                    locked
                      ? 'opacity-40 blur-[1px]'
                      : 'bg-white'
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

        {/* =========================
            QUICK SUMMARY
        ========================= */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">
                Pemasukan
              </div>
              <div className="font-bold text-green-700">
                {formatIDR(totalIncome)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">
                Pengeluaran
              </div>
              <div className="font-bold text-red-700">
                {formatIDR(totalExpense)}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
}
