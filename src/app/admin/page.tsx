'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { ShieldAlert, Trophy, Plus, Wallet } from 'lucide-react';

export default function AdminHub() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [tournaments, setTournaments] = useState<any[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Tournament Form State
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    map_img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop',
    type: 'SQUAD',
    perspective: 'TPP',
    fee: 100,
    total_slots: 25,
    first_prize: 1500,
    second_prize: 800,
    match_time: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkAdminAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: adminData } = await supabase.from('admins').select('*').eq('email', session.user.email).single();
        if (adminData) {
          setIsAuthorized(true);
          fetchAdminData();
        }
      }
      setAuthLoading(false);
    };
    checkAdminAuth();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    const [tourneyRes, depositRes] = await Promise.all([
      supabase.from('tournaments').select('*').order('created_at', { ascending: false }),
      supabase.from('transactions').select('*').eq('type', 'DEPOSIT').eq('status', 'PENDING').order('created_at', { ascending: false })
    ]);

    if (tourneyRes.data) setTournaments(tourneyRes.data);
    if (depositRes.data) setPendingDeposits(depositRes.data);
    setLoading(false);
  };

  // --- SECURE DEPOSIT APPROVAL (Admin only) ---
  const handleApproveDeposit = async (txId: string, targetUserId: string, amount: number) => {
    if (!confirm(`Verify and approve deposit of ₹${amount}?`)) return;

    try {
      // 1. Fetch user wallet securely
      const { data: wallet, error: walletErr } = await supabase.from('wallets').select('*').eq('user_id', targetUserId).single();
      if (walletErr || !wallet) throw new Error("User wallet not found.");

      const newBalance = Number(wallet.balance) + Number(amount);

      // 2. Update wallet balance safely
      const { error: updateWalletErr } = await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', targetUserId);
      if (updateWalletErr) throw updateWalletErr;

      // 3. Mark transaction as SUCCESS
      const { error: updateTxErr } = await supabase.from('transactions').update({ status: 'SUCCESS' }).eq('id', txId);
      if (updateTxErr) throw updateTxErr;

      alert(`Successfully approved ₹${amount} and credited player wallet!`);
      fetchAdminData();
    } catch (err: any) {
      alert("Error approving deposit: " + err.message);
    }
  };

  const handleRejectDeposit = async (txId: string) => {
    if (!confirm("Reject this deposit request? It will be marked as FAILED.")) return;
    try {
      await supabase.from('transactions').update({ status: 'FAILED', description: 'Deposit Rejected by Admin (Invalid UTR)' }).eq('id', txId);
      fetchAdminData();
    } catch (err: any) {
      alert("Error rejecting deposit: " + err.message);
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('tournaments').insert([form]);
      if (error) throw error;
      alert("Tournament created successfully!");
      setShowModal(false);
      fetchAdminData();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-[#050505] text-orange-500 font-black flex items-center justify-center animate-pulse">Verifying Admin Access...</div>;
  if (!isAuthorized) return (
    <main className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 text-center text-white">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-3xl font-black uppercase">Access Denied</h1>
      <p className="text-zinc-400 text-xs mt-2">Your account ({user?.email}) is not authorized as an admin.</p>
      <button onClick={() => router.push('/')} className="mt-6 bg-orange-500 text-black font-black px-6 py-3 rounded uppercase text-xs">Return Home</button>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-black italic tracking-wider text-orange-500 uppercase">Admin Control Hub</h1>
            <p className="text-zinc-400 text-sm mt-1 font-bold">Manage tournaments, review UTR deposits, and oversee platform operations.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-orange-500 hover:bg-orange-400 text-black font-black px-6 py-3 rounded-xl uppercase text-xs tracking-wider flex items-center gap-2 transition-all">
            <Plus className="w-4 h-4"/> Create New Tournament
          </button>
        </div>

        {/* --- PENDING UPI DEPOSITS VERIFICATION SECTION --- */}
        <div className="bg-zinc-900 border border-orange-500/30 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
            <h2 className="text-lg font-black uppercase tracking-wider flex items-center gap-2 text-orange-500">
              <Wallet className="w-5 h-5"/> Pending UTR Deposit Approvals ({pendingDeposits.length})
            </h2>
          </div>

          {pendingDeposits.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs font-bold uppercase">No pending deposit requests to verify.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950 text-zinc-400 uppercase font-black border-b border-zinc-800">
                  <tr>
                    <th className="p-4">Transaction Details</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Description / UTR</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {pendingDeposits.map((tx) => (
                    <tr key={tx.id} className="hover:bg-zinc-800/40">
                      <td className="p-4 font-mono text-zinc-400 text-[10px] break-all">{tx.user_id}</td>
                      <td className="p-4 font-black text-emerald-400 text-sm">₹{tx.amount}</td>
                      <td className="p-4 font-mono text-white font-bold">{tx.description}</td>
                      <td className="p-4 text-zinc-500 font-mono">{new Date(tx.created_at).toLocaleString()}</td>
                      <td className="p-4 text-right space-x-2 whitespace-nowrap">
                        <button 
                          onClick={() => handleRejectDeposit(tx.id)}
                          className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 font-black uppercase tracking-wider px-3 py-2 rounded-lg text-xs transition-all"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => handleApproveDeposit(tx.id, tx.user_id, tx.amount)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider px-4 py-2 rounded-lg text-xs transition-all shadow-md"
                        >
                          Approve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Existing Tournaments List */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-lg font-black uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-5 h-5 text-orange-500"/> Scheduled Tournaments
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-orange-500 font-bold uppercase animate-pulse">Loading Tournaments...</div>
          ) : tournaments.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 font-bold uppercase">No tournaments created yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {tournaments.map((t) => (
                <div key={t.id} className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex flex-col justify-between">
                  <div className="h-32 relative">
                    <img src={t.map_img} alt={t.name} className="w-full h-full object-cover filter brightness-75"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent"/>
                    <h3 className="absolute bottom-3 left-4 font-black italic text-lg tracking-wider text-white">{t.name}</h3>
                  </div>
                  <div className="p-4 space-y-2 text-xs">
                    <div className="flex justify-between text-zinc-400"><span>Fee: <strong className="text-white">₹{t.fee}</strong></span><span>Type: <strong className="text-orange-400">{t.type}</strong></span></div>
                    <div className="text-zinc-400 truncate">Time: {t.match_time ? new Date(t.match_time).toLocaleString() : 'TBA'}</div>
                  </div>
                  <div className="p-4 pt-0">
                    <button onClick={() => router.push(`/admin/tournament/${t.id}`)} className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black uppercase py-2.5 rounded-lg text-xs transition-colors">
                      Match Control Center &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Create Tournament Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#111116] w-full max-w-xl rounded-2xl border border-zinc-800 relative p-6 space-y-6 my-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-900 p-2 rounded-full">✕</button>
            <h2 className="text-xl font-black uppercase tracking-wide text-orange-500">Create New Tournament</h2>
            
            <form onSubmit={handleCreateTournament} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-zinc-400 uppercase tracking-wider block mb-1">Tournament Name</label>
                <input type="text" required placeholder="e.g. Erangel Squad Showdown" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-orange-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-zinc-400 uppercase tracking-wider block mb-1">Match Type</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-orange-500 font-bold">
                    <option value="SOLO">SOLO</option>
                    <option value="DUO">DUO</option>
                    <option value="SQUAD">SQUAD</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-zinc-400 uppercase tracking-wider block mb-1">Perspective</label>
                  <select value={form.perspective} onChange={e => setForm({...form, perspective: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-orange-500 font-bold">
                    <option value="TPP">TPP</option>
                    <option value="FPP">FPP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-zinc-400 uppercase tracking-wider block mb-1">Entry Fee (₹)</label>
                  <input type="number" required value={form.fee} onChange={e => setForm({...form, fee: Number(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="font-bold text-zinc-400 uppercase tracking-wider block mb-1">Total Slots</label>
                  <input type="number" required value={form.total_slots} onChange={e => setForm({...form, total_slots: Number(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-orange-500" />
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-400 uppercase tracking-wider block mb-1">Match Date & Time (IST)</label>
                <input type="datetime-local" required value={form.match_time} onChange={e => setForm({...form, match_time: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-orange-500" />
              </div>

              <div>
                <label className="font-bold text-zinc-400 uppercase tracking-wider block mb-1">Map Image URL</label>
                <input type="text" required value={form.map_img} onChange={e => setForm({...form, map_img: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-orange-500" />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-zinc-900 text-white font-bold uppercase py-3 rounded-xl hover:bg-zinc-800 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-[2] bg-orange-500 hover:bg-orange-400 text-black font-black uppercase tracking-widest py-3 rounded-xl transition-all">
                  {submitting ? 'Creating...' : 'Publish Tournament'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
