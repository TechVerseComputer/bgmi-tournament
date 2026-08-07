'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Trophy, Users, ShieldAlert, Gamepad2, UploadCloud, Trash2 } from 'lucide-react';

export default function AdminDashboard() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState('leaderboard'); // Defaulting to leaderboard for testing
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

  // --- TOURNAMENT LOGIC ---
  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return alert("Please select an image.");
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

      alert('Match Created!');
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
    if(confirm("Delete this match?")) {
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
        <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-black italic text-orange-500">SUPER ADMIN HUB</h1>
          </div>
          <button onClick={fetchAllData} className="bg-zinc-900 text-zinc-300 text-sm font-bold px-4 py-2 rounded border border-zinc-700">
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
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-3 rounded text-sm font-black uppercase transition-all ${activeTab === tab.id ? 'bg-orange-500 text-black' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* --- REGISTRATIONS TAB --- */}
        {activeTab === 'registrations' && (
           <div className="space-y-6">
             <div className="overflow-x-auto bg-zinc-900 border border-zinc-800 rounded">
               <table className="w-full text-left text-sm text-zinc-300">
                 <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs font-black border-b border-zinc-800">
                   <tr>
                     <th className="p-4">Squad</th><th className="p-4">UTR Number</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-800">
                   {registrations.map((reg) => (
                     <tr key={reg.id}>
                       <td className="p-4 font-bold">{reg.squad_name}</td>
                       <td className="p-4 font-mono text-orange-400">{reg.utr_number}</td>
                       <td className="p-4">{reg.payment_status}</td>
                       <td className="p-4 text-right space-x-2">
                         {reg.payment_status !== 'Verified' && <button onClick={() => handleVerify(reg.id)} className="bg-emerald-600 px-3 py-1.5 rounded font-bold text-xs">Verify</button>}
                         {reg.payment_status !== 'Rejected' && <button onClick={() => handleReject(reg.id)} className="bg-red-900 px-3 py-1.5 rounded font-bold text-xs">Reject</button>}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
        )}

        {/* --- TOURNAMENTS TAB --- */}
        {activeTab === 'tournaments' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded">
              <h2 className="text-xl font-black italic uppercase mb-4">Create Match</h2>
              {/* Form elements condensed for brevity, keeping all state bindings intact */}
              <form onSubmit={handleCreateTournament} className="space-y-4">
                <input required type="text" placeholder="Title" value={newTourney.name} onChange={e => setNewTourney({...newTourney, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-2 text-sm" />
                <input required id="imageUpload" type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="w-full text-sm file:mr-4 file:bg-orange-500 file:border-0 file:rounded file:px-4 file:py-1 cursor-pointer" />
                <input required type="number" placeholder="Fee" value={newTourney.fee} onChange={e => setNewTourney({...newTourney, fee: Number(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 p-2 text-sm" />
                <input required type="number" placeholder="1st Prize" value={newTourney.first_prize} onChange={e => setNewTourney({...newTourney, first_prize: Number(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 p-2 text-sm" />
                <input required type="number" placeholder="2nd Prize" value={newTourney.second_prize} onChange={e => setNewTourney({...newTourney, second_prize: Number(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 p-2 text-sm" />
                <button type="submit" disabled={uploading} className="w-full bg-orange-500 text-black font-black py-2 rounded">{uploading ? 'Uploading...' : 'Create'}</button>
              </form>
            </div>
            <div className="lg:col-span-2 space-y-4">
              {tournaments.map((t) => (
                <div key={t.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded flex justify-between items-center">
                  <div className="flex gap-4 items-center">
                    <img src={t.map_img} className="w-16 h-16 rounded object-cover" />
                    <div><h3 className="font-bold">{t.name}</h3><p className="text-xs text-orange-500 font-bold">Fee: ₹{t.fee}</p></div>
                  </div>
                  <button onClick={() => handleDeleteTournament(t.id)}><Trash2 className="w-5 h-5 text-red-500" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- LEADERBOARD TAB --- */}
        {activeTab === 'leaderboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded h-fit">
              <h2 className="text-xl font-black italic uppercase mb-4">Post Winners</h2>
              <form onSubmit={handleCreateLeaderboard} className="space-y-4 text-sm font-bold">
                <input required type="date" value={newLeaderboard.match_date} onChange={e => setNewLeaderboard({...newLeaderboard, match_date: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded text-zinc-300" />
                <input required type="text" placeholder="Time Slot (e.g. 9:00 PM)" value={newLeaderboard.slot_time} onChange={e => setNewLeaderboard({...newLeaderboard, slot_time: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded" />
                <input required type="text" placeholder="1st Place Squad" value={newLeaderboard.winner_1_team} onChange={e => setNewLeaderboard({...newLeaderboard, winner_1_team: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded border-l-4 border-l-orange-500" />
                <input required type="text" placeholder="2nd Place Squad" value={newLeaderboard.winner_2_team} onChange={e => setNewLeaderboard({...newLeaderboard, winner_2_team: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded border-l-4 border-l-zinc-500" />
                <button type="submit" className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black uppercase py-3 rounded">Publish to Leaderboard</button>
              </form>
            </div>
            <div className="lg:col-span-2 space-y-4">
              {leaderboards.map((l) => (
                <div key={l.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded flex justify-between items-center">
                  <div>
                    <span className="text-xs text-zinc-400 font-bold bg-black px-2 py-1 rounded">{l.match_date} • {l.slot_time}</span>
                    <p className="mt-3 font-black text-xl text-orange-500">🥇 {l.winner_1_team}</p>
                    <p className="font-bold text-zinc-300">🥈 {l.winner_2_team}</p>
                  </div>
                  <button onClick={() => handleDeleteLeaderboard(l.id)}><Trash2 className="w-5 h-5 text-red-500" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- RULES TAB --- */}
        {activeTab === 'rules' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded h-fit">
              <h2 className="text-xl font-black italic uppercase mb-4">Add Rule</h2>
              <form onSubmit={handleCreateRule} className="space-y-4 text-sm font-bold">
                <input required type="text" placeholder="Rule Title (e.g. EMULATORS)" value={newRule.title} onChange={e => setNewRule({...newRule, title: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded uppercase" />
                <textarea required placeholder="Detailed description..." value={newRule.description} onChange={e => setNewRule({...newRule, description: e.target.value})} rows={4} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded resize-none" />
                <button type="submit" className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black uppercase py-3 rounded">Save Rule</button>
              </form>
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rules.map((r) => (
                <div key={r.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded relative group">
                  <h3 className="font-black tracking-wide mb-2 text-orange-500">{r.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{r.description}</p>
                  <button onClick={() => handleDeleteRule(r.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4 text-red-500" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}