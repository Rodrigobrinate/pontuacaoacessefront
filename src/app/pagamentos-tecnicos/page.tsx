'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getTechniciansAnnualPayments, TechniciansAnnualResponse } from '@/lib/api';
import AdminAuthGuard from '@/components/AdminAuthGuard';

function PagamentosTecnicosPageContent() {
  const [data, setData] = useState<TechniciansAnnualResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  async function loadData() {
    try {
      setLoading(true);
      const result = await getTechniciansAnnualPayments(selectedYear);
      setData(result);
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const formatCurrencyFull = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2
    });
  };

  // Filter technicians by search term
  const filteredTechnicians = useMemo(() => {
    if (!data) return [];
    return data.technicians.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white font-sans">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-lg px-10 py-5 flex justify-between items-center border-b border-white/10">
        <h1 className="text-2xl font-semibold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent flex items-center gap-3">
          📊 Pagamentos por Técnico
        </h1>
        <div className="flex gap-4">
          <Link href="/resumo-anual">
            <button className="px-5 py-2.5 bg-white/10 text-white rounded-lg border border-white/20 font-medium hover:bg-white/20 transition-all">
              📅 Resumo Anual
            </button>
          </Link>
          <Link href="/pagamento">
            <button className="px-5 py-2.5 bg-white/10 text-white rounded-lg border border-white/20 font-medium hover:bg-white/20 transition-all">
              💸 Pagamentos
            </button>
          </Link>
          <Link href="/dashboard">
            <button className="px-5 py-2.5 bg-white/10 text-white rounded-lg border border-white/20 font-medium hover:bg-white/20 transition-all">
              ← Dashboard
            </button>
          </Link>
        </div>
      </header>

      <main className="p-8 max-w-[1600px] mx-auto">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-6 mb-8">
          {/* Year Selector */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
            <label className="text-lg font-medium text-gray-300">Ano:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-lg font-bold focus:outline-none focus:border-[#667eea] transition-colors cursor-pointer"
            >
              {yearOptions.map(year => (
                <option key={year} value={year} className="bg-[#1a1a2e] text-white">
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Buscar técnico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#667eea] transition-colors"
            />
          </div>

          {/* Stats */}
          {data && (
            <div className="flex gap-4">
              <div className="bg-gradient-to-br from-[#2ecc71] to-[#27ae60] rounded-xl px-6 py-3 text-white">
                <div className="text-xl font-bold">{formatCurrencyFull(data.grandTotal)}</div>
                <div className="text-xs opacity-80">Total {selectedYear}</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-3">
                <div className="text-xl font-bold text-white">{filteredTechnicians.length}</div>
                <div className="text-xs text-gray-400">Técnicos</div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Config Info */}
        {data && (
          <div className="mb-6 bg-gradient-to-br from-[#667eea]/10 to-[#764ba2]/10 border border-[#667eea]/20 rounded-2xl p-4">
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-gray-400">Mínimo: </span>
                <span className="font-bold text-white">{data.config.minPoints} pts</span>
              </div>
              <div>
                <span className="text-gray-400">Base: </span>
                <span className="font-bold text-[#2ecc71]">{formatCurrencyFull(data.config.basePayment)}</span>
              </div>
              <div>
                <span className="text-gray-400">Por ponto extra: </span>
                <span className="font-bold text-white">{formatCurrencyFull(data.config.pointRate)}</span>
              </div>
              <div>
                <span className="text-gray-400">Ciclo: </span>
                <span className="font-bold text-white">Dia {data.config.cycleStartDay} → {data.config.cycleEndDay}</span>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-16">
              <div className="w-10 h-10 border-4 border-[#667eea]/20 border-t-[#667eea] rounded-full animate-spin"></div>
              <span className="ml-4 text-gray-400">Carregando pagamentos...</span>
            </div>
          ) : data && filteredTechnicians.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-white/5 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-4 text-xs uppercase tracking-wider text-gray-500 font-medium sticky left-0 bg-[#1a1a2e] z-10 min-w-[200px]">
                      Técnico
                    </th>
                    {data.monthNames.map((month, idx) => (
                      <th 
                        key={idx} 
                        className="text-center px-2 py-4 text-xs uppercase tracking-wider text-gray-500 font-medium min-w-[90px]"
                      >
                        {month}
                      </th>
                    ))}
                    <th className="text-right px-4 py-4 text-xs uppercase tracking-wider text-gray-500 font-medium min-w-[120px]">
                      Total Ano
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTechnicians.map((tech, index) => (
                    <tr 
                      key={tech.id} 
                      className={`border-t border-white/5 hover:bg-white/[0.03] transition-colors ${
                        tech.yearTotal > 0 ? '' : 'opacity-60'
                      }`}
                    >
                      <td className="px-4 py-3 sticky left-0 bg-[#1a1a2e]/95 backdrop-blur-sm z-10">
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            tech.yearTotal > 0 
                              ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white' 
                              : 'bg-white/10 text-gray-400'
                          }`}>
                            {index + 1}
                          </span>
                          <span className="font-medium text-sm truncate max-w-[150px]" title={tech.name}>
                            {tech.name}
                          </span>
                        </div>
                      </td>
                      {tech.monthlyPayments.map((payment, monthIdx) => (
                        <td key={monthIdx} className="px-2 py-3 text-center">
                          <span 
                            className={`text-sm font-medium ${
                              payment > 0 ? 'text-[#2ecc71]' : 'text-gray-600'
                            }`}
                            title={`${tech.monthlyPoints[monthIdx]} pontos`}
                          >
                            {payment > 0 ? formatCurrency(payment) : 'R$ 0'}
                          </span>
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <span className={`text-lg font-bold ${
                          tech.yearTotal > 0 ? 'text-[#2ecc71]' : 'text-gray-500'
                        }`}>
                          {formatCurrency(tech.yearTotal)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-white/5 border-t border-white/10 sticky bottom-0">
                  <tr>
                    <td className="px-4 py-4 font-bold sticky left-0 bg-[#1a1a2e] z-10">
                      TOTAL
                    </td>
                    {data.monthlyTotals.map((total, idx) => (
                      <td key={idx} className="px-2 py-4 text-center">
                        <span className={`text-sm font-bold ${
                          total > 0 ? 'text-[#2ecc71]' : 'text-gray-600'
                        }`}>
                          {formatCurrency(total)}
                        </span>
                      </td>
                    ))}
                    <td className="px-4 py-4 text-right">
                      <span className="text-xl font-bold text-[#2ecc71]">
                        {formatCurrencyFull(data.grandTotal)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 text-gray-400">
              <span className="text-5xl mb-4">📭</span>
              <p>Nenhum técnico encontrado</p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="mt-4 text-[#667eea] hover:underline"
                >
                  Limpar busca
                </button>
              )}
            </div>
          )}
        </div>

        {/* Info Card */}
        {data && (
          <div className="mt-8 p-6 bg-[#667eea]/10 border border-[#667eea]/20 rounded-2xl">
            <h3 className="text-lg font-semibold text-[#667eea] mb-3 flex items-center gap-2">
              💡 Como ler a tabela
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              <span className="text-white font-medium">Colunas:</span> Cada coluna representa um mês do ano selecionado.<br />
              <span className="text-white font-medium">Valores:</span> <span className="text-[#2ecc71]">Verde</span> = pagamento efetuado | <span className="text-gray-500">Cinza (R$ 0)</span> = não atingiu {data.config.minPoints} pontos mínimos<br />
              <span className="text-white font-medium">Dica:</span> Passe o mouse sobre os valores para ver a pontuação do técnico naquele mês.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function PagamentosTecnicosPage() {
  return (
    <AdminAuthGuard>
      <PagamentosTecnicosPageContent />
    </AdminAuthGuard>
  );
}
