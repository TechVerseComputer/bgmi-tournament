'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { ShieldAlert, ArrowLeft, Users, Trophy, Mail, Copy, Check, CheckSquare, Eye, X, Timer, Search } from 'lucide-react';

const getServerTime = async () => {
  try {
    const url = typeof window !== 'undefined' ? window.location.href : '/';
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    const dateHeader = res.headers.get('Date');
    return dateHeader ? new Date(dateHeader).getTime() : Date.now();
  } catch {
    return Date.now();
  }
};

export default function AdminTournamentControlCenter() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [tournament, setTournament] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [matchResults, setMatchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [currentTime, setCurrentTime] = useState<number | null>(null);

  // Evidence Review States
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [rejectModalObj, setRejectModalObj] = useState<any>(null);
  const [rejectNote, setRejectNote] = useState('');

  const [selectedPayouts, setSelectedPayouts] = useState<Record<string, number>>({});

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

    // Start live clock for Review Timer calculations
    setCurrentTime(Date.now());
    const clock = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(clock);
  }, [id]);

  const fetchMatchData = async () => {
    setLoading(true);
    const [tourneyRes, regRes, resultsRes] = await Promise.all([
      supabase.from('tournaments').select('*').eq('id', id).single(),
      supabase.from('registrations').select('*').eq('tournament_id', id).order('slot_number', { ascending: true }),
      supabase.from('match_results').select('*').eq('tournament_id', id)
    ]);

    if (tourneyRes.data) setTournament(tourneyRes.data);
    if (regRes.data) setRegistrations(regRes.data);
    if (resultsRes.data) setMatchResults(resultsRes.data);
    setLoading(false);
  };

  const handleCopyRoomDetails = () => {
    const text = registrations.map(r => `Slot ${r.slot_number}: ${r.squad_name} (Cap: ${r.player_1_ign} - ID: ${r.player_1_id})`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePayoutWinner = async (regId: string, targetUserId: string, squadName: string, prizeAmount: number, positionLabel: string) => {
    if (!confirm(`Are you sure you want to payout ₹${prizeAmount} (${positionLabel}) to ${squadName}?`)) return;

    setPayoutLoading(regId);
    try {
      const { data: checkReg } = await supabase.from('registrations').select('awarded_prize').eq('id', regId).single();
      if (checkReg?.awarded_prize) throw new Error("This squad has already been awarded a prize.");

      const { data: wallet, error: walletErr } = await supabase.from('wallets').select('*').eq('user_id', targetUserId).single();
      if (walletErr || !wallet) throw new Error("Winner wallet not found.");

      const newBalance = Number(wallet.balance) + Number(prizeAmount);

      const { error: updateErr } = await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', targetUserId);
      if (updateErr) throw updateErr;

      const { error: txErr } = await supabase.from('transactions').insert([{
        user_id: targetUserId,
        type: 'PRIZE_WIN',
        amount: prizeAmount,
        status: 'SUCCESS',
        description: `Won ${positionLabel} in tournament: ${tournament.name} (${squadName})`
      }]);
      if (txErr) throw txErr;

      const { error: regUpdateErr } = await supabase.from('registrations').update({ awarded_prize: positionLabel }).eq('id', regId);
      if (regUpdateErr) throw regUpdateErr;

      alert(`Successfully credited ₹${prizeAmount} to ${squadName}'s wallet!`);
      
      const newSelections = { ...selectedPayouts };
      delete newSelections[regId];
      setSelectedPayouts(newSelections);
      fetchMatchData();
    } catch (err: any) {
      alert(`Payout failed: ${err.message}`);
    } finally {
      setPayoutLoading(null);
    }
  };

  // --- UPGRADED: 3-STEP REVIEW WORKFLOW ---
  const handleStartReview = async () => {
    if (!confirm(`Mark "${tournament.name}" as UNDER REVIEW?\n\nThis will start a mandatory 30-minute lockdown where players can submit evidence and admins can review screenshots before payouts are unlocked.`)) return;
    setActionLoading(true);
    try {
      const serverTime = new Date(await getServerTime()).toISOString();
      const { error } = await supabase.from('tournaments').update({ 
        status: 'UNDER REVIEW',
        review_started_at: serverTime
      }).eq('id', tournament.id);
      
      if (error) throw error;
      fetchMatchData();
    } catch (err: any) {
      alert("Error starting review: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalizeMatch = async () => {
    if (!confirm(`Finalize Match Results?\n\nThis will change the status to COMPLETED and officially unlock all winner payout buttons.`)) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from('tournaments').update({ status: 'COMPLETED' }).eq('id', tournament.id);
      if (error) throw error;
      fetchMatchData();
    } catch (err: any) {
      alert("Error finalizing match: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // --- EVIDENCE REVIEW HANDLERS ---
  const handleApproveEvidence = async (resultId: string) => {
    if(!confirm("Approve this match result evidence?")) return;
    setActionLoading(true);
    await supabase.from('match_results').update({ status: 'APPROVED', admin_note: null }).eq('id', resultId);
    fetchMatchData();
    setActionLoading(false);
  };

  const handleRejectEvidenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    await supabase.from('match_results').update({ status: 'REJECTED', admin_note: rejectNote }).eq('id', rejectModalObj.id);
    setRejectModalObj(null);
    setRejectNote('');
    fetchMatchData();
    setActionLoading(false);
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

  const isArchived = tournament.status === 'CANCELLED' || tournament.status === 'COMPLETED';
  const isUnderReview = tournament.status === 'UNDER REVIEW';

  // --- REVIEW TIMER LOGIC ---
  let reviewTimeLeft = 0;
  let canFinalize = false;

  if (isUnderReview && tournament.review_started_at && currentTime) {
    const reviewStart = new Date(tournament.review_started_at).getTime();
    const reviewEnd = reviewStart + (30 * 60 * 1000); // 30 minutes
    reviewTimeLeft = reviewEnd - currentTime;
    
    if (reviewTimeLeft <= 0) {
      canFinalize = true;
      reviewTimeLeft = 0;
    }
  }

  const formatReviewTimer = (ms: number) => {
    if (ms <= 0) return "REVIEW PERIOD ENDED";
    const m = Math.floor((ms / 1000 / 60) % 60);
    const s = Math.floor((ms / 1000) % 60);
    return `Mandatory Review: ${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Dynamic Live Pool Match
  const bookedCount = registrations.length;
  const totalLivePool = bookedCount > 0 ? Math.floor(bookedCount * Number(tournament.fee || 0) * 0.85) : 0;
  
  let activePrizes: number[] = [];
  const winnerCount = tournament.total_winners || (tournament.prize_breakdown?.length > 0 ? tournament.prize_breakdown.length : 2);

  if (tournament.fee > 0 && totalLivePool > 0) {
    if (winnerCount === 1) {
      activePrizes = [totalLivePool];
    } else if (winnerCount === 2) {
      const p1 = Math.floor(totalLivePool * 0.70);
      activePrizes = [p1, totalLivePool - p1];
    } else if (winnerCount === 3) {
      const p1 = Math.floor(totalLivePool * 0.55);
      const p2 = Math.floor(totalLivePool * 0.30);
      activePrizes = [p1, p2, totalLivePool - p1 - p2];
    } else if (winnerCount === 4) {
      const p1 = Math.floor(totalLivePool * 0.50);
      const p2 = Math.floor(totalLivePool * 0.25);
      const p3 = Math.floor(totalLivePool * 0.15);
      activePrizes = [p1, p2, p3, totalLivePool - p1 - p2 - p3];
    } else if (winnerCount === 5) {
      const p1 = Math.floor(totalLivePool * 0.45);
      const p2 = Math.floor(totalLivePool * 0.25);
      const p3 = Math.floor(totalLivePool * 0.15);
      const p4 = Math.floor(totalLivePool * 0.10);
      activePrizes = [p1, p2, p3, p4, totalLivePool - p1 - p2 - p3 - p4];
    } else if (winnerCount >= 6) {
      const p1 = Math.floor(totalLivePool * 0.45);
      const p2 = Math.floor(totalLivePool * 0.25);
      const p3 = Math.floor(totalLivePool * 0.15);
      const p4 = Math.floor(totalLivePool * 0.10);
      const p5 = Math.floor(totalLivePool * 0.03); 
      activePrizes = [p1, p2, p3, p4, p5, totalLivePool - p1 - p2 - p3 - p4 - p5];
    }
  } else {
    activePrizes = tournament.prize_breakdown?.length > 0 
      ? tournament.prize_breakdown.slice(0, winnerCount) 
      : [tournament.first_prize || 0, tournament.second_prize || 0].slice(0, winnerCount);
  }

  const posLabels = activePrizes.map((_, idx) => {
    if (idx === 0) return '1st Place';
    if (idx === 1) return '2nd Place';
    if (idx === 2) return '3rd Place';
    return `${idx + 1}th Place`;
  });

  const takenPrizes = registrations.map(r => r.awarded_prize).filter(Boolean);

  return (
    <main className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
          <div>
            <button onClick={() => router.push('/admin')} className="inline-flex items-center gap-2 text-zinc-400 hover:text-orange-500 text-xs font-bold uppercase tracking-wider mb-3 transition-colors bg-zinc-900 px-4 py-2 rounded border border-zinc-800">
              <ArrowLeft className="w-4 h-4"/> Back to Admin Hub
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black italic tracking-wider text-orange-500 uppercase">{tournament?.name} — Control Center</h1>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                tournament.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                tournament.status === 'UNDER REVIEW' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse' :
                tournament.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}>
                {tournament.status}
              </span>
            </div>
            <p className="text-zinc-400 text-sm mt-1 font-bold">Manage enrollments, review evidence, and execute secure one-click prize payouts.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            
            {/* DYNAMIC REVIEW STATUS BUTTON */}
            {!isArchived && !isUnderReview && (
              <button disabled={actionLoading} onClick={handleStartReview} className="bg-amber-600 hover:bg-amber-500 text-black border border-amber-500 px-5 py-3 rounded text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                <Search className="w-4 h-4"/> Start 30-Min Review
              </button>
            )}
            {isUnderReview && (
              <button disabled={actionLoading || !canFinalize} onClick={handleFinalizeMatch} className={`px-5 py-3 rounded text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all border ${canFinalize ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed'}`}>
                {canFinalize ? <><CheckSquare className="w-4 h-4"/> Finalize Match Results</> : <><Timer className="w-4 h-4"/> Review Active (Wait)</>}
              </button>
            )}

            <button onClick={handleCopyRoomDetails} className="bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 px-5 py-3 rounded text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all">
              {copied ? <Check className="w-4 h-4 text-emerald-500"/> : <Copy className="w-4 h-4 text-orange-500"/>} {copied ? 'Copied to Clipboard' : 'Copy All Squad Rosters'}
            </button>
          </div>
        </div>

        {/* --- REVIEW TIMER BANNER --- */}
        {isUnderReview && (
          <div className={`border p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg ${canFinalize ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
            <div>
              <h3 className={`font-black italic uppercase tracking-wider flex items-center gap-2 ${canFinalize ? 'text-emerald-500' : 'text-amber-500'}`}>
                {canFinalize ? <CheckCircle className="w-5 h-5"/> : <AlertCircle className="w-5 h-5"/>} 
                {canFinalize ? 'Review Period Complete' : 'Match Currently Under Review'}
              </h3>
              <p className="text-zinc-400 text-xs font-bold mt-1">
                {canFinalize 
                  ? "You may now finalize the match and distribute payouts." 
                  : "Payouts are strictly locked. Please use this time to review player evidence."}
              </p>
            </div>
            <div className={`text-xl font-black font-mono tracking-widest px-4 py-2 rounded-lg border ${canFinalize ? 'bg-emerald-950 text-emerald-400 border-emerald-900' : 'bg-amber-950 text-amber-400 border-amber-900'}`}>
              {formatReviewTimer(reviewTimeLeft)}
            </div>
          </div>
        )}

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

        {/* Detailed Enrolled Squads Table */}
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
                    <th className="p-4 text-center">Result Evidence</th>
                    <th className="p-4 text-right">Instant Winner Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {registrations.map((reg) => {
                    const result = matchResults.find(r => r.registration_id === reg.id);
                    const isPaid = !!reg.awarded_prize;
                    
                    // Payouts are ONLY unlocked if the match is officially COMPLETED
                    const payoutsLocked = tournament.status !== 'COMPLETED';

                    return (
                      <tr key={reg.id} className={`hover:bg-zinc-800/40 transition-colors`}>
                        <td className="p-4 font-black text-orange-500">S{reg.slot_number}</td>
                        <td className="p-4 font-black text-white">
                          {reg.squad_name}
                          <div className="text-[10px] text-zinc-500 font-mono mt-1 space-y-0.5">
                            <div>P1: {reg.player_1_id}</div>
                            {reg.player_2_id && <div>P2: {reg.player_2_id}</div>}
                            {reg.player_3_id && <div>P3: {reg.player_3_id}</div>}
                            {reg.player_4_id && <div>P4: {reg.player_4_id}</div>}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-white">{reg.player_1_ign}</div>
                          <div className="text-xs text-zinc-400 font-mono flex items-center gap-1"><Mail className="w-3 h-3 text-zinc-500"/> {reg.igl_email}</div>
                        </td>
                        
                        {/* EVIDENCE REVIEW COLUMN */}
                        <td className="p-4 text-center">
                          {!result ? (
                            <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider">No Submission</span>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <button onClick={() => setPreviewImage(result.image_url)} className="relative group w-16 h-12 rounded border border-zinc-700 overflow-hidden bg-black">
                                <img src={result.image_url} alt="Evidence" className="w-full h-full object-cover opacity-80 group-hover:opacity-40 transition-opacity" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Eye className="w-4 h-4 text-white"/>
                                </div>
                              </button>
                              <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${result.status === 'PENDING' ? 'bg-amber-500/20 text-amber-500' : result.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                                {result.status}
                              </span>
                              
                              {/* Always allow evidence review regardless of completion status */}
                              {result.status === 'PENDING' && (
                                <div className="flex gap-1 mt-1">
                                  <button onClick={() => handleApproveEvidence(result.id)} disabled={actionLoading} className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-black p-1.5 rounded transition-colors disabled:opacity-50" title="Approve">
                                    <Check className="w-3 h-3"/>
                                  </button>
                                  <button onClick={() => setRejectModalObj(result)} disabled={actionLoading} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-black p-1.5 rounded transition-colors disabled:opacity-50" title="Reject">
                                    <X className="w-3 h-3"/>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* PAYOUT CONTROLS */}
                        <td className="p-4 text-right whitespace-nowrap">
                          {isPaid ? (
                            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1.5 rounded text-xs font-black uppercase tracking-wider">
                              <Check className="w-3.5 h-3.5" /> Paid: {reg.awarded_prize}
                            </div>
                          ) : payoutsLocked ? (
                            <div className="inline-flex items-center gap-1.5 bg-zinc-800 text-zinc-500 border border-zinc-700 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest cursor-not-allowed">
                              {isUnderReview ? 'Payouts Locked (Review)' : 'Payouts Locked'}
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <select
                                className="bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs font-bold text-zinc-300 focus:border-orange-500 outline-none"
                                value={selectedPayouts[reg.id] !== undefined ? selectedPayouts[reg.id] : ""}
                                onChange={(e) => setSelectedPayouts({...selectedPayouts, [reg.id]: Number(e.target.value)})}
                              >
                                <option value="" disabled>Select Prize</option>
                                {activePrizes.map((prize: number, pIdx: number) => {
                                  if (!prize || prize === 0) return null;
                                  const posLabel = posLabels[pIdx];
                                  const isTaken = takenPrizes.includes(posLabel);
                                  return (
                                    <option key={pIdx} value={pIdx} disabled={isTaken}>
                                      {posLabel} (₹{prize}) {isTaken ? ' - PAID' : ''}
                                    </option>
                                  );
                                })}
                              </select>
                              <button
                                disabled={payoutLoading === reg.id || selectedPayouts[reg.id] === undefined}
                                onClick={() => {
                                  const pIdx = selectedPayouts[reg.id];
                                  handlePayoutWinner(reg.id, reg.user_id, reg.squad_name, activePrizes[pIdx], posLabels[pIdx]);
                                }}
                                className="bg-orange-500 hover:bg-orange-400 text-black px-4 py-1.5 rounded text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500"
                              >
                                {payoutLoading === reg.id ? 'Processing...' : 'Payout'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* --- REJECT EVIDENCE MODAL --- */}
      {rejectModalObj && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <button onClick={() => { setRejectModalObj(null); setRejectNote(''); }} className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1">
              <X className="w-5 h-5"/>
            </button>
            <div className="p-6 border-b border-zinc-800">
              <h3 className="text-lg font-black uppercase tracking-widest text-red-500">Reject Evidence</h3>
            </div>
            <form onSubmit={handleRejectEvidenceSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Reason for Rejection</label>
                <textarea 
                  required 
                  value={rejectNote} 
                  onChange={e => setRejectNote(e.target.value)} 
                  rows={3} 
                  placeholder="e.g., Image is too blurry, kills are not fully visible..." 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-sm text-white focus:border-red-500 outline-none resize-none"
                ></textarea>
                <p className="text-[10px] text-zinc-500 mt-2 font-bold">The player will see this note and be allowed to re-upload their evidence.</p>
              </div>
              <button type="submit" disabled={actionLoading} className="w-full bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest py-3 rounded transition-colors disabled:opacity-50">
                Confirm Rejection
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- FULLSCREEN IMAGE PREVIEW --- */}
      {previewImage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-6 right-6 text-white bg-zinc-900 p-3 rounded-full hover:bg-zinc-800 transition-colors z-[80]">
            <X className="w-6 h-6"/>
          </button>
          <img src={previewImage} alt="Evidence Preview" className="max-w-full max-h-[90vh] object-contain rounded-lg border border-zinc-800 shadow-2xl relative z-[70]" onClick={e => e.stopPropagation()} />
        </div>
      )}

    </main>
  );
}
