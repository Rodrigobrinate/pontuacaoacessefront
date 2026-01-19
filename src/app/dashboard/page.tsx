'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminAuthGuard from '@/components/AdminAuthGuard';
import { getDashboardFilters, getDashboardData, User, ServiceType, Service } from '@/lib/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const chartColors = [
  '#667eea', '#764ba2', '#2ecc71', '#e74c3c', '#f1c40f',
  '#3498db', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'
];

function DashboardPageContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [types, setTypes] = useState<ServiceType[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Set<number>>(new Set());
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingIndicator, setLoadingIndicator] = useState('');
  const router = useRouter();

  // Load initial filters
  useEffect(() => {
    async function init() {
      try {
        const data = await getDashboardFilters();
        setUsers(data.users);
        setTypes(data.types);
        setSelectedUsers(new Set(data.users.map(u => u.id)));
        setSelectedTypes(new Set(data.types.map(t => t.id)));
        
        // Set default date range (30 days)
        const today = new Date();
        const start = new Date();
        start.setDate(today.getDate() - 30);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
      } catch (error) {
        console.error('Erro ao carregar filtros:', error);
      }
    }
    init();
  }, []);

  // Load data when dates change
  const loadData = useCallback(async () => {
    if (!startDate || !endDate) return;
    
    setLoading(true);
    setLoadingIndicator('⏳ Carregando...');
    
    try {
      const data = await getDashboardData(startDate, endDate);
      setServices(data.services);
      setLoadingIndicator(`✅ ${data.count.toLocaleString('pt-BR')} registros`);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setLoadingIndicator('❌ Erro ao carregar');
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

  // Filter services based on selections
  const filtered = services.filter(s => 
    selectedUsers.has(s.userId) && selectedTypes.has(s.serviceTypeId)
  );

  // Calculate stats
  const totalPoints = filtered.reduce((sum, s) => sum + s.serviceType.points, 0);
  const uniqueTechs = new Set(filtered.map(s => s.userId)).size;
  const avgPoints = uniqueTechs > 0 ? Math.round(totalPoints / uniqueTechs) : 0;

  // Calculate ranking
  const userPoints: Record<string, number> = {};
  const userServiceCount: Record<string, number> = {};
  filtered.forEach(s => {
    userPoints[s.userId] = (userPoints[s.userId] || 0) + s.serviceType.points;
    userServiceCount[s.userId] = (userServiceCount[s.userId] || 0) + 1;
  });

  const ranking = Object.entries(userPoints)
    .map(([id, points]) => ({
      id,
      name: users.find(u => u.id === id)?.name || 'Desconhecido',
      points,
      services: userServiceCount[id]
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);

  // Bar chart data
  const top15 = ranking.slice(0, 15);
  const barData = {
    labels: top15.map(r => r.name),
    datasets: [{
      label: 'Pontos',
      data: top15.map(r => r.points),
      backgroundColor: chartColors,
      borderRadius: 8,
    }]
  };

  // Line chart data
  const dateMap: Record<string, number> = {};
  filtered.forEach(s => {
    const key = s.performedAt.split('T')[0];
    dateMap[key] = (dateMap[key] || 0) + s.serviceType.points;
  });
  const sortedDates = Object.keys(dateMap).sort();
  
  const lineData = {
    labels: sortedDates,
    datasets: [{
      label: 'Pontos Diários',
      data: sortedDates.map(d => dateMap[d]),
      borderColor: '#667eea',
      backgroundColor: 'rgba(102,126,234,0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#888' }, grid: { display: false } },
      y: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  };

  // Toggle functions
  function toggleAllUsers() {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  }

  function toggleAllTypes() {
    if (selectedTypes.size === types.length) {
      setSelectedTypes(new Set());
    } else {
      setSelectedTypes(new Set(types.map(t => t.id)));
    }
  }

  function toggleUser(id: string) {
    const newSet = new Set(selectedUsers);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedUsers(newSet);
  }

  function toggleType(id: number) {
    const newSet = new Set(selectedTypes);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedTypes(newSet);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white font-sans">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-lg px-10 py-5 flex justify-between items-center border-b border-white/10">
        <h1 className="text-2xl font-semibold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
          📊 Dashboard de Pontuação
        </h1>
        <div className="flex gap-4 items-center">
          <span className="text-gray-400 text-sm">{loadingIndicator}</span>
          <button 
            onClick={loadData} 
            className="px-5 py-2.5 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg font-medium hover:translate-y-[-2px] hover:shadow-lg hover:shadow-[#667eea]/40 transition-all"
          >
            🔄 Atualizar
          </button>
          <Link href="/pagamento">
            <button className="px-5 py-2.5 bg-gradient-to-r from-[#2ecc71] to-[#27ae60] text-white rounded-lg font-medium hover:translate-y-[-2px] hover:shadow-lg hover:shadow-green-500/40 transition-all">
              💸 Pagamento
            </button>
          </Link>
          <Link href="/pagamentos-tecnicos">
            <button className="px-5 py-2.5 bg-gradient-to-r from-[#9b59b6] to-[#8e44ad] text-white rounded-lg font-medium hover:translate-y-[-2px] hover:shadow-lg hover:shadow-purple-500/40 transition-all">
              📊 Pagamentos/Técnico
            </button>
          </Link>
          <Link href="/configuracao">
            <button className="px-5 py-2.5 bg-white/10 text-white rounded-lg border border-white/20 font-medium hover:bg-white/20 transition-all">
              ⚙️ Configuração
            </button>
          </Link>
          <Link href="/import">
            <button className="px-5 py-2.5 bg-white/10 text-white rounded-lg border border-white/20 font-medium hover:bg-white/20 transition-all">
              📥 Importar
            </button>
          </Link>
          <Link href="/usuarios-admin">
            <button className="px-5 py-2.5 bg-white/10 text-white rounded-lg border border-white/20 font-medium hover:bg-white/20 transition-all">
              👥 Admins
            </button>
          </Link>
          <Link href="/admin">
            <button className="px-5 py-2.5 bg-white/10 text-white rounded-lg border border-white/20 font-medium hover:bg-white/20 transition-all">
              ← Voltar
            </button>
          </Link>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-81px)]">
        {/* Sidebar */}
        <aside className="w-80 bg-white/[0.03] border-r border-white/10 p-6 overflow-y-auto">
          {/* Date Filters */}
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3">📅 Período</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {['today', 'week', 'month', 'year', 'all'].map(preset => (
                <button
                  key={preset}
                  onClick={() => setPreset(preset)}
                  className="px-3.5 py-2 border border-white/20 bg-white/5 text-gray-400 rounded-full text-xs hover:bg-gradient-to-r hover:from-[#667eea] hover:to-[#764ba2] hover:border-transparent hover:text-white transition-all"
                >
                  {preset === 'today' ? 'Hoje' : preset === 'week' ? '7 dias' : preset === 'month' ? '30 dias' : preset === 'year' ? '1 ano' : 'Tudo'}
                </button>
              ))}
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <label className="min-w-[35px] text-sm text-gray-500">De:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="flex-1 px-3 py-2.5 border border-white/15 bg-white/5 text-white rounded-lg text-sm focus:outline-none focus:border-[#667eea]"
                />
              </div>
              <div className="flex items-center gap-2.5">
                <label className="min-w-[35px] text-sm text-gray-500">Até:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="flex-1 px-3 py-2.5 border border-white/15 bg-white/5 text-white rounded-lg text-sm focus:outline-none focus:border-[#667eea]"
                />
              </div>
            </div>
          </div>

          {/* User Filters */}
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3">👥 Técnicos</h3>
            <div className="max-h-48 overflow-y-auto bg-black/20 rounded-lg p-2.5">
              <label className="flex items-center p-2 rounded cursor-pointer hover:bg-white/5">
                <input
                  type="checkbox"
                  checked={selectedUsers.size === users.length}
                  onChange={toggleAllUsers}
                  className="w-4 h-4 mr-2.5 accent-[#667eea]"
                />
                <span className="text-sm text-[#667eea] font-medium">Selecionar Todos</span>
              </label>
              {users.map(u => (
                <label key={u.id} className="flex items-center p-2 rounded cursor-pointer hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(u.id)}
                    onChange={() => toggleUser(u.id)}
                    className="w-4 h-4 mr-2.5 accent-[#667eea]"
                  />
                  <span className="text-sm text-gray-300">{u.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Type Filters */}
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3">🔧 Tipos de Serviço</h3>
            <div className="max-h-48 overflow-y-auto bg-black/20 rounded-lg p-2.5">
              <label className="flex items-center p-2 rounded cursor-pointer hover:bg-white/5">
                <input
                  type="checkbox"
                  checked={selectedTypes.size === types.length}
                  onChange={toggleAllTypes}
                  className="w-4 h-4 mr-2.5 accent-[#667eea]"
                />
                <span className="text-sm text-[#667eea] font-medium">Selecionar Todos</span>
              </label>
              {types.map(t => (
                <label key={t.id} className="flex items-center p-2 rounded cursor-pointer hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={selectedTypes.has(t.id)}
                    onChange={() => toggleType(t.id)}
                    className="w-4 h-4 mr-2.5 accent-[#667eea]"
                  />
                  <span className="text-sm text-gray-300">{t.name}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:translate-y-[-5px] transition-transform">
              <div className="w-12 h-12 bg-[#667eea]/20 rounded-xl flex items-center justify-center text-2xl mb-4">🏆</div>
              <div className="text-4xl font-bold text-[#667eea] mb-1">{totalPoints.toLocaleString('pt-BR')}</div>
              <div className="text-sm text-gray-500">Total de Pontos</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:translate-y-[-5px] transition-transform">
              <div className="w-12 h-12 bg-[#2ecc71]/20 rounded-xl flex items-center justify-center text-2xl mb-4">✅</div>
              <div className="text-4xl font-bold text-[#2ecc71] mb-1">{filtered.length.toLocaleString('pt-BR')}</div>
              <div className="text-sm text-gray-500">Serviços Realizados</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:translate-y-[-5px] transition-transform">
              <div className="w-12 h-12 bg-[#f1c40f]/20 rounded-xl flex items-center justify-center text-2xl mb-4">👷</div>
              <div className="text-4xl font-bold text-[#f1c40f] mb-1">{uniqueTechs}</div>
              <div className="text-sm text-gray-500">Técnicos Ativos</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:translate-y-[-5px] transition-transform">
              <div className="w-12 h-12 bg-[#9b59b6]/20 rounded-xl flex items-center justify-center text-2xl mb-4">📈</div>
              <div className="text-4xl font-bold text-[#9b59b6] mb-1">{avgPoints.toLocaleString('pt-BR')}</div>
              <div className="text-sm text-gray-500">Média por Técnico</div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div 
              className="bg-white/5 border border-white/10 rounded-2xl p-6 cursor-pointer hover:bg-white/[0.08] hover:border-[#667eea]/50 transition-all group"
              onClick={() => router.push(`/technicians?startDate=${startDate}&endDate=${endDate}`)}
            >
              <h3 className="text-base font-semibold mb-5 group-hover:text-[#667eea] transition-colors">
                📊 Pontuação por Técnico
                <span className="text-xs text-gray-500 ml-2 group-hover:text-[#667eea]/70">Clique para ver todos →</span>
              </h3>
              <div className="h-72">
                <Bar data={barData} options={chartOptions} />
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-semibold mb-5">📈 Evolução Diária</h3>
              <div className="h-72">
                <Line data={lineData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Ranking */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-base font-semibold mb-5">🏅 Top 10 Técnicos</h3>
            <div className="flex flex-col gap-2.5">
              {loading ? (
                <div className="flex items-center justify-center p-12 text-gray-500">
                  <div className="w-8 h-8 border-3 border-[#667eea]/20 border-t-[#667eea] rounded-full animate-spin mr-4"></div>
                  Carregando dados...
                </div>
              ) : ranking.length > 0 ? (
                ranking.map((r, i) => (
                  <div key={r.id} className="flex items-center p-4 bg-black/20 rounded-xl">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold mr-4 text-sm ${
                      i === 0 ? 'bg-gradient-to-r from-[#f1c40f] to-[#e67e22]' :
                      i === 1 ? 'bg-gradient-to-r from-[#bdc3c7] to-[#95a5a6]' :
                      i === 2 ? 'bg-gradient-to-r from-[#cd7f32] to-[#a0522d]' :
                      'bg-white/10'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium mb-0.5">{r.name}</div>
                      <div className="text-xs text-gray-500">{r.services} serviços</div>
                    </div>
                    <div className="text-xl font-bold text-[#667eea]">{r.points.toLocaleString('pt-BR')} pts</div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center p-12 text-gray-500">
                  Nenhum dado encontrado para o período selecionado
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AdminAuthGuard>
      <DashboardPageContent />
    </AdminAuthGuard>
  );
}
