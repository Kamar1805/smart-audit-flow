import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Phone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { updateUserProfile } from '@/lib/repositories/users';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function SettingsView() {
  const { profile } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [staffId, setStaffId] = useState(profile?.staffId || '');
  const [email] = useState(profile?.email || '');
  const [department, setDepartment] = useState(profile?.department || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const canSave = !!profile?.uid && (name.trim().length > 0 || department.trim().length > 0 || staffId.trim().length > 0 || phone.trim().length > 0);

  const handleSave = async () => {
    if (!profile?.uid) return;
    setSaving(true);
    setSaved(false);
    try {
      await updateUserProfile(profile.uid, { name, staffId, department, phone });
      setSaved(true);
    } catch (e) {
      console.error(e);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-2xl font-semibold text-gray-900">Account Settings</h2>
          <span className="h-1 w-16 rounded bg-gradient-to-r from-red-600/60 to-red-600/10 animate-pulse" />
        </div>
        <p className="font-body text-sm text-gray-500 mt-1">
          Update your profile information used across the system.
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 p-5 border-b border-gray-100 bg-gray-50">
          <User className="h-5 w-5 text-[#fe0000]" />
          <h3 className="font-display font-semibold text-gray-900">Profile</h3>
        </div>
        <div className="p-5 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Staff ID</label>
            <Input value={staffId} disabled className="mt-1 bg-gray-50" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Email</label>
            <Input value={email} disabled className="mt-1 bg-gray-50" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Department</label>
            <Input value={department} disabled className="mt-1 bg-gray-50" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2">Phone Number <Phone className="h-3 w-3 text-gray-400" /></label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter number with country code, e.g., 234XXXXXXXXXX" className="mt-1" />
            <p className="text-xs text-gray-500 mt-1">Used for WhatsApp sharing in requester memos.</p>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50">
          <Button variant="outline" className="border-gray-200" onClick={() => { setName(profile?.name || ''); setStaffId(profile?.staffId || ''); setDepartment(profile?.department || ''); setPhone(profile?.phone || ''); }}>Reset</Button>
          <Button onClick={handleSave} disabled={!canSave || saving} className="bg-[#fe0000] hover:bg-[#d50000] text-white">
            {saving ? 'Saving...' : (saved ? 'Saved' : 'Save Changes')}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
