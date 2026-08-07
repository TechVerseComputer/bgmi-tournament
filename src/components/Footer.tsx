'use client';

import { Gamepad } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  
  // Hide footer on Admin and Dashboard pages
  if (pathname === '/admin' || pathname === '/dashboard') return null;

  return (
    <footer className="bg-[#050505] py-12 border-t border-zinc-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <Gamepad className="text-orange-500 w-8 h-8" />
          <span className="font-black text-xl tracking-tighter text-white">BGMI <span className="text-orange-500">ARENA</span></span>
        </div>
        <div className="flex gap-6 text-sm font-bold text-zinc-500">
          <a href="#" className="hover:text-orange-500 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-orange-500 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-orange-500 transition-colors">Contact Support</a>
        </div>
        <p className="text-zinc-600 text-sm font-medium">© {new Date().getFullYear()} BGMI Arena. All Rights Reserved.</p>
      </div>
    </footer>
  );
}