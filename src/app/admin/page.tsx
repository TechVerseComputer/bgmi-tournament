'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Trophy, Users, ShieldAlert, Gamepad2, UploadCloud, Trash2 } from 'lucide-react';

export default function AdminDashboard() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState('tournaments'); 
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Data States
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [leaderboards, setLeaderboards] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);

  // Form States
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newTourney, setNewTourney] = useState({ name: '', type: 'SQUAD', perspective: 'TPP', fee: 0, first_prize: 0, second_prize: 0 });
  const [newLeaderboard, setNewLeaderboard] = useState({ match_date: '', slot_time: '', winner_1_team: '', winner_2_team: '' });
  const [newRule, setNewRule] = useState({ title: '', description: '' });

  // Fetch Everything
  const fetchAllData = async () => {
    setLoading(true);
    const [regRes, tourneyRes, leadRes, rulesRes] = await Promise.all([
      supabase.from('registrations').select('*').order('created_at', { ascending: false }),
      supabase.from('tournaments').select('*').order('created_at', { ascending: false }),
      supabase.from('leaderboard').select('*').order('match_date', { ascending: false }),
      supabase.from('rules').select('*').order('created_at', { ascending: true })
    ]);

    if (regRes.data) setRegistrations(regRes.data);
    if (tourneyRes.data) setTournaments(tourneyRes.data);
    if (leadRes.data) setLeaderboards(leadRes.data);
    if (rulesRes.data) setRules(rulesRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // --- UTR APPROVAL LOGIC ---
  const handleVerify = async (id: string) => {
    setActionLoading(id);
    const verifiedRegistrations = registrations.filter((r) => r.payment_status === 'Verified' && r.slot_number !== null);
    const assignedSlots = verifiedRegistrations.map((r) => r.slot_number as number);
    let nextSlot = 1;
    while (assignedSlots.includes(nextSlot)) nextSlot++;

    const { error } = await supabase.from('registrations').update({ payment_status: 'Verified', slot_number: nextSlot }).eq('id', id);
    if (!error) fetchAllData();
    setActionLoading(null);
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    const { error } = await supabase.from('registrations').update({ payment_status: 'Rejected', slot_number: null }).eq('id', id);
    if (!error) fetchAllData();
    setActionLoading(null);
  };

  // --- TOURNAMENT LOGIC (WITH UPLOAD) ---
  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return alert("Please select a background image file.");
    setUploading(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `match-banners/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('tournament-images').upload(filePath, imageFile);
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from('tournament-images').getPublicUrl(filePath);
      
      const { error: dbError } = await supabase.from('tournaments').insert([{ ...newTourney, map_img: publicUrlData.publicUrl }]);
      if (dbError) throw dbError;

      alert('Match Created Successfully!');
      setNewTourney({ name: '', type: 'SQUAD', perspective: 'TPP', fee: 0, first_prize: 0, second_prize: 0 });
      setImageFile(null);
      (document.getElementById('imageUpload') as HTMLInputElement).value = "";
      fetchAllData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTournament = async (id: string) => {
    if(confirm("Are you sure you want to delete this match?")) {
      await supabase.from('tournaments').delete().eq('id', id);
      fetchAllData();
    }
  };

  // --- LEADERBOARD LOGIC ---
  const handleCreateLeaderboard = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('leaderboard').insert([newLeaderboard]);
    if (!error) {
      setNewLeaderboard({ match_date: '', slot_time: '', winner_1_team: '', winner_2_team: '' });
      fetchAllData();
    } else alert(error.message);
  };

  const handleDeleteLeaderboard = async (id: string) => {
    if(confirm("Delete this entry?")) {
      await supabase.from('leaderboard').delete().eq('id', id);
      fetchAllData();
    }
  };

  // --- RULES LOGIC ---
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('rules').insert([newRule]);
    if (!error) {
      setNewRule({ title: '', description: '' });
      fetchAllData();
    } else alert(error.message);
  };

  const handleDeleteRule = async (id: string) => {
    if(confirm("Delete this rule?")) {
      await supabase.from('rules').delete().eq('id', id);
      fetchAllData();
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-black italic tracking-wider text-orange-500">SUPER ADMIN HUB</h1>
            <p className="text-zinc-400 text-sm mt-1 font-medium">Manage registrations, matches, and rules</p>
          </div>
          <button onClick={fetchAllData} className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-sm font-bold px-4 py-2 rounded border border-zinc-700 transition-all">
            🔄 Refresh Database
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { id: 'registrations', icon: Users, label: 'UTR Approvals' },
            { id: 'tournaments', icon: Gamepad2, label: 'Manage Tournaments' },
            { id: 'leaderboard', icon: Trophy, label: 'Leaderboard' },
            { id: 'rules', icon: ShieldAlert, label: 'Rules' }
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-3 rounded text-sm font-black uppercase tracking-wider transition-all ${activeTab === tab.id ? 'bg-orange-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'}`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* --- REGISTRATIONS TAB --- */}
        {activeTab === 'registrations' && (
           <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="bg-zinc-900 border border-zinc-800 p-5 rounded">
                 <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Pending Approvals</p>
                 <p className="text-3xl font-black text-amber-500 mt-1">{registrations.filter((r) => r.payment_status === 'Pending').length}</p>
               </div>
               <div className="bg-zinc-900 border border-zinc-800 p-5 rounded">
                 <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Verified Squads</p>
                 <p className="text-3xl font-black text-emerald-500 mt-1">{registrations.filter((r) => r.payment_status === 'Verified').length}</p>
               </div>
               <div className="bg-zinc-900 border border-zinc-800 p-5 rounded">
                 <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Collected Revenue</p>
                 <p className="text-3xl font-black text-emerald-500 mt-1">₹{registrations.filter((r) => r.payment_status === 'Verified').length * 100}</p>
               </div>
             </div>
             <div className="overflow-x-auto bg-zinc-900 border border-zinc-800 rounded">
               <table className="w-full text-left text-sm text-zinc-300">
                 <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs font-black tracking-wider border-b border-zinc-800">
                   <tr>
                     <th className="p-4">Squad / IGL</th><th className="p-4">Player IDs</th><th className="p-4">UTR Number</th><th className="p-4">Status</th><th className="p-4">Slot</th><th className="p-4 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-800">
                   {registrations.map((reg) => (
                     <tr key={reg.id} className="hover:bg-zinc-800/50">
                       <td className="p-4"><div className="font-bold text-white">{reg.squad_name}</div><div className="text-xs text-zinc-400">{reg.igl_email}</div></td>
                       <td className="p-4 text-xs font-mono text-zinc-400 space-y-0.5">
                         <div>P1: <span className="text-white">{reg.player_1_id}</span></div><div>P2: <span className="text-white">{reg.player_2_id}</span></div>
                         <div>P3: <span className="text-white">{reg.player_3_id}</span></div><div>P4: <span className="text-white">{reg.player_4_id}</span></div>
                       </td>
                       <td className="p-4 font-mono font-bold text-orange-400 select-all">{reg.utr_number}</td>
                       <td className="p-4">
                         <span className={`text-xs px-2.5 py-1 rounded font-bold ${reg.payment_status === 'Verified' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : reg.payment_status === 'Rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                           {reg.payment_status}
                         </span>
                       </td>
                       <td className="p-4 font-black text-white text-lg">{reg.slot_number ? `#${reg.slot_number}` : '-'}</td>
                       <td className="p-4 text-right space-x-2">
                         {reg.payment_status !== 'Verified' && <button disabled={actionLoading === reg.id} onClick={() => handleVerify(reg.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded uppercase">Verify</button>}
                         {reg.payment_status !== 'Rejected' && <button disabled={actionLoading === reg.id} onClick={() => handleReject(reg.id)} className="bg-zinc-800 hover:bg-red-900 text-red-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded uppercase border border-zinc-700">Reject</button>}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
        )}

        {/* --- TOURNAMENTS TAB (RESTORED DETAILED UI) --- */}
        {activeTab === 'tournaments' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 p-6 rounded">
              <h2 className="text-xl font-black italic uppercase tracking-widest mb-6 border-b border-zinc-800 pb-4">Create Match</h2>
              <form onSubmit={handleCreateTournament} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Match Title (e.g. Erangel Showdown)</label>
                  <input required type="text" value={newTourney.name} onChange={e => setNewTourney({...newTourney, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-sm focus:border-orange-500 outline-none" />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Background Image</label>
                  <input required id="imageUpload" type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-bold file:bg-orange-500 file:text-black hover:file:bg-orange-400 cursor-pointer" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Type</label>
                    <select value={newTourney.type} onChange={e => setNewTourney({...newTourney, type: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-sm focus:border-orange-500 outline-none">
                      <option>SOLO</option><option>DUO</option><option>SQUAD</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Perspective</label>
                    <select value={newTourney.perspective} onChange={e => setNewTourney({...newTourney, perspective: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-sm focus:border-orange-500 outline-none">
                      <option>TPP</option><option>FPP</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Entry Fee (₹)</label>
                  <input required type="number" value={newTourney.fee} onChange={e => setNewTourney({...newTourney, fee: Number(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-sm focus:border-orange-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">1st Prize (₹)</label>
                    <input required type="number" value={newTourney.first_prize} onChange={e => setNewTourney({...newTourney, first_prize: Number(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-sm focus:border-orange-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">2nd Prize (₹)</label>
                    <input required type="number" value={newTourney.second_prize} onChange={e => setNewTourney({...newTourney, second_prize: Number(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-sm focus:border-orange-500 outline-none" />
                  </div>
                </div>
                <button type="submit" disabled={uploading} className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black uppercase tracking-widest py-3 rounded mt-4 transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
                  {uploading ? <><UploadCloud className="w-5 h-5 animate-pulse" /> Uploading...</> : 'Create Tournament'}
                </button>
              </form>
            </div>
            
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
                        <h3 className="font-black italic text-lg uppercase tracking-wide">{t.name}</h3>
                        <div className="flex gap-2 text-xs font-bold text-zinc-400 mt-1">
                          <span className="text-orange-500">{t.type}</span> • <span>{t.perspective}</span> • <span>Fee: ₹{t.fee}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteTournament(t.id)} className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 px-4 py-2 rounded text-xs font-black uppercase tracking-wider transition-all w-full sm:w-auto">
                      Delete Match
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- LEADERBOARD TAB --- */}
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

        {/* --- RULES TAB --- */}
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