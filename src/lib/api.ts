////const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';
//const API_URL = 'https://pontuacao.h42on5.easypanel.host/';
const API_URL = 'http://51.222.140.204:8086';

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

// Technician Management API
export interface Technician {
  id: string;
  name: string;
  createdAt: string;
  hasCredentials: boolean;
  username: string | null;
  lastLogin: string | null;
}

export interface Credentials {
  username: string;
  password: string;
  message: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    username: string;
  };
}

export interface PerformanceData {
  cycleStart: string;
  cycleEnd: string;
  totalServices: number;
  totalPoints: number;
  payment: number;
  byServiceType: Record<string, { count: number; points: number; total: number }>;
  services: { id: number; type: string; points: number; performedAt: string }[];
  config: {
    minPoints: number;
    basePayment: number;
    pointRate: number;
  };
}

export async function getTechnicians(): Promise<Technician[]> {
  const res = await fetch(`${API_URL}/api/technicians`);
  if (!res.ok) throw new Error('Erro ao carregar técnicos');
  return res.json();
}

export async function generateCredentials(userId: string): Promise<Credentials> {
  const res = await fetch(`${API_URL}/api/technicians/${userId}/generate-credentials`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Erro ao gerar credenciais');
  return res.json();
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro ao fazer login');
  }
  return res.json();
}

export async function getTechnicianPerformance(token: string): Promise<PerformanceData> {
  const res = await fetch(`${API_URL}/api/technician/performance`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro ao carregar desempenho');
  }
  return res.json();
}

export async function getTechnicianMe(token: string): Promise<{ id: string; name: string; username: string }> {
  const res = await fetch(`${API_URL}/api/technician/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Erro ao carregar dados do técnico');
  return res.json();
}

// Admin Authentication API
export async function adminLogin(username: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro ao fazer login');
  }
  return res.json();
}

export async function getAdminMe(token: string): Promise<{ id: string; name: string; username: string }> {
  const res = await fetch(`${API_URL}/api/admin/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Erro ao carregar dados do admin');
  return res.json();
}

export async function verifyAdminToken(token: string): Promise<{ valid: boolean; user: { id: string; name: string } }> {
  const res = await fetch(`${API_URL}/api/admin/verify`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) return { valid: false, user: { id: '', name: '' } };
  return res.json();
}

// Technician Report API
export interface ServiceTypeReport {
  name: string;
  count: number;
  pointsEach: number;
  totalPoints: number;
}

export interface TechnicianReport {
  technician: { id: string; name: string };
  startDate: string | null;
  endDate: string | null;
  totalPoints: number;
  totalServices: number;
  byServiceType: ServiceTypeReport[];
}

export async function getTechnicianReport(userId: string, startDate?: string, endDate?: string): Promise<TechnicianReport> {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const res = await fetch(`${API_URL}/api/technician-report/${userId}?${params}`);
  if (!res.ok) throw new Error('Erro ao carregar relatório do técnico');
  return res.json();
}

// Annual Summary API
export interface MonthSummary {
  month: number;
  monthName: string;
  period: string;
  cycleStart: string;
  cycleEnd: string;
  totalServices: number;
  totalPoints: number;
  qualifiedTechnicians: number;
  totalTechnicians: number;
  totalPayment: number;
}

export interface AnnualSummary {
  year: number;
  config: {
    minPoints: number;
    basePayment: number;
    pointRate: number;
    cycleStartDay: number;
    cycleEndDay: number;
  };
  months: MonthSummary[];
  totals: {
    totalPayment: number;
    totalServices: number;
    totalPoints: number;
    qualifiedTechnicians: number;
  };
}

export async function getAnnualSummary(year: number): Promise<AnnualSummary> {
  const res = await fetch(`${API_URL}/api/annual-summary?year=${year}`);
  if (!res.ok) throw new Error('Erro ao carregar resumo anual');
  return res.json();
}

// Technicians Annual Payments API (12 month columns)
export interface TechnicianAnnualPayment {
  id: string;
  name: string;
  monthlyPayments: number[];  // Array de 12 valores
  monthlyPoints: number[];    // Array de 12 valores de pontos
  yearTotal: number;
}

export interface TechniciansAnnualResponse {
  year: number;
  config: {
    minPoints: number;
    basePayment: number;
    pointRate: number;
    cycleStartDay: number;
    cycleEndDay: number;
  };
  technicians: TechnicianAnnualPayment[];
  monthlyTotals: number[];
  monthlyQualified: number[];
  monthNames: string[];
  grandTotal: number;
}

export async function getTechniciansAnnualPayments(year: number): Promise<TechniciansAnnualResponse> {
  const res = await fetch(`${API_URL}/api/technicians-annual-payments?year=${year}`);
  if (!res.ok) throw new Error('Erro ao carregar pagamentos anuais por técnico');
  return res.json();
}
