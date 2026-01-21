'use client';

import React, { useState, useEffect } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download, TrendingUp, TrendingDown, Target } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
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

export default function LaporanPage() {
  const { activeProfile, isLoading } = useProfile();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingsTargets, setSavingsTargets] = useState<SavingsTarget[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'month' | 'year'>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    if (activeProfile) {
      fetchData();
    }
  }, [activeProfile, filterType, filterPeriod, selectedMonth, selectedYear]);

  const fetchData = async () => {
    if (!activeProfile) return;

    // Fetch transactions
    let transactionUrl = `/api/transactions?profileId=${activeProfile.id}`;

    if (filterType !== 'all') {
      transactionUrl += `&type=${filterType.toUpperCase()}`;
    }

    if (filterPeriod === 'month') {
      transactionUrl += `&month=${selectedMonth}&year=${selectedYear}`;
    } else if (filterPeriod === 'year') {
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;
      transactionUrl += `&startDate=${startDate}&endDate=${endDate}`;
    }

    try {
      const [transactionsRes, savingsRes] = await Promise.all([
        fetch(transactionUrl),
        fetch(`/api/savings-targets?profileId=${activeProfile.id}`),
      ]);

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setTransactions(transactionsData);
      }

      if (savingsRes.ok) {
        const savingsData = await savingsRes.json();
        setSavingsTargets(savingsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const exportToExcel = () => {
    if (!activeProfile) return;

    // Prepare transactions data
    const transactionsData = transactions.map((t) => ({
      ID: t.id,
      Tanggal: format(new Date(t.date), 'dd MMM yyyy', { locale: id }),
      Tipe: t.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
      Kategori: t.category.name,
      Deskripsi: t.description || '-',
      Jumlah: t.amount,
    }));

    // Prepare savings data
    const savingsData = savingsTargets.map((s) => {
      const progress = ((s.currentAmount / s.targetAmount) * 100).toFixed(1);
      const remaining = s.targetAmount - s.currentAmount;
      return {
        ID: s.id,
        'Nama Target': s.name,
        'Target Jumlah': s.targetAmount,
        'Terkumpul': s.currentAmount,
        Sisa: remaining,
        Progress: `${progress}%`,
        'Tanggal Mulai': format(new Date(s.startDate), 'dd MMM yyyy', { locale: id }),
        'Target Tanggal': format(new Date(s.endDate), 'dd MMM yyyy', { locale: id }),
      };
    });

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Transactions sheet
    const transactionsWs = XLSX.utils.json_to_sheet(transactionsData);
    XLSX.utils.book_append_sheet(wb, transactionsWs, 'Transaksi');

    // Savings sheet
    const savingsWs = XLSX.utils.json_to_sheet(savingsData);
    XLSX.utils.book_append_sheet(wb, savingsWs, 'Target Tabungan');

    // Summary sheet
    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    const summaryData = [
      { Metrik: 'Nama Profil', Nilai: activeProfile.name },
      { Metrik: 'Periode', Nilai: `Bulan ${parseInt(selectedMonth) + 1} ${selectedYear}` },
      { Metrik: 'Total Pemasukan', Nilai: totalIncome },
      { Metrik: 'Total Pengeluaran', Nilai: totalExpense },
      { Metrik: 'Saldo', Nilai: balance },
      { Metrik: 'Jumlah Transaksi', Nilai: transactions.length },
      { Metrik: 'Jumlah Target Tabungan', Nilai: savingsTargets.length },
    ];

    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Ringkasan');

    // Generate file name
    const fileName = `Laporan_${activeProfile.name}_${selectedYear}_${parseInt(selectedMonth) + 1}.xlsx`;

    // Download
    XLSX.writeFile(wb, fileName);
  };

  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  if (isLoading) {
    return <DashboardLayout><div>Loading...</div></DashboardLayout>;
  }

  if (!activeProfile) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <FileText className="h-16 w-16 text-navy-900 mb-4" />
          <h2 className="text-2xl font-bold text-navy-900 mb-2">Profil Tidak Dipilih</h2>
          <p className="text-gray-600">Silakan pilih profil untuk melihat laporan</p>
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
            <h1 className="text-3xl font-bold text-navy-900">Laporan</h1>
            <p className="text-gray-600 mt-1">Laporan keuangan dan target tabungan</p>
          </div>
          <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700">
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Periode</label>
                <Select value={filterPeriod} onValueChange={(v: any) => setFilterPeriod(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Data</SelectItem>
                    <SelectItem value="month">Bulan Ini</SelectItem>
                    <SelectItem value="year">Tahun Ini</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipe Transaksi</label>
                <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="income">Pemasukan</SelectItem>
                    <SelectItem value="expense">Pengeluaran</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(filterPeriod === 'month' || filterPeriod === 'year') && (
                <>
                  {filterPeriod === 'month' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Bulan</label>
                      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              {new Date(0, i).toLocaleDateString('id-ID', { month: 'long' })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tahun</label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 5 }, (_, i) => (
                          <SelectItem key={i} value={(new Date().getFullYear() - 2 + i).toString()}>
                            {new Date().getFullYear() - 2 + i}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                Rp {totalIncome.toLocaleString('id-ID')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                Rp {totalExpense.toLocaleString('id-ID')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Saldo</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                Rp {balance.toLocaleString('id-ID')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
              <FileText className="h-4 w-4 text-navy-900" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy-900">{transactions.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Transaksi</CardTitle>
            <CardDescription>
              {filterPeriod === 'all' ? 'Semua transaksi' :
               filterPeriod === 'year' ? `Transaksi untuk tahun ${selectedYear}` :
               `Transaksi untuk ${new Date(0, parseInt(selectedMonth)).toLocaleDateString('id-ID', { month: 'long' })} ${selectedYear}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(new Date(transaction.date), 'dd MMM yyyy', { locale: id })}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.type === 'INCOME'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {transaction.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">
                          {transaction.description || '-'}
                        </TableCell>
                        <TableCell>{transaction.category.name}</TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {transaction.type === 'INCOME' ? '+' : '-'}Rp {transaction.amount.toLocaleString('id-ID')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-gray-500">
                <FileText className="h-12 w-12 mb-2" />
                <p>Belum ada transaksi untuk periode ini</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Savings Targets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Target Tabungan</CardTitle>
            <CardDescription>Progress semua target tabungan</CardDescription>
          </CardHeader>
          <CardContent>
            {savingsTargets.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Target</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Terkumpul</TableHead>
                      <TableHead>Sisa</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Tanggal Target</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {savingsTargets.map((target) => {
                      const progress = ((target.currentAmount / target.targetAmount) * 100).toFixed(1);
                      const remaining = target.targetAmount - target.currentAmount;
                      const isCompleted = target.currentAmount >= target.targetAmount;

                      return (
                        <TableRow key={target.id}>
                          <TableCell className="font-medium">{target.name}</TableCell>
                          <TableCell>
                            Rp {target.targetAmount.toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell className={isCompleted ? 'text-green-600 font-semibold' : ''}>
                            Rp {target.currentAmount.toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell className={remaining <= 0 ? 'text-green-600' : 'text-red-600'}>
                            Rp {Math.max(0, remaining).toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                                <div
                                  className={`h-2 rounded-full ${
                                    isCompleted ? 'bg-green-600' : 'bg-navy-900'
                                  }`}
                                  style={{ width: `${Math.min(100, parseFloat(progress))}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(target.endDate), 'dd MMM yyyy', { locale: id })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-gray-500">
                <Target className="h-12 w-12 mb-2" />
                <p>Belum ada target tabungan</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
