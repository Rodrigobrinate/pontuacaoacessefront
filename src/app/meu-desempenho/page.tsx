'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Calendar, 
  LogOut, 
  Loader2,
  Award,
  BarChart3,
  CheckCircle2
} from 'lucide-react';
import { getTechnicianPerformance, getTechnicianMe, PerformanceData } from '@/lib/api';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function MeuDesempenhoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; name: string; username: string } | null>(null);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  async function checkAuthAndLoad() {
    const token = localStorage.getItem('techToken');
    const userStr = localStorage.getItem('techUser');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      const userData = JSON.parse(userStr);
      setUser(userData);

      const perfData = await getTechnicianPerformance(token);
      setPerformance(perfData);
    } catch (err) {
      if (err instanceof Error && err.message.includes('Token')) {
        localStorage.removeItem('techToken');
        localStorage.removeItem('techUser');
        router.push('/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('techToken');
    localStorage.removeItem('techUser');
    router.push('/login');
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
          <p className="text-slate-400 mt-4">Carregando seu desempenho...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 max-w-md text-center">
          <p className="text-red-200">{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  if (!performance || !user) return null;

  // Prepara dados para gráficos
  const serviceTypes = Object.keys(performance.byServiceType);
  const serviceColors = [
    'rgba(59, 130, 246, 0.8)',
    'rgba(147, 51, 234, 0.8)',
    'rgba(34, 197, 94, 0.8)',
    'rgba(249, 115, 22, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(14, 165, 233, 0.8)',
    'rgba(234, 179, 8, 0.8)',
    'rgba(239, 68, 68, 0.8)',
  ];

  const barChartData = {
    labels: serviceTypes,
    datasets: [{
      label: 'Quantidade',
      data: serviceTypes.map(t => performance.byServiceType[t].count),
      backgroundColor: serviceColors.slice(0, serviceTypes.length),
      borderRadius: 8,
    }]
  };

  const doughnutData = {
    labels: serviceTypes,
    datasets: [{
      data: serviceTypes.map(t => performance.byServiceType[t].total),
      backgroundColor: serviceColors.slice(0, serviceTypes.length),
      borderWidth: 0,
    }]
  };

  const progressPercent = Math.min((performance.totalPoints / performance.config.minPoints) * 100, 100);
  const reachedGoal = performance.totalPoints >= performance.config.minPoints;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Olá, {user.name}! 👋</h1>
            <p className="text-slate-400 mt-1">
              Período: {formatDate(performance.cycleStart)} a {formatDate(performance.cycleEnd)}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 shadow-lg shadow-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Pontuação Total</p>
                <p className="text-4xl font-bold text-white mt-1">{performance.totalPoints}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <TrendingUp className="text-white" size={28} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 shadow-lg shadow-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm">Pagamento Estimado</p>
                <p className="text-4xl font-bold text-white mt-1">{formatCurrency(performance.payment)}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <DollarSign className="text-white" size={28} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 shadow-lg shadow-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm">Total de Serviços</p>
                <p className="text-4xl font-bold text-white mt-1">{performance.totalServices}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <CheckCircle2 className="text-white" size={28} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl p-6 shadow-lg shadow-orange-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-200 text-sm">Tipos de Serviço</p>
                <p className="text-4xl font-bold text-white mt-1">{serviceTypes.length}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <BarChart3 className="text-white" size={28} />
              </div>
            </div>
          </div>
        </div>

        {/* Goal Progress */}
        <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Target className="text-yellow-400" size={24} />
              <h2 className="text-xl font-semibold text-white">Meta do Mês</h2>
            </div>
            {reachedGoal && (
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                <Award size={16} /> Meta Atingida!
              </span>
            )}
          </div>
          <div className="relative h-6 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ${
                reachedGoal ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-slate-400">0 pontos</span>
            <span className="text-white font-medium">{performance.totalPoints} / {performance.config.minPoints} pontos</span>
            <span className="text-slate-400">{performance.config.minPoints} pontos</span>
          </div>
          <p className="text-slate-400 text-sm mt-3">
            {reachedGoal ? (
              <>Parabéns! Você ultrapassou a meta em <span className="text-green-400 font-medium">{performance.totalPoints - performance.config.minPoints}</span> pontos.</>
            ) : (
              <>Faltam <span className="text-yellow-400 font-medium">{performance.config.minPoints - performance.totalPoints}</span> pontos para atingir a meta.</>
            )}
          </p>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Serviços por Tipo</h3>
            <div className="h-64">
              <Bar 
                data={barChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { 
                      ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 },
                      grid: { display: false }
                    },
                    y: { 
                      ticks: { color: '#94a3b8' },
                      grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Distribuição de Pontos</h3>
            <div className="h-64 flex items-center justify-center">
              <Doughnut 
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { 
                    legend: { 
                      position: 'right',
                      labels: { color: '#94a3b8', boxWidth: 12 }
                    } 
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">Últimos Serviços</h3>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-800">
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-slate-400 font-medium">Data</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Serviço</th>
                  <th className="text-right p-4 text-slate-400 font-medium">Pontos</th>
                </tr>
              </thead>
              <tbody>
                {performance.services.slice(0, 50).map((service, i) => (
                  <tr key={service.id} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                    <td className="p-4 text-slate-300 text-sm">
                      {new Date(service.performedAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-4 text-white">{service.type}</td>
                    <td className="p-4 text-right">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-500/20 text-blue-400 rounded-lg font-medium">
                        {service.points}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Info */}
        <div className="mt-8 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-green-400 flex items-center gap-2 mb-4">
            <DollarSign size={20} />
            Resumo do Pagamento
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-slate-400">Meta mínima</p>
              <p className="text-white font-medium">{performance.config.minPoints} pontos = {formatCurrency(performance.config.basePayment)}</p>
            </div>
            <div>
              <p className="text-slate-400">Pontos extras</p>
              <p className="text-white font-medium">
                {Math.max(0, performance.totalPoints - performance.config.minPoints)} × {formatCurrency(performance.config.pointRate)} = 
                {formatCurrency(Math.max(0, performance.totalPoints - performance.config.minPoints) * performance.config.pointRate)}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Total a receber</p>
              <p className="text-2xl font-bold text-green-400">{formatCurrency(performance.payment)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
