'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { ShieldAlert, ArrowLeft, Users, Trophy, Mail, Copy, Check } from 'lucide-react';

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

  if (authLoading) return <div className="min-h-screen bg-[#050505] text-orange-500 font-black flex items-center justify-center animate-pulse">Checking Admin Clearance...</div>;
  if (!isAuthorized) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 text-center text-white">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-3xl font-black uppercase">Access Denied</h1>
      <p className="text-zinc-500 mt-2">You must be logged in as an administrator to view this control center.</p>
      <button onClick={() => router.push('/admin')} className="mt-6 bg-orange-500 text-black font-black px-6 py-3 rounded uppercase">Back to Admin Hub</button>
    </div>
  );

  if (loading) return <div className="min-h-screen bg-[#050505] text-orange-500 font-bold flex items-center justify-center animate-pulse">Loading Control Center Data...</div>;

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
            <p className="text-zinc-400 text-sm mt-1 font-bold">Manage enrollments, inspect player IDs, and review slot bookings.</p>
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
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Match Status</p>
            <p className="text-xl font-black text-blue-400">{tournament?.status}</p>
          </div>
        </div>

        {/* Detailed Enrolled Squads Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
            <h2 className="text-xl font-black uppercase tracking-wider flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500"/> Enrolled Rosters & Player IDs
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
                    <th className="p-4">IGL Email (Google ID)</th>
                    <th className="p-4">Player 1 (Captain)</th>
                    <th className="p-4">Player 2</th>
                    <th className="p-4">Player 3</th>
                    <th className="p-4">Player 4</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="p-4 font-black text-orange-500">S{reg.slot_number}</td>
                      <td className="p-4 font-black text-white">{reg.squad_name}</td>
                      <td className="p-4 text-zinc-400 font-mono text-xs flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-zinc-500"/> {reg.igl_email}</td>
                      <td className="p-4">
                        <div className="font-bold text-white">{reg.player_1_ign || '---'}</div>
                        <div className="text-xs font-mono text-orange-400">{reg.player_1_id}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-white">{reg.player_2_ign || '---'}</div>
                        <div className="text-xs font-mono text-zinc-500">{reg.player_2_id}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-white">{reg.player_3_ign || '---'}</div>
                        <div className="text-xs font-mono text-zinc-500">{reg.player_3_id}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-white">{reg.player_4_ign || '---'}</div>
                        <div className="text-xs font-mono text-zinc-500">{reg.player_4_id}</div>
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