'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAdminData, runCleanup, revertImport, AdminData } from '@/lib/api';

export default function AdminPage() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const result = await getAdminData();
      setData(result);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCleanup() {
    if (!confirm('ATENÇÃO: Isso vai apagar todos os técnicos com ZERO pontos. Deseja continuar?')) {
      return;
    }
    
    setActionLoading(true);
    try {
      const result = await runCleanup();
      alert(`Limpeza concluída: ${result.count} usuários removidos`);
      loadData();
    } catch (error) {
      alert('Erro ao realizar limpeza');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRevert(importId: string, rowCount: number) {
    if (!confirm(`Desfazer esta importação apagará ${rowCount} pontos. Confirma?`)) {
      return;
    }
    
    setActionLoading(true);
    try {
      await revertImport(importId);
      loadData();
    } catch (error) {
      alert('Erro ao reverter importação');
    } finally {
      setActionLoading(false);
    }
  }

  function copyLink(userId: string) {
    const domain = window.location.origin;
    const link = `${domain}/score/${userId}`;
    navigator.clipboard.writeText(link);
    alert('Link copiado!');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] p-5 font-[Segoe_UI,sans-serif]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Painel de Gestão</h1>
          <div className="flex gap-2.5">
            <Link href="/dashboard">
              <button className="px-4 py-2 rounded bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors">
                📊 Ver Gráficos
              </button>
            </Link>
            <button
              onClick={handleCleanup}
              disabled={actionLoading}
              className="px-4 py-2 rounded bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              🗑️ Limpar Erros
            </button>
            <Link href="/import">
              <button className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                + Nova Importação
              </button>
            </Link>
          </div>
        </div>

        {/* Import History */}
        <div className="bg-white p-5 rounded-lg shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">📂 Histórico de Importações</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-3 text-left font-semibold text-gray-700 border-b">Data</th>
                  <th className="p-3 text-left font-semibold text-gray-700 border-b">Arquivo</th>
                  <th className="p-3 text-left font-semibold text-gray-700 border-b">Registros</th>
                  <th className="p-3 text-left font-semibold text-gray-700 border-b">Status</th>
                  <th className="p-3 text-left font-semibold text-gray-700 border-b">Ação</th>
                </tr>
              </thead>
              <tbody>
                {data?.history.map(h => (
                  <tr 
                    key={h.id} 
                    className={h.status === 'REVERTIDO' ? 'opacity-50' : ''}
                  >
                    <td className="p-3 border-b border-gray-100">
                      {new Date(h.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3 border-b border-gray-100">{h.filename}</td>
                    <td className="p-3 border-b border-gray-100">{h.rowCount} serviços</td>
                    <td className="p-3 border-b border-gray-100">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        h.status === 'CONCLUIDO' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700 line-through'
                      }`}>
                        {h.status}
                      </span>
                    </td>
                    <td className="p-3 border-b border-gray-100">
                      {h.status === 'CONCLUIDO' ? (
                        <button
                          onClick={() => handleRevert(h.id, h.rowCount)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          ↺ Desfazer
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">Cancelado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Technicians Table */}
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">🏆 Pontuação dos Técnicos</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-3 text-left font-semibold text-gray-700 border-b">Técnico</th>
                  <th className="p-3 text-left font-semibold text-gray-700 border-b">Total de Pontos</th>
                  <th className="p-3 text-left font-semibold text-gray-700 border-b">Link de Acesso</th>
                </tr>
              </thead>
              <tbody>
                {data?.users.map(u => {
                  const total = u.services.reduce((acc, s) => acc + s.serviceType.points, 0);
                  return (
                    <tr key={u.id}>
                      <td className="p-3 border-b border-gray-100">
                        <strong>{u.name}</strong>
                      </td>
                      <td className="p-3 border-b border-gray-100">{total}</td>
                      <td className="p-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <Link 
                            href={`/score/${u.id}`} 
                            target="_blank"
                            className="text-blue-600 font-bold hover:underline"
                          >
                            Abrir Painel
                          </Link>
                          <button
                            onClick={() => copyLink(u.id)}
                            className="px-2.5 py-1 border border-gray-300 rounded text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            📋 Copiar Link
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
