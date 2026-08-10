import { Gamepad2, Trophy, Users, Zap } from 'lucide-react';

export default function HowToPlayPage() {
  return (
    <main className="bg-[#0a0a0a] text-white font-sans min-h-screen pb-24">
      <section className="py-16 px-4 text-center border-b border-zinc-900 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        <Gamepad2 className="w-16 h-16 text-orange-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
        <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">How To <span className="text-orange-500">Play</span></h1>
        <p className="text-zinc-400 font-bold">Your 4-step guide to winning on BGMI Arena.</p>
      </section>
      
      <section className="py-12 px-4 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900/40 border border-zinc-800/80 p-8 rounded-2xl space-y-4">
          <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center font-black text-xl mb-4 border border-orange-500/20">1</div>
          <h3 className="font-black uppercase tracking-wider text-white text-lg">Deposit Funds</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">Head to the Player Portal and top up your wallet via UPI. Admins approve deposits instantly.</p>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800/80 p-8 rounded-2xl space-y-4">
          <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center font-black text-xl mb-4 border border-orange-500/20">2</div>
          <h3 className="font-black uppercase tracking-wider text-white text-lg">Book Your Drop</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">Select a match, choose an open Drop Slot, enter your squad's In-Game IDs, and confirm.</p>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800/80 p-8 rounded-2xl space-y-4">
          <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center font-black text-xl mb-4 border border-orange-500/20">3</div>
          <h3 className="font-black uppercase tracking-wider text-white text-lg">Get Room Details</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">Return to the Match Details page 15 minutes before the start time to view the Room ID & Password.</p>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800/80 p-8 rounded-2xl space-y-4">
          <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center font-black text-xl mb-4 border border-orange-500/20">4</div>
          <h3 className="font-black uppercase tracking-wider text-white text-lg">Submit & Win</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">Upload a screenshot of your match result. Once verified, your prize money is instantly credited.</p>
        </div>
      </section>
    </main>
  );
}
