'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAnnualSummary, AnnualSummary } from '@/lib/api';
import AdminAuthGuard from '@/components/AdminAuthGuard';

function ResumoAnualPageContent() {
  const [data, setData] = useState<AnnualSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  async function loadData() {
    try {
      setLoading(true);
      const summary = await getAnnualSummary(selectedYear);
      setData(summary);
    } catch (error) {
      console.error('Erro ao carregar resumo anual:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2 
    });
  };

  // Generate year options (current year and 5 years back)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white font-sans">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-lg px-10 py-5 flex justify-between items-center border-b border-white/10">
        <h1 className="text-2xl font-semibold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent flex items-center gap-3">
          📅 Resumo Anual de Pagamentos
        </h1>
        <div className="flex gap-4">
          <Link href="/pagamento">
            <button className="px-5 py-2.5 bg-white/10 text-white rounded-lg border border-white/20 font-medium hover:bg-white/20 transition-all">
              💸 Pagamentos
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
        {/* Year Selector */}
        <div className="mb-8 flex items-center gap-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4">
            <label className="text-lg font-medium text-gray-300">Ano:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-lg font-bold focus:outline-none focus:border-[#667eea] transition-colors cursor-pointer"
            >
              {yearOptions.map(year => (
                <option key={year} value={year} className="bg-[#1a1a2e] text-white">
                  {year}
                </option>
              ))}
            </select>
          </div>

          {data && (
            <div className="bg-gradient-to-br from-[#667eea]/10 to-[#764ba2]/10 border border-[#667eea]/20 rounded-2xl p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Regras de Pagamento</h3>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-gray-400">Mínimo: </span>
                  <span className="font-bold text-white">{data.config.minPoints} pts</span>
                </div>
                <div>
                  <span className="text-gray-400">Base: </span>
                  <span className="font-bold text-[#2ecc71]">{formatCurrency(data.config.basePayment)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Por ponto: </span>
                  <span className="font-bold text-white">{formatCurrency(data.config.pointRate)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Ciclo: </span>
                  <span className="font-bold text-white">Dia {data.config.cycleStartDay} → {data.config.cycleEndDay}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-[#2ecc71] to-[#27ae60] rounded-2xl p-6 text-white">
              <div className="text-3xl font-bold">{formatCurrency(data.totals.totalPayment)}</div>
              <div className="text-sm opacity-80 mt-1">Total Pago no Ano</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="text-3xl font-bold text-[#667eea]">{data.totals.totalPoints.toLocaleString()}</div>
              <div className="text-sm text-gray-400 mt-1">Total de Pontos</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="text-3xl font-bold text-white">{data.totals.qualifiedTechnicians}</div>
              <div className="text-sm text-gray-400 mt-1">Qualificações no Ano</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="text-3xl font-bold text-white">{data.totals.totalServices.toLocaleString()}</div>
              <div className="text-sm text-gray-400 mt-1">Total de Serviços</div>
            </div>
          </div>
        )}

        {/* Monthly Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-16">
              <div className="w-10 h-10 border-4 border-[#667eea]/20 border-t-[#667eea] rounded-full animate-spin"></div>
              <span className="ml-4 text-gray-400">Carregando resumo anual...</span>
            </div>
          ) : data ? (
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-gray-500 font-medium">
                    Mês
                  </th>
                  <th className="text-center px-6 py-4 text-xs uppercase tracking-wider text-gray-500 font-medium">
                    Período
                  </th>
                  <th className="text-center px-6 py-4 text-xs uppercase tracking-wider text-gray-500 font-medium">
                    Serviços
                  </th>
                  <th className="text-center px-6 py-4 text-xs uppercase tracking-wider text-gray-500 font-medium">
                    Pontos
                  </th>
                  <th className="text-center px-6 py-4 text-xs uppercase tracking-wider text-gray-500 font-medium">
                    Qualificados
                  </th>
                  <th className="text-right px-6 py-4 text-xs uppercase tracking-wider text-gray-500 font-medium">
                    Total Pago
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.months.map((month, index) => (
                  <tr 
                    key={month.month} 
                    className={`border-t border-white/5 hover:bg-white/[0.03] transition-colors ${
                      month.totalPayment > 0 ? '' : 'opacity-50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          month.totalPayment > 0 
                            ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white' 
                            : 'bg-white/10 text-gray-400'
                        }`}>
                          {month.month}
                        </span>
                        <span className="font-medium">{month.monthName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-gray-400 text-sm">{month.period}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-gray-300">{month.totalServices.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xl font-bold ${
                        month.totalPayment > 0 ? 'text-[#667eea]' : 'text-gray-500'
                      }`}>
                        {month.totalPoints.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {month.qualifiedTechnicians > 0 ? (
                        <span className="text-[#2ecc71] font-medium">
                          {month.qualifiedTechnicians}/{month.totalTechnicians}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-xl font-bold ${
                        month.totalPayment > 0 ? 'text-[#2ecc71]' : 'text-gray-500'
                      }`}>
                        {formatCurrency(month.totalPayment)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-white/5 border-t border-white/10">
                <tr>
                  <td className="px-6 py-4 font-bold">TOTAL {selectedYear}</td>
                  <td className="px-6 py-4 text-center text-gray-500">-</td>
                  <td className="px-6 py-4 text-center font-bold">{data.totals.totalServices.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center font-bold text-[#667eea]">{data.totals.totalPoints.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center font-bold">{data.totals.qualifiedTechnicians}</td>
                  <td className="px-6 py-4 text-right font-bold text-[#2ecc71] text-xl">
                    {formatCurrency(data.totals.totalPayment)}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 text-gray-400">
              <span className="text-5xl mb-4">📭</span>
              <p>Erro ao carregar dados</p>
            </div>
          )}
        </div>

        {/* Info Card */}
        {data && (
          <div className="mt-8 p-6 bg-[#667eea]/10 border border-[#667eea]/20 rounded-2xl">
            <h3 className="text-lg font-semibold text-[#667eea] mb-3 flex items-center gap-2">
              💡 Como funciona o cálculo
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              <span className="text-white font-medium">Ciclo Mensal:</span> Cada mês é calculado do dia {data.config.cycleStartDay} do mês anterior até o dia {data.config.cycleEndDay} do mês atual.
              <br />
              <span className="text-white font-medium">Pagamento:</span> Técnicos com ≥ {data.config.minPoints} pontos recebem {formatCurrency(data.config.basePayment)} + (Pontos - {data.config.minPoints}) × {formatCurrency(data.config.pointRate)}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ResumoAnualPage() {
  return (
    <AdminAuthGuard>
      <ResumoAnualPageContent />
    </AdminAuthGuard>
  );
}
