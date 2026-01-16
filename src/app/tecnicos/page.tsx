'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Key, Check, Copy, RefreshCw, Clock, AlertCircle } from 'lucide-react';
import { getTechnicians, generateCredentials, Technician, Credentials } from '@/lib/api';
import AdminAuthGuard from '@/components/AdminAuthGuard';

function TecnicosPageContent() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [copied, setCopied] = useState<'username' | 'password' | null>(null);

  useEffect(() => {
    loadTechnicians();
  }, []);

  async function loadTechnicians() {
    try {
      setLoading(true);
      const data = await getTechnicians();
      setTechnicians(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateCredentials(userId: string) {
    try {
      setGeneratingFor(userId);
      const creds = await generateCredentials(userId);
      setCredentials(creds);
      await loadTechnicians(); // Recarrega para atualizar status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar credenciais');
    } finally {
      setGeneratingFor(null);
    }
  }

  function copyToClipboard(text: string, type: 'username' | 'password') {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('pt-BR');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <ArrowLeft className="text-white" size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Users className="text-blue-400" />
                Gestão de Técnicos
              </h1>
              <p className="text-slate-400 mt-1">Gerencie credenciais de acesso para os técnicos</p>
            </div>
          </div>
          <button
            onClick={loadTechnicians}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title="Atualizar lista"
          >
            <RefreshCw className="text-white" size={20} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="text-red-400" size={20} />
            <span className="text-red-200">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">×</button>
          </div>
        )}

        {/* Credentials Modal */}
        {credentials && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-700">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="text-green-400" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-white">{credentials.message}</h2>
                <p className="text-slate-400 mt-2">Copie as credenciais abaixo. A senha não será exibida novamente.</p>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <label className="text-xs text-slate-500 uppercase tracking-wide">Usuário</label>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xl font-mono text-white">{credentials.username}</span>
                    <button
                      onClick={() => copyToClipboard(credentials.username, 'username')}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {copied === 'username' ? (
                        <Check className="text-green-400" size={18} />
                      ) : (
                        <Copy className="text-slate-400" size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4">
                  <label className="text-xs text-slate-500 uppercase tracking-wide">Senha</label>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xl font-mono text-yellow-400">{credentials.password}</span>
                    <button
                      onClick={() => copyToClipboard(credentials.password, 'password')}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {copied === 'password' ? (
                        <Check className="text-green-400" size={18} />
                      ) : (
                        <Copy className="text-slate-400" size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setCredentials(null)}
                className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <div className="text-3xl font-bold text-white">{technicians.length}</div>
            <div className="text-slate-400 text-sm">Total de Técnicos</div>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <div className="text-3xl font-bold text-green-400">
              {technicians.filter(t => t.hasCredentials).length}
            </div>
            <div className="text-slate-400 text-sm">Com Credenciais</div>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <div className="text-3xl font-bold text-yellow-400">
              {technicians.filter(t => !t.hasCredentials).length}
            </div>
            <div className="text-slate-400 text-sm">Sem Credenciais</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-slate-400 font-medium">Técnico</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Usuário</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Status</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Último Login</th>
                  <th className="text-right p-4 text-slate-400 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {technicians.map(tech => (
                  <tr key={tech.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {tech.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{tech.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-slate-300">{tech.username || '-'}</span>
                    </td>
                    <td className="p-4">
                      {tech.hasCredentials ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                          <Check size={14} /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm">
                          <Clock size={14} /> Pendente
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400 text-sm">
                      {formatDate(tech.lastLogin)}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleGenerateCredentials(tech.id)}
                        disabled={generatingFor === tech.id}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-wait text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        {generatingFor === tech.id ? (
                          <>
                            <RefreshCw className="animate-spin" size={16} />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <Key size={16} />
                            {tech.hasCredentials ? 'Nova Senha' : 'Gerar Acesso'}
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TecnicosPage() {
  return (
    <AdminAuthGuard>
      <TecnicosPageContent />
    </AdminAuthGuard>
  );
}
