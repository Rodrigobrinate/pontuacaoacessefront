'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { verifyAdminToken } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface AdminAuthGuardProps {
  children: ReactNode;
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        router.push('/admin-login');
        return;
      }

      try {
        const result = await verifyAdminToken(token);
        if (result.valid) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          router.push('/admin-login');
        }
      } catch {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        router.push('/admin-login');
      }
    }

    checkAuth();
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto" />
          <p className="text-slate-400 mt-4">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
