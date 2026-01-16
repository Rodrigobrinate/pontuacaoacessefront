'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getDashboardFilters, getDashboardData, User, ServiceType, Service } from '@/lib/api';
import AdminAuthGuard from '@/components/AdminAuthGuard';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Extended color palette for many service types
const chartColors = [
  '#667eea', '#764ba2', '#2ecc71', '#e74c3c', '#f1c40f',
  '#3498db', '#9b59b6', '#1abc9c', '#e67e22', '#34495e',
  '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#2c3e50',
  '#f39c12', '#d35400', '#c0392b', '#7f8c8d', '#1abc9c',
  '#00cec9', '#6c5ce7', '#fd79a8', '#00b894', '#e17055',
  '#0984e3', '#b2bec3', '#fdcb6e', '#81ecec', '#fab1a0'
];

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center">
      <div className="text-white flex items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#667eea]/20 border-t-[#667eea] rounded-full animate-spin"></div>
        Carregando...
      </div>
    </div>
  );
}

// Main content component that uses useSearchParams
function TechniciansContent() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [types, setTypes] = useState<ServiceType[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    async function init() {
      try {
        const data = await getDashboardFilters();
        setUsers(data.users);
        setTypes(data.types);

        // Get dates from query params or default to 30 days
        const urlStart = searchParams.get('startDate');
        const urlEnd = searchParams.get('endDate');
        
        if (urlStart && urlEnd) {
          setStartDate(urlStart);
          setEndDate(urlEnd);
        } else {
          const today = new Date();
          const start = new Date();
          start.setDate(today.getDate() - 30);
          setStartDate(start.toISOString().split('T')[0]);
          setEndDate(today.toISOString().split('T')[0]);
        }
      } catch (error) {
        console.error('Erro ao carregar filtros:', error);
      }
    }
    init();
  }, [searchParams]);

  // Load data when dates change
  const loadData = useCallback(async () => {
    if (!startDate || !endDate) return;
    
    setLoading(true);
    try {
      const data = await getDashboardData(startDate, endDate);
      setServices(data.services);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (startDate && endDate) {
      loadData();
    }
  }, [startDate, endDate, loadData]);

  // Set date presets
  function setPreset(preset: string) {
    const today = new Date();
    let start = new Date();
    
    switch (preset) {
      case 'today': start = today; break;
      case 'week': start.setDate(today.getDate() - 7); break;
      case 'month': start.setDate(today.getDate() - 30); break;
      case 'year': start.setFullYear(today.getFullYear() - 1); break;
      case 'all': start = new Date('2020-01-01'); break;
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }

  // Calculate rankings for all users
  const userPoints: Record<string, number> = {};
  const userServicesByType: Record<string, Record<number, number>> = {};
  
  services.forEach(s => {
    userPoints[s.userId] = (userPoints[s.userId] || 0) + s.serviceType.points;
    
    if (!userServicesByType[s.userId]) {
      userServicesByType[s.userId] = {};
    }
    userServicesByType[s.userId][s.serviceTypeId] = 
      (userServicesByType[s.userId][s.serviceTypeId] || 0) + 1;
  });

  // Full ranking sorted by points
  const fullRanking = Object.entries(userPoints)
    .map(([id, points]) => ({
      id,
      name: users.find(u => u.id === id)?.name || 'Desconhecido',
      points
    }))
    .sort((a, b) => b.points - a.points);

  // Calculate dynamic height based on number of technicians
  const chartHeight = Math.max(400, fullRanking.length * 35);

  // Chart 1: Points by Technician (horizontal bar)
  const pointsChartData = {
    labels: fullRanking.map(r => r.name),
    datasets: [{
      label: 'Pontos',
      data: fullRanking.map(r => r.points),
      backgroundColor: fullRanking.map((_, i) => chartColors[i % chartColors.length]),
      borderRadius: 6,
    }]
  };

  const pointsChartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (context: any) => `${(context.parsed.x ?? 0).toLocaleString('pt-BR')} pontos`
        }
      }
    },
    scales: {
      x: { 
        ticks: { color: '#888' }, 
        grid: { color: 'rgba(255,255,255,0.05)' } 
      },
      y: { 
        ticks: { color: '#ccc', font: { size: 11 } }, 
        grid: { display: false } 
      }
    }
  };

  // Chart 2: Services by Type (stacked horizontal bar)
  const servicesChartData = {
    labels: fullRanking.map(r => r.name),
    datasets: types.map((type, typeIndex) => ({
      label: type.name,
      data: fullRanking.map(r => userServicesByType[r.id]?.[type.id] || 0),
      backgroundColor: chartColors[typeIndex % chartColors.length],
      borderRadius: 4,
    }))
  };

  const servicesChartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true,
        position: 'top' as const,
        labels: {
          color: '#ccc',
          padding: 15,
          usePointStyle: true,
          pointStyle: 'rectRounded',
          font: { size: 11 }
        }
      },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (context: any) => 
            `${context.dataset?.label || ''}: ${context.parsed?.x ?? 0} serviços`
        }
      }
    },
    scales: {
      x: { 
        stacked: true,
        ticks: { color: '#888' }, 
        grid: { color: 'rgba(255,255,255,0.05)' } 
      },
      y: { 
        stacked: true,
        ticks: { color: '#ccc', font: { size: 11 } }, 
        grid: { display: false } 
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white font-sans">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-lg px-10 py-5 flex justify-between items-center border-b border-white/10">
        <h1 className="text-2xl font-semibold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
          👥 Análise Completa dos Técnicos
        </h1>
        <div className="flex gap-4 items-center">
          <Link href="/dashboard">
            <button className="px-5 py-2.5 bg-white/10 text-white rounded-lg border border-white/20 font-medium hover:bg-white/20 transition-all">
              ← Voltar ao Dashboard
            </button>
          </Link>
        </div>
      </header>

      <main className="p-8">
        {/* Date Filters */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-4">📅 Filtrar por Período</h3>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-2">
              {['today', 'week', 'month', 'year', 'all'].map(preset => (
                <button
                  key={preset}
                  onClick={() => setPreset(preset)}
                  className="px-4 py-2 border border-white/20 bg-white/5 text-gray-400 rounded-full text-sm hover:bg-gradient-to-r hover:from-[#667eea] hover:to-[#764ba2] hover:border-transparent hover:text-white transition-all"
                >
                  {preset === 'today' ? 'Hoje' : preset === 'week' ? '7 dias' : preset === 'month' ? '30 dias' : preset === 'year' ? '1 ano' : 'Tudo'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-500">De:</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="px-3 py-2 border border-white/15 bg-white/5 text-white rounded-lg text-sm focus:outline-none focus:border-[#667eea]"
              />
              <label className="text-sm text-gray-500">Até:</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="px-3 py-2 border border-white/15 bg-white/5 text-white rounded-lg text-sm focus:outline-none focus:border-[#667eea]"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-20 text-gray-500">
            <div className="w-10 h-10 border-4 border-[#667eea]/20 border-t-[#667eea] rounded-full animate-spin mr-4"></div>
            Carregando dados...
          </div>
        ) : (
          <>
            {/* Chart 1: Points by Technician */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
              <h3 className="text-lg font-semibold mb-2">📊 Pontuação por Técnico</h3>
              <p className="text-gray-400 text-sm mb-6">Ranking completo de todos os {fullRanking.length} técnicos ordenados por pontuação</p>
              <div style={{ height: chartHeight }} className="overflow-y-auto">
                <div style={{ height: chartHeight }}>
                  <Bar data={pointsChartData} options={pointsChartOptions} />
                </div>
              </div>
            </div>

            {/* Chart 2: Services by Type */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-2">🔧 Número de Serviços por Tipo</h3>
              <p className="text-gray-400 text-sm mb-6">Cada cor representa um tipo de serviço diferente - barras empilhadas mostram a distribuição</p>
              <div style={{ height: chartHeight + 60 }} className="overflow-y-auto">
                <div style={{ height: chartHeight + 60 }}>
                  <Bar data={servicesChartData} options={servicesChartOptions} />
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// Default export with Suspense wrapper
export default function TechniciansPage() {
  return (
    <AdminAuthGuard>
      <Suspense fallback={<LoadingFallback />}>
        <TechniciansContent />
      </Suspense>
    </AdminAuthGuard>
  );
}
