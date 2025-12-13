import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { logout, profile } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-gray-100">
        <div className="bg-red-100 p-4 rounded-full inline-flex mb-6">
          <ShieldAlert className="w-12 h-12 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2 font-playfair">Access Denied</h1>
        <p className="text-gray-500 mb-6">
          You do not have permission to view this page.
        </p>

        {/* --- DEBUG BOX: THIS WILL SHOW US THE PROBLEM --- */}
        <div className="bg-gray-100 p-4 rounded-lg text-left text-xs font-mono mb-6 text-gray-700">
          <p className="font-bold text-gray-900 mb-2">DEBUG INFO:</p>
          <p>Logged in as: <span className="text-blue-600">{profile?.email || 'Unknown'}</span></p>
          <p>Current Role: <span className="text-red-600 font-bold uppercase">{profile?.role || 'NONE'}</span></p>
        </div>
        {/* ----------------------------------------------- */}

        <div className="space-y-3">
          <Button 
            onClick={handleLogout} 
            className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Sign Out & Create New Account
          </Button>
        </div>
      </div>
    </div>
  );
}