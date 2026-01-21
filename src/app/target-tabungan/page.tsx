'use client';

import React, { useState, useEffect } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, Calculator, Target, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface SavingsTarget {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  allocationPercentage: number;
  startDate: string;
  endDate: string;
  description: string | null;
}

interface SavingsAllocation {
  id: string;
  amount: number;
  date: string;
  description: string | null;
}

export default function TargetTabunganPage() {
  const { activeProfile, isLoading } = useProfile();
  const [savingsTargets, setSavingsTargets] = useState<SavingsTarget[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<SavingsTarget | null>(null);
  const [allocations, setAllocations] = useState<SavingsAllocation[]>([]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    allocationPercentage: '0',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: '',
  });

  const [allocationAmount, setAllocationAmount] = useState('');
  const [allocationDescription, setAllocationDescription] = useState('');

  // Investment Calculator State
  const [calculator, setCalculator] = useState({
    initialAmount: '',
    monthlyContribution: '',
    annualInterest: '',
    years: '',
  });

  const [calculatorResult, setCalculatorResult] = useState<{
    totalAmount: number;
    totalContributions: number;
    totalInterest: number;
  } | null>(null);

  useEffect(() => {
    if (activeProfile) {
      fetchSavingsTargets();
    }
  }, [activeProfile]);

  useEffect(() => {
    if (selectedTarget) {
      fetchAllocations(selectedTarget.id);
    }
  }, [selectedTarget]);

  const fetchSavingsTargets = async () => {
    if (!activeProfile) return;

    try {
      const response = await fetch(`/api/savings-targets?profileId=${activeProfile.id}`);
      if (response.ok) {
        const data = await response.json();
        setSavingsTargets(data);
        if (data.length > 0 && !selectedTarget) {
          setSelectedTarget(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching savings targets:', error);
    }
  };

  const fetchAllocations = async (targetId: string) => {
    try {
      const response = await fetch(`/api/savings-allocations?profileId=${activeProfile?.id}&savingsTargetId=${targetId}`);
      if (response.ok) {
        const data = await response.json();
        setAllocations(data);
      }
    } catch (error) {
      console.error('Error fetching allocations:', error);
    }
  };

  const handleCreateTarget = async () => {
    if (!activeProfile) return;

    if (!formData.name || !formData.targetAmount || !formData.startDate || !formData.endDate) {
      alert('Semua field wajib diisi');
      return;
    }

    // Validate dates
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      alert('Format tanggal tidak valid');
      return;
    }

    if (startDate >= endDate) {
      alert('Tanggal target harus setelah tanggal mulai');
      return;
    }

    // Validate allocation percentage
    const allocationPct = parseFloat(formData.allocationPercentage);
    if (isNaN(allocationPct) || allocationPct < 0 || allocationPct > 100) {
      alert('Persentase alokasi harus antara 0-100');
      return;
    }

    try {
      const response = await fetch('/api/savings-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: activeProfile.id,
          name: formData.name,
          targetAmount: parseFloat(formData.targetAmount),
          allocationPercentage: allocationPct,
          startDate: formData.startDate,
          endDate: formData.endDate,
          description: formData.description,
        }),
      });

      if (response.ok) {
        setIsAddOpen(false);
        resetForm();
        fetchSavingsTargets();
      } else if (response.status === 400) {
        const errorData = await response.json();
        alert(errorData.error || 'Gagal membuat target tabungan');
      } else {
        alert('Gagal membuat target tabungan');
      }
    } catch (error) {
      console.error('Error creating savings target:', error);
      alert('Gagal membuat target tabungan');
    }
  };

  const handleDeleteTarget = async (id: string) => {
    try {
      const response = await fetch(`/api/savings-targets/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        if (selectedTarget?.id === id) {
          setSelectedTarget(null);
        }
        fetchSavingsTargets();
      } else {
        alert('Gagal menghapus target tabungan');
      }
    } catch (error) {
      console.error('Error deleting savings target:', error);
      alert('Gagal menghapus target tabungan');
    }
  };

  const handleAllocate = async () => {
    if (!activeProfile || !selectedTarget) return;

    if (!allocationAmount) {
      alert('Masukkan jumlah alokasi');
      return;
    }

    try {
      const response = await fetch('/api/savings-allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: activeProfile.id,
          savingsTargetId: selectedTarget.id,
          amount: parseFloat(allocationAmount),
          description: allocationDescription,
        }),
      });

      if (response.ok) {
        setIsAllocateOpen(false);
        setAllocationAmount('');
        setAllocationDescription('');
        fetchSavingsTargets();
        fetchAllocations(selectedTarget.id);
      } else {
        alert('Gagal menambah alokasi');
      }
    } catch (error) {
      console.error('Error creating allocation:', error);
      alert('Gagal menambah alokasi');
    }
  };

  const handleDeleteAllocation = async (allocationId: string) => {
    if (!selectedTarget) return;

    try {
      const response = await fetch(`/api/savings-allocations/${allocationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchSavingsTargets();
        fetchAllocations(selectedTarget.id);
      } else {
        alert('Gagal menghapus alokasi');
      }
    } catch (error) {
      console.error('Error deleting allocation:', error);
      alert('Gagal menghapus alokasi');
    }
  };

  const calculateInvestment = () => {
    const initial = parseFloat(calculator.initialAmount) || 0;
    const monthly = parseFloat(calculator.monthlyContribution) || 0;
    const rate = parseFloat(calculator.annualInterest) / 100 || 0;
    const years = parseFloat(calculator.years) || 0;

    const months = years * 12;
    let total = initial;

    for (let i = 0; i < months; i++) {
      total = total * (1 + rate / 12) + monthly;
    }

    const totalContributions = initial + (monthly * months);
    const totalInterest = total - totalContributions;

    setCalculatorResult({
      totalAmount: total,
      totalContributions,
      totalInterest,
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      targetAmount: '',
      allocationPercentage: '0',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: '',
    });
  };

  if (isLoading) {
    return <DashboardLayout><div>Loading...</div></DashboardLayout>;
  }

  if (!activeProfile) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Target className="h-16 w-16 text-navy-900 mb-4" />
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
            <h1 className="text-3xl font-bold text-navy-900">Target Tabungan</h1>
            <p className="text-gray-600 mt-1">Atur target tabungan dan kalkulator investasi</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-navy-900 hover:bg-navy-700">
                <Plus className="h-4 w-4 mr-2" />
                Target Baru
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Buat Target Tabungan Baru</DialogTitle>
                <DialogDescription>Set tujuan tabungan Anda</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Target</Label>
                  <Input
                    id="name"
                    placeholder="Dana Darurat"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetAmount">Target Jumlah (Rp)</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    placeholder="10000000"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allocationPercentage">Alokasi Otomatis dari Pemasukan (%)</Label>
                  <Input
                    id="allocationPercentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="10"
                    value={formData.allocationPercentage}
                    onChange={(e) => setFormData({ ...formData, allocationPercentage: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">
                    Masukkan 0 untuk tidak ada alokasi otomatis. Alokasi akan dilakukan secara otomatis ketika ada pemasukan.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Tanggal Mulai</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      max={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Target Tanggal</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      min={formData.startDate}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi (opsional)</Label>
                  <Input
                    id="description"
                    placeholder="Dana darurat untuk keadaan darurat"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleCreateTarget}>Buat Target</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="targets" className="space-y-6">
          <TabsList>
            <TabsTrigger value="targets">Target Tabungan</TabsTrigger>
            <TabsTrigger value="calculator">Kalkulator Investasi</TabsTrigger>
          </TabsList>

          <TabsContent value="targets" className="space-y-6">
            {savingsTargets.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-[300px]">
                  <Target className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 text-center">
                    Belum ada target tabungan. Buat target pertama Anda!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Target Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savingsTargets.map((target) => {
                    const progress = (target.currentAmount / target.targetAmount) * 100;
                    const remaining = target.targetAmount - target.currentAmount;
                    const daysLeft = Math.ceil((new Date(target.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                    return (
                      <Card
                        key={target.id}
                        className={`cursor-pointer transition-all ${
                          selectedTarget?.id === target.id
                            ? 'ring-2 ring-navy-900'
                            : 'hover:shadow-lg'
                        }`}
                        onClick={() => setSelectedTarget(target)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{target.name}</CardTitle>
                              <CardDescription>
                                {format(new Date(target.endDate), 'dd MMM yyyy', { locale: id })}
                              </CardDescription>
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hapus Target</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Apakah Anda yakin ingin menghapus target "{target.name}"?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteTarget(target.id)}>
                                    Hapus
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Progress</span>
                                <span className="font-semibold">{progress.toFixed(1)}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-gray-600">Terkumpul</p>
                                <p className="font-semibold text-navy-900">
                                  Rp {target.currentAmount.toLocaleString('id-ID')}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Sisa</p>
                                <p className="font-semibold text-red-600">
                                  Rp {remaining.toLocaleString('id-ID')}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Target</p>
                                <p className="font-semibold">
                                  Rp {target.targetAmount.toLocaleString('id-ID')}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Sisa Waktu</p>
                                <p className={`font-semibold ${daysLeft < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {daysLeft < 0 ? 'Terlewati' : `${daysLeft} hari`}
                                </p>
                              </div>
                              {target.allocationPercentage > 0 && (
                                <div>
                                  <p className="text-gray-600">Alokasi Otomatis</p>
                                  <p className="font-semibold text-green-600">
                                    {target.allocationPercentage}%
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Allocations */}
                {selectedTarget && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Alokasi untuk {selectedTarget.name}</CardTitle>
                          <CardDescription>Riwayat setoran tabungan</CardDescription>
                        </div>
                        <Dialog open={isAllocateOpen} onOpenChange={setIsAllocateOpen}>
                          <DialogTrigger asChild>
                            <Button className="bg-navy-900 hover:bg-navy-700">
                              <Plus className="h-4 w-4 mr-2" />
                              Tambah Alokasi
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Tambah Alokasi Tabungan</DialogTitle>
                              <DialogDescription>Setorkan tabungan ke {selectedTarget.name}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="allocate-amount">Jumlah (Rp)</Label>
                                <Input
                                  id="allocate-amount"
                                  type="number"
                                  placeholder="500000"
                                  value={allocationAmount}
                                  onChange={(e) => setAllocationAmount(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="allocate-description">Deskripsi (opsional)</Label>
                                <Input
                                  id="allocate-description"
                                  placeholder="Setoran bulanan"
                                  value={allocationDescription}
                                  onChange={(e) => setAllocationDescription(e.target.value)}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsAllocateOpen(false)}>
                                Batal
                              </Button>
                              <Button onClick={handleAllocate}>Setor</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {allocations.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {allocations.map((allocation) => (
                            <div
                              key={allocation.id}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                            >
                              <div className="flex-1">
                                <p className="font-semibold text-navy-900">
                                  Rp {allocation.amount.toLocaleString('id-ID')}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {format(new Date(allocation.date), 'dd MMM yyyy', { locale: id })}
                                </p>
                                {allocation.description && (
                                  <p className="text-xs text-gray-500">{allocation.description}</p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteAllocation(allocation.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          Belum ada alokasi untuk target ini
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="calculator" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calculator className="h-6 w-6 text-navy-900" />
                  <CardTitle>Kalkulator Investasi</CardTitle>
                </div>
                <CardDescription>
                  Hitung potensi pertumbuhan investasi Anda dengan bunga majemuk
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="initialAmount">Modal Awal (Rp)</Label>
                      <Input
                        id="initialAmount"
                        type="number"
                        placeholder="10000000"
                        value={calculator.initialAmount}
                        onChange={(e) =>
                          setCalculator({ ...calculator, initialAmount: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthlyContribution">Investasi Bulanan (Rp)</Label>
                      <Input
                        id="monthlyContribution"
                        type="number"
                        placeholder="1000000"
                        value={calculator.monthlyContribution}
                        onChange={(e) =>
                          setCalculator({ ...calculator, monthlyContribution: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="annualInterest">Bunga Tahunan (%)</Label>
                      <Input
                        id="annualInterest"
                        type="number"
                        placeholder="10"
                        value={calculator.annualInterest}
                        onChange={(e) =>
                          setCalculator({ ...calculator, annualInterest: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="years">Jangka Waktu (Tahun)</Label>
                      <Input
                        id="years"
                        type="number"
                        placeholder="5"
                        value={calculator.years}
                        onChange={(e) =>
                          setCalculator({ ...calculator, years: e.target.value })
                        }
                      />
                    </div>
                    <Button onClick={calculateInvestment} className="w-full bg-navy-900 hover:bg-navy-700">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Hitung Investasi
                    </Button>
                  </div>

                  {calculatorResult && (
                    <div className="space-y-4">
                      <Card className="bg-gradient-to-br from-navy-900 to-navy-700 text-white">
                        <CardHeader>
                          <CardTitle className="text-white">Hasil Perhitungan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-200">Total Nilai Akhir</p>
                            <p className="text-3xl font-bold text-white">
                              Rp {calculatorResult.totalAmount.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <div className="space-y-2 pt-4 border-t border-white/20">
                            <div className="flex justify-between">
                              <span className="text-gray-200">Total Setoran</span>
                              <span className="font-semibold">
                                Rp {calculatorResult.totalContributions.toLocaleString('id-ID')}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-200">Total Bunga</span>
                              <span className="font-semibold text-green-300">
                                Rp {calculatorResult.totalInterest.toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
