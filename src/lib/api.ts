//const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';
const API_URL = 'https://pontuacao.h42on5.easypanel.host/';


export interface User {
  id: string;
  name: string;
  createdAt: string;
}

export interface ServiceType {
  id: number;
  name: string;
  points: number;
}

export interface Service {
  id: number;
  performedAt: string;
  userId: string;
  user: User;
  serviceTypeId: number;
  serviceType: ServiceType;
  importId: string | null;
}

export interface ImportHistory {
  id: string;
  filename: string;
  createdAt: string;
  status: string;
  rowCount: number;
}

export interface AdminData {
  users: (User & { services: (Service & { serviceType: ServiceType })[] })[];
  history: ImportHistory[];
}

export interface DashboardData {
  users: User[];
  types: ServiceType[];
}

export interface DashboardServicesData {
  services: Service[];
  count: number;
}

export interface ScoreData {
  user: User;
  totalScore: number;
  detail: Record<string, { count: number; points: number }>;
}

// Admin API
export async function getAdminData(): Promise<AdminData> {
  const res = await fetch(`${API_URL}/api/admin`);
  if (!res.ok) throw new Error('Erro ao carregar dados do admin');
  return res.json();
}

// Dashboard API
export async function getDashboardFilters(): Promise<DashboardData> {
  const res = await fetch(`${API_URL}/api/dashboard`);
  if (!res.ok) throw new Error('Erro ao carregar filtros do dashboard');
  return res.json();
}

export async function getDashboardData(startDate?: string, endDate?: string): Promise<DashboardServicesData> {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const res = await fetch(`${API_URL}/api/dashboard-data?${params}`);
  if (!res.ok) throw new Error('Erro ao carregar dados do dashboard');
  return res.json();
}

// Score API
export async function getScoreData(userId: string): Promise<ScoreData> {
  const res = await fetch(`${API_URL}/api/score/${userId}`);
  if (!res.ok) throw new Error('Erro ao carregar pontuação');
  return res.json();
}

// Cleanup API
export async function runCleanup(): Promise<{ message: string; count: number }> {
  const res = await fetch(`${API_URL}/api/cleanup`, { method: 'POST' });
  if (!res.ok) throw new Error('Erro ao limpar dados');
  return res.json();
}

// Revert Import API
export async function revertImport(importId: string): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/api/revert/${importId}`, { method: 'POST' });
  if (!res.ok) throw new Error('Erro ao reverter importação');
  return res.json();
}

// Import API URL (for streaming)
export function getImportUrl(): string {
  return `${API_URL}/api/import`;
}

// Import History API
export async function getImportHistory(): Promise<ImportHistory[]> {
  const res = await fetch(`${API_URL}/api/import-history`);
  if (!res.ok) throw new Error('Erro ao carregar histórico de importações');
  return res.json();
}

// Service Types API
export async function getServiceTypes(): Promise<ServiceType[]> {
  const res = await fetch(`${API_URL}/api/service-types`);
  if (!res.ok) throw new Error('Erro ao carregar tipos de serviço');
  return res.json();
}

export async function updateServiceTypePoints(id: number, points: number): Promise<ServiceType> {
  const res = await fetch(`${API_URL}/api/service-types/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points })
  });
  if (!res.ok) throw new Error('Erro ao atualizar pontuação');
  return res.json();
}

// Payment Config API
export interface PaymentConfig {
  id: number;
  minPoints: number;
  basePayment: number;
  pointRate: number;
  cycleStartDay: number;
  cycleEndDay: number;
  updatedAt: string;
}

export async function getPaymentConfig(): Promise<PaymentConfig> {
  const res = await fetch(`${API_URL}/api/payment-config`);
  if (!res.ok) throw new Error('Erro ao carregar configuração de pagamento');
  return res.json();
}

export async function updatePaymentConfig(config: Partial<Omit<PaymentConfig, 'id' | 'updatedAt'>>): Promise<PaymentConfig> {
  const res = await fetch(`${API_URL}/api/payment-config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) throw new Error('Erro ao atualizar configuração de pagamento');
  return res.json();
}

