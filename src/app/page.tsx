'use client';

import React, { useState, useEffect } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Target, AlertCircle, Lightbulb, CheckCircle2, AlertTriangle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: string;
  category: any;
}

interface SavingsTarget {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  startDate: string;
  endDate: string;
}

const FINANCIAL_PHASES = [
  {
    level: 1,
    name: 'Cacing',
    emoji: '🐛',
    min: 0,
    max: 1_000_000,
    narrative: 'Fase bertahan hidup. Disiplin lebih penting dari nominal.',
    advice: 'Fokus menutup kebocoran kecil dan biasakan mencatat.'
  },
  {
    level: 2,
    name: 'Semut',
    emoji: '🐜',
    min: 1_000_000,
    max: 5_000_000,
    narrative: 'Kecil tapi konsisten. Pondasi mulai terbentuk.',
    advice: 'Bangun dana darurat minimal 3 bulan.'
  },
  {
    level: 3,
    name: 'Serigala',
    emoji: '🐺',
    min: 5_000_000,
    max: 50_000_000,
    narrative: 'Mulai berburu peluang. Efisiensi adalah senjata.',
    advice: 'Pisahkan tabungan, modal, dan lifestyle.'
  },
  {
    level: 4,
    name: 'Singa',
    emoji: '🦁',
    min: 50_000_000,
    max: 250_000_000,
    narrative: 'Wilayah luas. Kesalahan makin mahal.',
    advice: 'Diversifikasi dan kontrol risiko.'
  },
  {
    level: 5,
    name: 'Naga',
    emoji: '🐉',
    min: 250_000_000,
    max: Infinity,
    narrative: 'Penjaga kekayaan. Fokus keberlanjutan.',
    advice: 'Optimalkan compounding dan capital preservation.'
  },
];

