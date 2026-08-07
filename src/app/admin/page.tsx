'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Trophy, Users, ShieldAlert, Gamepad2, UploadCloud } from 'lucide-react';

interface Registration {
  id: string;
  squad_name: string;
  igl_email: string;
  player_1_id: string;
  player_2_id: string;
  player_3_id: string;
  player_4_id: string;
  utr_number: string;
  payment_status: string;
  slot_number: number | null;
  created_at: string;
}

interface Tournament {
  id: string;
  name: string;
  map_img: string;
  type: string;
  perspective: string;
  fee: number;
  first_prize: number;
  second_prize: number;
  status: string;
}

export default function AdminDashboard() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState('tournaments'); // Set default tab to tournaments for testing
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  // File Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [newTourney, setNewTourney] = useState({
    name: '', type: 'SQUAD', perspective: 'TPP', fee: 0, first_prize: 0, second_prize: 0
  });

  const fetchAllData = async () => {
    setLoading(true);
    const [regRes, tourneyRes] = await Promise.all([
      supabase.from('registrations').select('*').order('created_at', { ascending: false }),
      supabase.from('tournaments').select('*').order('created_at', { ascending: false })
    ]);

    if (regRes.data) setRegistrations(regRes.data);
    if (tourneyRes.data) setTournaments(tourneyRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleVerify = async (id: string) => {
    setActionLoading(id);
    const verifiedRegistrations = registrations.filter((r) => r.payment_status === 'Verified' && r.slot_number !== null);
    const assignedSlots = verifiedRegistrations.map((r) => r.slot_number as number);
    
    let nextSlot = 1;
    while (assignedSlots.includes(nextSlot)) nextSlot++;

    const { error } = await supabase.from('registrations').update({ payment_status: 'Verified', slot_number: nextSlot }).eq('id', id);
    if (!error) fetchAllData();
    else alert(`Failed to verify: ${error.message}`);
    setActionLoading(null);
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    const { error } = await supabase.from('registrations').update({ payment_status: 'Rejected', slot_number: null }).eq('id', id);
    if (!error) fetchAllData();
    setActionLoading(null);
  };

  // --- UPDATED TOURNAMENT LOGIC WITH IMAGE UPLOAD ---
  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      alert("Please select a background image file.");
      return;
    }
    setUploading(true);

    try {
      // 1. Create a unique file name to prevent overriding
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `match-banners/${fileName}`;

      // 2. Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('tournament-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      // 3. Get the public URL for the uploaded image
      const { data: publicUrlData } = supabase.storage
        .from('tournament-images')
        .getPublicUrl(filePath);

      // 4. Save everything to the database
      const finalTourneyData = {
        ...newTourney,
        map_img: publicUrlData.publicUrl
      };

      const { error: dbError } = await supabase.from('tournaments').insert([finalTourneyData]);
      if (dbError) throw dbError;

      alert('Tournament Successfully Created!');
      // Reset Form
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
    if(!confirm("Are you sure you want to delete this match?")) return;
    const { error } = await supabase.from('tournaments').delete().eq('id', id);
    if (!error) fetchAllData();
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
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
            { id: 'leaderboard', icon: Trophy, label: 'Leaderboard (Coming Next)' },
            { id: 'rules', icon: ShieldAlert, label: 'Rules (Coming Next)' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded text-sm font-black uppercase tracking-wider transition-all ${
                activeTab === tab.id ? 'bg-orange-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

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
                   <th className="p-4">Squad / IGL</th>
                   <th className="p-4">Player IDs</th>
                   <th className="p-4">UTR Number</th>
                   <th className="p-4">Status</th>
                   <th className="p-4">Slot</th>
                   <th className="p-4 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-zinc-800">
                 {registrations.map((reg) => (
                   <tr key={reg.id} className="hover:bg-zinc-800/50">
                     <td className="p-4">
                       <div className="font-bold text-white">{reg.squad_name}</div>
                       <div className="text-xs text-zinc-400">{reg.igl_email}</div>
                     </td>
                     <td className="p-4 text-xs font-mono text-zinc-400 space-y-0.5">
                       <div>P1: <span className="text-white">{reg.player_1_id}</span></div>
                       <div>P2: <span className="text-white">{reg.player_2_id}</span></div>
                       <div>P3: <span className="text-white">{reg.player_3_id}</span></div>
                       <div>P4: <span className="text-white">{reg.player_4_id}</span></div>
                     </td>
                     <td className="p-4 font-mono font-bold text-orange-400 select-all">{reg.utr_number}</td>
                     <td className="p-4">
                       <span className={`text-xs px-2.5 py-1 rounded font-bold ${
                           reg.payment_status === 'Verified' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                             : reg.payment_status === 'Rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                             : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                         }`}>
                         {reg.payment_status}
                       </span>
                     </td>
                     <td className="p-4 font-black text-white text-lg">{reg.slot_number ? `#${reg.slot_number}` : '-'}</td>
                     <td className="p-4 text-right space-x-2">
                       {reg.payment_status !== 'Verified' && (
                         <button disabled={actionLoading === reg.id} onClick={() => handleVerify(reg.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded uppercase">Verify</button>
                       )}
                       {reg.payment_status !== 'Rejected' && (
                         <button disabled={actionLoading === reg.id} onClick={() => handleReject(reg.id)} className="bg-zinc-800 hover:bg-red-900 text-red-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded uppercase border border-zinc-700">Reject</button>
                       )}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>
        )}

        {activeTab === 'tournaments' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 p-6 rounded">
              <h2 className="text-xl font-black italic uppercase tracking-widest mb-6 border-b border-zinc-800 pb-4">Create Match</h2>
              <form onSubmit={handleCreateTournament} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Match Title (e.g. Erangel Showdown)</label>
                  <input required type="text" value={newTourney.name} onChange={e => setNewTourney({...newTourney, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-sm focus:border-orange-500 outline-none" />
                </div>
                
                {/* NEW FILE UPLOAD FIELD */}
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Background Image</label>
                  <input 
                    required 
                    id="imageUpload"
                    type="file" 
                    accept="image/*"
                    onChange={e => setImageFile(e.target.files?.[0] || null)} 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-bold file:bg-orange-500 file:text-black hover:file:bg-orange-400 cursor-pointer" 
                  />
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

      </div>
    </main>
  );
}