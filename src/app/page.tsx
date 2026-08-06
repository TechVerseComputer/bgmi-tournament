'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function Home() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegistration = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsSuccess(false);

    const formData = new FormData(e.currentTarget);
    const utr = (formData.get('utr') as string).trim();

    if (utr.length < 10) {
      setMessage('Error: Please enter a valid 12-digit UTR/Ref number.');
      setLoading(false);
      return;
    }

    // Save registration directly to Supabase
    const { error } = await supabase.from('registrations').insert([
      {
        igl_email: formData.get('email'),
        squad_name: formData.get('squadName'),
        player_1_id: formData.get('p1'),
        player_2_id: formData.get('p2'),
        player_3_id: formData.get('p3'),
        player_4_id: formData.get('p4'),
        utr_number: utr,
        payment_status: 'Pending',
      },
    ]);

    if (error) {
      if (error.code === '23505') {
        setMessage('❌ Fraud Blocked: This UTR number has already been used by another team!');
      } else {
        setMessage(`❌ Registration Error: ${error.message}`);
      }
    } else {
      setIsSuccess(true);
      setMessage('✅ Registration Submitted! Admin will verify payment within 1 hour.');
      (e.target as HTMLFormElement).reset();
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-lg mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="text-center mb-6">
          <span className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-500/20">
            BGMI Squad Match
          </span>
          <h1 className="text-2xl font-bold mt-2">Registration Portal</h1>
          <p className="text-slate-400 text-sm mt-1">
            Entry Fee: <span className="text-emerald-400 font-bold">₹100 / Squad</span>
          </p>
        </div>

        {/* QR Code Container */}
        <div className="bg-slate-800 p-4 rounded-xl text-center mb-6 border border-slate-700">
          <p className="text-xs text-slate-300 font-medium mb-3">Scan QR Code to Pay ₹100</p>
          <div className="w-48 h-48 bg-white mx-auto rounded-lg flex items-center justify-center text-slate-800 font-bold text-sm border-2 border-emerald-500">
            [ Scan UPI QR Here ]
          </div>
          <p className="text-xs text-slate-400 mt-2">GPay / PhonePe / Paytm / Any UPI App</p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleRegistration} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">IGL Google Email</label>
            <input
              required
              name="email"
              type="email"
              placeholder="igl@gmail.com"
              className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:outline-none text-sm text-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">Squad Name</label>
            <input
              required
              name="squadName"
              type="text"
              placeholder="Team Alpha"
              className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:outline-none text-sm text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Player 1 ID</label>
              <input
                required
                name="p1"
                type="text"
                placeholder="512345678"
                className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:outline-none text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Player 2 ID</label>
              <input
                required
                name="p2"
                type="text"
                placeholder="512345679"
                className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:outline-none text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Player 3 ID</label>
              <input
                required
                name="p3"
                type="text"
                placeholder="512345680"
                className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:outline-none text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Player 4 ID</label>
              <input
                required
                name="p4"
                type="text"
                placeholder="512345681"
                className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:outline-none text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-emerald-400 mb-1 block">
              12-Digit UTR / Transaction Ref No.
            </label>
            <input
              required
              name="utr"
              type="text"
              placeholder="e.g. 423589102948"
              className="w-full p-3 rounded-lg bg-slate-800 border-2 border-emerald-500 focus:outline-none font-mono text-sm tracking-widest text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-lg transition-all disabled:opacity-50 mt-2"
          >
            {loading ? 'Submitting Entry...' : 'Submit Entry'}
          </button>
        </form>

        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-center text-sm font-medium ${
              isSuccess
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-red-950 text-red-300 border border-red-800'
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </main>
  );
}