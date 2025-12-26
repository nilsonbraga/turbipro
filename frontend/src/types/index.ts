export interface Agency {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  logo?: string;
  createdAt: Date;
  isActive: boolean;
}

export interface Client {
  id: string;
  agencyId: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  birthDate?: Date;
  address?: string;
  notes?: string;
  createdAt: Date;
}

export interface Partner {
  id: string;
  agencyId: string;
  name: string;
  type: 'airline' | 'hotel' | 'car_rental' | 'tour_operator' | 'other';
  email: string;
  phone: string;
  commissionRate: number;
  createdAt: Date;
}

export interface Tag {
  id: string;
  agencyId: string;
  name: string;
  color: string;
}

export interface PipelineStage {
  id: string;
  agencyId: string;
  name: string;
  order: number;
  color: string;
}

export interface Service {
  id: string;
  proposalId: string;
  type: 'flight' | 'hotel' | 'car' | 'package' | 'tour';
  description: string;
  supplier: string;
  startDate: Date;
  endDate: Date;
  price: number;
  cost: number;
  details?: Record<string, any>;
}

export interface Proposal {
  id: string;
  agencyId: string;
  clientId: string;
  client?: Client;
  title: string;
  description?: string;
  stageId: string;
  stage?: PipelineStage;
  value: number;
  discount: number;
  commissionType: 'percentage' | 'fixed';
  commissionValue: number;
  services: Service[];
  tags: Tag[];
  assignedTo?: string;
  expectedCloseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  images?: string[];
}

export interface ProposalLog {
  id: string;
  proposalId: string;
  userId: string;
  userName: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'agency_owner' | 'agent';
  agencyId?: string;
  avatar?: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalProfit: number;
  totalProposals: number;
  conversionRate: number;
  revenueByMonth: { month: string; revenue: number; profit: number }[];
  proposalsByStage: { stage: string; count: number; value: number }[];
  topClients: { name: string; revenue: number }[];
  topPartners: { name: string; revenue: number }[];
}
