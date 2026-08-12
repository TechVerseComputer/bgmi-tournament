'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Trophy, ShieldAlert, Gamepad2, UploadCloud, Trash2, LogOut, Wallet, CheckCircle, XCircle, Edit3, PlusCircle, Eye, Calculator, Key, Ban, CheckSquare, FileText, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

// --- TIMEZONE HELPERS ---
// Converts UTC from database into local IST for the Edit Form
const formatToISTInput = (utcString: string | null) => {
  if (!utcString) return '';
  const d = new Date(utcString);
  if (isNaN(d.getTime())) return '';
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(d.getTime() + istOffset);
  return istDate.toISOString().slice(0, 16);
};

// Converts the Form's IST time back into UTC for the Database
const parseISTToUTC = (localString: string) => {
  if (!localString) return null;
  const d = new Date(`${localString}+05:30`);
  return d.toISOString();
};

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

  // Tournament States
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const defaultTourney = { 
    name: '', 
    type: 'SQUAD', 
    perspective: 'TPP', 
    entry_type: 'PAID', 
    fee: 100, 
    total_slots: 25,
    minimum_slots_required: 25, 
    status: 'OPEN', 
    match_time: '',
    registration_closing_time: '',
    map_img: '',
    total_winners: 3,
    prizes: [1500, 800, 400, 0, 0, 0],
    room_id: '',
    room_password: ''
  };
  const [newTourney, setNewTourney] = useState(defaultTourney);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Leaderboard States
  const defaultLeaderboard = { 
    match_date: '', 
    tournament_name: '', 
    team_name: '', 
    team_id: '', 
    prize_won: '', 
    status: 'Draft',
    screenshot_url: '' 
  };
  const [newLeaderboard, setNewLeaderboard] = useState(defaultLeaderboard);
  const [editingLeaderboardId, setEditingLeaderboardId] = useState<string | null>(null);
  const [leaderboardImageFile, setLeaderboardImageFile] = useState<File | null>(null);
  const [leaderboardUploading, setLeaderboardUploading] = useState(false);

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
    if (tourneyRes.data) {
      const mappedTourneys = tourneyRes.data.map(t => ({
        ...t,
        entry_type: t.entry_type || 'PAID',
        minimum_slots_required: t.minimum_slots_required || t.total_slots,
        total_winners: t.total_winners || 2,
        prizes: t.prize_breakdown?.length > 0 ? t.prize_breakdown : [t.first_prize || 0, t.second_prize || 0, 0, 0, 0, 0]
      }));
      setTournaments(mappedTourneys);
    }
    if (leadRes.data) setLeaderboards(leadRes.data);
    if (rulesRes.data) setRules(rulesRes.data);
    if (txRes.data) setPendingTransactions(txRes.data);
    setLoading(false);
  };

  const sendPushNotification = async (userIds: string[], title: string, body: string, url: string = '/dashboard') => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds, title, body, url })
      });
    } catch (err) {
      console.error("Failed to send push notification", err);
    }
  };

  const handleApproveDeposit = async (txId: string, userId: string, amount: number) => {
    setActionLoading(txId);
    let { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', userId).single();
    if (!wallet) {
      const { data: newWallet } = await supabase.from('wallets').insert([{ user_id: userId, balance: 0, total_deposited: 0, total_won: 0 }]).select().single();
      wallet = newWallet;
    }
    if (wallet) {
      const currentBalance = Number(wallet.balance) || 0;
      const currentDeposited = Number(wallet.total_deposited) || 0;
      const depositAmount = Number(amount) || 0;
      const { error: walletError } = await supabase.from('wallets').update({ 
        balance: currentBalance + depositAmount, 
        total_deposited: currentDeposited + depositAmount 
      }).eq('user_id', userId);
      if (walletError) {
        alert("Error updating wallet: " + walletError.message);
        setActionLoading(null);
        return;
      }
      await supabase.from('transactions').update({ status: 'SUCCESS' }).eq('id', txId);
      await sendPushNotification([userId], 'Deposit Approved! 💰', `Your deposit of ₹${amount} has been successfully credited to your wallet.`, '/dashboard');
    }
    fetchAllData();
    setActionLoading(null);
  };

  const handleRejectDeposit = async (txId: string, userId: string) => {
    setActionLoading(txId);
    await supabase.from('transactions').update({ status: 'REJECTED' }).eq('id', txId);
    await sendPushNotification([userId], 'Deposit Rejected ❌', 'Your recent deposit request was rejected. Please check your transaction details or contact support.', '/dashboard');
    fetchAllData();
    setActionLoading(null);
  };

  const handleAutoCalculatePrizes = () => {
    if (newTourney.entry_type === 'FREE') {
      alert("Auto-calculate is disabled for Free Entry tournaments. Please manually enter the prize amounts.");
      return;
    }

    const totalPool = Number(newTourney.fee) * Number(newTourney.total_slots);
    const prizePool = Math.floor(totalPool * 0.85);
    const count = Number(newTourney.total_winners);

    let newPrizes = [0, 0, 0, 0, 0, 0];
    if (count === 1) {
      newPrizes[0] = prizePool;
    } else if (count === 2) {
      newPrizes[0] = Math.floor(prizePool * 0.70);
      newPrizes[1] = prizePool - newPrizes[0];
    } else if (count === 3) {
      newPrizes[0] = Math.floor(prizePool * 0.55);
      newPrizes[1] = Math.floor(prizePool * 0.30);
      newPrizes[2] = prizePool - newPrizes[0] - newPrizes[1];
    } else if (count === 4) {
      newPrizes[0] = Math.floor(prizePool * 0.50);
      newPrizes[1] = Math.floor(prizePool * 0.25);
      newPrizes[2] = Math.floor(prizePool * 0.15);
      newPrizes[3] = prizePool - newPrizes[0] - newPrizes[1] - newPrizes[2];
    } else if (count >= 5) {
      newPrizes[0] = Math.floor(prizePool * 0.45);
      newPrizes[1] = Math.floor(prizePool * 0.25);
      newPrizes[2] = Math.floor(prizePool * 0.15);
      newPrizes[3] = Math.floor(prizePool * 0.10);
      newPrizes[4] = prizePool - newPrizes[0] - newPrizes[1] - newPrizes[2] - newPrizes[3];
      if (count === 6) {
        newPrizes[4] = Math.floor(prizePool * 0.38);
        newPrizes[5] = prizePool - newPrizes[0] - newPrizes[1] - newPrizes[2] - newPrizes[3] - newPrizes[4];
      }
    }
    setNewTourney({ ...newTourney, prizes: newPrizes });
  };

  const handleEditClick = (tourney: any) => {
    setEditingId(tourney.id);
    setNewTourney({
      ...tourney,
      entry_type: tourney.entry_type || 'PAID',
      minimum_slots_required: tourney.minimum_slots_required || tourney.total_slots,
      match_time: formatToISTInput(tourney.match_time),
      registration_closing_time: formatToISTInput(tourney.registration_closing_time),
      total_winners: tourney.total_winners || 3,
      prizes: tourney.prizes || [tourney.first_prize, tourney.second_prize, 0, 0, 0, 0],
      room_id: tourney.room_id || '',
      room_password: tourney.room_password || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setEditingId(null);
    setNewTourney(defaultTourney);
    setImageFile(null);
    const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleSaveTournament = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newTourney.entry_type === 'FREE') {
      if (newTourney.minimum_slots_required <= 0 || newTourney.minimum_slots_required > newTourney.total_slots) {
        alert(`Minimum Slots Required must be between 1 and ${newTourney.total_slots}.`);
        return;
      }
    }

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

      const activePrizes = newTourney.prizes.slice(0, newTourney.total_winners);

      const payload = {
        name: String(newTourney.name),
        type: String(newTourney.type),
        perspective: String(newTourney.perspective),
        entry_type: String(newTourney.entry_type),
        fee: newTourney.entry_type === 'FREE' ? 0 : Number(newTourney.fee),
        minimum_slots_required: newTourney.entry_type === 'FREE' ? Number(newTourney.minimum_slots_required) : Number(newTourney.total_slots),
        first_prize: Number(newTourney.prizes[0] || 0),
        second_prize: Number(newTourney.prizes[1] || 0),
        total_winners: Number(newTourney.total_winners),
        prize_breakdown: activePrizes,
        match_time: newTourney.match_time ? parseISTToUTC(newTourney.match_time) : '',
        registration_closing_time: newTourney.registration_closing_time ? parseISTToUTC(newTourney.registration_closing_time) : null,
        total_slots: Number(newTourney.total_slots || 25),
        status: String(newTourney.status || 'OPEN'),
        map_img: publicUrl,
        room_id: newTourney.room_id || null, 
        room_password: newTourney.room_password || null 
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

      handleCancelForm(); // Properly resets state
      fetchAllData();
    } catch (err: any) { alert(`Error: ${err.message}`); } finally { setUploading(false); }
  };

  const handleCancelMatch = async (tourney: any) => {
    const isFree = tourney.entry_type === 'FREE' || tourney.fee === 0;
    const warningMsg = isFree 
      ? `WARNING: Are you sure you want to CANCEL "${tourney.name}"? This is a free match.`
      : `WARNING: Are you sure you want to CANCEL "${tourney.name}"? This will immediately refund ₹${tourney.fee} to all registered players.`;

    if (!confirm(warningMsg)) return;
    
    setActionLoading(tourney.id);
    try {
      const { data: regs, error: regErr } = await supabase.from('registrations').select('*').eq('tournament_id', tourney.id);
      if (regErr) throw regErr;

      let refundedUserIds: string[] = [];

      if (regs && regs.length > 0 && tourney.fee > 0) {
        for (const reg of regs) {
          const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', reg.user_id).single();
          if (wallet) {
            const newBalance = Number(wallet.balance) + Number(tourney.fee);
            await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', reg.user_id);
            await supabase.from('transactions').insert([{
              user_id: reg.user_id,
              type: 'REFUND',
              amount: tourney.fee,
              status: 'SUCCESS',
              description: `Refund for Cancelled Match: ${tourney.name} (Slot ${reg.slot_number})`
            }]);
            refundedUserIds.push(reg.user_id);
          }
        }
      } else if (regs && regs.length > 0 && isFree) {
        for (const reg of regs) {
          refundedUserIds.push(reg.user_id);
        }
      }

      const { error: updateErr } = await supabase.from('tournaments').update({ status: 'CANCELLED' }).eq('id', tourney.id);
      if (updateErr) throw updateErr;

      if (refundedUserIds.length > 0) {
        const notifMsg = isFree 
          ? `"${tourney.name}" has been cancelled by administrators.`
          : `"${tourney.name}" has been cancelled. Your entry fee of ₹${tourney.fee} has been returned to your wallet.`;
        await sendPushNotification(refundedUserIds, 'Match Cancelled 🚫', notifMsg, '/dashboard');
      }

      alert(`Match Cancelled successfully! ${regs?.length || 0} players notified${!isFree ? ' and refunded' : ''}.`);
      fetchAllData();
    } catch (err: any) {
      alert("Error cancelling match: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkCompleted = async (tourney: any) => {
    if (!confirm(`Mark "${tourney.name}" as COMPLETED? It will be moved to Old Match History.`)) return;
    setActionLoading(tourney.id);
    try {
      const { error } = await supabase.from('tournaments').update({ status: 'COMPLETED' }).eq('id', tourney.id);
      if (error) throw error;
      fetchAllData();
    } catch (err: any) {
      alert("Error completing match: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTournament = async (tourney: any) => { 
    if (tourney.status !== 'CANCELLED' && tourney.status !== 'COMPLETED') {
      return alert("You can only permanently delete matches that are CANCELLED or COMPLETED.");
    }
    
    if(!confirm(`Are you absolutely sure you want to PERMANENTLY DELETE "${tourney.name}"? This action cannot be undone.`)) return;
    
    setActionLoading(tourney.id);
    try {
      await supabase.from('registrations').delete().eq('tournament_id', tourney.id);
      const { error } = await supabase.from('tournaments').delete().eq('id', tourney.id); 
      if (error) throw error;

      alert("Match and its registration data successfully deleted.");
      fetchAllData();
    } catch (err: any) {
      alert("Error deleting match: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditLeaderboard = (item: any) => {
    setEditingLeaderboardId(item.id);
    setNewLeaderboard({
      match_date: item.match_date || '',
      tournament_name: item.tournament_name || '',
      team_name: item.team_name || item.winner_1_team || '', 
      team_id: item.team_id || '',
      prize_won: item.prize_won || '',
      status: item.status || 'Draft',
      screenshot_url: item.screenshot_url || ''
    });
    setLeaderboardImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelLeaderboardEdit = () => {
    setEditingLeaderboardId(null);
    setNewLeaderboard(defaultLeaderboard);
    setLeaderboardImageFile(null);
  };

  const handleSaveLeaderboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeaderboardUploading(true);
    
    try {
      let finalScreenshotUrl = newLeaderboard.screenshot_url;

      if (leaderboardImageFile) {
        const fileExt = leaderboardImageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `winner-screenshots/${fileName}`;
        
        const { error: uploadError } = await supabase.storage.from('leaderboard-images').upload(filePath, leaderboardImageFile);
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage.from('leaderboard-images').getPublicUrl(filePath);
        finalScreenshotUrl = publicUrlData.publicUrl;
      } else if (!editingLeaderboardId && !finalScreenshotUrl) {
        throw new Error("Please upload a winner screenshot.");
      }

      const payload = {
        match_date: newLeaderboard.match_date,
        tournament_name: newLeaderboard.tournament_name,
        team_name: newLeaderboard.team_name,
        team_id: newLeaderboard.team_id,
        prize_won: Number(newLeaderboard.prize_won),
        status: newLeaderboard.status,
        screenshot_url: finalScreenshotUrl,
        winner_1_team: newLeaderboard.team_name 
      };

      if (editingLeaderboardId) {
        const { error } = await supabase.from('leaderboard').update(payload).eq('id', editingLeaderboardId);
        if (error) throw error;
        alert("Winner record updated successfully!");
      } else {
        const { error } = await supabase.from('leaderboard').insert([payload]);
        if (error) throw error;
        alert("Winner record created successfully!");
      }

      setNewLeaderboard(defaultLeaderboard);
      setEditingLeaderboardId(null);
      setLeaderboardImageFile(null);
      fetchAllData();

    } catch (error: any) {
      alert("Error saving leaderboard: " + error.message);
    } finally {
      setLeaderboardUploading(false);
    }
  };

  const handleDeleteLeaderboard = async (id: string) => { 
    if(confirm("Delete this winner record permanently?")) { 
      await supabase.from('leaderboard').delete().eq('id', id); 
      fetchAllData(); 
    } 
  };

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

  const activeMatches = tournaments.filter(t => t.status !== 'CANCELLED' && t.status !== 'COMPLETED');
  const historyMatches = tournaments.filter(t => t.status === 'CANCELLED' || t.status === 'COMPLETED');

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
            <button onClick={() => router.push('/admin/ledger')} className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-4 py-2.5 rounded border border-emerald-500 transition-all flex items-center justify-center gap-2">
              <FileText className="w-4 h-4"/> Financial Ledger
            </button>
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
                          <button disabled={actionLoading === tx.id} onClick={() => handleRejectDeposit(tx.id, tx.user_id)} className="bg-zinc-800 hover:bg-red-900 text-red-400 hover:text-white text-xs font-bold px-3 py-2 rounded uppercase tracking-wider border border-zinc-700 inline-flex items-center gap-1 transition-colors"><XCircle className="w-3 h-3"/> Reject</button>
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
                </div>
              ) : (
                <h2 className="text-xl font-black italic uppercase tracking-widest mb-6 border-b border-zinc-800 pb-4 text-white">Create New Match</h2>
              )}
              
              <form onSubmit={handleSaveTournament} className="space-y-4">
                
                {/* --- NEW: ENTRY TYPE TOGGLE --- */}
                <div className="flex gap-2 bg-zinc-950 p-1.5 rounded-lg border border-zinc-800">
                  <button 
                    type="button"
                    onClick={() => {
                      setNewTourney({ ...newTourney, entry_type: 'PAID' });
                    }}
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded transition-colors ${newTourney.entry_type === 'PAID' ? 'bg-orange-500 text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Paid Entry
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setNewTourney({ ...newTourney, entry_type: 'FREE', fee: 0 });
                    }}
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded transition-colors ${newTourney.entry_type === 'FREE' ? 'bg-emerald-500 text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Free Entry
                  </button>
                </div>

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
                    <label className="text-xs font-bold text-orange-500 uppercase tracking-wider block mb-1">Match Date & Time (IST)</label>
                    <input required type="datetime-local" value={newTourney.match_time} onChange={e => setNewTourney({...newTourney, match_time: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm focus:border-orange-500 outline-none text-white [color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-red-400 uppercase tracking-wider block mb-1">Registration Closes At (IST)</label>
                    <input type="datetime-local" required value={newTourney.registration_closing_time} onChange={e => setNewTourney({...newTourney, registration_closing_time: e.target.value})} className="w-full bg-red-950/20 border border-red-900/50 rounded p-2 text-sm focus:border-red-500 outline-none text-red-200 [color-scheme:dark]" />
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
                      </select>
                    </div>
                  </div>

                  {/* --- NEW: MINIMUM SLOTS FOR FREE ENTRY --- */}
                  {newTourney.entry_type === 'FREE' && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded mt-2">
                      <label className="text-xs font-bold text-emerald-500 uppercase tracking-wider block mb-1">Min. Slots Required to Start</label>
                      <input required type="number" min="1" max={newTourney.total_slots || 25} value={newTourney.minimum_slots_required} onChange={e => setNewTourney({...newTourney, minimum_slots_required: Number(e.target.value)})} className="w-full bg-zinc-950 border border-emerald-500/50 rounded p-2 text-sm focus:border-emerald-500 outline-none text-emerald-400 font-bold" />
                      <p className="text-[10px] font-bold text-emerald-500/70 mt-1 uppercase tracking-wider">Tournament cancels if minimum is not reached.</p>
                    </div>
                  )}

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

                {newTourney.entry_type === 'PAID' && (
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Entry Fee (₹)</label>
                    <input required type="number" value={newTourney.fee} onChange={e => setNewTourney({...newTourney, fee: Number(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-sm focus:border-orange-500 outline-none text-white" />
                  </div>
                )}

                <div className="bg-zinc-950 p-4 rounded border border-zinc-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-orange-500 uppercase tracking-wider">Number of Winners</label>
                    <select 
                      value={newTourney.total_winners} 
                      onChange={e => setNewTourney({...newTourney, total_winners: Number(e.target.value)})} 
                      className="bg-zinc-900 border border-zinc-700 rounded px-3 py-1 text-xs font-black text-white outline-none"
                    >
                      <option value={1}>1 Winner</option>
                      <option value={2}>2 Winners</option>
                      <option value={3}>3 Winners</option>
                      <option value={4}>4 Winners</option>
                      <option value={5}>5 Winners</option>
                      <option value={6}>6 Winners</option>
                    </select>
                  </div>

                  {/* Disable Auto Calc for Free Tournaments */}
                  {newTourney.entry_type === 'PAID' ? (
                    <button 
                      type="button" 
                      onClick={handleAutoCalculatePrizes} 
                      className="w-full bg-zinc-800 hover:bg-zinc-700 text-orange-400 border border-orange-500/30 text-xs font-black uppercase py-2 rounded flex items-center justify-center gap-2 transition-all"
                    >
                      <Calculator className="w-4 h-4" /> Auto-Calculate Prizes (85% Pool)
                    </button>
                  ) : (
                    <div className="w-full bg-zinc-900 border border-zinc-800 text-zinc-500 text-[10px] font-black uppercase py-2 rounded flex flex-col items-center justify-center text-center">
                      <span>Manual Prizes Only</span>
                      <span>(Free Tournaments do not have an entry pool)</span>
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    {Array.from({ length: newTourney.total_winners }, (_, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-400 w-20"># {idx + 1} Prize:</span>
                        <input 
                          type="number" 
                          value={newTourney.prizes[idx]} 
                          onChange={e => {
                            const updated = [...newTourney.prizes];
                            updated[idx] = Number(e.target.value);
                            setNewTourney({...newTourney, prizes: updated});
                          }} 
                          className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm focus:border-orange-500 outline-none text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-emerald-950/20 p-4 rounded border border-emerald-500/20 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-xs font-black text-emerald-500 uppercase tracking-wider">Room Credentials (Optional)</h3>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase">Fill this approx 15 mins before match starts.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Room ID</label>
                      <input type="text" placeholder="e.g. 1234567" value={newTourney.room_id} onChange={e => setNewTourney({...newTourney, room_id: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm focus:border-emerald-500 outline-none text-white font-mono" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Password</label>
                      <input type="text" placeholder="e.g. bgmipro" value={newTourney.room_password} onChange={e => setNewTourney({...newTourney, room_password: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm focus:border-emerald-500 outline-none text-white font-mono" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button type="button" onClick={handleCancelForm} className="w-1/3 bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase tracking-widest py-3 rounded transition-colors border border-zinc-700">
                    Cancel
                  </button>
                  <button type="submit" disabled={uploading} className={`w-2/3 font-black uppercase tracking-widest py-3 rounded transition-colors disabled:opacity-50 flex justify-center items-center gap-2 ${editingId ? 'bg-blue-500 hover:bg-blue-400 text-black' : 'bg-orange-500 hover:bg-orange-400 text-black'}`}>
                    {uploading ? <><UploadCloud className="w-5 h-5 animate-pulse" /> Saving...</> : editingId ? 'Update Match' : 'Create Match'}
                  </button>
                </div>
              </form>
            </div>
            
            {/* MATCHES LIST */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Active Matches */}
              <div>
                <h2 className="text-xl font-black italic uppercase tracking-widest mb-6 border-b border-zinc-800 pb-2">Active Matches</h2>
                {activeMatches.length === 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 p-8 text-center rounded text-zinc-500 font-bold uppercase tracking-wider">No active matches.</div>
                ) : (
                  <div className="space-y-4">
                    {activeMatches.map((t) => {
                      const bookedCount = registrations.filter(r => r.tournament_id === t.id).length;
                      return (
                        <div key={t.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded flex flex-col sm:flex-row justify-between items-center gap-4">
                          <div className="flex items-center gap-4 w-full sm:w-auto">
                            <img src={t.map_img} alt="map" className="w-16 h-16 object-cover rounded border border-zinc-700" />
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-black italic text-lg uppercase tracking-wide">{t.name}</h3>
                                {t.entry_type === 'FREE' ? (
                                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">FREE ENTRY</span>
                                ) : (
                                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border bg-orange-500/10 text-orange-500 border-orange-500/20">₹{t.fee} ENTRY</span>
                                )}
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${t.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : t.status === 'FULL' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>{t.status}</span>
                              </div>
                              <div className="flex gap-2 text-xs font-bold text-zinc-400 mt-1">
                                <span className="text-orange-500">
                                  {t.match_time ? new Date(t.match_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : 'No Time Set'}
                                </span> • <span>{t.type}</span> • <span className="text-blue-400 font-black">{bookedCount} / {t.total_slots} SLOTS BOOKED</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap justify-end gap-2 w-full sm:w-auto">
                            <button onClick={() => router.push(`/admin/tournament/${t.id}`)} className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 px-3 py-2 rounded text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1"><Eye className="w-3 h-3"/> View Control</button>
                            <button onClick={() => handleEditClick(t)} className="bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white border border-blue-500/20 px-3 py-2 rounded text-[10px] font-black uppercase tracking-wider transition-all"><Edit3 className="w-3 h-3"/></button>
                            <button disabled={actionLoading === t.id} onClick={() => handleMarkCompleted(t)} className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 px-3 py-2 rounded text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 disabled:opacity-50"><CheckSquare className="w-3 h-3"/> Complete</button>
                            <button disabled={actionLoading === t.id} onClick={() => handleCancelMatch(t)} className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 px-3 py-2 rounded text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 disabled:opacity-50"><Ban className="w-3 h-3"/> Cancel & Refund</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Match History (Cancelled & Completed) */}
              <div>
                <h2 className="text-xl font-black italic uppercase tracking-widest mb-6 border-b border-zinc-800 pb-2 text-zinc-500">Old Match History</h2>
                {historyMatches.length === 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 p-8 text-center rounded text-zinc-500 font-bold uppercase tracking-wider">No history found.</div>
                ) : (
                  <div className="space-y-4 opacity-75">
                    {historyMatches.map((t) => {
                      const bookedCount = registrations.filter(r => r.tournament_id === t.id).length;
                      return (
                        <div key={t.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded flex flex-col sm:flex-row justify-between items-center gap-4">
                          <div className="flex items-center gap-4 w-full sm:w-auto">
                            <img src={t.map_img} alt="map" className="w-12 h-12 object-cover rounded border border-zinc-700 grayscale" />
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-black italic text-base uppercase tracking-wide text-zinc-400">{t.name}</h3>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${t.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>{t.status}</span>
                              </div>
                              <p className="text-xs font-bold text-zinc-500 mt-1">{t.type} • {t.match_time ? new Date(t.match_time).toLocaleDateString() : 'N/A'} • <span className="text-blue-400/70">{bookedCount} / {t.total_slots} SLOTS BOOKED</span></p>
                            </div>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <button onClick={() => router.push(`/admin/tournament/${t.id}`)} className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 px-4 py-2 rounded text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1"><Eye className="w-3 h-3"/> View Records</button>
                            <button disabled={actionLoading === t.id} onClick={() => handleDeleteTournament(t)} className="bg-red-900/20 text-red-500 hover:bg-red-600 hover:text-white border border-red-900/30 px-4 py-2 rounded text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 disabled:opacity-50"><Trash2 className="w-3 h-3"/> Perm Delete</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* --- LEADERBOARD TAB --- */}
        {activeTab === 'leaderboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className={`bg-zinc-900 border p-6 rounded h-fit ${editingLeaderboardId ? 'border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 'border-zinc-800'}`}>
              
              {editingLeaderboardId ? (
                <div className="mb-6 flex flex-col gap-4 border-b border-blue-500/30 pb-4">
                  <div className="flex items-center gap-2 text-blue-400 font-black italic tracking-widest uppercase">
                    <Edit3 className="w-5 h-5"/> Editing Winner
                  </div>
                  <button type="button" onClick={handleCancelLeaderboardEdit} className="bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold px-4 py-3 rounded uppercase tracking-wider transition-colors border border-zinc-700 flex items-center justify-center gap-2 w-full">
                    <PlusCircle className="w-4 h-4"/> Post New Winner Instead
                  </button>
                </div>
              ) : (
                <h2 className="text-xl font-black italic uppercase tracking-widest mb-6 border-b border-zinc-800 pb-4 text-orange-500">Post Official Winner</h2>
              )}

              <form onSubmit={handleSaveLeaderboard} className="space-y-4 text-sm font-bold">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Match Date</label>
                  <input required type="date" value={newLeaderboard.match_date} onChange={e => setNewLeaderboard({...newLeaderboard, match_date: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded text-zinc-300 focus:border-orange-500 outline-none [color-scheme:dark]" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Tournament Name</label>
                  <input required type="text" placeholder="e.g. Erangel Squad TPP" value={newLeaderboard.tournament_name} onChange={e => setNewLeaderboard({...newLeaderboard, tournament_name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded text-white focus:border-orange-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-orange-500 uppercase tracking-wider block mb-1">Winner / Squad Name</label>
                  <input required type="text" placeholder="Team Alpha" value={newLeaderboard.team_name} onChange={e => setNewLeaderboard({...newLeaderboard, team_name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded border-l-4 border-l-orange-500 text-white focus:border-orange-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Captain / Team ID (Optional)</label>
                  <input type="text" placeholder="e.g. 554312345" value={newLeaderboard.team_id} onChange={e => setNewLeaderboard({...newLeaderboard, team_id: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded text-zinc-400 focus:border-orange-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-emerald-500 uppercase tracking-wider block mb-1">Prize Won (₹)</label>
                  <input required type="number" placeholder="1500" value={newLeaderboard.prize_won} onChange={e => setNewLeaderboard({...newLeaderboard, prize_won: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded text-emerald-400 focus:border-emerald-500 outline-none font-black" />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Status</label>
                  <select value={newLeaderboard.status} onChange={e => setNewLeaderboard({...newLeaderboard, status: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded text-white focus:border-orange-500 outline-none">
                    <option value="Draft">Draft (Hidden)</option>
                    <option value="Under Review">Under Review (Hidden)</option>
                    <option value="Published">Published (Public)</option>
                  </select>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                    Winner Screenshot {editingLeaderboardId && '(Leave blank to keep existing)'}
                  </label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => setLeaderboardImageFile(e.target.files?.[0] || null)} 
                    className="w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-[10px] file:font-black file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 cursor-pointer" 
                  />
                  {newLeaderboard.screenshot_url && !leaderboardImageFile && (
                    <div className="mt-3 relative h-20 w-full rounded overflow-hidden border border-zinc-800">
                      <img src={newLeaderboard.screenshot_url} alt="Current" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-white">Current Image</div>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={leaderboardUploading} className={`w-full font-black uppercase tracking-widest py-3 rounded transition-colors mt-4 disabled:opacity-50 flex items-center justify-center gap-2 ${editingLeaderboardId ? 'bg-blue-500 hover:bg-blue-400 text-black' : 'bg-orange-500 hover:bg-orange-400 text-black'}`}>
                  {leaderboardUploading ? 'Saving...' : editingLeaderboardId ? 'Update Winner' : 'Publish to Leaderboard'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-black italic uppercase tracking-widest mb-6">Winner Database</h2>
              {leaderboards.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 p-8 text-center rounded text-zinc-500 font-bold uppercase tracking-wider">No winners recorded yet.</div>
              ) : (
                <div className="space-y-4">
                  {leaderboards.map((l) => {
                    const statusColors: any = {
                      'Published': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                      'Under Review': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                      'Draft': 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    };
                    const statusClass = statusColors[l.status || 'Draft'] || statusColors['Draft'];
                    const displayTeamName = l.team_name || l.winner_1_team || 'Unknown Team'; // Backwards compatibility

                    return (
                      <div key={l.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          {l.screenshot_url ? (
                            <img src={l.screenshot_url} alt="Winner" className="w-16 h-16 object-cover rounded border border-zinc-700 bg-zinc-950" />
                          ) : (
                            <div className="w-16 h-16 rounded border border-zinc-800 bg-zinc-950 flex items-center justify-center text-zinc-700">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${statusClass}`}>{l.status || 'Draft'}</span>
                              <span className="text-[10px] text-zinc-500 font-black tracking-widest uppercase">{l.match_date}</span>
                            </div>
                            <h3 className="font-black text-lg text-white">🥇 {displayTeamName}</h3>
                            <p className="text-xs font-bold text-zinc-400">{l.tournament_name || 'Legacy Match'} <span className="text-emerald-500 ml-2">₹{l.prize_won || 'N/A'}</span></p>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto justify-end">
                          <button onClick={() => handleEditLeaderboard(l)} className="bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white border border-blue-500/20 px-3 py-2 rounded text-[10px] font-black uppercase tracking-wider transition-all">
                            <Edit3 className="w-3 h-3"/>
                          </button>
                          <button onClick={() => handleDeleteLeaderboard(l.id)} className="bg-zinc-800 hover:bg-red-900 text-red-500 hover:text-white border border-zinc-700 px-3 py-2 rounded text-[10px] font-black uppercase tracking-wider transition-all">
                            <Trash2 className="w-3 h-3"/>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                    <h3 className="text-orange-500 font-black uppercase tracking-wide mb-2">{r.title}</h3>
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
