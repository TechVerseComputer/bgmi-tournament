'use client';

import Link from 'next/link';
import { Gamepad, Mail, Phone, MapPin } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  
  if (pathname === '/admin' || pathname === '/dashboard') return null;

  return (
    <footer className="bg-[#050505] text-zinc-400 font-sans border-t border-zinc-900 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
        
        {/* Col 1: Brand */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Gamepad className="text-orange-500 w-8 h-8" />
            <span className="font-black text-xl tracking-tighter text-white">BGMI <span className="text-orange-500">ARENA</span></span>
          </div>
          <p className="text-sm leading-relaxed text-zinc-400">
            India's most trusted platform for competitive BGMI tournaments. Join, play, and win cash prizes daily.
          </p>
        </div>

        {/* Col 2: Quick Links */}
        <div>
          <h4 className="text-white font-black uppercase tracking-wider text-sm mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm font-medium">
            <li><Link href="/" className="hover:text-orange-500 transition-colors">Home</Link></li>
            <li><Link href="/tournaments" className="hover:text-orange-500 transition-colors">Tournaments</Link></li>
            <li><Link href="/leaderboard" className="hover:text-orange-500 transition-colors">Leaderboard</Link></li>
            <li><Link href="/rules" className="hover:text-orange-500 transition-colors">Rules</Link></li>
            <li><Link href="/dashboard" className="hover:text-orange-500 transition-colors">Player Portal</Link></li>
          </ul>
        </div>

        {/* Col 3: Support (FIXED ROUTES) */}
        <div>
          <h4 className="text-white font-black uppercase tracking-wider text-sm mb-4">Support</h4>
          <ul className="space-y-2 text-sm font-medium">
            <li><Link href="/help" className="hover:text-orange-500 transition-colors">Help Center</Link></li>
            <li><Link href="/how-to-play" className="hover:text-orange-500 transition-colors">How to Play</Link></li>
            <li><Link href="/terms" className="hover:text-orange-500 transition-colors">Terms & Conditions</Link></li>
            <li><Link href="/privacy" className="hover:text-orange-500 transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>

        {/* Col 4: Contact Us (FIXED CLICKABLE LINKS) */}
        <div>
          <h4 className="text-white font-black uppercase tracking-wider text-sm mb-4">Contact Us</h4>
          <ul className="space-y-3 text-sm font-medium">
            <li>
              <a href="mailto:mail.bgmighost@gmail.com" className="flex items-center gap-2 hover:text-orange-500 transition-colors">
                <Mail className="w-4 h-4 text-orange-500"/> mail.bgmighost@gmail.com
              </a>
            </li>
            <li>
              <a href="tel:+919967566736" className="flex items-center gap-2 hover:text-orange-500 transition-colors">
                <Phone className="w-4 h-4 text-orange-500"/> +91 99675 66736
              </a>
            </li>
            <li className="flex items-center gap-2 cursor-default">
              <MapPin className="w-4 h-4 text-orange-500"/> Navi Mumbai, India
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 border-t border-zinc-900 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold text-zinc-500">
        <p>© {new Date().getFullYear()} BGMI Arena. All Rights Reserved.</p>
        <p className="flex items-center gap-1">Made with <span className="text-red-500">❤️</span> for BGMI Lovers</p>
      </div>
    </footer>
  );
}
