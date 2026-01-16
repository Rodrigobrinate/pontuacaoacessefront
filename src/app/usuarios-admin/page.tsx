'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAdminUsers, createAdminUser, deleteAdminUser, resetAdminPassword, AdminUserType } from '@/lib/api';
import AdminAuthGuard from '@/components/AdminAuthGuard';

function UsuariosAdminPageContent() {
  const [admins, setAdmins] = useState<AdminUserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', username: '', password: '', confirmPassword: '' });
  
  // Delete modal state
  const [deleteModalAdmin, setDeleteModalAdmin] = useState<AdminUserType | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Password reset modal state
  const [resetModalAdmin, setResetModalAdmin] = useState<AdminUserType | null>(null);
  const [resetting, setResetting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  useEffect(() => {
    loadAdmins();
  }, []);

  async function loadAdmins() {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      const data = await getAdminUsers(token);
      setAdmins(data);
    } catch (error) {
      console.error('Erro ao carregar admins:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar administradores' });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    
    if (!newAdmin.name || !newAdmin.username || !newAdmin.password) {
      setMessage({ type: 'error', text: 'Preencha todos os campos' });
      return;
    }
    
    if (newAdmin.password !== newAdmin.confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' });
      return;
    }
    
    if (newAdmin.password.length < 6) {
      setMessage({ type: 'error', text: 'Senha deve ter no mínimo 6 caracteres' });
      return;
    }

    try {
      setCreating(true);
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      
      await createAdminUser(token, {
        name: newAdmin.name,
        username: newAdmin.username,
        password: newAdmin.password
      });
      
      setMessage({ type: 'success', text: 'Administrador criado com sucesso!' });
      setNewAdmin({ name: '', username: '', password: '', confirmPassword: '' });
      setShowCreateForm(false);
      loadAdmins();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar administrador';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!deleteModalAdmin) return;
    
    try {
      setDeleting(true);
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      
      await deleteAdminUser(token, deleteModalAdmin.id);
      
      setMessage({ type: 'success', text: 'Administrador removido com sucesso!' });
      setDeleteModalAdmin(null);
      loadAdmins();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao remover administrador';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setDeleting(false);
    }
  }

  async function handleResetPassword() {
    if (!resetModalAdmin) return;
    
    if (newPassword !== confirmNewPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' });
      return;
    }
    
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Senha deve ter no mínimo 6 caracteres' });
      return;
    }

    try {
      setResetting(true);
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      
      await resetAdminPassword(token, resetModalAdmin.id, newPassword);
      
      setMessage({ type: 'success', text: 'Senha atualizada com sucesso!' });
      setResetModalAdmin(null);
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setMessage(null), 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao resetar senha';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setResetting(false);
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('pt-BR');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white font-sans">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-lg px-10 py-5 flex justify-between items-center border-b border-white/10">
        <h1 className="text-2xl font-semibold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
          👥 Gestão de Administradores
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

        {/* Create Admin Section */}
        <div className="mb-8 bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-3">
              ➕ Novo Administrador
            </h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-[#667eea]/30 hover:translate-y-[-1px] transition-all"
            >
              {showCreateForm ? '✕ Fechar' : '+ Criar Admin'}
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nome</label>
                <input
                  type="text"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  placeholder="Nome completo"
                  className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#667eea] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Usuário</label>
                <input
                  type="text"
                  value={newAdmin.username}
                  onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                  placeholder="Nome de usuário"
                  className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#667eea] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Senha</label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#667eea] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Confirmar Senha</label>
                <input
                  type="password"
                  value={newAdmin.confirmPassword}
                  onChange={(e) => setNewAdmin({ ...newAdmin, confirmPassword: e.target.value })}
                  placeholder="Digite a senha novamente"
                  className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#667eea] transition-colors"
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full px-4 py-3 bg-gradient-to-r from-[#2ecc71] to-[#27ae60] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-green-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? '⏳ Criando...' : '✓ Criar Administrador'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Admins Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-semibold">📋 Administradores Cadastrados</h2>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center p-16">
              <div className="w-10 h-10 border-4 border-[#667eea]/20 border-t-[#667eea] rounded-full animate-spin"></div>
              <span className="ml-4 text-gray-400">Carregando administradores...</span>
            </div>
          ) : admins.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-gray-400">
              <span className="text-5xl mb-4">👤</span>
              <p>Nenhum administrador cadastrado</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-gray-500 font-medium">
                    Nome
                  </th>
                  <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-gray-500 font-medium">
                    Usuário
                  </th>
                  <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-gray-500 font-medium">
                    Último Login
                  </th>
                  <th className="text-center px-6 py-4 text-xs uppercase tracking-wider text-gray-500 font-medium w-48">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-full bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 flex items-center justify-center text-lg">
                          👤
                        </span>
                        <span className="font-medium">{admin.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      @{admin.username}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {formatDate(admin.lastLogin)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setResetModalAdmin(admin)}
                          className="px-3 py-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-lg text-sm font-medium hover:bg-yellow-500/20 transition-all"
                        >
                          🔑 Senha
                        </button>
                        <button
                          onClick={() => setDeleteModalAdmin(admin)}
                          className="px-3 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-all"
                        >
                          🗑️ Deletar
                        </button>
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
            💡 Sobre os Administradores
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Administradores têm acesso total ao sistema, incluindo gestão de técnicos, importação de dados, 
            configuração de pagamentos e todos os relatórios. Crie novos admins apenas para pessoas de confiança.
            Você não pode deletar seu próprio usuário ou o último administrador do sistema.
          </p>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModalAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4 text-red-400">⚠️ Confirmar Exclusão</h3>
            <p className="text-gray-400 mb-6">
              Tem certeza que deseja remover o administrador <strong className="text-white">{deleteModalAdmin.name}</strong>?
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalAdmin(null)}
                className="flex-1 px-4 py-3 bg-white/10 text-gray-300 rounded-xl font-medium hover:bg-white/20 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {deleting ? '⏳ Removendo...' : '🗑️ Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4 text-yellow-400">🔑 Resetar Senha</h3>
            <p className="text-gray-400 mb-4">
              Nova senha para <strong className="text-white">{resetModalAdmin.name}</strong>
            </p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nova Senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#667eea] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Confirmar Nova Senha</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Digite a senha novamente"
                  className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#667eea] transition-colors"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setResetModalAdmin(null);
                  setNewPassword('');
                  setConfirmNewPassword('');
                }}
                className="flex-1 px-4 py-3 bg-white/10 text-gray-300 rounded-xl font-medium hover:bg-white/20 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resetting}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#667eea]/30 transition-all disabled:opacity-50"
              >
                {resetting ? '⏳ Salvando...' : '✓ Salvar Nova Senha'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UsuariosAdminPage() {
  return (
    <AdminAuthGuard>
      <UsuariosAdminPageContent />
    </AdminAuthGuard>
  );
}
