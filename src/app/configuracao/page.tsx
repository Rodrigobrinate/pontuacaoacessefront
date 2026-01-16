'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getServiceTypes, updateServiceTypePoints, ServiceType, getPaymentConfig, updatePaymentConfig, PaymentConfig } from '@/lib/api';
import AdminAuthGuard from '@/components/AdminAuthGuard';

function ConfiguracaoPageContent() {
  const [types, setTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Payment config state
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(true);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [editingPayment, setEditingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    minPoints: 900,
    basePayment: 100,
    pointRate: 1,
    cycleStartDay: 24,
    cycleEndDay: 25
  });

  useEffect(() => {
    loadTypes();
    loadPaymentConfig();
  }, []);

  async function loadTypes() {
    try {
      setLoading(true);
      const data = await getServiceTypes();
      setTypes(data);
    } catch (error) {
      console.error('Erro ao carregar tipos:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar tipos de serviço' });
    } finally {
      setLoading(false);
    }
  }

  async function loadPaymentConfig() {
    try {
      setPaymentLoading(true);
      const config = await getPaymentConfig();
      setPaymentConfig(config);
      setPaymentForm({
        minPoints: config.minPoints,
        basePayment: config.basePayment,
        pointRate: config.pointRate,
        cycleStartDay: config.cycleStartDay,
        cycleEndDay: config.cycleEndDay
      });
    } catch (error) {
      console.error('Erro ao carregar configuração de pagamento:', error);
    } finally {
      setPaymentLoading(false);
    }
  }

  async function handleSave(id: number) {
    const points = parseInt(editValue);
    if (isNaN(points) || points < 0) {
      setMessage({ type: 'error', text: 'Pontuação deve ser um número positivo' });
      return;
    }

    try {
      setSaving(id);
      const updated = await updateServiceTypePoints(id, points);
      setTypes(types.map(t => t.id === id ? updated : t));
      setEditingId(null);
      setMessage({ type: 'success', text: `Pontuação de "${updated.name}" atualizada para ${points} pontos` });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setMessage({ type: 'error', text: 'Erro ao salvar pontuação' });
    } finally {
      setSaving(null);
    }
  }

  async function handleSavePaymentConfig() {
    try {
      setPaymentSaving(true);
      const updated = await updatePaymentConfig(paymentForm);
      setPaymentConfig(updated);
      setEditingPayment(false);
      setMessage({ type: 'success', text: 'Configuração de pagamento atualizada com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      setMessage({ type: 'error', text: 'Erro ao salvar configuração de pagamento' });
    } finally {
      setPaymentSaving(false);
    }
  }

  function startEdit(type: ServiceType) {
    setEditingId(type.id);
    setEditValue(type.points.toString());
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue('');
  }

  function startEditPayment() {
    if (paymentConfig) {
      setPaymentForm({
        minPoints: paymentConfig.minPoints,
        basePayment: paymentConfig.basePayment,
        pointRate: paymentConfig.pointRate,
        cycleStartDay: paymentConfig.cycleStartDay,
        cycleEndDay: paymentConfig.cycleEndDay
      });
    }
    setEditingPayment(true);
  }

  function cancelEditPayment() {
    if (paymentConfig) {
      setPaymentForm({
        minPoints: paymentConfig.minPoints,
        basePayment: paymentConfig.basePayment,
        pointRate: paymentConfig.pointRate,
        cycleStartDay: paymentConfig.cycleStartDay,
        cycleEndDay: paymentConfig.cycleEndDay
      });
    }
    setEditingPayment(false);
  }

  // Calculate payment examples
  const paymentExamples = useMemo(() => {
    const { minPoints, basePayment, pointRate } = paymentForm;
    const calculatePayment = (points: number) => {
      if (points < minPoints) return 0;
      return basePayment + (points - minPoints) * pointRate;
    };
    
    return [
      { points: minPoints - 1, payment: calculatePayment(minPoints - 1) },
      { points: minPoints, payment: calculatePayment(minPoints) },
      { points: minPoints + 1, payment: calculatePayment(minPoints + 1) },
      { points: minPoints + 2, payment: calculatePayment(minPoints + 2) },
    ];
  }, [paymentForm]);

  const filteredTypes = types.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white font-sans">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-lg px-10 py-5 flex justify-between items-center border-b border-white/10">
        <h1 className="text-2xl font-semibold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
          ⚙️ Configuração de Pontuação
        </h1>
        <div className="flex gap-4">
          <Link href="/dashboard">
            <button className="px-5 py-2.5 bg-white/10 text-white rounded-lg border border-white/20 font-medium hover:bg-white/20 transition-all">
              ← Voltar ao Dashboard
            </button>
          </Link>
        </div>
      </header>

      <main className="p-8 max-w-5xl mx-auto">
        {/* Message Toast */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border ${
            message.type === 'success' 
              ? 'bg-green-500/10 border-green-500/30 text-green-400' 
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          } flex items-center gap-3 animate-fade-in`}>
            <span className="text-xl">{message.type === 'success' ? '✅' : '❌'}</span>
            {message.text}
          </div>
        )}

        {/* Payment Configuration Section */}
        <div className="mb-8 bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-3">
              💰 Configuração de Pagamento
            </h2>
            {!editingPayment && !paymentLoading && (
              <button
                onClick={startEditPayment}
                className="px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-[#667eea]/30 hover:translate-y-[-1px] transition-all"
              >
                ✏️ Editar
              </button>
            )}
          </div>

          {paymentLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-8 h-8 border-4 border-[#667eea]/20 border-t-[#667eea] rounded-full animate-spin"></div>
              <span className="ml-4 text-gray-400">Carregando configuração...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Config Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Pontuação Mínima</label>
                    <input
                      type="number"
                      min="0"
                      value={paymentForm.minPoints}
                      onChange={(e) => setPaymentForm({ ...paymentForm, minPoints: parseInt(e.target.value) || 0 })}
                      disabled={!editingPayment}
                      className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white focus:outline-none focus:border-[#667eea] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    />
                    <span className="text-xs text-gray-500 mt-1 block">pontos para começar a ganhar</span>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Pagamento Base</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={paymentForm.basePayment}
                        onChange={(e) => setPaymentForm({ ...paymentForm, basePayment: parseFloat(e.target.value) || 0 })}
                        disabled={!editingPayment}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white focus:outline-none focus:border-[#667eea] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      />
                    </div>
                    <span className="text-xs text-gray-500 mt-1 block">ao atingir o mínimo</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Valor por Ponto Extra</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentForm.pointRate}
                      onChange={(e) => setPaymentForm({ ...paymentForm, pointRate: parseFloat(e.target.value) || 0 })}
                      disabled={!editingPayment}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white focus:outline-none focus:border-[#667eea] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    />
                  </div>
                  <span className="text-xs text-gray-500 mt-1 block">para cada ponto acima do mínimo</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Início do Ciclo (dia)</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={paymentForm.cycleStartDay}
                      onChange={(e) => setPaymentForm({ ...paymentForm, cycleStartDay: parseInt(e.target.value) || 1 })}
                      disabled={!editingPayment}
                      className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white focus:outline-none focus:border-[#667eea] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Fim do Ciclo (dia)</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={paymentForm.cycleEndDay}
                      onChange={(e) => setPaymentForm({ ...paymentForm, cycleEndDay: parseInt(e.target.value) || 1 })}
                      disabled={!editingPayment}
                      className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white focus:outline-none focus:border-[#667eea] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  O mês de faturamento vai do dia {paymentForm.cycleStartDay} ao dia {paymentForm.cycleEndDay} do mês seguinte
                </p>

                {editingPayment && (
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSavePaymentConfig}
                      disabled={paymentSaving}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-[#2ecc71] to-[#27ae60] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-green-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {paymentSaving ? '⏳ Salvando...' : '✓ Salvar Configuração'}
                    </button>
                    <button
                      onClick={cancelEditPayment}
                      className="px-4 py-3 bg-white/10 text-gray-300 rounded-xl font-medium hover:bg-white/20 transition-all"
                    >
                      ✕ Cancelar
                    </button>
                  </div>
                )}
              </div>

              {/* Payment Preview */}
              <div className="bg-black/20 rounded-xl p-5">
                <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                  📊 Simulação de Pagamento
                </h3>
                <div className="space-y-3">
                  {paymentExamples.map((ex, i) => (
                    <div 
                      key={i} 
                      className={`flex justify-between items-center p-3 rounded-lg ${
                        ex.payment > 0 ? 'bg-green-500/10' : 'bg-red-500/10'
                      }`}
                    >
                      <span className="text-gray-300">
                        <span className="font-bold text-white">{ex.points}</span> pontos
                      </span>
                      <span className={`font-bold ${ex.payment > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        R$ {ex.payment.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Fórmula: {paymentForm.minPoints} pts = R${paymentForm.basePayment.toFixed(2)}, +R${paymentForm.pointRate.toFixed(2)}/ponto extra
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Search and Info */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Buscar tipo de serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#667eea] transition-colors"
            />
          </div>
          <div className="text-sm text-gray-400">
            {types.length} tipos de serviço cadastrados
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-16">
              <div className="w-10 h-10 border-4 border-[#667eea]/20 border-t-[#667eea] rounded-full animate-spin"></div>
              <span className="ml-4 text-gray-400">Carregando tipos de serviço...</span>
            </div>
          ) : filteredTypes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-gray-400">
              <span className="text-5xl mb-4">📭</span>
              <p>Nenhum tipo de serviço encontrado</p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="mt-4 text-[#667eea] hover:underline"
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
                    Tipo de Serviço
                  </th>
                  <th className="text-center px-6 py-4 text-xs uppercase tracking-wider text-gray-500 font-medium w-40">
                    Pontuação
                  </th>
                  <th className="text-center px-6 py-4 text-xs uppercase tracking-wider text-gray-500 font-medium w-40">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTypes.map((type, index) => (
                  <tr 
                    key={type.id} 
                    className={`border-t border-white/5 hover:bg-white/[0.03] transition-colors ${
                      editingId === type.id ? 'bg-[#667eea]/5' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 flex items-center justify-center text-sm">
                          🔧
                        </span>
                        <span className="font-medium">{type.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingId === type.id ? (
                        <input
                          type="number"
                          min="0"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave(type.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          autoFocus
                          className="w-24 mx-auto block px-3 py-2 bg-white/10 border border-[#667eea] rounded-lg text-center text-white focus:outline-none"
                        />
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-2xl font-bold text-[#667eea]">{type.points}</span>
                          <span className="text-sm text-gray-500">pts</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {editingId === type.id ? (
                          <>
                            <button
                              onClick={() => handleSave(type.id)}
                              disabled={saving === type.id}
                              className="px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#27ae60] text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-green-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {saving === type.id ? '⏳' : '✓ Salvar'}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-4 py-2 bg-white/10 text-gray-300 rounded-lg text-sm font-medium hover:bg-white/20 transition-all"
                            >
                              ✕ Cancelar
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startEdit(type)}
                            className="px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-[#667eea]/30 hover:translate-y-[-1px] transition-all"
                          >
                            ✏️ Editar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-8 p-6 bg-[#667eea]/10 border border-[#667eea]/20 rounded-2xl">
          <h3 className="text-lg font-semibold text-[#667eea] mb-3 flex items-center gap-2">
            💡 Como funciona a pontuação
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Cada tipo de serviço possui um valor de pontuação que é atribuído ao técnico quando ele realiza aquele serviço. 
            Ao importar dados, o sistema automaticamente calcula a pontuação total de cada técnico multiplicando a quantidade 
            de serviços realizados pelo valor de pontos de cada tipo. Alterar o valor aqui afetará os cálculos futuros e 
            os dados já importados serão recalculados automaticamente.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function ConfiguracaoPage() {
  return (
    <AdminAuthGuard>
      <ConfiguracaoPageContent />
    </AdminAuthGuard>
  );
}
