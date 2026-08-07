'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Wallet, Trophy, Clock, Key, LogOut, ArrowRight, ShieldCheck, Gamepad2, PlusCircle } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [joinedTournaments, setJoinedTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Withdrawal state
  const [upiId, setUpiId] = useState('digitallibrary@slc');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  // Add Funds state
  const [depositAmount, setDepositAmount] = useState('');
  const [submittingDeposit, setSubmittingDeposit] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/tournaments');
        return;
      }
      setUser(session.user);

      const { data: walletData } = await supabase.from('wallets').select('*').eq('user_id', session.user.id).single();
      if (walletData) setWallet(walletData);

      const { data: txData } = await supabase.from('transactions').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
      if (txData) setTransactions(txData);

      const { data: regData } = await supabase
        .from('registrations')
        .select('*, tournaments (*)')
        .eq('user_id', session.user.id);
      
      if (regData) {
        const matches = regData.map(r => ({
          ...r.tournaments,
          bookedSlot: r.slot_number,
          squadName: r.squad_name
        }));
        setJoinedTournaments(matches);
      }

      setLoading(false);
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(depositAmount);
    if (!amountNum || amountNum <= 0) return alert("Please enter a valid deposit amount.");

    setSubmittingDeposit(true);
    try {
      const currentBal = Number(wallet?.balance || 0);
      const newBalance = currentBal + amountNum;

      const { error: walletErr } = await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', user.id);
      if (walletErr) throw walletErr;

      const { error: txErr } = await supabase.from('transactions').insert([{
        user_id: user.id, type: 'DEPOSIT', amount: amountNum, status: 'SUCCESS', description: `Wallet Deposit via UPI`
      }]);
      if (txErr) throw txErr;

      alert(`Successfully added ₹${amountNum} to your wallet!`);
      setWallet({...wallet, balance: newBalance});
      setDepositAmount('');

      const { data: txData } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (txData) setTransactions(txData);
    } catch (err: any) {
      alert("Error adding funds: " + err.message);
    } finally {
      setSubmittingDeposit(false);
    }
  };

  const handleWithdrawRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(withdrawAmount);
    if (!upiId || !amountNum || amountNum <= 0) return alert("Please enter a valid UPI ID and amount.");
    if (amountNum > wallet.balance) return alert("Insufficient wallet balance.");

    setSubmittingWithdraw(true);
    try {
      const newBalance = wallet.balance - amountNum;
      await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', user.id);

      await supabase.from('transactions').insert([{
        user_id: user.id, type: 'WITHDRAWAL', amount: amountNum, status: 'PENDING', description: `Withdrawal request to UPI: ${upiId}`
      }]);

      alert("Withdrawal request submitted successfully!");
      setWallet({...wallet, balance: newBalance});
      setWithdrawAmount('');
      
      const { data: txData } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (txData) setTransactions(txData);

    } catch (err: any) {
      alert("Error processing withdrawal: " + err.message);
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] text-orange-500 font-bold flex items-center justify-center animate-pulse">Loading Player Portal...</div>;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white font-sans p-4 md:p-8 pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-center justify-center text-orange-500">
              <Gamepad2 className="w-8 h-8"/>
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-wider">Player Portal</h1>
              <p className="text-xs text-zinc-400 font-mono">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2">
            <LogOut className="w-4 h-4"/> Logout
          </button>
        </div>

        {/* Wallet & Add Funds / Withdraw Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-6 rounded-2xl space-y-4">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Wallet className="w-4 h-4 text-orange-500"/> Available Wallet Balance
            </p>
            <p className="text-4xl font-black text-emerald-400">₹{wallet?.balance || 0}</p>
            
            {/* Add Funds Box inside Wallet Card */}
            <form onSubmit={handleAddFunds} className="pt-2 border-t border-zinc-800 space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Add Funds to Wallet</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="Amount ₹" 
                  value={depositAmount} 
                  onChange={e => setDepositAmount(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-orange-500"
                />
                <button type="submit" disabled={submittingDeposit} className="bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-xs px-4 rounded-xl transition-all flex items-center gap-1 shrink-0">
                  <PlusCircle className="w-4 h-4"/> Add
                </button>
              </div>
            </form>
          </div>

          {/* Withdrawal Box */}
          <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-orange-500">Request Withdrawal</h3>
            <form onSubmit={handleWithdrawRequest} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input 
                type="text" 
                placeholder="Enter UPI ID" 
                value={upiId} 
                onChange={e => setUpiId(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white outline-none focus:border-orange-500 font-mono"
              />
              <input 
                type="number" 
                placeholder="Amount (₹)" 
                value={withdrawAmount} 
                onChange={e => setWithdrawAmount(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white outline-none focus:border-orange-500"
              />
              <button type="submit" disabled={submittingWithdraw} className="bg-orange-500 hover:bg-orange-400 text-black font-black uppercase text-xs tracking-wider py-3 rounded-xl transition-all">
                {submittingWithdraw ? 'Processing...' : 'Withdraw Funds'}
              </button>
            </form>
          </div>
        </div>

        {/* Joined Tournaments */}
        {joinedTournaments.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-black uppercase tracking-wider flex items-center gap-2 text-orange-500">
              <Trophy className="w-5 h-5"/> My Upcoming Joined Matches ({joinedTournaments.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {joinedTournaments.map((match) => (
                <div key={match.id} className="bg-zinc-900 border border-orange-500/40 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="h-36 relative">
                      <img src={match.map_img} alt={match.name} className="w-full h-full object-cover"/>
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent"/>
                      <span className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                        Slot S{match.bookedSlot}
                      </span>
                      <h3 className="absolute bottom-3 left-4 font-black italic text-lg tracking-wider text-white">{match.name}</h3>
                    </div>
                    <div className="p-4 space-y-3 text-xs">
                      <div className="flex items-center gap-2 text-zinc-300 font-bold">
                        <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0"/>
                        <span>{match.match_time ? new Date(match.match_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : 'TBA'}</span>
                      </div>
                      <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1.5">
                        <div className="text-zinc-400 font-semibold">Squad: <span className="text-white font-bold">{match.squadName}</span></div>
                        {match.room_id ? (
                          <div className="pt-2 border-t border-zinc-900 flex justify-between items-center text-emerald-400 font-mono">
                            <span>Room ID: {match.room_id}</span>
                            <span>Pass: {match.room_password}</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-orange-400 font-bold pt-1">Room credentials unlock before match time.</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 pt-0">
                    <button onClick={() => router.push(`/tournaments/${match.id}`)} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase py-2.5 rounded-xl text-xs transition-colors border border-zinc-700 flex items-center justify-center gap-1.5">
                      View Match Lobby <ArrowRight className="w-3.5 h-3.5"/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction Ledger */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800">
            <h3 className="text-lg font-black uppercase tracking-wider">Transaction Ledger</h3>
          </div>
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs font-bold uppercase">No transactions recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950 text-zinc-400 uppercase font-black border-b border-zinc-800">
                  <tr>
                    <th className="p-4">Type</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Description</th>
                    <th className="p-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-zinc-800/30">
                      <td className="p-4 font-black text-orange-500">{tx.type}</td>
                      <td className={`p-4 font-black ${tx.type.includes('CREDIT') || tx.type.includes('WIN') || tx.type.includes('DEPOSIT') ? 'text-emerald-400' : 'text-white'}`}>
                        {tx.type.includes('CREDIT') || tx.type.includes('WIN') || tx.type.includes('DEPOSIT') ? '+' : '-'}₹{tx.amount}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${tx.status === 'SUCCESS' || tx.status === 'Verified' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-4 text-zinc-400">{tx.description}</td>
                      <td className="p-4 text-right text-zinc-500 font-mono">{new Date(tx.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
