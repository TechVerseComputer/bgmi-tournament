'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Trophy, Users, ShieldAlert, Gamepad2, UploadCloud, Trash2, LogOut, Wallet, CheckCircle, XCircle, Edit3, PlusCircle, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tournaments'); 
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [registrations, setRegistrations] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [leaderboards, setLeaderboards] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const defaultTourney = { name: '', type: 'SQUAD', perspective: 'TPP', fee: 0, first_prize: 0, second_prize: 0, match_time: '', total_slots: 25, status: 'OPEN', map_img: '' };
  const [newTourney, setNewTourney] = useState(defaultTourney);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newLeaderboard, setNewLeaderboard] = useState({ match_date: '', slot_time: '', winner_1_team: '', winner_2_team: '' });
  const [newRule, setNewRule] = useState({ title: '', description: '' });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) { setUser(session.user); verifyAdmin(session.user.email); } 
      else { setAuthLoading(false); }
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) { setUser(session.user); verifyAdmin(session.user.email); } 
        else { setUser(null); setIsAuthorized(false); setAuthLoading(false); }
      });
    };
    checkAuth();
  }, []);

  const verifyAdmin = async (email: string | undefined) => {
    if (!email) return;
    const { data } = await supabase.from('admins').select('*').eq('email', email).single();
    if (data) { setIsAuthorized(true); fetchAllData(); } else { setIsAuthorized(false); }
    setAuthLoading(false);
  };

  const handleLogin = async () => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/admin' } });
  const handleLogout = async () => supabase.auth.signOut();

  const fetchAllData = async () => {
    setLoading(true);
    const [regRes, tourneyRes, leadRes, rulesRes, txRes] = await Promise.all([
      supabase.from('registrations').select('*').order('created_at', { ascending: false }),
      supabase.from('tournaments').select('*').order('created_at', { ascending: false }),
      supabase.from('leaderboard').select('*').order('match_date', { ascending: false }),
      supabase.from('rules').select('*').order('created_at', { ascending: true }),
      supabase.from('transactions').select('*').eq('status', 'PENDING').order('created_at', { ascending: true })
    ]);
    if (regRes.data) setRegistrations(regRes.data);
    if (tourneyRes.data) setTournaments(tourneyRes.data);
    if (leadRes.data) setLeaderboards(leadRes.data);
    if (rulesRes.data) setRules(rulesRes.data);
    if (txRes.data) setPendingTransactions(txRes.data);
    setLoading(false);
  };

  const handleApproveDeposit = async (txId: string, userId: string, amount: number) => {
    setActionLoading(txId);
    await supabase.from('transactions').update({ status: 'SUCCESS' }).eq('id', txId);
    const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', userId).single();
    if (wallet) {
      await supabase.from('wallets').update({ balance: Number(wallet.balance) + Number(amount), total_deposited: Number(wallet.total_deposited) + Number(amount) }).eq('user_id', userId);
    }
    fetchAllData();
    setActionLoading(null);
  };

  const handleRejectDeposit = async (txId: string) => {
    setActionLoading(txId);
    await supabase.from('transactions').update({ status: 'REJECTED' }).eq('id', txId);
    fetchAllData();
    setActionLoading(null);
  };

  const handleEditClick = (tourney: any) => {
    setEditingId(tourney.id);
    setNewTourney(tourney);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewTourney(defaultTourney);
    setImageFile(null);
  };

  const handleSaveTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let publicUrl = newTourney.map_img;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `match-banners/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('tournament-images').upload(filePath, imageFile);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('tournament-images').getPublicUrl(filePath);
        publicUrl = publicUrlData.publicUrl;
      } else if (!editingId) {
        throw new Error("Please select a background image.");
      }

      const payload = {
        name: newTourney.name,
        type: newTourney.type,
        perspective: newTourney.perspective,
        fee: newTourney.fee,
        first_prize: newTourney.first_prize,
        second_prize: newTourney.second_prize,
        match_time: newTourney.match_time,
        total_slots: newTourney.total_slots,
        status: newTourney.status,
        map_img: publicUrl
      };

      if (editingId) {
        const { error } = await supabase.from('tournaments').update(payload).eq('id', editingId);
        if (error) throw error;
        alert('Match Updated Successfully!');
      } else {
        const { error } = await supabase.from('tournaments').insert([payload]);
        if (error) throw error;
        alert('Match Created Successfully!');
      }

      setNewTourney(defaultTourney);
      setEditingId(null);
      setImageFile(null);
      const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      fetchAllData();
    } catch (err: any) { alert(`Error: ${err.message}`); } finally { setUploading(false); }
  };

  const handleDeleteTournament = async (id: string) => { if(confirm("Are you sure you want to delete this match?")) { await supabase.from('tournaments').delete().eq('id', id); fetchAllData(); } };
  const handleCreateLeaderboard = async (e: React.FormEvent) => { e.preventDefault(); const { error } = await supabase.from('leaderboard').insert([newLeaderboard]); if (!error) { setNewLeaderboard({ match_date: '', slot_time: '', winner_1_team: '', winner_2_team: '' }); fetchAllData(); } };
  const handleDeleteLeaderboard = async (id: string) => { if(confirm("Delete this entry?")) { await supabase.from('leaderboard').delete().eq('id', id); fetchAllData(); } };
  const handleCreateRule = async (e: React.FormEvent) => { e.preventDefault(); const { error } = await supabase.from('rules').insert([newRule]); if (!error) { setNewRule({ title: '', description: '' }); fetchAllData(); } };
  const handleDeleteRule = async (id: string) => { if(confirm("Delete this rule?")) { await supabase.from('rules').delete().eq('id', id); fetchAllData(); } };

  if (authLoading) return <div className="min-h-screen bg-[#050505] text-orange-500 font-black flex items-center justify-center animate-pulse tracking-widest uppercase">Checking Clearance...</div>;
  if (!user) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4">
      <ShieldAlert className="w-16 h-16 text-orange-500 mb-6" />
      <h1 className="text-4xl font-black italic text-white mb-2 uppercase tracking-widest">Restricted Area</h1>
      <button onClick={handleLogin} className="mt-8 bg-white hover:bg-gray-200 text-black font-black uppercase tracking-wider px-8 py-4 rounded flex items-center gap-3 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]">Sign in with Google</button>
    </div>
  );
  if (!isAuthorized) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 text-center">
      <ShieldAlert className="w-20 h-20 text-red-500 mb-6" />
      <h1 className="text-4xl font-black italic text-white mb-2 uppercase">Access Denied</h1>
      <button onClick={handleLogout} className="mt-8 bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-8 py-3 rounded uppercase tracking-wider transition-colors border border-zinc-700">Logout & Try Another Account</button>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans pb-24">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-black italic tracking-wider text-orange-500">SUPER ADMIN HUB</h1>
            <p className="text-emerald-500 text-sm mt-1 font-bold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Authenticated as {user.email}</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button onClick={fetchAllData} className="flex-1 md:flex-none bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-sm font-bold px-4 py-2.5 rounded border border-zinc-700 transition-all">🔄 Refresh Data</button>
            <button onClick={handleLogout} className="flex-1 md:flex-none bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-sm font-bold px-4 py-2.5 rounded border border-red-500/20 transition-all flex items-center justify-center gap-2"><LogOut className="w-4 h-4" /> Logout</button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { id: 'wallet', icon: Wallet, label: 'Wallet Approvals' },
            { id: 'tournaments', icon: Gamepad2, label: 'Manage Tournaments' },
            { id: 'leaderboard', icon: Trophy, label: 'Leaderboard' },
            { id: 'rules', icon: ShieldAlert, label: 'Rules' }
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-3 rounded text-sm font-black uppercase tracking-wider transition-all ${activeTab === tab.id ? 'bg-orange-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'}`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
              {tab.id === 'wallet' && pendingTransactions.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-2">{pendingTransactions.length}</span>}
            </button>
          ))}
        </div>

        {/* --- WALLET TAB --- */}
        {activeTab === 'wallet' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black italic uppercase tracking-widest mb-6 border-b border-zinc-800 pb-4">Pending Deposits & Withdrawals</h2>
            {pendingTransactions.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 p-8 text-center rounded text-zinc-500 font-bold uppercase tracking-wider">No pending requests.</div>
            ) : (
              <div className="overflow-x-auto bg-zinc-900 border border-zinc-800 rounded">
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs font-black tracking-wider border-b border-zinc-800">
                    <tr><th className="p-4">Type</th><th className="p-4">Amount</th><th className="p-4">UTR / UPI ID</th><th className="p-4 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {pendingTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-zinc-800/50">
                        <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-black uppercase tracking-wider ${tx.type === 'DEPOSIT' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>{tx.type}</span></td>
                        <td className="p-4 font-black text-white text-lg">₹{tx.amount}</td>
                        <td className="p-4 font-mono font-bold text-orange-400 select-all">{tx.type === 'DEPOSIT' ? `UTR: ${tx.reference_id}` : `UPI: ${tx.upi_id}`}</td>
                        <td className="p-4 text-right space-x-2">
                          <button disabled={actionLoading === tx.id} onClick={() => handleApproveDeposit(tx.id, tx.user_id, tx.amount)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded uppercase tracking-wider inline-flex items-center gap-1 transition-colors"><CheckCircle className="w-3 h-3"/> Approve</button>
                          <button disabled={actionLoading === tx.id} onClick={() => handleRejectDeposit(tx.id)} className="bg-zinc-800 hover:bg-red-900 text-red-400 hover:text-white text-xs font-bold px-3 py-2 rounded uppercase tracking-wider border border-zinc-700 inline-flex items-center gap-1 transition-colors"><XCircle className="w-3 h-3"/> Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* --- TOURNAMENTS TAB --- */}
        {activeTab === 'tournaments' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Create / Edit Form */}
            <div className={`lg:col-span-1 border p-6 rounded h-fit relative transition-colors ${editingId ? 'bg-[#0f172a] border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 'bg-zinc-900 border-zinc-800'}`}>
              
              {editingId ? (
                <div className="mb-6 flex flex-col gap-4 border-b border-blue-500/30 pb-4">
                  <div className="flex items-center gap-2 text-blue-400 font-black italic tracking-widest uppercase">
                    <Edit3 className="w-5 h-5"/> Editing Mode Active
                  </div>
                  <button type="button" onClick={handleCancelEdit} className="bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold px-4 py-3 rounded uppercase tracking-wider transition-colors border border-zinc-700 flex items-center justify-center gap-2 w-full">
                    <PlusCircle className="w-4 h-4"/> Create New Match Instead
                  </button>
                </div>
              ) : (
                <h2 className="text-xl font-black italic uppercase tracking-widest mb-6 border-b border-zinc-800 pb-4 text-white">Create New Match</h2>
              )}
              
              <form onSubmit={handleSaveTournament} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Match Title</label>
                  <input required type="text" value={newTourney.name} onChange={e => setNewTourney({...newTourney, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-sm focus:border-orange-500 outline-none text-white" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Background Image {editingId && '(Optional)'}</label>
                  <input id="imageUpload" type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-bold file:bg-orange-500 file:text-black hover:file:bg-orange-400 cursor-pointer" />
                </div>
                
                <div className="bg-zinc-950 p-4 rounded border border-zinc-800 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-orange-500 uppercase tracking-wider block mb-1">Match Date & Time</label>
                    <input required type="datetime-local" value={newTourney.match_time} onChange={e => setNewTourney({...newTourney, match_time: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm focus:border-orange-500 outline-none text-white [color-scheme:dark]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-orange-500 uppercase tracking-wider block mb-1">Total Slots</label>
                      <input required type="number" value={newTourney.total_slots} onChange={e => setNewTourney({...newTourney, total_slots: Number(e.target.value)})} className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm focus:border-orange-500 outline-none text-white" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-orange-500 uppercase tracking-wider block mb-1">Status</label>
                      <select value={newTourney.status} onChange={e => setNewTourney({...newTourney, status: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm focus:border-orange-500 outline-none text-white">
                        <option value="OPEN">OPEN</option>
                        <option value="FULL">FULL</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Type</label>
                    <select value={newTourney.type} onChange={e => setNewTourney({...newTourney, type: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-sm focus:border-orange-500 outline-none text-white"><option>SOLO</option><option>DUO</option><option>SQUAD</option></select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Perspective</label>
                    <select value={newTourney.perspective} onChange={e => setNewTourney({...newTourney, perspective: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-sm focus:border-orange-500 outline-none text-white"><option>TPP</option><option>FPP</option></select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Entry Fee (₹)</label>
                  <input required type="number" value={newTourney.fee} onChange={e => setNewTourney({...newTourney, fee: Number(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-sm focus:border-orange-500 outline-none text-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">1st Prize (₹)</label>
                    <input required type="number" value={newTourney.first_prize} onChange={e => setNewTourney({...newTourney, first_prize: Number(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-sm focus:border-orange-500 outline-none text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">2nd Prize (₹)</label>
                    <input required type="number" value={newTourney.second_prize} onChange={e => setNewTourney({...newTourney, second_prize: Number(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-sm focus:border-orange-500 outline-none text-white" />
                  </div>
                </div>
                <button type="submit" disabled={uploading} className={`w-full font-black uppercase tracking-widest py-3 rounded mt-4 transition-colors disabled:opacity-50 flex justify-center items-center gap-2 ${editingId ? 'bg-blue-500 hover:bg-blue-400 text-black' : 'bg-orange-500 hover:bg-orange-400 text-black'}`}>
                  {uploading ? <><UploadCloud className="w-5 h-5 animate-pulse" /> Saving...</> : editingId ? 'Update Tournament' : 'Create Tournament'}
                </button>
              </form>
            </div>
            
            {/* Active Matches List (Now includes [View More] Button) */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-black italic uppercase tracking-widest mb-6">Active Database Matches</h2>
              {tournaments.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 p-8 text-center rounded text-zinc-500 font-bold uppercase tracking-wider">No matches created yet.</div>
              ) : (
                tournaments.map((t) => (
                  <div key={t.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <img src={t.map_img} alt="map" className="w-16 h-16 object-cover rounded border border-zinc-700" />
                      <div>
                        <div className="flex items-center gap-2">
                           <h3 className="font-black italic text-lg uppercase tracking-wide">{t.name}</h3>
                           <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${t.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : t.status === 'FULL' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>{t.status}</span>
                        </div>
                        <div className="flex gap-2 text-xs font-bold text-zinc-400 mt-1">
                          <span className="text-orange-500">{t.match_time ? new Date(t.match_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'No Time Set'}</span> • <span>{t.type}</span> • <span>Slots: {t.total_slots}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      {/* NEW: View More Button to check slot rosters */}
                      <button onClick={() => router.push(`/admin/tournament/${t.id}`)} className="flex-1 sm:flex-none bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 px-4 py-2 rounded text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1">
                        <Eye className="w-3.5 h-3.5"/> View More
                      </button>
                      <button onClick={() => handleEditClick(t)} className="flex-1 sm:flex-none bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white border border-blue-500/20 px-4 py-2 rounded text-xs font-black uppercase tracking-wider transition-all">Edit</button>
                      <button onClick={() => handleDeleteTournament(t.id)} className="flex-1 sm:flex-none bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 px-4 py-2 rounded text-xs font-black uppercase tracking-wider transition-all">Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* LEADERBOARD & RULES TABS */}
        {activeTab === 'leaderboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded h-fit">
              <h2 className="text-xl font-black italic uppercase tracking-widest mb-6 border-b border-zinc-800 pb-4">Post Winners</h2>
              <form onSubmit={handleCreateLeaderboard} className="space-y-4 text-sm font-bold">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Match Date</label>
                  <input required type="date" value={newLeaderboard.match_date} onChange={e => setNewLeaderboard({...newLeaderboard, match_date: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded text-zinc-300 focus:border-orange-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Time Slot</label>
                  <input required type="text" placeholder="e.g. 9:00 PM" value={newLeaderboard.slot_time} onChange={e => setNewLeaderboard({...newLeaderboard, slot_time: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded focus:border-orange-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">1st Place Squad</label>
                  <input required type="text" placeholder="Team Alpha" value={newLeaderboard.winner_1_team} onChange={e => setNewLeaderboard({...newLeaderboard, winner_1_team: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded border-l-4 border-l-orange-500 focus:border-orange-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">2nd Place Squad</label>
                  <input required type="text" placeholder="Team Beta" value={newLeaderboard.winner_2_team} onChange={e => setNewLeaderboard({...newLeaderboard, winner_2_team: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded border-l-4 border-l-zinc-500 focus:border-orange-500 outline-none" />
                </div>
                <button type="submit" className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black uppercase tracking-widest py-3 rounded transition-colors mt-4">Publish to Leaderboard</button>
              </form>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-black italic uppercase tracking-widest mb-6">Published Results</h2>
              {leaderboards.map((l) => (
                <div key={l.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded flex justify-between items-center">
                  <div>
                    <span className="text-xs text-zinc-400 font-bold bg-black px-2 py-1 rounded border border-zinc-800">{l.match_date} • {l.slot_time}</span>
                    <p className="mt-3 font-black text-xl text-orange-500">🥇 {l.winner_1_team}</p>
                    <p className="font-bold text-zinc-300">🥈 {l.winner_2_team}</p>
                  </div>
                  <button onClick={() => handleDeleteLeaderboard(l.id)} className="p-2 hover:bg-red-500/10 rounded transition-colors"><Trash2 className="w-5 h-5 text-red-500" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RULES TAB */}
        {activeTab === 'rules' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded h-fit">
              <h2 className="text-xl font-black italic uppercase tracking-widest mb-6 border-b border-zinc-800 pb-4">Add Rule</h2>
              <form onSubmit={handleCreateRule} className="space-y-4 text-sm font-bold">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Rule Title</label>
                  <input required type="text" placeholder="e.g. EMULATORS" value={newRule.title} onChange={e => setNewRule({...newRule, title: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded uppercase focus:border-orange-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Description</label>
                  <textarea required placeholder="Detailed description..." value={newRule.description} onChange={e => setNewRule({...newRule, description: e.target.value})} rows={4} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded resize-none focus:border-orange-500 outline-none" />
                </div>
                <button type="submit" className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black uppercase tracking-widest py-3 rounded transition-colors mt-4">Save Rule</button>
              </form>
            </div>
            <div className="lg:col-span-2">
              <h2 className="text-xl font-black italic uppercase tracking-widest mb-6">Active Rules</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rules.map((r) => (
                  <div key={r.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded relative group">
                    <h3 className="font-black tracking-wide mb-2 text-orange-500 uppercase">{r.title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">{r.description}</p>
                    <button onClick={() => handleDeleteRule(r.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/10 rounded"><Trash2 className="w-4 h-4 text-red-500" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}