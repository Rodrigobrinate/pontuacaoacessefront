'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  getDashboardData, 
  getPaymentConfig, 
  PaymentConfig, 
  Service,
  getTechnicianReport,
  TechnicianReport
} from '@/lib/api';
import AdminAuthGuard from '@/components/AdminAuthGuard';

interface TechnicianPayment {
  id: string;
  name: string;
  totalPoints: number;
  payment: number;
  serviceCount: number;
  servicesAboveMin: number;
}

function PagamentoPageContent() {
  const [technicians, setTechnicians] = useState<TechnicianPayment[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<TechnicianPayment | null>(null);
  const [technicianReport, setTechnicianReport] = useState<TechnicianReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [modalStartDate, setModalStartDate] = useState<string>('');
  const [modalEndDate, setModalEndDate] = useState<string>('');
  
  // Service type summary state
  const [serviceTypeSummary, setServiceTypeSummary] = useState<{name: string; count: number; points: number; totalPoints: number}[]>([]);

  // Calculate current cycle dates based on config
  useEffect(() => {
    if (paymentConfig) {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      // Calculate cycle: starts on cycleStartDay of previous month, ends on cycleEndDay of current month
      let cycleStartMonth = currentMonth - 1;
      let cycleStartYear = currentYear;
      if (cycleStartMonth < 0) {
        cycleStartMonth = 11;
        cycleStartYear = currentYear - 1;
      }
      
      const cycleStart = new Date(cycleStartYear, cycleStartMonth, paymentConfig.cycleStartDay);
      const cycleEnd = new Date(currentYear, currentMonth, paymentConfig.cycleEndDay);
      
      setStartDate(cycleStart.toISOString().split('T')[0]);
      setEndDate(cycleEnd.toISOString().split('T')[0]);
    }
  }, [paymentConfig]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (paymentConfig && startDate && endDate) {
      loadServices();
    }
  }, [startDate, endDate, paymentConfig]);

  async function loadData() {
    try {
      setLoading(true);
      const config = await getPaymentConfig();
      setPaymentConfig(config);
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  }

  async function loadServices() {
    try {
      setLoading(true);
      const { services } = await getDashboardData(startDate, endDate);
      
      if (paymentConfig) {
        // Group services by technician and calculate payments
        const techMap = new Map<string, { 
          name: string; 
          totalPoints: number; 
          serviceCount: number;
        }>();

        // Group services by service type for summary
        const serviceTypeMap = new Map<string, {
          name: string;
          count: number;
          points: number;
          totalPoints: number;
        }>();

        services.forEach((service: Service) => {
          const userId = service.user.id;
          const userName = service.user.name;
          const points = service.serviceType.points;
          const serviceTypeName = service.serviceType.name;
          
          // Technician grouping
          if (!techMap.has(userId)) {
            techMap.set(userId, { name: userName, totalPoints: 0, serviceCount: 0 });
          }
          
          const tech = techMap.get(userId)!;
          tech.totalPoints += points;
          tech.serviceCount += 1;

          // Service type grouping
          if (!serviceTypeMap.has(serviceTypeName)) {
            serviceTypeMap.set(serviceTypeName, { 
              name: serviceTypeName, 
              count: 0, 
              points: points,
              totalPoints: 0 
            });
          }
          
          const serviceType = serviceTypeMap.get(serviceTypeName)!;
          serviceType.count += 1;
          serviceType.totalPoints += points;
        });

        // Calculate payments and convert to array
        const techPayments: TechnicianPayment[] = [];
        techMap.forEach((tech, id) => {
          const { minPoints, basePayment, pointRate } = paymentConfig;
          let payment = 0;
          let servicesAboveMin = 0;
          
          if (tech.totalPoints >= minPoints) {
            payment = basePayment + (tech.totalPoints - minPoints) * pointRate;
            servicesAboveMin = tech.totalPoints - minPoints;
          }
          
          techPayments.push({
            id,
            name: tech.name,
            totalPoints: tech.totalPoints,
            payment,
            serviceCount: tech.serviceCount,
            servicesAboveMin
          });
        });

        // Sort by payment (descending)
        techPayments.sort((a, b) => b.payment - a.payment);
        setTechnicians(techPayments);

        // Convert service type summary to sorted array
        const serviceTypeSummaryArray = Array.from(serviceTypeMap.values())
          .sort((a, b) => b.totalPoints - a.totalPoints);
        setServiceTypeSummary(serviceTypeSummaryArray);
      }
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    } finally {
      setLoading(false);
    }
  }

  // Filter technicians by search term
  const filteredTechnicians = useMemo(() => {
    return technicians.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [technicians, searchTerm]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredTechnicians.reduce(
      (acc, t) => ({
        totalPayment: acc.totalPayment + t.payment,
        totalPoints: acc.totalPoints + t.totalPoints,
        totalServices: acc.totalServices + t.serviceCount,
        qualifiedCount: acc.qualifiedCount + (t.payment > 0 ? 1 : 0)
      }),
      { totalPayment: 0, totalPoints: 0, totalServices: 0, qualifiedCount: 0 }
    );
  }, [filteredTechnicians]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2 
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  // Open modal and load technician report
  const openTechnicianModal = async (tech: TechnicianPayment) => {
    setSelectedTechnician(tech);
    setModalStartDate(startDate);
    setModalEndDate(endDate);
    setIsModalOpen(true);
    await loadTechnicianReport(tech.id, startDate, endDate);
  };

  // Load technician report data
  const loadTechnicianReport = async (userId: string, start: string, end: string) => {
    try {
      setReportLoading(true);
      const report = await getTechnicianReport(userId, start, end);
      setTechnicianReport(report);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
    } finally {
      setReportLoading(false);
    }
  };

  // Reload report when modal dates change
  useEffect(() => {
    if (isModalOpen && selectedTechnician && modalStartDate && modalEndDate) {
      loadTechnicianReport(selectedTechnician.id, modalStartDate, modalEndDate);
    }
  }, [modalStartDate, modalEndDate]);

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTechnician(null);
    setTechnicianReport(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white font-sans">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-lg px-10 py-5 flex justify-between items-center border-b border-white/10">
        <h1 className="text-2xl font-semibold bg-gradient-to-r from-[#2ecc71] to-[#27ae60] bg-clip-text text-transparent flex items-center gap-3">
          💸 Cálculo de Pagamento
        </h1>
        <div className="flex gap-4">
          <Link href="/resumo-anual">
            <button className="px-5 py-2.5 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg font-medium hover:opacity-90 transition-all">
              📅 Resumo Anual
            </button>
          </Link>
          <Link href="/configuracao">
            <button className="px-5 py-2.5 bg-white/10 text-white rounded-lg border border-white/20 font-medium hover:bg-white/20 transition-all">
              ⚙️ Configuração
            </button>
          </Link>
          <Link href="/dashboard">
            <button className="px-5 py-2.5 bg-white/10 text-white rounded-lg border border-white/20 font-medium hover:bg-white/20 transition-all">
              ← Voltar ao Dashboard
            </button>
          </Link>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto">
        {/* Date Filter & Payment Config Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Date Filter */}
          <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              📅 Período de Cálculo
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Data Inicial</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white focus:outline-none focus:border-[#2ecc71] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Data Final</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white focus:outline-none focus:border-[#2ecc71] transition-colors"
                />
              </div>
            </div>
            {startDate && endDate && (
              <p className="text-sm text-gray-400 mt-3">
                Exibindo serviços de <span className="text-white font-medium">{formatDate(startDate)}</span> até <span className="text-white font-medium">{formatDate(endDate)}</span>
              </p>
            )}
          </div>

          {/* Payment Config Summary */}
          {paymentConfig && (
            <div className="bg-gradient-to-br from-[#2ecc71]/10 to-[#27ae60]/10 border border-[#2ecc71]/20 rounded-2xl p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Regras de Pagamento</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Mínimo:</span>
                  <span className="font-bold text-white">{paymentConfig.minPoints} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Base:</span>
                  <span className="font-bold text-[#2ecc71]">{formatCurrency(paymentConfig.basePayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Por ponto extra:</span>
                  <span className="font-bold text-white">{formatCurrency(paymentConfig.pointRate)}</span>
                </div>
              </div>
              <Link href="/configuracao" className="block mt-4 text-center text-sm text-[#2ecc71] hover:underline">
                Editar configuração →
              </Link>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-[#2ecc71] to-[#27ae60] rounded-2xl p-6 text-white">
            <div className="text-3xl font-bold">{formatCurrency(totals.totalPayment)}</div>
            <div className="text-sm opacity-80 mt-1">Total a Pagar</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="text-3xl font-bold text-[#667eea]">{totals.totalPoints.toLocaleString()}</div>
            <div className="text-sm text-gray-400 mt-1">Total de Pontos</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="text-3xl font-bold text-white">{totals.qualifiedCount}</div>
            <div className="text-sm text-gray-400 mt-1">Técnicos Qualificados</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="text-3xl font-bold text-white">{totals.totalServices.toLocaleString()}</div>
            <div className="text-sm text-gray-400 mt-1">Total de Serviços</div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Buscar técnico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#2ecc71] transition-colors"
            />
          </div>
          <div className="text-sm text-gray-400">
            {filteredTechnicians.length} técnicos
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-16">
              <div className="w-10 h-10 border-4 border-[#2ecc71]/20 border-t-[#2ecc71] rounded-full animate-spin"></div>
              <span className="ml-4 text-gray-400">Calculando pagamentos...</span>
            </div>
          ) : filteredTechnicians.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-gray-400">
              <span className="text-5xl mb-4">📭</span>
              <p>Nenhum técnico encontrado</p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="mt-4 text-[#2ecc71] hover:underline"
                >
                  Limpar busca
                </button>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-gray-500 font-medium">
                    Técnico
                  </th>
                  <th className="text-center px-6 py-4 text-xs uppercase tracking-wider text-gray-500 font-medium">
                    Serviços
                  </th>
                  <th className="text-center px-6 py-4 text-xs uppercase tracking-wider text-gray-500 font-medium">
                    Pontuação
                  </th>
                  <th className="text-center px-6 py-4 text-xs uppercase tracking-wider text-gray-500 font-medium">
                    Pts Extras
                  </th>
                  <th className="text-right px-6 py-4 text-xs uppercase tracking-wider text-gray-500 font-medium">
                    Pagamento
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTechnicians.map((tech, index) => (
                  <tr 
                    key={tech.id} 
                    className={`border-t border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer ${
                      tech.payment > 0 ? '' : 'opacity-60'
                    }`}
                    onClick={() => openTechnicianModal(tech)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          tech.payment > 0 
                            ? 'bg-gradient-to-br from-[#2ecc71] to-[#27ae60] text-white' 
                            : 'bg-white/10 text-gray-400'
                        }`}>
                          {index + 1}
                        </span>
                        <div>
                          <span className="font-medium">{tech.name}</span>
                          {tech.payment === 0 && paymentConfig && (
                            <p className="text-xs text-red-400">
                              Faltam {paymentConfig.minPoints - tech.totalPoints} pts
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-gray-300">{tech.serviceCount}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xl font-bold ${
                        tech.payment > 0 ? 'text-[#667eea]' : 'text-gray-500'
                      }`}>
                        {tech.totalPoints}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">pts</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {tech.servicesAboveMin > 0 ? (
                        <span className="text-[#2ecc71] font-medium">+{tech.servicesAboveMin}</span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-xl font-bold ${
                        tech.payment > 0 ? 'text-[#2ecc71]' : 'text-red-400'
                      }`}>
                        {formatCurrency(tech.payment)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-white/5 border-t border-white/10">
                <tr>
                  <td className="px-6 py-4 font-bold">TOTAL</td>
                  <td className="px-6 py-4 text-center font-bold">{totals.totalServices}</td>
                  <td className="px-6 py-4 text-center font-bold text-[#667eea]">{totals.totalPoints}</td>
                  <td className="px-6 py-4 text-center font-bold">-</td>
                  <td className="px-6 py-4 text-right font-bold text-[#2ecc71] text-xl">
                    {formatCurrency(totals.totalPayment)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Service Type Summary Table */}
        {!loading && serviceTypeSummary.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              📋 Resumo por Tipo de Serviço
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-gray-500 font-medium">
                      Tipo de Serviço
                    </th>
                    <th className="text-center px-6 py-4 text-xs uppercase tracking-wider text-gray-500 font-medium">
                      Quantidade
                    </th>
                    <th className="text-center px-6 py-4 text-xs uppercase tracking-wider text-gray-500 font-medium">
                      Pts/Serviço
                    </th>
                    <th className="text-right px-6 py-4 text-xs uppercase tracking-wider text-gray-500 font-medium">
                      Total Pts
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {serviceTypeSummary.map((serviceType, index) => (
                    <tr key={index} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-white">{serviceType.name}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-gray-300">{serviceType.count}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-gray-400">{serviceType.points}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-[#667eea]">{serviceType.totalPoints.toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-white/5 border-t border-white/10">
                  <tr>
                    <td className="px-6 py-4 font-bold text-white">TOTAL</td>
                    <td className="px-6 py-4 text-center font-bold text-white">
                      {serviceTypeSummary.reduce((acc, s) => acc + s.count, 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-500">-</td>
                    <td className="px-6 py-4 text-right font-bold text-[#667eea] text-xl">
                      {serviceTypeSummary.reduce((acc, s) => acc + s.totalPoints, 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Info Card */}
        {paymentConfig && (
          <div className="mt-8 p-6 bg-[#2ecc71]/10 border border-[#2ecc71]/20 rounded-2xl">
            <h3 className="text-lg font-semibold text-[#2ecc71] mb-3 flex items-center gap-2">
              💡 Fórmula de Pagamento
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              <span className="text-white font-medium">Se pontuação ≥ {paymentConfig.minPoints}:</span> Pagamento = {formatCurrency(paymentConfig.basePayment)} + (Pontos - {paymentConfig.minPoints}) × {formatCurrency(paymentConfig.pointRate)}
              <br />
              <span className="text-white font-medium">Se pontuação &lt; {paymentConfig.minPoints}:</span> Pagamento = R$ 0,00
            </p>
          </div>
        )}
      </main>

      {/* Technician Report Modal */}
      {isModalOpen && selectedTechnician && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-white/20 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-white/5 px-6 py-4 border-b border-white/10 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  📊 Relatório Detalhado
                </h2>
                <p className="text-gray-400 text-sm mt-1">{selectedTechnician.name}</p>
              </div>
              <button
                onClick={closeModal}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white text-xl"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Date Selector */}
              <div className="mb-6 bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                  📅 Período
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Data Inicial</label>
                    <input
                      type="date"
                      value={modalStartDate}
                      onChange={(e) => setModalStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-lg text-white text-sm focus:outline-none focus:border-[#2ecc71] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Data Final</label>
                    <input
                      type="date"
                      value={modalEndDate}
                      onChange={(e) => setModalEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-lg text-white text-sm focus:outline-none focus:border-[#2ecc71] transition-colors"
                    />
                  </div>
                </div>
              </div>

              {reportLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-[#2ecc71]/20 border-t-[#2ecc71] rounded-full animate-spin"></div>
                  <span className="ml-3 text-gray-400">Carregando relatório...</span>
                </div>
              ) : technicianReport ? (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 border border-[#667eea]/30 rounded-xl p-4">
                      <div className="text-3xl font-bold text-[#667eea]">{technicianReport.totalPoints.toLocaleString()}</div>
                      <div className="text-sm text-gray-400 mt-1">Pontuação Total</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="text-3xl font-bold text-white">{technicianReport.totalServices}</div>
                      <div className="text-sm text-gray-400 mt-1">Total de Serviços</div>
                    </div>
                  </div>

                  {/* Services Table */}
                  <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-gray-500 font-medium">
                            Tipo de Serviço
                          </th>
                          <th className="text-center px-4 py-3 text-xs uppercase tracking-wider text-gray-500 font-medium">
                            Quantidade
                          </th>
                          <th className="text-center px-4 py-3 text-xs uppercase tracking-wider text-gray-500 font-medium">
                            Pts/Serviço
                          </th>
                          <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-gray-500 font-medium">
                            Total Pts
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {technicianReport.byServiceType.map((service, index) => (
                          <tr key={index} className="border-t border-white/5 hover:bg-white/[0.02]">
                            <td className="px-4 py-3">
                              <span className="font-medium text-white">{service.name}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-gray-300">{service.count}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-gray-400">{service.pointsEach}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-bold text-[#667eea]">{service.totalPoints}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-white/5 border-t border-white/10">
                        <tr>
                          <td className="px-4 py-3 font-bold text-white">TOTAL</td>
                          <td className="px-4 py-3 text-center font-bold text-white">{technicianReport.totalServices}</td>
                          <td className="px-4 py-3 text-center text-gray-500">-</td>
                          <td className="px-4 py-3 text-right font-bold text-[#667eea] text-xl">{technicianReport.totalPoints}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {technicianReport.byServiceType.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <span className="text-4xl mb-3 block">📭</span>
                      <p>Nenhum serviço encontrado no período selecionado</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>Erro ao carregar relatório</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PagamentoPage() {
  return (
    <AdminAuthGuard>
      <PagamentoPageContent />
    </AdminAuthGuard>
  );
}
