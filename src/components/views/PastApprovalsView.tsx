import { CheckCircle2, Search, FileText, Download } from 'lucide-react';
import { useFinanceMemos } from '@/pages/FinancePage';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export function PastApprovalsView() {
  const { memos } = useFinanceMemos();
  const [search, setSearch] = useState('');

  // Filter only PAID/COMPLETED
  const history = memos.filter(m => 
    (m.status === 'paid' || m.status === 'completed') &&
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-4xl font-display font-bold text-gray-900">Past Approvals</h1>
           <p className="text-gray-500 mt-2">Archive of all processed payments.</p>
        </div>
        <div className="relative w-72">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
           <Input 
             placeholder="Search archive..." 
             value={search}
             onChange={e => setSearch(e.target.value)}
             className="pl-9 bg-white" 
           />
        </div>
      </div>

      <div className="space-y-4">
        {history.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed">
                <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400">No past approvals found.</p>
            </div>
        ) : (
            history.map(item => (
                <div key={item.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-gray-900">{item.title}</h4>
                            <div className="text-sm text-gray-500 flex gap-4">
                                <span>{item.department || 'General'}</span>
                                <span>•</span>
                                <span>₦{(item.amount || 0).toLocaleString()}</span>
                                <span>•</span>
                                <span>Paid on {item.paymentDate ? new Date(item.paymentDate).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200 px-3 py-1">PAID</Badge>
                        {item.receiptUrl && (
                            <a href={item.receiptUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#fe0000] transition-colors">
                                <Download className="h-5 w-5" />
                            </a>
                        )}
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
}