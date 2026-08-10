import { ShieldCheck } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <main className="bg-[#0a0a0a] text-white font-sans min-h-screen pb-24">
      <section className="py-16 px-4 text-center border-b border-zinc-900 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        <ShieldCheck className="w-16 h-16 text-orange-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
        <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">Privacy <span className="text-orange-500">Policy</span></h1>
      </section>
      
      <section className="py-12 px-4 max-w-4xl mx-auto space-y-8 text-zinc-300">
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-4">
          <h2 className="text-xl font-black uppercase tracking-wider text-orange-500">Data Collection</h2>
          <p className="leading-relaxed">We collect essential information required to operate the tournaments securely. This includes your authenticated Google email, in-game BGMI ID, and wallet transaction history. We do not sell or distribute your personal data to third parties.</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-4">
          <h2 className="text-xl font-black uppercase tracking-wider text-orange-500">Security</h2>
          <p className="leading-relaxed">All wallet deposits and withdrawals are processed via secure UPI gateways. Player data is encrypted and stored securely using industry-standard database protocols.</p>
        </div>
      </section>
    </main>
  );
}
