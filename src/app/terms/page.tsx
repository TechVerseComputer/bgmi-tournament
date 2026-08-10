import { ShieldCheck } from 'lucide-react';

export default function TermsPage() {
  return (
    <main className="bg-[#0a0a0a] text-white font-sans min-h-screen pb-24">
      <section className="py-16 px-4 text-center border-b border-zinc-900 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        <ShieldCheck className="w-16 h-16 text-orange-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
        <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">Terms & <span className="text-orange-500">Conditions</span></h1>
      </section>
      
      <section className="py-12 px-4 max-w-4xl mx-auto space-y-8 text-zinc-300">
        
        {/* EXISTING SECTIONS */}
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

        {/* NEW SECTIONS */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-4">
          <h2 className="text-xl font-black uppercase tracking-wider text-orange-500">3. Player Eligibility</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Users must provide accurate account and player information during registration.</li>
            <li>Users must meet any applicable age and eligibility requirements to participate in cash tournaments.</li>
            <li>One person is strictly prohibited from operating multiple accounts to manipulate tournament lobbies or payouts.</li>
          </ul>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-4">
          <h2 className="text-xl font-black uppercase tracking-wider text-orange-500">4. Account Responsibility</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Players are entirely responsible for all activity occurring under their account.</li>
            <li>Login credentials and account access must be kept secure.</li>
            <li>Suspicious, unauthorized, or fraudulent activity may result in immediate account restrictions or permanent bans.</li>
          </ul>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-4">
          <h2 className="text-xl font-black uppercase tracking-wider text-orange-500">5. Tournament Registration</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Registration is strictly subject to available drop slots on a first-come, first-served basis.</li>
            <li>Registration permanently closes at the displayed closing time. Once registration closes, new entries are not accepted.</li>
            <li>Players must carefully verify tournament details (date, time, map, fee) before confirming joining.</li>
          </ul>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-4">
          <h2 className="text-xl font-black uppercase tracking-wider text-orange-500">6. Match Participation</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Players must follow all specific tournament rules established on the platform.</li>
            <li>Players must enter the match using the exact BGMI/In-Game ID they registered with. Using unverified accounts will forfeit winnings.</li>
            <li>Cheating, hacks, exploits, teaming in solo/duo, or any fraudulent behavior will result in disqualification and a ban.</li>
          </ul>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-4">
          <h2 className="text-xl font-black uppercase tracking-wider text-orange-500">7. Result Verification</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Results are placed "Under Review" for a mandatory 30-minute window after a match concludes.</li>
            <li>Submitted screenshots and match evidence are manually checked by administrators.</li>
            <li>Administrators reserve the right to request additional video or screenshot evidence when necessary.</li>
            <li>Wallet payouts occur strictly after result verification and approval.</li>
          </ul>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-4">
          <h2 className="text-xl font-black uppercase tracking-wider text-orange-500">8. Disputes</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Players must contact official support immediately during the "Under Review" period for any disputes.</li>
            <li>When raising a dispute, players should provide the Match ID, Player ID, and relevant unedited evidence.</li>
            <li>Administrative decisions regarding tournament verification and disputes are final and follow platform rules.</li>
          </ul>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-4">
          <h2 className="text-xl font-black uppercase tracking-wider text-orange-500">9. Cancellation & Refund Policy</h2>
          <p className="leading-relaxed">Entry fees are solely refundable if a match is officially cancelled by BGMI Arena administrators. In the event of an official cancellation, the entry fee is automatically returned to the player's platform wallet. Refunds are not granted for player disconnections, failing to join the room on time, or missing the registration window.</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-4">
          <h2 className="text-xl font-black uppercase tracking-wider text-orange-500">10. Platform Misuse</h2>
          <p className="leading-relaxed mb-3">Engaging in any of the following activities will result in immediate disqualification, forfeiture of wallet balances, and an account ban:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Committing financial fraud or payment manipulation.</li>
            <li>Submitting fake, edited, or reused screenshot evidence.</li>
            <li>Multiple-account abuse to manipulate match scaling.</li>
            <li>Attempting to exploit technical vulnerabilities on the platform.</li>
            <li>Abuse, harassment, or spamming of support and administrative systems.</li>
          </ul>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-4">
          <h2 className="text-xl font-black uppercase tracking-wider text-orange-500">11. Platform Availability</h2>
          <p className="leading-relaxed">While we strive for continuous service, technical interruptions, routine maintenance, or third-party service failures (such as payment gateway downtimes) may occasionally affect platform availability. BGMI Arena does not guarantee 100% platform uptime.</p>
        </div>

      </section>
    </main>
  );
}
