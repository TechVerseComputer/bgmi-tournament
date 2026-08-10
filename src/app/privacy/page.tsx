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
          <h2 className="text-xl font-black uppercase tracking-wider text-orange-500">1. Information We Collect</h2>
          <p className="leading-relaxed">We collect essential information required to operate the tournaments securely. This includes your authenticated Google email, in-game BGMI ID, and wallet transaction history. We do not sell or distribute your personal data to third parties.</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Player profile and authentication information</li>
            <li>Tournament participation records</li>
            <li>Withdrawal details required to process payouts</li>
            <li>Match result screenshots submitted for verification</li>
            <li>Basic technical and device information required for platform functionality</li>
          </ul>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-4">
          <h2 className="text-xl font-black uppercase tracking-wider text-orange-500">2. How Information is Used</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Account authentication and security</li>
            <li>Tournament registration and match management</li>
            <li>Result verification and payout distribution</li>
            <li>Wallet and transaction processing</li>
            <li>Fraud prevention and resolving disputes</li>
            <li>Customer support and platform improvement</li>
          </ul>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-4">
          <h2 className="text-xl font-black uppercase tracking-wider text-orange-500">3. Payment Information</h2>
          <p className="leading-relaxed">We retain transaction reference numbers (such as UTR or UPI IDs) and amounts strictly for verifying deposits and processing withdrawals. BGMI Arena does not collect, process, or store sensitive payment credentials like banking PINs or card details.</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-4">
          <h2 className="text-xl font-black uppercase tracking-wider text-orange-500">4. Screenshots & Match Evidence</h2>
          <p className="leading-relaxed">User-submitted match screenshots are collected strictly for verifying tournament results, confirming placements and kills, and resolving potential match disputes during the mandatory review period.</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-4">
          <h2 className="text-xl font-black uppercase tracking-wider text-orange-500">5. Data Sharing</h2>
          <p className="leading-relaxed">While we do not sell personal data, necessary information is securely shared with trusted service providers required to operate the platform. This includes our authentication provider (Google), database and hosting providers, and payment processing gateways for verifying UPI transactions.</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-4">
          <h2 className="text-xl font-black uppercase tracking-wider text-orange-500">6. Data Security</h2>
          <p className="leading-relaxed">All wallet deposits and withdrawals are processed via secure UPI gateways. Player data is encrypted and stored securely using industry-standard database protocols.</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-4">
          <h2 className="text-xl font-black uppercase tracking-wider text-orange-500">7. Data Retention</h2>
          <p className="leading-relaxed">We retain certain transaction ledgers, tournament entries, and account records for operational, security, and dispute resolution purposes. This ensures a transparent financial and match history for all users.</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-4">
          <h2 className="text-xl font-black uppercase tracking-wider text-orange-500">8. User Rights & Requests</h2>
          <p className="leading-relaxed">If you have questions regarding your privacy, need to correct account information, or have specific data-related requests, please contact our official support team at <strong>support@bgmiarena.in</strong>.</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-4">
          <h2 className="text-xl font-black uppercase tracking-wider text-orange-500">9. Cookies & Local Storage</h2>
          <p className="leading-relaxed">We use browser local storage and cookies strictly to maintain your active login session, save your notification preferences, and support Progressive Web App (PWA) functionalities.</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-4">
          <h2 className="text-xl font-black uppercase tracking-wider text-orange-500">10. Policy Updates</h2>
          <p className="leading-relaxed">We may update this Privacy Policy as our platform evolves. The latest version will always be published directly on this page.</p>
        </div>

      </section>
    </main>
  );
}
