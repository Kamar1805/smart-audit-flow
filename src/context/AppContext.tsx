import React, { createContext, useContext, useState, ReactNode } from 'react';

export type RequestStatus = 
  | 'DRAFT' 
  | 'PENDING_PROCUREMENT' 
  | 'PENDING_AUDIT' 
  | 'PENDING_FINANCE' 
  | 'PAID' 
  | 'REJECTED';

export type UserRole = 'requester' | 'procurement' | 'audit' | 'finance';

export interface ProcurementRequest {
  id: string;
  title: string;
  description: string;
  quantity: number;
  model?: string;
  price: number;
  status: RequestStatus;
  requester: string;
  department: string;
  createdAt: Date;
  memo?: string;
  memoFile?: string;
  complianceScore?: number;
  priceVerified?: boolean;
  rejectionReason?: string;
  paymentReceipt?: string;
  aiAnalysis?: {
    budgetCode: string;
    vendorStatus: string;
    riskLevel: string;
  };
}

interface AppContextType {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  requests: ProcurementRequest[];
  addRequest: (request: Omit<ProcurementRequest, 'id' | 'createdAt'>) => void;
  updateRequest: (id: string, updates: Partial<ProcurementRequest>) => void;
  getRequestsByStatus: (status: RequestStatus) => ProcurementRequest[];
  getMyRequests: () => ProcurementRequest[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialRequests: ProcurementRequest[] = [
  {
    id: '1',
    title: 'MacBook Pro 16"',
    description: 'High-performance laptop for development team',
    quantity: 1,
    model: 'MacBook Pro 16" M3 Max',
    price: 2500,
    status: 'PENDING_PROCUREMENT',
    requester: 'John Smith',
    department: 'Engineering',
    createdAt: new Date('2024-01-15'),
    memo: 'This MacBook Pro is required for our senior developer to handle complex computational tasks and machine learning model training. The current equipment is outdated and significantly impacts productivity.',
    priceVerified: false,
  },
  {
    id: '2',
    title: 'Ergonomic Office Chairs',
    description: 'Premium ergonomic chairs for the design team',
    quantity: 10,
    model: 'Herman Miller Aeron',
    price: 800,
    status: 'PENDING_AUDIT',
    requester: 'Sarah Johnson',
    department: 'Design',
    createdAt: new Date('2024-01-14'),
    memo: 'Ergonomic chairs are essential for maintaining employee health and productivity. The current chairs have exceeded their lifespan and are causing back pain complaints.',
    priceVerified: true,
    complianceScore: 92,
    aiAnalysis: {
      budgetCode: 'Valid - OPEX-2024-FURN',
      vendorStatus: 'Verified Supplier',
      riskLevel: 'Low',
    },
  },
  {
    id: '3',
    title: 'Team Lunch Event',
    description: 'Quarterly team building lunch for marketing department',
    quantity: 25,
    price: 150,
    status: 'PENDING_FINANCE',
    requester: 'Mike Chen',
    department: 'Marketing',
    createdAt: new Date('2024-01-13'),
    memo: 'Quarterly team building activity to boost morale and foster collaboration among team members.',
    priceVerified: true,
    complianceScore: 88,
    aiAnalysis: {
      budgetCode: 'Valid - OPEX-2024-TEAM',
      vendorStatus: 'Verified Caterer',
      riskLevel: 'Low',
    },
  },
];

interface AppProviderProps {
  children: ReactNode;
  initialRole?: UserRole;
}

export function AppProvider({ children, initialRole = 'requester' }: AppProviderProps) {
  const [currentRole, setCurrentRole] = useState<UserRole>(initialRole);
  const [requests, setRequests] = useState<ProcurementRequest[]>(initialRequests);

  const addRequest = (request: Omit<ProcurementRequest, 'id' | 'createdAt'>) => {
    const newRequest: ProcurementRequest = {
      ...request,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setRequests(prev => [newRequest, ...prev]);
  };

  const updateRequest = (id: string, updates: Partial<ProcurementRequest>) => {
    setRequests(prev =>
      prev.map(req => (req.id === id ? { ...req, ...updates } : req))
    );
  };

  const getRequestsByStatus = (status: RequestStatus) => {
    return requests.filter(req => req.status === status);
  };

  const getMyRequests = () => {
    return requests;
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        requests,
        addRequest,
        updateRequest,
        getRequestsByStatus,
        getMyRequests,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
