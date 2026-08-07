'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { ShieldAlert, ArrowLeft, Users, Trophy, Mail, Copy, Check, Award } from 'lucide-react';

export default function AdminTournamentControlCenter() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [tournament, setTournament] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: adminData } = await supabase.from('admins').select('*').eq('email', session.user.email).single();
        if (adminData) {
          setIsAuthorized(true);
          fetchMatchData();
        }
      }
      setAuthLoading(false);
    };
    checkAuthAndFetch();
  }, [id]);

  const fetchMatchData = async () => {
    setLoading(true);
    const [tourneyRes, regRes] = await Promise.all([
      supabase.from('tournaments').select('*').eq('id', id).single(),
      supabase.from('registrations').select('*').eq('tournament_id', id).order('slot_number', { ascending: true })
    ]);

    if (tourneyRes.data) setTournament(tourneyRes.data);
    if (regRes.data) setRegistrations(regRes.data);
    setLoading(false);
  };

  const handleCopyRoomDetails = () => {
    const text = registrations.map(r => `Slot ${r.slot_number}: ${r.squad_name} (Cap: ${r.player_1_ign} - ID: ${r.player_1_id})`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- ONE-CLICK WINNER PAYOUT HANDLER ---
  const handlePayoutWinner = async (regId: string, targetUserId: string, squadName: string, prizeAmount: number, positionLabel: string) => {
    if (!confirm(`Are you sure you want to payout ₹${prizeAmount} (${positionLabel}) to ${squadName}?`)) return;

    setPayoutLoading(regId);
    try {
      // 1. Fetch current wallet of winner
      const { data: wallet, error: walletErr } = await supabase.from('wallets').select('*').eq('user_id', targetUserId).single();
      if (walletErr || !wallet) throw new Error("Winner wallet not found.");

      const newBalance = Number(wallet.balance) + Number(prizeAmount);

      // 2. Update wallet balance
      const { error: updateErr } = await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', targetUserId);
      if (updateErr) throw updateErr;

      // 3. Log immutable transaction record
      const { error: txErr } = await supabase.from('transactions').insert([{
        user_id: targetUserId,
        type: 'PRIZE_WIN',
        amount: prizeAmount,
        status: 'SUCCESS',
        description: `Won ${positionLabel} in tournament: ${tournament.name} (${squadName})`
      }]);
      if (txErr) throw txErr;

      alert(`Successfully credited ₹${prizeAmount} to ${squadName}'s wallet!`);
      fetchMatchData();
    } catch (err: any) {
      alert(`Payout failed: ${err.message}`);
    } finally {
      setPayoutLoading(null);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-[#050505] text-orange-500 font-black flex items-center justify-center animate-pulse">Checking Admin Clearance...</div>;
  if (!isAuthorized) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 text-center text-white">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-3xl font-black uppercase">Access Denied</h1>
      <button onClick={() => router.push('/admin')} className="mt-6 bg-orange-500 text-black font-black px-6 py-3 rounded uppercase">Back to Admin Hub</button>
    </div>
  );

  if (loading) return <div className="min-h-screen bg-[#050505] text-orange-500 font-bold flex items-center justify-center animate-pulse">Loading Control Center Data...</div>;

  const activePrizes = tournament.prize_breakdown?.length > 0 ? tournament.prize_breakdown : [tournament.first_prize || 0, tournament.second_prize || 0];

  return (
    <main className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
          <div>
            <button onClick={() => router.push('/admin')} className="inline-flex items-center gap-2 text-zinc-400 hover:text-orange-500 text-xs font-bold uppercase tracking-wider mb-3 transition-colors bg-zinc-900 px-4 py-2 rounded border border-zinc-800">
              <ArrowLeft className="w-4 h-4"/> Back to Admin Hub
            </button>
            <h1 className="text-3xl font-black italic tracking-wider text-orange-500 uppercase">{tournament?.name} — Control Center</h1>
            <p className="text-zinc-400 text-sm mt-1 font-bold">Manage enrollments, inspect player IDs, and execute secure one-click prize payouts.</p>
          </div>
          <button onClick={handleCopyRoomDetails} className="bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 px-5 py-3 rounded text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all">
            {copied ? <Check className="w-4 h-4 text-emerald-500"/> : <Copy className="w-4 h-4 text-orange-500"/>} {copied ? 'Copied to Clipboard' : 'Copy All Squad Rosters'}
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Enrolled Squads</p>
            <p className="text-3xl font-black text-orange-500">{registrations.length} / {tournament?.total_slots || 25}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Match Type</p>
            <p className="text-2xl font-black text-white">{tournament?.type} • {tournament?.perspective}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Entry Fee</p>
            <p className="text-3xl font-black text-emerald-500">₹{tournament?.fee}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">1st Place Prize</p>
            <p className="text-2xl font-black text-amber-400">₹{activePrizes[0] || 0}</p>
          </div>
        </div>

        {/* Detailed Enrolled Squads Table with One-Click Payouts */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
            <h2 className="text-xl font-black uppercase tracking-wider flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500"/> Enrolled Rosters & Winner Payouts
            </h2>
          </div>

          {registrations.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 font-bold uppercase tracking-wider">No teams have registered for this match yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-300">
                <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs font-black tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="p-4">Slot</th>
                    <th className="p-4">Squad Name</th>
                    <th className="p-4">Captain / Email</th>
                    <th className="p-4">Player IDs</th>
                    <th className="p-4 text-right">Instant Winner Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="p-4 font-black text-orange-500">S{reg.slot_number}</td>
                      <td className="p-4 font-black text-white">{reg.squad_name}</td>
                      <td className="p-4">
                        <div className="font-bold text-white">{reg.player_1_ign}</div>
                        <div className="text-xs text-zinc-400 font-mono flex items-center gap-1"><Mail className="w-3 h-3 text-zinc-500"/> {reg.igl_email}</div>
                      </td>
                      <td className="p-4 text-xs font-mono text-zinc-400 space-y-0.5">
                        <div>P1: {reg.player_1_id}</div>
                        {reg.player_2_id && <div>P2: {reg.player_2_id}</div>}
                        {reg.player_3_id && <div>P3: {reg.player_3_id}</div>}
                        {reg.player_4_id && <div>P4: {reg.player_4_id}</div>}
                      </td>
                      <td className="p-4 text-right space-x-2 whitespace-nowrap">
                        {activePrizes.map((prize: number, pIdx: number) => {
                          if (!prize || prize === 0) return null;
                          const posLabels = ['1st Place', '2nd Place', '3rd Place', '4th Place', '5th Place', '6th Place'];
                          const badgeColors = ['bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500 hover:text-black', 'bg-zinc-700/30 text-zinc-300 border-zinc-600 hover:bg-zinc-600 hover:text-white', 'bg-orange-900/20 text-orange-400 border-orange-700/30 hover:bg-orange-800 hover:text-white'];
                          
                          return (
                            <button
                              key={pIdx}
                              disabled={payoutLoading === reg.id}
                              onClick={() => handlePayoutWinner(reg.id, reg.user_id, reg.squad_name, prize, posLabels[pIdx])}
                              className={`px-3 py-1.5 rounded text-xs font-black uppercase tracking-wider border transition-all ${badgeColors[pIdx] || 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}
                            >
                              Payout {posLabels[pIdx]} (₹{prize})
                            </button>
                          );
                        })}
                      </td>
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