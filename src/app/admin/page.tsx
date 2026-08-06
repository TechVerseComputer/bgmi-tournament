'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Registration {
  id: string;
  squad_name: string;
  igl_email: string;
  player_1_id: string;
  player_2_id: string;
  player_3_id: string;
  player_4_id: string;
  utr_number: string;
  payment_status: string;
  slot_number: number | null;
  created_at: string;
}

export default function AdminDashboard() {
  const supabase = createClient();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRegistrations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRegistrations(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleVerify = async (id: string) => {
    setActionLoading(id);

    // Automatically calculate the next available slot number
    const verifiedRegistrations = registrations.filter(
      (r) => r.payment_status === 'Verified' && r.slot_number !== null
    );
    const assignedSlots = verifiedRegistrations.map((r) => r.slot_number as number);
    
    let nextSlot = 1;
    while (assignedSlots.includes(nextSlot)) {
      nextSlot++;
    }

    const { error } = await supabase
      .from('registrations')
      .update({ payment_status: 'Verified', slot_number: nextSlot })
      .eq('id', id);

    if (!error) {
      fetchRegistrations();
    } else {
      alert(`Failed to verify: ${error.message}`);
    }
    setActionLoading(null);
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    const { error } = await supabase
      .from('registrations')
      .update({ payment_status: 'Rejected', slot_number: null })
      .eq('id', id);

    if (!error) {
      fetchRegistrations();
    } else {
      alert(`Failed to reject: ${error.message}`);
    }
    setActionLoading(null);
  };

  const verifiedCount = registrations.filter((r) => r.payment_status === 'Verified').length;
  const pendingCount = registrations.filter((r) => r.payment_status === 'Pending').length;
  const totalRevenue = verifiedCount * 100;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Admin Management Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Verify incoming UTR payments and assign match slots</p>
          </div>
          <button
            onClick={fetchRegistrations}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm px-4 py-2 rounded-lg border border-slate-700 transition-all"
          >
            🔄 Refresh List
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <p className="text-xs text-slate-400 font-medium">Pending Approvals</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{pendingCount} Squads</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <p className="text-xs text-slate-400 font-medium">Verified Registrations</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{verifiedCount} / 25 Slots</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <p className="text-xs text-slate-400 font-medium">Collected Revenue</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">₹{totalRevenue}</p>
          </div>
        </div>

        {/* Registrations List */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading registrations...</div>
        ) : registrations.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-8 text-center rounded-xl text-slate-400">
            No registrations found yet.
          </div>
        ) : (
          <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-xs border-b border-slate-800">
                <tr>
                  <th className="p-4">Squad Name / IGL</th>
                  <th className="p-4">Player IDs</th>
                  <th className="p-4">UTR Number</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Slot</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-800/30">
                    <td className="p-4">
                      <div className="font-bold text-white">{reg.squad_name}</div>
                      <div className="text-xs text-slate-400">{reg.igl_email}</div>
                    </td>
                    <td className="p-4 text-xs space-y-0.5">
                      <div>P1: <span className="font-mono text-slate-200">{reg.player_1_id}</span></div>
                      <div>P2: <span className="font-mono text-slate-200">{reg.player_2_id}</span></div>
                      <div>P3: <span className="font-mono text-slate-200">{reg.player_3_id}</span></div>
                      <div>P4: <span className="font-mono text-slate-200">{reg.player_4_id}</span></div>
                    </td>
                    <td className="p-4 font-mono font-bold text-emerald-400 select-all">
                      {reg.utr_number}
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          reg.payment_status === 'Verified'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : reg.payment_status === 'Rejected'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {reg.payment_status}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-white">
                      {reg.slot_number ? `#${reg.slot_number}` : '-'}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {reg.payment_status !== 'Verified' && (
                        <button
                          disabled={actionLoading === reg.id}
                          onClick={() => handleVerify(reg.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded disabled:opacity-50"
                        >
                          Verify & Assign Slot
                        </button>
                      )}
                      {reg.payment_status !== 'Rejected' && (
                        <button
                          disabled={actionLoading === reg.id}
                          onClick={() => handleReject(reg.id)}
                          className="bg-slate-800 hover:bg-red-900/50 text-red-400 text-xs font-semibold px-3 py-1.5 rounded border border-slate-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}