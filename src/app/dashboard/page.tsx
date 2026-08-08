'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, History, QrCode, ShieldCheck, X, Home, LogOut, Gamepad2, Clock, Key, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PlayerDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [wallet, setWallet] = useState({ balance: 0, total_deposited: 0, total_won: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [myMatches, setMyMatches] = useState<any[]>([]);
  
  // Deposit States
  const [depositAmount, setDepositAmount] = useState<number | ''>('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const quickAmounts = [50, 100, 200, 500, 1000, 2000];

  // Withdraw States
  const [withdrawAmount, setWithdrawAmount] = useState<number | ''>('');
  const [upiId, setUpiId] = useState('');

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
    // 1. Fetch or Create Wallet
    let { data: walletData } = await supabase.from('wallets').select('*').eq('user_id', userId).single();
    
    if (!walletData) {
      const { data: newWallet } = await supabase.from('wallets').insert([{ user_id: userId }]).select().single();
      walletData = newWallet;
    }
    
    if (walletData) setWallet(walletData);

    // 2. Fetch Transactions
    const { data: txData } = await supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (txData) setTransactions(txData);

    // 3. Fetch Enrolled Matches
    const { data: regs } = await supabase.from('registrations').select('*, tournaments(*)').eq('user_id', userId).order('created_at', { ascending: false });
    if (regs) setMyMatches(regs);
    
    setAuthLoading(false);
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/dashboard' }});
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber || utrNumber.length < 12) return alert("Please enter a valid 12-digit UTR number.");
    setIsSubmitting(true);
    
    const { error } = await supabase.from('transactions').insert([{
      user_id: user.id,
      type: 'DEPOSIT',
      amount: depositAmount,
      reference_id: utrNumber,
      description: 'Wallet Deposit via UPI'
    }]);

    if (error) {
      alert("Database Error: " + error.message);
    } else {
      alert("Deposit request submitted! Our team will verify the UTR shortly.");
      setShowQRModal(false);
      setDepositAmount('');
      setUtrNumber('');
      fetchWalletData(user.id);
    }
    
    setIsSubmitting(false);
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(withdrawAmount) > wallet.balance) return alert("Insufficient balance.");
    if (Number(withdrawAmount) < 100) return alert("Minimum withdrawal is ₹100.");
    
    setIsSubmitting(true);
    const { error } = await supabase.from('transactions').insert([{
      user_id: user.id,
      type: 'WITHDRAWAL',
      amount: withdrawAmount,
      upi_id: upiId,
      description: 'Withdrawal to UPI'
    }]);

    if (error) {
       alert("Database Error: " + error.message);
    } else {
      alert("Withdrawal request submitted! Funds will be transferred shortly.");
      setWithdrawAmount('');
      setUpiId('');
      fetchWalletData(user.id);
    }
    setIsSubmitting(false);
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

  return (
    <main className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans pb-24">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-zinc-800 pb-6">
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

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 bg-zinc-900 p-1 rounded-lg border border-zinc-800 w-full md:w-fit">
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
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <p className="text-zinc-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2 mb-2"><Wallet className="w-4 h-4 text-emerald-500"/> Available Balance</p>
                <p className="text-5xl font-black text-white">₹{wallet.balance}</p>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <button onClick={() => setActiveTab('deposit')} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider px-6 py-3 rounded flex items-center justify-center gap-2 transition-colors"><ArrowDownToLine className="w-5 h-5"/> Add Money</button>
                <button onClick={() => setActiveTab('withdraw')} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase tracking-wider px-6 py-3 rounded border border-zinc-700 flex items-center justify-center gap-2 transition-colors"><ArrowUpFromLine className="w-5 h-5"/> Withdraw</button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-6">
                <p className="text-emerald-500 font-black text-2xl mb-1">₹{wallet.total_deposited}</p>
                <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Total Deposited</p>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6">
                <p className="text-amber-500 font-black text-2xl mb-1">₹{wallet.total_won}</p>
                <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Total Winnings</p>
              </div>
            </div>
          </div>
        )}

        {/* --- PHASE 3: MY MATCHES TAB (WITH ROOM ID REVEAL) --- */}
        {activeTab === 'matches' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-black uppercase flex items-center gap-2 mb-6"><Gamepad2 className="w-5 h-5 text-orange-500"/> My Upcoming Tournaments</h2>
            
            {myMatches.length === 0 ? (
              <div className="text-center py-12 bg-zinc-950 rounded-lg border border-zinc-800">
                <p className="text-zinc-500 font-bold uppercase tracking-widest">You haven&apos;t joined any matches yet.</p>
                <button onClick={() => router.push('/tournaments')} className="mt-4 bg-orange-500 hover:bg-orange-400 text-black font-black px-6 py-2 rounded uppercase text-xs transition-colors">Browse Tournaments</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {myMatches.map((m: any, idx: number) => {
                  const tourney = Array.isArray(m.tournaments) ? m.tournaments[0] : m.tournaments;
                  if (!tourney) return null;
                  return (
                    <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-black italic text-lg tracking-wider text-white">{tourney.name || 'Tournament'}</h3>
                            <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-bold mt-1">
                              <Clock className="w-3.5 h-3.5 text-orange-500" />
                              {tourney.match_time ? new Date(tourney.match_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : 'TBA'}
                            </div>
                          </div>
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded border ${tourney.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : tourney.status === 'FULL' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                            {tourney.status || 'OPEN'}
                          </span>
                        </div>
                        
                        <div className="bg-zinc-900 border border-zinc-800 rounded p-3 mb-4 flex justify-between items-center">
                          <div>
                            <p className="text-xs text-zinc-500 font-bold uppercase">Booked Slot</p>
                            <p className="text-xl font-black text-orange-500">Slot {m.slot_number}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-zinc-500 font-bold uppercase">Squad Name</p>
                            <p className="text-sm font-bold text-white">{m.squad_name}</p>
                          </div>
                        </div>

                        {/* --- THE ROOM CREDENTIALS WIDGET --- */}
                        {tourney.room_id ? (
                          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-lg p-4 mb-4">
                            <div className="flex items-center gap-2 mb-3 border-b border-emerald-500/20 pb-2">
                              <Key className="w-4 h-4 text-emerald-500" />
                              <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500">Room Details Unlocked</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Room ID</p>
                                <p className="font-mono font-black text-white select-all">{tourney.room_id}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Password</p>
                                <p className="font-mono font-black text-white select-all">{tourney.room_password}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-lg p-4 mb-4 flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-black text-amber-500 uppercase tracking-wider mb-1">Room Details Pending</p>
                              <p className="text-[10px] text-zinc-400 font-bold leading-relaxed">The Room ID and Password will automatically appear here approx 15 minutes before the match starts.</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <Link href={`/tournaments/${tourney.id}`} className="w-full text-center bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-wider py-3 rounded text-xs transition-colors border border-zinc-700 mt-2">
                        View Match Details
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- DEPOSIT TAB --- */}
        {activeTab === 'deposit' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-3xl mx-auto">
            <h2 className="text-lg font-black uppercase flex items-center gap-2 mb-6"><ArrowDownToLine className="w-5 h-5 text-emerald-500"/> Add Money to Wallet</h2>
            
            <div className="mb-6">
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-3">Quick Select</p>
              <div className="grid grid-cols-3 gap-3">
                {quickAmounts.map(amt => (
                  <button key={amt} type="button" onClick={() => setDepositAmount(amt)} className={`py-3 rounded font-black border transition-all ${depositAmount === amt ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-emerald-500/50'}`}>
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-3">Or enter custom amount</p>
              <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(Number(e.target.value))} placeholder="Enter amount" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-bold text-lg focus:border-emerald-500 outline-none text-white" />
              <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase mt-2">
                <span>Min ₹10</span><span>Max ₹50,000</span>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-6 mb-6 space-y-3 text-sm font-bold">
              <div className="flex justify-between text-zinc-400"><p>Deposit Amount</p><p>₹{depositAmount || 0}</p></div>
              <div className="flex justify-between text-zinc-400"><p>Processing Fee</p><p className="text-emerald-500">FREE</p></div>
              <div className="flex justify-between text-lg text-white border-t border-zinc-800 pt-3"><p>Total to Pay</p><p>₹{depositAmount || 0}</p></div>
            </div>

            <button disabled={!depositAmount || depositAmount < 10} onClick={() => setShowQRModal(true)} className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 text-black font-black uppercase tracking-widest py-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
              ⚡ Pay ₹{depositAmount || 0} via UPI
            </button>
          </div>
        )}

        {/* --- ZAPUPI QR MODAL --- */}
        {showQRModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
            <div className="bg-[#1c1c24] w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 relative flex flex-col md:flex-row">
              <button onClick={() => setShowQRModal(false)} className="absolute top-4 right-4 bg-zinc-800 p-2 rounded-full text-zinc-400 hover:text-white z-10"><X className="w-5 h-5"/></button>
              
              {/* Left Side: QR Code */}
              <div className="bg-white p-8 flex flex-col items-center justify-center w-full md:w-1/2">
                <h3 className="text-black font-black uppercase tracking-widest mb-6 flex items-center gap-2"><QrCode className="w-5 h-5"/> Scan & Pay</h3>
                <div className="bg-white p-2 rounded-xl shadow-lg mb-6 border border-zinc-200">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=digitallibrary@slc&pn=BGMI+Arena&am=${depositAmount}`} alt="UPI QR" className="w-48 h-48" />
                </div>
                <p className="text-zinc-500 text-xs font-bold uppercase">GPay • PhonePe • Paytm</p>
              </div>

              {/* Right Side: Details & Input */}
              <div className="p-8 w-full md:w-1/2 flex flex-col justify-center bg-[#1c1c24]">
                <div className="text-center mb-8">
                  <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Amount to Pay</p>
                  <p className="text-5xl font-black text-[#8b8df8]">₹{depositAmount}.00</p>
                </div>

                <form onSubmit={handleDepositSubmit} className="space-y-4">
                  <div className="bg-[#252530] p-4 rounded-xl border border-zinc-700">
                    <label className="text-xs font-bold text-zinc-400 uppercase flex items-center gap-2 mb-2"><ShieldCheck className="w-4 h-4 text-[#8b8df8]"/> Already Paid? Enter UTR</label>
                    <input required type="text" placeholder="12-digit UTR Number" value={utrNumber} onChange={(e) => setUtrNumber(e.target.value)} className="w-full bg-[#1c1c24] border border-zinc-700 rounded-lg p-3 text-sm font-mono focus:border-[#8b8df8] outline-none text-white" />
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full bg-[#8b8df8] hover:bg-[#7a7ce0] text-white font-black uppercase tracking-widest py-3 rounded-xl transition-colors disabled:opacity-50">
                    {isSubmitting ? 'Verifying...' : 'Submit to Verify'}
                  </button>
                </form>
                <div className="mt-8 flex items-center justify-center gap-2 text-zinc-600 text-[10px] font-bold uppercase">
                  <ShieldCheck className="w-4 h-4" /> Secure Gateway
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- WITHDRAW TAB --- */}
        {activeTab === 'withdraw' && (
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-3xl mx-auto">
             <h2 className="text-lg font-black uppercase flex items-center gap-2 mb-6"><ArrowUpFromLine className="w-5 h-5 text-zinc-400"/> Withdraw Winnings</h2>
             
             <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg mb-6 flex justify-between items-center">
               <div>
                 <p className="text-emerald-500 font-bold text-xs uppercase mb-1">Available to Withdraw</p>
                 <p className="text-2xl font-black text-white">₹{wallet.balance}</p>
               </div>
               <Wallet className="w-8 h-8 text-emerald-500/50" />
             </div>

             <form onSubmit={handleWithdrawSubmit} className="space-y-6">
               <div>
                 <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">Amount to Withdraw</label>
                 <input required type="number" min="100" max={wallet.balance} value={withdrawAmount} onChange={(e) => setWithdrawAmount(Number(e.target.value))} placeholder="Min ₹100" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-bold focus:border-emerald-500 outline-none text-white" />
               </div>
               <div>
                 <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">Your UPI ID</label>
                 <input required type="text" placeholder="e.g. 9876543210@ybl" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-bold focus:border-emerald-500 outline-none text-white" />
               </div>
               <button type="submit" disabled={isSubmitting || wallet.balance < 100} className="w-full bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest py-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
                 {isSubmitting ? 'Processing...' : 'Request Withdrawal'}
               </button>
             </form>
           </div>
        )}

        {/* --- HISTORY TAB --- */}
        {activeTab === 'history' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-black uppercase flex items-center gap-2 mb-6"><History className="w-5 h-5 text-zinc-400"/> Transaction Ledger</h2>
            
            {transactions.length === 0 ? (
              <div className="text-center py-12 bg-zinc-950 rounded-lg border border-zinc-800">
                <p className="text-zinc-500 font-bold uppercase tracking-widest">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map(tx => (
                  <div key={tx.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${tx.type === 'DEPOSIT' || tx.type === 'PRIZE_MONEY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {tx.type === 'DEPOSIT' || tx.type === 'PRIZE_MONEY' ? <ArrowDownToLine className="w-5 h-5"/> : <ArrowUpFromLine className="w-5 h-5"/>}
                      </div>
                      <div>
                        <p className="font-bold text-white">{tx.description}</p>
                        <p className="text-xs text-zinc-500 mt-1 font-mono">{new Date(tx.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-black text-lg ${tx.type === 'DEPOSIT' || tx.type === 'PRIZE_MONEY' ? 'text-emerald-500' : 'text-white'}`}>
                        {tx.type === 'DEPOSIT' || tx.type === 'PRIZE_MONEY' ? '+' : '-'}₹{tx.amount}
                      </p>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${tx.status === 'PENDING' ? 'bg-amber-500/20 text-amber-500' : tx.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
