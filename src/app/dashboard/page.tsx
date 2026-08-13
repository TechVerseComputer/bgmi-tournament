'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, History, QrCode, ShieldCheck, X, Home, LogOut, Gamepad2, Clock, Key, AlertCircle, UploadCloud, ImageIcon, CheckCircle2, ArrowLeft, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// --- TRANSACTION CONFIGURATION ---
const MIN_DEPOSIT = 50;
const MAX_DEPOSIT = 50000;
const MIN_WITHDRAWAL = 100;
const MAX_WITHDRAWAL = 20000;

export default function PlayerDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [wallet, setWallet] = useState({ balance: 0, total_deposited: 0, total_won: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [myMatches, setMyMatches] = useState<any[]>([]);
  const [myResults, setMyResults] = useState<any[]>([]); 
  
  // Deposit States
  const [depositAmount, setDepositAmount] = useState<number | ''>('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const quickAmounts = [50, 100, 200, 500, 1000, 2000];

  // Withdraw States
  const [withdrawAmount, setWithdrawAmount] = useState<number | ''>('');
  const [upiId, setUpiId] = useState('');

  // Screenshot Submission States
  const [resultModalObj, setResultModalObj] = useState<any>(null);
  const [resultFile, setResultFile] = useState<File | null>(null);
  const [resultPreview, setResultPreview] = useState<string | null>(null);
  const [isUploadingResult, setIsUploadingResult] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        fetchWalletData(session.user.id);
      } else {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  const fetchWalletData = async (userId: string) => {
    let { data: walletData } = await supabase.from('wallets').select('*').eq('user_id', userId).single();
    
    if (!walletData) {
      const { data: newWallet } = await supabase.from('wallets').insert([{ user_id: userId }]).select().single();
      walletData = newWallet;
    }
    
    if (walletData) setWallet(walletData);

    const { data: txData } = await supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (txData) setTransactions(txData);

    const { data: regs } = await supabase.from('registrations').select('*, tournaments(*)').eq('user_id', userId).order('created_at', { ascending: false });
    if (regs) setMyMatches(regs);
    
    const { data: resultsData } = await supabase.from('match_results').select('*').eq('user_id', userId);
    if (resultsData) setMyResults(resultsData);
    
    setAuthLoading(false);
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/dashboard' }});
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // --- ADMIN NOTIFICATION HELPER ---
  const notifyAdmin = async (type: string, message: string, amount: number | null = null) => {
    try {
      await supabase.from('admin_notifications').insert([{
        type,
        message,
        player_name: user?.email || 'Unknown Player',
        amount
      }]);
    } catch (err) {
      console.error("Admin notification failed silently", err);
    }
  };

  const handleProceedToDeposit = () => {
    const amount = Number(depositAmount);
    if (!amount || amount <= 0) return alert("Please enter a valid amount.");
    if (amount < MIN_DEPOSIT) return alert(`Minimum deposit amount is ₹${MIN_DEPOSIT}.`);
    if (amount > MAX_DEPOSIT) return alert(`Maximum deposit amount is ₹${MAX_DEPOSIT}.`);
    
    setShowQRModal(true);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = Number(depositAmount);
    if (amount < MIN_DEPOSIT) return alert(`Minimum deposit amount is ₹${MIN_DEPOSIT}.`);
    if (amount > MAX_DEPOSIT) return alert(`Maximum deposit amount is ₹${MAX_DEPOSIT}.`);
    
    if (!utrNumber || utrNumber.length < 12) return alert("Please enter a valid 12-digit UTR number.");
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amount, utrNumber, userEmail: user.email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert("Deposit request submitted! Our team will verify the UTR shortly.");
      setShowQRModal(false);
      setDepositAmount('');
      setUtrNumber('');
      fetchWalletData(user.id);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (wallet.balance < MIN_WITHDRAWAL) {
      return alert(`Minimum withdrawal amount is ₹${MIN_WITHDRAWAL}. Your current balance is below the minimum withdrawal limit.`);
    }

    const amount = Number(withdrawAmount);
    
    if (!amount || amount <= 0) return alert("Please enter a valid amount.");
    if (amount < MIN_WITHDRAWAL) return alert(`Minimum withdrawal amount is ₹${MIN_WITHDRAWAL}.`);
    if (amount > MAX_WITHDRAWAL) return alert(`Maximum withdrawal amount is ₹${MAX_WITHDRAWAL}.`);
    
    if (amount > wallet.balance) return alert("Insufficient balance.");
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amount, upiId, userEmail: user.email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert("Withdrawal request submitted! Funds will be transferred shortly.");
      setWithdrawAmount('');
      setUpiId('');
      fetchWalletData(user.id);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResultImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResultFile(file);
      const objectUrl = URL.createObjectURL(file);
      setResultPreview(objectUrl);
    }
  };

  const submitMatchResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultFile || !resultModalObj) return alert("Please select an image first.");
    
    setIsUploadingResult(true);
    try {
      const fileExt = resultFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `screenshots/${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from('match-results').upload(filePath, resultFile);
      if (uploadError) throw uploadError;
      
      const { data: publicUrlData } = supabase.storage.from('match-results').getPublicUrl(filePath);

      const res = await fetch('/api/tournaments/submit-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: resultModalObj.tournament_id,
          registrationId: resultModalObj.id,
          userId: user.id,
          imageUrl: publicUrlData.publicUrl
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert("Result submitted successfully! Our admins will review it shortly.");
      setResultModalObj(null);
      setResultFile(null);
      setResultPreview(null);
      fetchWalletData(user.id);
    } catch (err: any) {
      alert("Upload Error: " + err.message);
    } finally {
      setIsUploadingResult(false);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-[#050505] text-emerald-500 flex items-center justify-center font-black animate-pulse tracking-widest uppercase">Loading Secure Portal...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 text-center">
        <Wallet className="w-16 h-16 text-emerald-500 mb-6" />
        <h1 className="text-4xl font-black italic text-white mb-2 uppercase tracking-widest">Player Portal</h1>
        <p className="text-zinc-400 mb-8 font-medium">Login to manage your wallet, deposits, and winnings.</p>
        <button onClick={handleLogin} className="bg-white hover:bg-gray-200 text-black font-black uppercase tracking-wider px-8 py-4 rounded flex items-center gap-3 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
          Sign in with Google
        </button>
      </div>
    );
  }

  // Pre-calculate upcoming match for mobile app view & desktop widgets
  const upcomingMatches = myMatches.filter((m: any) => {
    const t = Array.isArray(m.tournaments) ? m.tournaments[0] : m.tournaments;
    return t && t.status !== 'COMPLETED' && t.status !== 'CANCELLED';
  });
  const nextMatch = upcomingMatches.length > 0 ? upcomingMatches[0] : null;

  // --- DYNAMIC CALCULATIONS ---
  const actualWinnings = transactions
    .filter(tx => tx.type === 'PRIZE_WIN' && tx.status === 'SUCCESS')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    
  const matchesPlayedCount = myMatches.length;
  const matchesWonCount = transactions.filter(tx => tx.type === 'PRIZE_WIN' && tx.status === 'SUCCESS').length;

  return (
    <main className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans pb-28 md:pb-24">
      <div className="max-w-6xl mx-auto">
        
        {/* --- DESKTOP HEADER (Hidden on Mobile) --- */}
        <div className="hidden md:flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-3">
            <Wallet className="w-8 h-8 text-emerald-500" />
            <div>
              <h1 className="text-2xl font-black italic tracking-wider">PLAYER DASHBOARD</h1>
              <p className="text-zinc-400 text-xs font-medium">Logged in as <span className="text-emerald-500 font-bold">{user.email}</span></p>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={() => router.push('/')} className="flex-1 md:flex-none bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2.5 rounded text-sm font-bold border border-zinc-700 transition-colors flex items-center justify-center gap-2">
              <Home className="w-4 h-4"/> Home
            </button>
            <button onClick={handleLogout} className="flex-1 md:flex-none bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2.5 rounded text-sm font-bold border border-red-500/20 transition-colors flex items-center justify-center gap-2">
              <LogOut className="w-4 h-4"/> Logout
            </button>
          </div>
        </div>

        {/* --- MOBILE APP HEADER (Visible only on Mobile) --- */}
        <div className="md:hidden flex justify-between items-center mb-6 pt-2">
          <div>
            <h1 className="text-2xl font-black italic tracking-wider">ACCOUNT</h1>
            <p className="text-zinc-500 text-[10px] font-bold tracking-wide truncate max-w-[200px]">{user.email}</p>
          </div>
          <button onClick={handleLogout} className="bg-red-500/10 border border-red-500/20 text-red-500 p-2.5 rounded-full hover:bg-red-500 hover:text-white transition-colors" aria-label="Logout">
            <LogOut className="w-4 h-4"/>
          </button>
        </div>

        {/* --- DESKTOP TAB NAVIGATION (Hidden on Mobile) --- */}
        <div className="hidden md:flex flex-wrap gap-2 mb-8 bg-zinc-900 p-1 rounded-lg border border-zinc-800 w-full md:w-fit">
          {[
            { id: 'overview', icon: Wallet, label: 'Overview' },
            { id: 'matches', icon: Gamepad2, label: 'My Matches' },
            { id: 'deposit', icon: ArrowDownToLine, label: 'Deposit' },
            { id: 'withdraw', icon: ArrowUpFromLine, label: 'Withdraw' },
            { id: 'history', icon: History, label: 'History' }
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* --- OVERVIEW TAB --- */}
        {activeTab === 'overview' && (
          <>
            {/* --- UPGRADED DESKTOP VIEW --- */}
            <div className="hidden md:flex flex-col space-y-6">
              
              {/* QUICK STATS ROW */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Balance */}
                <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-xl p-5 flex flex-col justify-center relative overflow-hidden group hover:border-emerald-500/50 transition-colors shadow-lg">
                  <div className="absolute -right-4 -top-4 opacity-5"><Wallet size={80}/></div>
                  <p className="text-zinc-500 font-bold text-xs uppercase tracking-wider mb-1">Available Balance</p>
                  <p className="text-3xl font-black text-white">₹{wallet.balance}</p>
                </div>
                {/* Deposited */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-center relative overflow-hidden group hover:border-emerald-500/30 transition-colors shadow-lg">
                  <p className="text-zinc-500 font-bold text-xs uppercase tracking-wider mb-1">Total Deposited</p>
                  <p className="text-2xl font-black text-emerald-500">₹{wallet.total_deposited}</p>
                </div>
                {/* Winnings */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-center relative overflow-hidden group hover:border-amber-500/30 transition-colors shadow-lg">
                  <p className="text-zinc-500 font-bold text-xs uppercase tracking-wider mb-1">Total Winnings</p>
                  <p className="text-2xl font-black text-amber-500">₹{actualWinnings}</p>
                </div>
                {/* Matches Played */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-center relative overflow-hidden group hover:border-blue-500/30 transition-colors shadow-lg">
                  <p className="text-zinc-500 font-bold text-xs uppercase tracking-wider mb-1">Matches Played</p>
                  <p className="text-2xl font-black text-white">{matchesPlayedCount}</p>
                </div>
                {/* Matches Won */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-center relative overflow-hidden group hover:border-orange-500/30 transition-colors shadow-lg">
                  <p className="text-zinc-500 font-bold text-xs uppercase tracking-wider mb-1">Matches Won</p>
                  <p className="text-2xl font-black text-orange-500">{matchesWonCount}</p>
                </div>
              </div>

              {/* MAIN CONTENT GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT COLUMN */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* WALLET ACTIONS */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex items-center justify-between shadow-lg">
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-widest mb-1 text-white">Wallet Management</h3>
                      <p className="text-xs font-bold text-zinc-500">Deposit funds to join matches or withdraw your winnings instantly.</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setActiveTab('deposit')} className="bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <ArrowDownToLine className="w-4 h-4"/> Add Money
                      </button>
                      <button onClick={() => setActiveTab('withdraw')} className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 font-black uppercase tracking-wider px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-lg">
                        <ArrowUpFromLine className="w-4 h-4"/> Withdraw
                      </button>
                    </div>
                  </div>

                  {/* RECENT / UPCOMING MATCHES PREVIEW */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg">
                    <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                      <h3 className="font-black italic text-lg uppercase tracking-widest text-zinc-300 flex items-center gap-2">
                        <Gamepad2 className="w-5 h-5 text-orange-500"/> My Upcoming Drops
                      </h3>
                      <button onClick={() => setActiveTab('matches')} className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1.5 rounded transition-colors border border-orange-500/20">
                        Manage All
                      </button>
                    </div>

                    {upcomingMatches.length === 0 ? (
                      <div className="text-center py-8 opacity-70">
                        <p className="text-zinc-500 font-bold text-sm uppercase tracking-wider mb-4">No active matches found.</p>
                        <Link href="/tournaments" className="inline-block bg-orange-500 text-black px-6 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest transition-colors hover:bg-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]">Explore Tournaments</Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {upcomingMatches.slice(0, 3).map((m: any, idx: number) => {
                          const t = Array.isArray(m.tournaments) ? m.tournaments[0] : m.tournaments;
                          if (!t) return null;
                          return (
                            <div key={idx} className="bg-zinc-950 border border-zinc-800/80 p-4 rounded-lg flex justify-between items-center group hover:border-zinc-700 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-md bg-zinc-800 overflow-hidden shrink-0 border border-zinc-800">
                                  <img src={t.map_img} alt="map" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div>
                                  <h4 className="font-black text-white uppercase tracking-wider text-sm">{t.name}</h4>
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 mt-1">
                                    <span className="flex items-center gap-1 text-emerald-500"><Clock className="w-3 h-3"/> {t.match_time ? new Date(t.match_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' }) : 'TBA'}</span>
                                    <span>•</span>
                                    <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-white border border-zinc-700">SLOT {m.slot_number}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`text-[9px] font-black uppercase px-2.5 py-1.5 rounded border ${t.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>{t.status || 'OPEN'}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="lg:col-span-1">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg h-full flex flex-col">
                    <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                      <h3 className="font-black italic text-lg uppercase tracking-widest text-zinc-300 flex items-center gap-2">
                        <History className="w-5 h-5 text-zinc-400"/> Activity
                      </h3>
                      <button onClick={() => setActiveTab('history')} className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded transition-colors">
                        Full Ledger
                      </button>
                    </div>

                    <div className="flex-1">
                      {transactions.length > 0 ? (
                        <div className="space-y-4">
                          {transactions.slice(0, 6).map(tx => (
                            <div key={tx.id} className="flex justify-between items-center bg-zinc-950 p-3.5 rounded-lg border border-zinc-800/50 group hover:border-zinc-700 transition-colors">
                              <div className="flex items-center gap-3 min-w-0 pr-2">
                                <div className={`p-2 rounded-full shrink-0 border ${tx.type === 'DEPOSIT' || tx.type === 'PRIZE_WIN' || tx.type === 'REFUND' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                  {tx.type === 'DEPOSIT' || tx.type === 'PRIZE_WIN' || tx.type === 'REFUND' ? <ArrowDownToLine size={14}/> : <ArrowUpFromLine size={14}/>}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[10px] font-bold text-white truncate">{tx.description}</p>
                                  <p className="text-[9px] text-zinc-500 font-mono mt-0.5">{new Date(tx.created_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className={`text-sm font-black ${tx.type === 'DEPOSIT' || tx.type === 'PRIZE_WIN' || tx.type === 'REFUND' ? 'text-emerald-500' : 'text-white'}`}>
                                  {tx.type === 'DEPOSIT' || tx.type === 'PRIZE_WIN' || tx.type === 'REFUND' ? '+' : '-'}₹{tx.amount}
                                </p>
                                <p className={`text-[8px] font-black uppercase tracking-wider mt-0.5 ${tx.status === 'PENDING' ? 'text-amber-500' : tx.status === 'SUCCESS' ? 'text-emerald-500' : 'text-red-500'}`}>{tx.status}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full opacity-50 py-10">
                          <History className="w-8 h-8 text-zinc-600 mb-3"/>
                          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">No activity yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MOBILE VIEW (App-Like Flow - UNTOUCHED) */}
            <div className="md:hidden space-y-6">
              {/* Premium Compact Wallet Card */}
              <div className="bg-gradient-to-br from-[#121215] to-[#0a0a0c] border border-zinc-800 rounded-2xl p-5 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03]"><Wallet size={120}/></div>
                <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest mb-1">Available Balance</p>
                <p className="text-4xl font-black text-white mb-5 tracking-tight">₹{wallet.balance}</p>
                
                <div className="flex justify-between border-t border-zinc-800/80 pt-4">
                  <div>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-0.5">Deposited</p>
                    <p className="text-xs font-black text-emerald-500">₹{wallet.total_deposited}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-0.5">Winnings</p>
                    <p className="text-xs font-black text-amber-500">₹{actualWinnings}</p>
                  </div>
                </div>
              </div>

              {/* Primary Actions Grid */}
              <div className="flex gap-3">
                <button onClick={() => setActiveTab('deposit')} className="flex-1 bg-emerald-500 active:scale-95 text-black py-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(16,185,129,0.2)] transition-transform">
                  <ArrowDownToLine size={16}/> Add Money
                </button>
                <button onClick={() => setActiveTab('withdraw')} className="flex-1 bg-zinc-800 active:scale-95 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border border-zinc-700 shadow-lg transition-transform">
                  <ArrowUpFromLine size={16}/> Withdraw
                </button>
              </div>

              {/* My Matches Compact Feed */}
              <div>
                <div className="flex justify-between items-end mb-3 px-1">
                  <h3 className="font-black text-xs uppercase tracking-wider text-zinc-300">My Matches</h3>
                  {myMatches.length > 0 && (
                    <button onClick={() => setActiveTab('matches')} className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">View All</button>
                  )}
                </div>
                
                {nextMatch ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3 shadow-lg">
                    <div className="flex justify-between items-start">
                      <div className="pr-4">
                        <h4 className="font-black italic text-lg text-white leading-tight truncate">{nextMatch.tournaments.name || 'Tournament'}</h4>
                        <p className="text-xs text-zinc-400 font-bold mt-1">
                          {nextMatch.tournaments.match_time ? new Date(nextMatch.tournaments.match_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : 'TBA'}
                        </p>
                      </div>
                      <span className="bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider shrink-0">
                        ₹{nextMatch.tournaments.fee} Entry
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center bg-zinc-950 p-3 rounded-lg border border-zinc-800/80">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Booked Slot</span>
                        <span className="text-sm font-black text-white">S{nextMatch.slot_number}</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Status</span>
                        <span className="text-xs font-black text-emerald-500">{nextMatch.tournaments.status || 'OPEN'}</span>
                      </div>
                    </div>
                    
                    <button onClick={() => setActiveTab('matches')} className="w-full bg-zinc-800 active:scale-95 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-lg border border-zinc-700 transition-transform">
                      Manage Match
                    </button>
                  </div>
                ) : (
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
                    <Gamepad2 className="w-8 h-8 text-zinc-600 mx-auto mb-3"/>
                    <p className="text-xs font-bold text-zinc-400 mb-4">No upcoming matches scheduled.</p>
                    <Link href="/tournaments" className="inline-block bg-orange-500 text-black px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest">Explore Tournaments</Link>
                  </div>
                )}
              </div>

              {/* Recent Activity Feed */}
              <div className="pt-2">
                <div className="flex justify-between items-end mb-3 px-1">
                  <h3 className="font-black text-xs uppercase tracking-wider text-zinc-300">Recent Activity</h3>
                  {transactions.length > 0 && (
                    <button onClick={() => setActiveTab('history')} className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Full Ledger</button>
                  )}
                </div>

                {transactions.length > 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800 shadow-lg">
                    {transactions.slice(0, 3).map(tx => (
                      <div key={tx.id} className="p-3 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full shrink-0 ${tx.type === 'DEPOSIT' || tx.type === 'PRIZE_WIN' || tx.type === 'REFUND' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            {tx.type === 'DEPOSIT' || tx.type === 'PRIZE_WIN' || tx.type === 'REFUND' ? <ArrowDownToLine size={14}/> : <ArrowUpFromLine size={14}/>}
                          </div>
                          <div className="min-w-0 pr-2">
                            <p className="text-[11px] font-bold text-white truncate w-full">{tx.description}</p>
                            <p className="text-[9px] text-zinc-500 font-mono mt-0.5">{new Date(tx.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-black ${tx.type === 'DEPOSIT' || tx.type === 'PRIZE_WIN' || tx.type === 'REFUND' ? 'text-emerald-500' : 'text-white'}`}>
                            {tx.type === 'DEPOSIT' || tx.type === 'PRIZE_WIN' || tx.type === 'REFUND' ? '+' : '-'}₹{tx.amount}
                          </p>
                          <span className={`text-[8px] font-black uppercase tracking-wider ${tx.status === 'PENDING' ? 'text-amber-500' : tx.status === 'SUCCESS' ? 'text-emerald-500' : 'text-red-500'}`}>{tx.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
                    <History className="w-8 h-8 text-zinc-600 mx-auto mb-2"/>
                    <p className="text-xs font-bold text-zinc-400">No recent transactions.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* --- MY MATCHES TAB --- */}
        {activeTab === 'matches' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-6 max-w-5xl mx-auto">
            <div className="md:hidden mb-4">
              <button onClick={() => setActiveTab('overview')} className="flex items-center gap-1 text-zinc-400 text-[10px] font-black uppercase tracking-wider"><ArrowLeft className="w-3 h-3"/> Back to Hub</button>
            </div>
            <h2 className="text-lg font-black uppercase flex items-center gap-2 mb-6"><Gamepad2 className="w-5 h-5 text-orange-500"/> My Tournaments & Results</h2>
            
            {myMatches.length === 0 ? (
              <div className="text-center py-12 bg-zinc-950 rounded-lg border border-zinc-800">
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs md:text-sm">You haven&apos;t joined any matches yet.</p>
                <button onClick={() => router.push('/tournaments')} className="mt-4 bg-orange-500 hover:bg-orange-400 text-black font-black px-6 py-3 rounded uppercase text-xs transition-colors">Browse Tournaments</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {myMatches.map((m: any, idx: number) => {
                  const tourney = Array.isArray(m.tournaments) ? m.tournaments[0] : m.tournaments;
                  if (!tourney) return null;

                  const submittedResult = myResults.find(r => r.registration_id === m.id);
                  const isMatchActive = tourney.status === 'FULL' || tourney.status === 'COMPLETED' || tourney.status === 'UNDER REVIEW';
                  const needsSubmission = isMatchActive && (!submittedResult || submittedResult.status === 'REJECTED');

                  return (
                    <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 md:p-5 flex flex-col justify-between shadow-lg">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className="pr-3">
                            <h3 className="font-black italic text-base md:text-lg tracking-wider text-white leading-tight">{tourney.name || 'Tournament'}</h3>
                            <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] md:text-xs font-bold mt-1.5">
                              <Clock className="w-3 h-3 text-orange-500" />
                              {tourney.match_time ? new Date(tourney.match_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : 'TBA'}
                            </div>
                          </div>
                          <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded border shrink-0 ${tourney.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : tourney.status === 'UNDER REVIEW' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse' : tourney.status === 'FULL' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                            {tourney.status || 'OPEN'}
                          </span>
                        </div>
                        
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 mb-4 flex justify-between items-center">
                          <div>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Booked Slot</p>
                            <p className="text-lg font-black text-orange-500">S{m.slot_number}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Squad Name</p>
                            <p className="text-sm font-bold text-white">{m.squad_name}</p>
                          </div>
                        </div>

                        {/* --- ROOM CREDENTIALS WIDGET --- */}
                        {tourney.room_id ? (
                          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-lg p-4 mb-4">
                            <div className="flex items-center gap-2 mb-3 border-b border-emerald-500/20 pb-2">
                              <Key className="w-4 h-4 text-emerald-500" />
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Room Unlocked</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Room ID</p>
                                <p className="font-mono font-black text-white select-all text-xs md:text-sm">{tourney.room_id}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Password</p>
                                <p className="font-mono font-black text-white select-all text-xs md:text-sm">{tourney.room_password}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-lg p-4 mb-4 flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-black text-amber-500 uppercase tracking-wider mb-1">Details Pending</p>
                              <p className="text-[9px] text-zinc-400 font-bold leading-relaxed">Room ID & Pass will appear 15 mins before start.</p>
                            </div>
                          </div>
                        )}

                        {/* --- SCREENSHOT SUBMISSION STATUS UI --- */}
                        {submittedResult && (
                          <div className={`p-3 md:p-4 rounded-lg border mb-4 ${
                            submittedResult.status === 'PENDING' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                            submittedResult.status === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' :
                            'bg-red-500/10 border-red-500/30 text-red-500'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              {submittedResult.status === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
                              {submittedResult.status === 'APPROVED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                              {submittedResult.status === 'REJECTED' && <AlertCircle className="w-3.5 h-3.5" />}
                              <p className="text-[10px] md:text-xs font-black uppercase tracking-wider">Result: {submittedResult.status}</p>
                            </div>
                            {submittedResult.status === 'REJECTED' && submittedResult.admin_note && (
                              <p className="text-[9px] md:text-[10px] mt-2 font-bold text-red-400 bg-red-950/40 p-2 rounded">Note: {submittedResult.admin_note}</p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 mt-2">
                        <Link href={`/tournaments/${tourney.id}`} className="flex-1 text-center bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase tracking-wider py-3 rounded-lg text-[10px] md:text-xs transition-colors border border-zinc-700">
                          View Match
                        </Link>
                        {needsSubmission && (
                          <button onClick={() => setResultModalObj({ ...m, tournament_id: tourney.id })} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider py-3 rounded-lg text-[10px] md:text-xs transition-colors shadow-lg flex items-center justify-center gap-1.5">
                            <UploadCloud className="w-3.5 h-3.5" /> Submit Result
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- DEPOSIT TAB --- */}
        {activeTab === 'deposit' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-6 max-w-3xl mx-auto">
            <div className="md:hidden mb-4">
              <button onClick={() => setActiveTab('overview')} className="flex items-center gap-1 text-zinc-400 text-[10px] font-black uppercase tracking-wider"><ArrowLeft className="w-3 h-3"/> Back to Hub</button>
            </div>
            <h2 className="text-lg font-black uppercase flex items-center gap-2 mb-6"><ArrowDownToLine className="w-5 h-5 text-emerald-500"/> Add Money</h2>
            
            <div className="mb-6">
              <p className="text-[10px] md:text-xs text-zinc-400 font-bold uppercase tracking-wider mb-3">Quick Select</p>
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                {quickAmounts.map(amt => (
                  <button key={amt} type="button" onClick={() => setDepositAmount(amt)} className={`py-3 rounded-lg font-black border text-xs transition-all ${depositAmount === amt ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-emerald-500/50'}`}>
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <p className="text-[10px] md:text-xs text-zinc-400 font-bold uppercase tracking-wider mb-3">Or enter custom amount</p>
              <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(Number(e.target.value))} placeholder="Enter amount" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-black text-xl md:text-2xl focus:border-emerald-500 outline-none text-white" />
              <div className="flex justify-between text-[9px] md:text-[10px] text-zinc-500 font-bold uppercase mt-2">
                <span>Min ₹{MIN_DEPOSIT}</span><span>Max ₹{MAX_DEPOSIT.toLocaleString()}</span>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-6 mb-6 space-y-3 text-xs md:text-sm font-bold">
              <div className="flex justify-between text-zinc-400"><p>Deposit Amount</p><p>₹{depositAmount || 0}</p></div>
              <div className="flex justify-between text-zinc-400"><p>Processing Fee</p><p className="text-emerald-500">FREE</p></div>
              <div className="flex justify-between text-base md:text-lg text-white border-t border-zinc-800 pt-3"><p>Total to Pay</p><p>₹{depositAmount || 0}</p></div>
            </div>

            <button onClick={handleProceedToDeposit} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg">
              ⚡ Pay ₹{depositAmount || 0} via UPI
            </button>
          </div>
        )}

        {/* --- WITHDRAW TAB --- */}
        {activeTab === 'withdraw' && (
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-6 max-w-3xl mx-auto">
             <div className="md:hidden mb-4">
               <button onClick={() => setActiveTab('overview')} className="flex items-center gap-1 text-zinc-400 text-[10px] font-black uppercase tracking-wider"><ArrowLeft className="w-3 h-3"/> Back to Hub</button>
             </div>
             <h2 className="text-lg font-black uppercase flex items-center gap-2 mb-6"><ArrowUpFromLine className="w-5 h-5 text-zinc-400"/> Withdraw Winnings</h2>
             
             <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl mb-6 flex justify-between items-center">
               <div>
                 <p className="text-emerald-500 font-bold text-[10px] md:text-xs uppercase mb-1">Available to Withdraw</p>
                 <p className="text-2xl md:text-3xl font-black text-white">₹{wallet.balance}</p>
               </div>
               <Wallet className="w-8 h-8 text-emerald-500/50" />
             </div>

             <form onSubmit={handleWithdrawSubmit} className="space-y-6">
               <div>
                 <label className="text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">Amount to Withdraw</label>
                 <input required type="number" min={MIN_WITHDRAWAL} max={wallet.balance} value={withdrawAmount} onChange={(e) => setWithdrawAmount(Number(e.target.value))} placeholder={`Min ₹${MIN_WITHDRAWAL}`} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-black text-xl focus:border-emerald-500 outline-none text-white" />
                 <div className="flex justify-between text-[9px] md:text-[10px] text-zinc-500 font-bold uppercase mt-2">
                    <span>Min ₹{MIN_WITHDRAWAL}</span><span>Max ₹{MAX_WITHDRAWAL.toLocaleString()}</span>
                  </div>
               </div>
               <div>
                 <label className="text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">Your UPI ID</label>
                 <input required type="text" placeholder="e.g. 9876543210@ybl" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-bold text-sm md:text-base focus:border-emerald-500 outline-none text-white" />
               </div>
               <button type="submit" disabled={isSubmitting} className="w-full bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg">
                 {isSubmitting ? 'Processing...' : 'Request Withdrawal'}
               </button>
             </form>
           </div>
        )}

        {/* --- HISTORY TAB --- */}
        {activeTab === 'history' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-6 max-w-4xl mx-auto">
            <div className="md:hidden mb-4">
              <button onClick={() => setActiveTab('overview')} className="flex items-center gap-1 text-zinc-400 text-[10px] font-black uppercase tracking-wider"><ArrowLeft className="w-3 h-3"/> Back to Hub</button>
            </div>
            <h2 className="text-lg font-black uppercase flex items-center gap-2 mb-6"><History className="w-5 h-5 text-zinc-400"/> Transaction Ledger</h2>
            
            {transactions.length === 0 ? (
              <div className="text-center py-12 bg-zinc-950 rounded-lg border border-zinc-800">
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs md:text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map(tx => (
                  <div key={tx.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className={`p-2.5 md:p-3 rounded-full shrink-0 ${tx.type === 'DEPOSIT' || tx.type === 'PRIZE_WIN' || tx.type === 'REFUND' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {tx.type === 'DEPOSIT' || tx.type === 'PRIZE_WIN' || tx.type === 'REFUND' ? <ArrowDownToLine className="w-4 h-4 md:w-5 md:h-5"/> : <ArrowUpFromLine className="w-4 h-4 md:w-5 md:h-5"/>}
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs md:text-sm leading-tight max-w-[180px] md:max-w-none truncate">{tx.description}</p>
                        <p className="text-[10px] md:text-xs text-zinc-500 mt-1 font-mono">{new Date(tx.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-black text-base md:text-lg ${tx.type === 'DEPOSIT' || tx.type === 'PRIZE_WIN' || tx.type === 'REFUND' ? 'text-emerald-500' : 'text-white'}`}>
                        {tx.type === 'DEPOSIT' || tx.type === 'PRIZE_WIN' || tx.type === 'REFUND' ? '+' : '-'}₹{tx.amount}
                      </p>
                      <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${tx.status === 'PENDING' ? 'bg-amber-500/20 text-amber-500' : tx.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- ZAPUPI QR MODAL --- */}
        {showQRModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="bg-[#1c1c24] w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 relative flex flex-col md:flex-row my-8">
              <button onClick={() => setShowQRModal(false)} className="absolute top-4 right-4 bg-zinc-800 p-2 rounded-full text-zinc-400 hover:text-white z-10"><X className="w-5 h-5"/></button>
              
              {/* Left Side: QR Code */}
              <div className="bg-white p-8 flex flex-col items-center justify-center w-full md:w-1/2 shrink-0">
                <h3 className="text-black font-black uppercase tracking-widest mb-6 flex items-center gap-2"><QrCode className="w-5 h-5"/> Scan & Pay</h3>
                <div className="bg-white p-2 rounded-xl shadow-lg mb-6 border border-zinc-200">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=digitallibrary@slc&pn=BGMI+Arena&am=${depositAmount}`} alt="UPI QR" className="w-40 h-40 md:w-48 md:h-48" />
                </div>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider text-center">GPay • PhonePe • Paytm</p>
              </div>

              {/* Right Side: Details & Input */}
              <div className="p-6 md:p-8 w-full md:w-1/2 flex flex-col justify-center bg-[#1c1c24]">
                <div className="text-center mb-8">
                  <p className="text-zinc-400 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-2">Amount to Pay</p>
                  <p className="text-4xl md:text-5xl font-black text-[#8b8df8]">₹{depositAmount}.00</p>
                </div>

                <form onSubmit={handleDepositSubmit} className="space-y-4">
                  <div className="bg-[#252530] p-4 rounded-xl border border-zinc-700">
                    <label className="text-[10px] md:text-xs font-bold text-zinc-400 uppercase flex items-center gap-2 mb-2"><ShieldCheck className="w-4 h-4 text-[#8b8df8]"/> Already Paid? Enter UTR</label>
                    <input required type="text" placeholder="12-digit UTR Number" value={utrNumber} onChange={(e) => setUtrNumber(e.target.value)} className="w-full bg-[#1c1c24] border border-zinc-700 rounded-lg p-3 md:p-4 text-xs md:text-sm font-mono focus:border-[#8b8df8] outline-none text-white" />
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full bg-[#8b8df8] hover:bg-[#7a7ce0] text-white font-black uppercase tracking-widest py-3 md:py-4 rounded-xl transition-colors disabled:opacity-50 text-sm">
                    {isSubmitting ? 'Verifying...' : 'Submit to Verify'}
                  </button>
                </form>
                <div className="mt-6 md:mt-8 flex items-center justify-center gap-2 text-zinc-600 text-[9px] md:text-[10px] font-bold uppercase tracking-widest">
                  <ShieldCheck className="w-3 h-3 md:w-4 md:h-4" /> Secure Gateway
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- RESULT UPLOAD MODAL --- */}
        {resultModalObj && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative my-8">
              <button onClick={() => { setResultModalObj(null); setResultFile(null); setResultPreview(null); }} className="absolute top-4 right-4 bg-zinc-900 p-2 rounded-full text-zinc-400 hover:text-white transition-colors z-10">
                <X className="w-4 h-4"/>
              </button>
              
              <div className="p-5 md:p-6 border-b border-zinc-800">
                <h3 className="text-lg md:text-xl font-black uppercase flex items-center gap-2 text-white">
                  <UploadCloud className="w-5 h-5 text-blue-500"/> Submit Result
                </h3>
                <p className="text-[10px] md:text-xs font-bold text-zinc-500 mt-1 uppercase tracking-wider">Slot {resultModalObj.slot_number} • {resultModalObj.squad_name}</p>
              </div>

              <form onSubmit={submitMatchResult} className="p-5 md:p-6 space-y-6">
                <div className="bg-zinc-900 border border-zinc-800 border-dashed rounded-xl p-6 text-center">
                  {!resultPreview ? (
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-14 h-14 md:w-16 md:h-16 bg-zinc-800 rounded-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 md:w-8 md:h-8 text-zinc-500" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm font-bold text-zinc-300">Upload Screenshot Evidence</p>
                        <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">JPG, PNG up to 5MB</p>
                      </div>
                      <label className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] md:text-xs font-black uppercase tracking-wider px-6 py-2.5 rounded-lg cursor-pointer transition-colors mt-2">
                        Browse Files
                        <input type="file" accept="image/*" className="hidden" onChange={handleResultImageChange} />
                      </label>
                    </div>
                  ) : (
                    <div className="relative group rounded-lg overflow-hidden border border-zinc-700">
                      <img src={resultPreview} alt="Preview" className="w-full h-auto max-h-64 object-contain bg-black" />
                      <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-bold text-xs uppercase tracking-wider">
                        <UploadCloud className="w-4 h-4 mr-2"/> Replace Image
                        <input type="file" accept="image/*" className="hidden" onChange={handleResultImageChange} />
                      </label>
                    </div>
                  )}
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3 text-[10px] md:text-xs text-blue-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p className="leading-relaxed font-medium">Please ensure the screenshot clearly shows your squad's placement and total kills. Fraudulent submissions will result in a permanent ban.</p>
                </div>

                <button type="submit" disabled={isUploadingResult || !resultFile} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest py-3.5 md:py-4 rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2 text-xs md:text-sm shadow-lg">
                  {isUploadingResult ? 'Uploading Evidence...' : 'Submit Evidence for Review'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
