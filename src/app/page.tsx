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
import { TrendingUp, TrendingDown, Target, AlertCircle, Lightbulb } from 'lucide-react';
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
  endDate: string;
}

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

  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0;
  const expenseRatio = totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : 0;

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

  const COLORS = ['#0f172a', '#1e40af', '#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd'];

  if (isLoading) {
    return <DashboardLayout><div>Loading...</div></DashboardLayout>;
  }

  if (!activeProfile) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <AlertCircle className="h-16 w-16 text-navy-900 mb-4" />
          <h2 className="text-2xl font-bold text-navy-900 mb-2">
            Profil Tidak Dipilih
          </h2>
          <p className="text-gray-600 mb-4">
            Silakan pilih atau buat profil untuk mulai menggunakan aplikasi
          </p>
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

          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">
                Saldo
              </CardTitle>
              <Target className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  balance >= 0 ? 'text-blue-900' : 'text-red-900'
                }`}
              >
                Rp {balance.toLocaleString('id-ID')}
              </div>
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
                {savingsRate}%
              </div>
              <p className="text-xs text-purple-700 mt-1">
                {parseFloat(savingsRate) >= 20 ? 'Sehat ✓' : 'Perlu ditingkatkan'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            </CardContent>
          </Card>

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
            </CardContent>
          </Card>
        </div>

        {/* Savings Progress */}
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
                  return (
                    <div key={target.id} className="space-y-2">
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
