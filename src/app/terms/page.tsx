import { ShieldCheck } from 'lucide-react';

export default function TermsPage() {
  return (
    <main className="bg-[#0a0a0a] text-white font-sans min-h-screen pb-24">
      <section className="py-16 px-4 text-center border-b border-zinc-900 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        <ShieldCheck className="w-16 h-16 text-orange-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
        <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">Terms & <span className="text-orange-500">Conditions</span></h1>
      </section>
      
      <section className="py-12 px-4 max-w-4xl mx-auto space-y-8 text-zinc-300">
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-4">
          <h2 className="text-xl font-black uppercase tracking-wider text-orange-500">1. Acceptance of Terms</h2>
          <p className="leading-relaxed">By accessing and registering on BGMI Arena, you agree to abide by these Terms and Conditions. If you do not agree with any part of these terms, you are prohibited from using the platform.</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-4">
          <h2 className="text-xl font-black uppercase tracking-wider text-orange-500">2. Tournament Entry & Payouts</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Entry fees are strictly non-refundable unless a tournament is officially cancelled by administrators.</li>
            <li>Prize distributions are subject to the total number of registered slots. Live scaling logic applies unless the match is fully booked.</li>
            <li>Fraudulent evidence submission will result in an immediate and permanent ban without refund.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
