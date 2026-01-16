'use client';

import Link from 'next/link';
import { LayoutDashboard, ShieldCheck, ArrowRight, Users, UserCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side - Gradient Header */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-900 p-12 text-white flex flex-col justify-center">
          <h1 className="text-4xl font-bold mb-4">Bem-vindo ao Sistema</h1>
          <p className="text-blue-100 text-lg mb-8">
            Selecione o seu perfil de acesso para continuar. Gerencie seus dados ou administre a plataforma.
          </p>
          <div className="text-sm text-blue-200 font-medium">
            &copy; {new Date().getFullYear()} Sua Empresa Ltda.
          </div>
        </div>

        {/* Right Side - Navigation Cards */}
        <div className="w-full md:w-1/2 p-12 flex flex-col justify-center gap-4">
          
          <h2 className="text-2xl font-semibold text-slate-800 mb-2">Escolha o acesso</h2>

          {/* Dashboard Button */}
          <Link href="/dashboard" className="group">
            <div className="flex items-center justify-between p-5 border-2 border-slate-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 cursor-pointer w-full">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <LayoutDashboard size={24} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-700">Dashboard</h3>
                  <p className="text-xs text-slate-500">Acesso operacional e métricas</p>
                </div>
              </div>
              <ArrowRight className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" size={20} />
            </div>
          </Link>

          {/* Admin Button */}
          <Link href="/admin" className="group">
            <div className="flex items-center justify-between p-5 border-2 border-slate-100 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all duration-300 cursor-pointer w-full">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <ShieldCheck size={24} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-700">Administrador</h3>
                  <p className="text-xs text-slate-500">Configurações e gestão</p>
                </div>
              </div>
              <ArrowRight className="text-slate-300 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" size={20} />
            </div>
          </Link>

          {/* Technicians Management Button */}
          <Link href="/tecnicos" className="group">
            <div className="flex items-center justify-between p-5 border-2 border-slate-100 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-300 cursor-pointer w-full">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 text-green-600 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <Users size={24} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-700">Gestão de Técnicos</h3>
                  <p className="text-xs text-slate-500">Credenciais e acessos</p>
                </div>
              </div>
              <ArrowRight className="text-slate-300 group-hover:text-green-600 group-hover:translate-x-1 transition-all" size={20} />
            </div>
          </Link>

          {/* Technician Login Button */}
          <Link href="/login" className="group">
            <div className="flex items-center justify-between p-5 border-2 border-slate-100 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all duration-300 cursor-pointer w-full">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <UserCircle size={24} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-700">Área do Técnico</h3>
                  <p className="text-xs text-slate-500">Visualize seu desempenho</p>
                </div>
              </div>
              <ArrowRight className="text-slate-300 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" size={20} />
            </div>
          </Link>

          {/* Admin Login Link */}
          <div className="text-center pt-4 border-t border-slate-100">
            <Link 
              href="/admin-login" 
              className="text-sm text-slate-500 hover:text-purple-600 transition-colors"
            >
              🔐 Acesso Administrativo
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