export default function DashboardPage() {
  const { activeProfile, isLoading } = useProfile();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingsTargets, setSavingsTargets] = useState<SavingsTarget[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'month' | 'year'>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const investmentQuotes = [
    "Investasikan uang Anda, jangan hanya menabungnya. - Robert Kiyosaki",
    "Jangan menunggu waktu yang tepat, karena tidak ada waktu yang sempurna. - Nicolas Darvas",
    "Kaya bukan berarti banyak uang, tapi bebas dari utang. - Suze Orman",
    "Uang tidak mengubah seseorang, tapi hanya mengungkapkan siapa mereka sebenarnya.",
    "Cara terbaik untuk memprediksi masa depan adalah dengan menciptakannya. - Peter Drucker",
  ];

  const [randomQuote] = useState(
    investmentQuotes[Math.floor(Math.random() * investmentQuotes.length)]
  );

  useEffect(() => {
    if (activeProfile) {
      fetchTransactions();
      fetchSavingsTargets();
    }
  }, [activeProfile, filterType, filterPeriod, selectedMonth, selectedYear]);

  const fetchTransactions = async () => {
    if (!activeProfile) return;

    let url = `/api/transactions?profileId=${activeProfile.id}`;

    if (filterType !== 'all') {
      url += `&type=${filterType.toUpperCase()}`;
    }

    if (filterPeriod === 'month') {
      url += `&month=${selectedMonth}&year=${selectedYear}`;
    } else if (filterPeriod === 'year') {
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;
      url += `&startDate=${startDate}&endDate=${endDate}`;
    }

    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchSavingsTargets = async () => {
    if (!activeProfile) return;

    try {
      const response = await fetch(`/api/savings-targets?profileId=${activeProfile.id}`);
      if (response.ok) {
        const data = await response.json();
        setSavingsTargets(data);
      }
    } catch (error) {
      console.error('Error fetching savings targets:', error);
    }
  };

  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;
  const expenseRatio = totalIncome > 0 ? ((totalExpense / totalIncome) * 100) : 0;

    // === Financial Phase Logic ===
    const currentPhase = FINANCIAL_PHASES.find(
        p => balance >= p.min && balance < p.max
    );

    const nextPhase = currentPhase
        ? FINANCIAL_PHASES.find(p => p.level === currentPhase.level + 1)
        : null;

    const phaseProgress =
        currentPhase && nextPhase
        ? ((balance - currentPhase.min) / (nextPhase.min - currentPhase.min)) * 100
        : 100;

  // A. Financial Status Badge Logic
  const getFinancialStatus = () => {
    const rate = parseFloat(savingsRate.toFixed(1));
    if (balance < 0) {
      return {
        status: 'Defisit',
        color: 'bg-red-100 border-red-500 text-red-900',
        icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
        description: `Pengeluaran ${(expenseRatio).toFixed(0)}% lebih besar dari pemasukan`
      };
    } else if (rate >= 20) {
      return {
        status: 'Sehat',
        color: 'bg-green-100 border-green-500 text-green-900',
        icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
        description: `Cashflow positif dengan tabungan ${rate.toFixed(1)}%`
      };
    } else {
      return {
        status: 'Waspada',
        color: 'bg-yellow-100 border-yellow-500 text-yellow-900',
        icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
        description: `Saldo tipis dengan tabungan ${rate.toFixed(1)}%`
      };
    }
  };

  const financialStatus = getFinancialStatus();

  // B. Saldo Narrative
  const getBalanceNarrative = () => {
    if (balance < 0) {
      const deficitRatio = totalIncome > 0 ? (totalExpense / totalIncome) : 0;
      const daysToNegative = deficitRatio > 0 ? Math.floor(30 / (deficitRatio - 1)) : 0;
      return {
        narrative: `Saldo Defisit`,
        detail: `Pengeluaran Anda ${deficitRatio.toFixed(1)}x lebih besar dari pemasukan dalam periode ini.`,
        forecast: daysToNegative > 0 && daysToNegative < 365 
          ? `Dengan pola ini, cashflow negatif akan berlanjut dalam ${daysToNegative} hari.`
          : `Dengan pola ini, keuangan Anda akan terus negatif.`
      };
    } else if (parseFloat(savingsRate.toFixed(1)) < 10) {
      return {
        narrative: `Saldo Tipis`,
        detail: `Tabungan Anda ${savingsRate.toFixed(1)}% dari pemasukan.`
      };
    } else {
      return {
        narrative: `Saldo Positif`,
        detail: `Tabungan ${savingsRate.toFixed(1)}% dari pemasukan. Pertahankan pola ini!`
      };
    }
  };

  const balanceNarrative = getBalanceNarrative();

  // C. Cash Flow Insight
  const getCashFlowInsight = () => {
    if (transactions.length === 0) return null;

    const sortedDates = [...new Set(transactions.map(t => new Date(t.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })))];
    if (sortedDates.length < 2) return null;

    // Calculate recent vs previous period trends
    const midPoint = Math.floor(sortedDates.length / 2);
    const recentDates = sortedDates.slice(-midPoint);
    const previousDates = sortedDates.slice(0, midPoint);

    const recentTransactions = transactions.filter(t => recentDates.includes(new Date(t.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })));
    const previousTransactions = transactions.filter(t => previousDates.includes(new Date(t.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })));

    const recentExpense = recentTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
    const previousExpense = previousTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);

    const recentIncome = recentTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
    const previousIncome = previousTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);

    const expenseChange = previousExpense > 0 ? ((recentExpense - previousExpense) / previousExpense) * 100 : 0;
    const incomeChange = previousIncome > 0 ? ((recentIncome - previousIncome) / previousIncome) * 100 : 0;

    if (Math.abs(expenseChange) > 20) {
      return {
        type: 'expense',
        trend: expenseChange > 0 ? 'naik' : 'turun',
        percentage: Math.abs(expenseChange).toFixed(0),
        message: `Pengeluaran ${expenseChange > 0 ? 'meningkat' : 'menurun'} ${Math.abs(expenseChange).toFixed(0)}% dibanding periode sebelumnya.`
      };
    } else if (Math.abs(incomeChange) > 20) {
      return {
        type: 'income',
        trend: incomeChange > 0 ? 'naik' : 'turun',
        percentage: Math.abs(incomeChange).toFixed(0),
        message: `Pemasukan ${incomeChange > 0 ? 'meningkat' : 'menurun'} ${Math.abs(incomeChange).toFixed(0)}% dibanding periode sebelumnya.`
      };
    } else if (recentIncome > recentExpense * 1.2) {
      return {
        type: 'surplus',
        message: 'Cashflow sehat dengan surplus yang signifikan. Pertahankan!'
      };
    }

    return null;
  };

  const cashFlowInsight = getCashFlowInsight();

  // Prepare data for cash flow chart
  const cashFlowData = transactions
    .filter((t) => filterType === 'all' || t.type === filterType.toUpperCase())
    .reduce((acc: any, t) => {
      const date = new Date(t.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
      const existing = acc.find((item: any) => item.date === date);
      if (existing) {
        if (t.type === 'INCOME') existing.income += t.amount;
        if (t.type === 'EXPENSE') existing.expense += t.amount;
      } else {
        acc.push({
          date,
          income: t.type === 'INCOME' ? t.amount : 0,
          expense: t.type === 'EXPENSE' ? t.amount : 0,
        });
      }
      return acc;
    }, [])
    .slice(-30);

  // D. Expense Distribution - Top Wasteful Category
  const getTopWastefulCategory = () => {
    if (categoryData.length === 0) return null;

    const sortedCategories = [...categoryData].sort((a, b) => b.value - a.value);
    const topCategory = sortedCategories[0];
    const topPercentage = ((topCategory.value / totalExpense) * 100).toFixed(0);
    const reductionAmount = (totalExpense * 0.2).toFixed(0);
    const newBalance = (balance + parseFloat(reductionAmount)).toFixed(0);

    return {
      name: topCategory.name,
      percentage: topPercentage,
      impact: `Mengurangi kategori ini 20% akan memperbaiki saldo menjadi Rp ${newBalance.toLocaleString('id-ID')}`,
      reductionNeeded: reductionAmount
    };
  };

  // Prepare data for category chart
  const categoryData = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((acc: any, t) => {
      const existing = acc.find((item: any) => item.name === t.category.name);
      if (existing) {
        existing.value += t.amount;
      } else {
        acc.push({
          name: t.category.name,
          value: t.amount,
        });
      }
      return acc;
    }, []);

  const topWastefulCategory = getTopWastefulCategory();

  const COLORS = ['#0f172a', '#1e40af', '#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd'];

  // E. Savings Target with ETA
  const getSavingsTargetETA = (target: SavingsTarget) => {
    const progress = target.currentAmount / target.targetAmount;
    const remaining = target.targetAmount - target.currentAmount;
    
    if (progress >= 1) {
      return {
        eta: '🎉 Tercapai!',
        monthlyRequired: null
      };
    }

    const startDate = new Date(target.startDate);
    const endDate = new Date(target.endDate);
    const totalMonths = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)));
    const monthsPassed = Math.max(1, Math.floor((new Date().getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)));
    const averageMonthlySavings = target.currentAmount / monthsPassed;
    const monthsRemaining = averageMonthlySavings > 0 ? Math.ceil(remaining / averageMonthlySavings) : Infinity;
    
    // Calculate ETA
    const etaDate = new Date();
    etaDate.setMonth(etaDate.getMonth() + monthsRemaining);
    const yearsRemaining = Math.floor(monthsRemaining / 12);
    const monthsRemainingAfterYears = monthsRemaining % 12;

    let etaText = '';
    if (yearsRemaining > 0) {
      etaText = `${yearsRemaining} tahun ${monthsRemainingAfterYears} bulan`;
    } else if (monthsRemaining > 0) {
      etaText = `${monthsRemaining} bulan`;
    } else {
      etaText = '∞';
    }

    // Calculate required monthly saving for 5-year goal
    const fiveYearsInMonths = 5 * 12;
    const requiredMonthly = remaining / fiveYearsInMonths;

    return {
      eta: etaText,
      etaDate: etaDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' }),
      currentMonthly: averageMonthlySavings,
      monthlyRequired: requiredMonthly
    };
  };

  // F. Decision Card Recommendations
  const getRecommendations = () => {
    const recommendations = [];

    if (balance < 0) {
      recommendations.push({
        icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
        title: 'Prioritas: Kurangi Pengeluaran',
        detail: `Fokus kurangi kategori ${topWastefulCategory?.name || 'terbesar'} terlebih dahulu.`
      });
      recommendations.push({
        icon: <Target className="h-5 w-5 text-blue-600" />,
        title: 'Targetkan Surplus',
        detail: 'Prioritaskan pemasukan sebelum pengeluaran bulan depan.'
      });
    } else if (parseFloat(savingsRate.toFixed(1)) < 20) {
      recommendations.push({
        icon: <TrendingUp className="h-5 w-5 text-green-600" />,
        title: 'Tingkatkan Tabungan',
        detail: 'Targetkan tabungan minimal 20% dari pemasukan.'
      });
      recommendations.push({
        icon: <Lightbulb className="h-5 w-5 text-yellow-600" />,
        title: 'Review Pengeluaran Rutin',
        detail: 'Cari langganan atau pengeluaran yang bisa dihilangkan.'
      });
    } else {
      recommendations.push({
        icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
        title: 'Luar Biasa!',
        detail: 'Pola keuangan Anda sangat sehat. Pertahankan!'
      });
      if (savingsTargets.length === 0) {
        recommendations.push({
          icon: <Target className="h-5 w-5 text-blue-600" />,
          title: 'Buat Target Tabungan',
          detail: 'Dengan cashflow sehat, saatnya membuat target tabungan jangka panjang.'
        });
      }
    }

    return recommendations;
  };

  const recommendations = getRecommendations();

  if (isLoading) {
    return <DashboardLayout><div>Loading...</div></DashboardLayout>;
  }

  if (!activeProfile) {
    return (
       <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <AlertCircle className="h-16 w-16 text-navy-900 mb-4" />
          <h2 className="text-2xl font-bold text-navy-900 mb-2">Profil Tidak Dipilih</h2>
          <p className="text-gray-600">Silakan pilih profil untuk melanjutkan</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-navy-900">Wealth Tracker</h1>
            <p className="text-gray-600 mt-1">Ringkasan keuangan Anda</p>
          </div>
          <div className="flex gap-2">
            <Select value={filterPeriod} onValueChange={(v: any) => setFilterPeriod(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Bulan Ini</SelectItem>
                <SelectItem value="year">Tahun Ini</SelectItem>
                <SelectItem value="all">Semua Data</SelectItem>
              </SelectContent>
            </Select>
            {(filterPeriod === 'month' || filterPeriod === 'year') && (
              <>
                {filterPeriod === 'month' && (
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Bulan" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {new Date(0, i).toLocaleDateString('id-ID', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => (
                      <SelectItem key={i} value={(new Date().getFullYear() - 2 + i).toString()}>
                        {new Date().getFullYear() - 2 + i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>
{/* 🧬 Financial Phase */}
{currentPhase && (
  <Card className="border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 to-white">
    <CardHeader className="text-center">
      <CardTitle className="text-2xl">
        {currentPhase.emoji} Fase {currentPhase.name}
      </CardTitle>
      <CardDescription>{currentPhase.narrative}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="text-center text-xl font-bold">
        Rp {balance.toLocaleString('id-ID')}
      </div>

      <Progress value={phaseProgress} />

      {nextPhase ? (
        <div className="text-center text-sm text-gray-600">
          Menuju {nextPhase.emoji} {nextPhase.name} (
          Rp {(nextPhase.min - balance).toLocaleString('id-ID')} lagi)
        </div>
      ) : (
        <div className="text-center text-sm text-green-700 font-semibold">
          Fase tertinggi tercapai
        </div>
      )}

      <div className="bg-indigo-50 border border-indigo-200 rounded p-3 text-sm">
        <strong>Advice:</strong> {currentPhase.advice}
      </div>
    </CardContent>
  </Card>
)}
        {/* A. Financial Status Badge */}
        <Card className={`${financialStatus.color} border-2`}>
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-3">
              {financialStatus.icon}
              <div className="text-center">
                <div className="text-sm font-semibold">Status Keuangan</div>
                <div className="text-2xl font-bold">{financialStatus.status}</div>
                <div className="text-sm mt-1 opacity-90">{financialStatus.description}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* F. Decision Card */}
        <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <Lightbulb className="h-5 w-5" />
              Rekomendasi Bulan Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="mt-0.5">{rec.icon}</div>
                  <div>
                    <div className="font-semibold text-navy-900">{rec.title}</div>
                    <div className="text-sm text-gray-600">{rec.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-900">
                Total Pemasukan
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                Rp {totalIncome.toLocaleString('id-ID')}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-white border-red-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-red-900">
                Total Pengeluaran
              </CardTitle>
              <TrendingDown className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900">
                Rp {totalExpense.toLocaleString('id-ID')}
              </div>
            </CardContent>
          </Card>

          {/* B. Saldo with Narrative */}
          <Card className={`bg-gradient-to-br ${balance >= 0 ? 'from-blue-50' : 'from-red-50'} to-white border-2 ${balance >= 0 ? 'border-blue-200' : 'border-red-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className={`text-sm font-medium ${balance >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                {balanceNarrative.narrative}
              </CardTitle>
              <Target className={`h-5 w-5 ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                Rp {balance.toLocaleString('id-ID')}
              </div>
              <p className="text-xs mt-2 text-gray-600">{balanceNarrative.detail}</p>
              {balanceNarrative.forecast && (
                <p className="text-xs mt-1 text-gray-700 font-medium">{balanceNarrative.forecast}</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-purple-900">
                Rasio Tabungan
              </CardTitle>
              <AlertCircle className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">
                {savingsRate.toFixed(1)}%
              </div>
              <p className="text-xs text-purple-700 mt-1">
                {parseFloat(savingsRate.toFixed(1)) >= 20 ? 'Sehat ✓' : 'Perlu ditingkatkan'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* C. Cash Flow Chart with Insight */}
          <Card>
            <CardHeader>
              <CardTitle>Grafik Arus Kas</CardTitle>
              <CardDescription>30 hari terakhir</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `Rp ${(value / 1000000).toFixed(1)}jt`} />
                  <Tooltip
                    formatter={(value: any) => `Rp ${value.toLocaleString('id-ID')}`}
                    contentStyle={{ backgroundColor: 'white', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Pemasukan" />
                  <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Pengeluaran" />
                </LineChart>
              </ResponsiveContainer>
              {/* C. Cash Flow Insight Line */}
              {cashFlowInsight && (
                <div className={`mt-4 p-3 rounded-lg border-2 ${
                  cashFlowInsight.type === 'expense' 
                    ? 'bg-red-50 border-red-300 text-red-800' 
                    : cashFlowInsight.type === 'income'
                    ? 'bg-green-50 border-green-300 text-green-800'
                    : 'bg-blue-50 border-blue-300 text-blue-800'
                }`}>
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-medium">{cashFlowInsight.message}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* D. Expense Distribution with Decision */}
          <Card>
            <CardHeader>
              <CardTitle>Distribusi Pengeluaran</CardTitle>
              <CardDescription>Berdasarkan kategori</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `Rp ${value.toLocaleString('id-ID')}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  Belum ada data pengeluaran
                </div>
              )}
              {/* D. Top Wasteful Category Alert */}
              {topWastefulCategory && (
                <div className={`mt-4 p-3 rounded-lg border-2 bg-orange-50 border-orange-400 text-orange-900`}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0 text-orange-600" />
                    <div>
                      <p className="text-sm font-semibold">
                        {topWastefulCategory.name} ({topWastefulCategory.percentage}%)
                      </p>
                      <p className="text-xs mt-1">{topWastefulCategory.impact}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* E. Savings Progress with ETA */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Tabungan</CardTitle>
            <CardDescription>Target pencapaian tabungan Anda</CardDescription>
          </CardHeader>
          <CardContent>
            {savingsTargets.length > 0 ? (
              <div className="space-y-6">
                {savingsTargets.map((target) => {
                  const progress = (target.currentAmount / target.targetAmount) * 100;
                  const etaInfo = getSavingsTargetETA(target);
                  
                  return (
                    <div key={target.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-navy-900">{target.name}</h4>
                          <p className="text-sm text-gray-600">
                            Target: Rp {target.targetAmount.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-navy-900">
                            Rp {target.currentAmount.toLocaleString('id-ID')}
                          </p>
                          <p className="text-sm text-gray-600">{progress.toFixed(1)}%</p>
                        </div>
                      </div>
                      <Progress value={progress} className="h-2" />
                      
                      {/* E. ETA and Required Monthly Saving */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-blue-700 font-medium mb-1">
                              Estimasi Tercapai (ETA)
                            </p>
                            <p className="text-sm font-semibold text-blue-900">
                              {etaInfo.etaDate}
                            </p>
                            <p className="text-xs text-gray-600">
                              {etaInfo.eta !== '🎉 Tercapai!' && `Dalam ${etaInfo.eta}`}
                            </p>
                          </div>
                          {etaInfo.monthlyRequired && progress < 100 && (
                            <div>
                              <p className="text-xs text-blue-700 font-medium mb-1">
                                Target 5 Tahun
                              </p>
                              <p className="text-sm font-semibold text-blue-900">
                                Rp {etaInfo.monthlyRequired.toLocaleString('id-ID')} / bln
                              </p>
                              <p className="text-xs text-gray-600">
                                Tabungan bulanan yang diperlukan
                              </p>
                            </div>
                          )}
                        </div>
                        {progress < 100 && etaInfo.currentMonthly > 0 && (
                          <div className="mt-2 pt-2 border-t border-blue-200">
                            <p className="text-xs text-gray-600">
                              Tabungan rata-rata saat ini: Rp {etaInfo.currentMonthly.toLocaleString('id-ID')} / bln
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-500">
                        Sisa: Rp {(target.targetAmount - target.currentAmount).toLocaleString('id-ID')}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-gray-500">
                Belum ada target tabungan
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quote Card */}
        <Card className="bg-gradient-to-r from-navy-900 to-navy-700 text-white border-navy-900">
          <CardHeader>
            <div className="flex items-start gap-3">
              <Lightbulb className="h-6 w-6 mt-1 text-yellow-400" />
              <div>
                <CardTitle className="text-white">Tips Menabung & Investasi</CardTitle>
                <CardDescription className="text-gray-200 mt-2">
                  {randomQuote}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </DashboardLayout>
  );
}
