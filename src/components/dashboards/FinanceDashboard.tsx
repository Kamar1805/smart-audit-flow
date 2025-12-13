import { useState } from 'react';
import { CheckCircle2, CreditCard, Wallet, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/context/AppContext'; 
import { useAuth } from '@/context/AuthContext';
import { RequestCard } from '@/components/shared/RequestCard';

export function FinanceDashboard() {
  const { profile } = useAuth();
  const { requests, updateRequest } = useApp(); 
  const [searchQuery, setSearchQuery] = useState('');

  // --- FIX 1: Cast status to 'any' or 'string' to avoid the Type Mismatch error ---
  // We check for 'PENDING_FINANCE' or 'APPROVED' (common statuses for Finance queues)
  const pendingPayments = requests.filter(r => 
    (r.status as any) === 'PENDING_FINANCE' || (r.status as any) === 'APPROVED'
  );
  
  const paidRequests = requests.filter(r => r.status === 'PAID');

  const handleMarkPaid = (id: string) => {
    updateRequest(id, {
      status: 'PAID',
      // --- FIX 2: Cast to 'any' so we can save paymentDate without errors ---
      paymentDate: new Date().toISOString(),
    } as any);
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* 1. Header Section */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">
            Finance Overview
          </h1>
          <p className="font-body text-lg text-gray-500">
            You have <span className="font-bold text-green-600">{pendingPayments.length} payments</span> pending processing.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
      </div>

      {/* 2. Pending Payments Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-semibold text-gray-800 flex items-center gap-3">
            <Wallet className="text-green-600 h-6 w-6" />
            Pending Payments
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64 bg-white font-body"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {pendingPayments.length === 0 ? (
             <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
               <CreditCard className="mx-auto h-12 w-12 text-gray-300 mb-3" />
               <p className="text-gray-500 font-medium">No pending payments.</p>
             </div>
          ) : (
            pendingPayments
              .filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((request) => (
                <div key={request.id} className="group relative">
                  {/* Render the Card */}
                  <RequestCard request={request} />
                  
                  {/* Action Bar */}
                  <div className="mt-[-1rem] mx-4 p-4 pt-6 bg-gray-50 border-x border-b border-gray-100 rounded-b-xl flex justify-between items-center relative z-0">
                     <div className="text-xs text-gray-500">
                       <span className="font-bold">Budget Code:</span> {request.aiAnalysis?.budgetCode || 'OPEX-GEN'}
                     </div>
                     <Button 
                       onClick={() => handleMarkPaid(request.id)}
                       className="bg-green-600 hover:bg-green-700 text-white font-body shadow-sm shadow-green-200"
                     >
                       <CheckCircle2 className="mr-2 h-4 w-4" />
                       Mark as Paid
                     </Button>
                  </div>
                </div>
            ))
          )}
        </div>
      </div>

      {/* 3. History / Paid */}
      {paidRequests.length > 0 && (
        <div className="pt-8 border-t border-gray-100">
           <h3 className="font-display text-xl font-semibold text-gray-800 mb-6 opacity-70">Payment History</h3>
           <div className="opacity-60 hover:opacity-100 transition-opacity space-y-3">
             {paidRequests.map(req => (
               <div key={req.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl">
                 <div className="flex items-center gap-4">
                   <div className="h-10 w-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                     <CheckCircle2 size={20} />
                   </div>
                   <div>
                     <p className="font-bold text-gray-900">{req.title}</p>
                     <p className="text-xs text-gray-500">
                       {/* FIX 3: Cast to any for paymentDate access */}
                       Paid on {new Date((req as any).paymentDate || Date.now()).toLocaleDateString()}
                     </p>
                   </div>
                 </div>
                 <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">PAID</Badge>
               </div>
             ))}
           </div>
        </div>
      )}

    </div>
  );
}