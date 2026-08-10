'use client';

import Link from 'next/link';
import { Gamepad, Wallet, LogIn, Menu, X, Download, BellRing, BellOff, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { usePathname } from 'next/navigation';

// Strictly type the PWA event to satisfy the TypeScript compiler
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Utility function to convert VAPID key for the PushManager
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function Navbar() {
  const supabase = createClient();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // PWA Install Prompt State with strict typing
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Notification States
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data } = await supabase.from('wallets').select('balance').eq('user_id', session.user.id).single();
        if (data) setBalance(data.balance);
      }
    };
    fetchUser();

    // Listen for PWA install capability safely
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // --- NOTIFICATION PERMISSION LOGIC ---
    if (!('Notification' in window)) {
      setNotifPermission('unsupported');
    } else {
      setNotifPermission(Notification.permission);
      
      // If default (never asked) and user hasn't explicitly dismissed our custom prompt before
      if (Notification.permission === 'default' && !localStorage.getItem('notifPromptDismissed')) {
        // Slight delay so it doesn't aggressively pop up the millisecond the site loads
        const timer = setTimeout(() => setShowNotifPrompt(true), 3500);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [pathname]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // --- NOTIFICATION HANDLERS (UPGRADED FOR REAL WEB PUSH) ---
  const handleEnableNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      setShowNotifPrompt(false);

      // If granted and the user is logged in, securely subscribe their device
      if (permission === 'granted' && user) {
        await subscribeDeviceToPush();
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    }
  };

  const subscribeDeviceToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    
    try {
      // Wait for the next-pwa service worker to be ready
      const registration = await navigator.serviceWorker.ready;
      
      // Check if this device is already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) return; 

      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) {
        console.warn('VAPID public key is missing from environment variables.');
        return;
      }

      // Generate the secure push subscription endpoint via the browser
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });

      const subJSON = subscription.toJSON();
      
      // Save the subscription to your Supabase database securely linked to the player
      await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys?.p256dh,
        auth: subJSON.keys?.auth,
        created_at: new Date().toISOString()
      }, { onConflict: 'endpoint' });

    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    }
  };

  const handleDismissNotificationPrompt = () => {
    localStorage.setItem('notifPromptDismissed', 'true');
    setShowNotifPrompt(false);
  };

  if (pathname === '/admin' || pathname === '/dashboard' || pathname === '/admin/ledger') return null;

  return (
    <>
      {/* CUSTOM NOTIFICATION PROMPT OVERLAY */}
      {showNotifPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative text-center">
            <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
              <Bell className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-black italic text-white uppercase tracking-wider mb-2">Stay Updated</h3>
            <p className="text-sm text-zinc-400 font-bold mb-8">
              Allow notifications to receive important match updates, room details, results, and wallet deposit confirmations.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleEnableNotifications}
                className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black uppercase tracking-widest py-3 rounded transition-colors"
              >
                Enable Notifications
              </button>
              <button 
                onClick={handleDismissNotificationPrompt}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold uppercase tracking-widest py-3 rounded border border-zinc-800 transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="w-full z-50 p-4 md:px-8 lg:px-12 flex justify-between items-center bg-zinc-950 border-b border-zinc-900 sticky top-0">
        <Link href="/" className="flex items-center gap-2">
          <Gamepad className="text-orange-500 w-6 h-6 md:w-8 md:h-8 shrink-0" />
          <div className="font-black text-xl md:text-2xl tracking-tighter text-white whitespace-nowrap">BGMI <span className="text-orange-500">ARENA</span></div>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8 text-sm font-bold tracking-wide items-center">
          <Link href="/" className={`transition-colors ${pathname === '/' ? 'text-orange-500 border-b-2 border-orange-500 pb-1' : 'text-zinc-300 hover:text-orange-400'}`}>HOME</Link>
          <Link href="/tournaments" className={`transition-colors ${pathname.includes('/tournaments') ? 'text-orange-500 border-b-2 border-orange-500 pb-1' : 'text-zinc-300 hover:text-orange-400'}`}>TOURNAMENTS</Link>
          <Link href="/leaderboard" className={`transition-colors ${pathname === '/leaderboard' ? 'text-orange-500 border-b-2 border-orange-500 pb-1' : 'text-zinc-300 hover:text-orange-400'}`}>LEADERBOARD</Link>
          <Link href="/rules" className={`transition-colors ${pathname === '/rules' ? 'text-orange-500 border-b-2 border-orange-500 pb-1' : 'text-zinc-300 hover:text-orange-400'}`}>RULES</Link>
          
          {user && (
            <Link href="/dashboard" className={`transition-colors ${pathname === '/dashboard' ? 'text-orange-500 border-b-2 border-orange-500 pb-1' : 'text-zinc-300 hover:text-orange-400'}`}>DASHBOARD</Link>
          )}

          {/* Notification Status Indicator (Desktop) */}
          {notifPermission === 'granted' && <BellRing className="w-4 h-4 text-emerald-500" title="Notifications Enabled" />}
          {notifPermission === 'denied' && <BellOff className="w-4 h-4 text-red-500 opacity-50" title="Notifications Blocked in Browser Settings" />}

          {/* PWA Install Button (Desktop) */}
          {deferredPrompt && (
            <button onClick={handleInstallClick} className="bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-4 py-2 rounded flex items-center gap-2 transition-colors border border-blue-500/30">
              <Download className="w-4 h-4 shrink-0" /> Install App
            </button>
          )}
          
          {user ? (
            <Link href="/dashboard" className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded flex items-center gap-2 transition-colors border border-zinc-700 text-emerald-500">
              <Wallet className="w-4 h-4 shrink-0" /> ₹{balance}
            </Link>
          ) : (
            <Link href="/dashboard" className="bg-orange-500 hover:bg-orange-400 text-black px-5 py-2.5 rounded flex items-center gap-2 transition-colors font-black uppercase tracking-wider shadow-[0_0_15px_rgba(249,115,22,0.3)]">
              <LogIn className="w-4 h-4 shrink-0" /> Player Login
            </Link>
          )}
        </div>

        {/* Mobile Top Bar */}
        <div className="flex md:hidden items-center gap-3">
          
          {/* Notification Status Indicator (Mobile) */}
          {notifPermission === 'granted' && <BellRing className="w-4 h-4 text-emerald-500" />}
          {notifPermission === 'denied' && <BellOff className="w-4 h-4 text-red-500 opacity-50" />}

          {/* PWA Install Button (Mobile Top Bar) */}
          {deferredPrompt && (
            <button onClick={handleInstallClick} className="bg-blue-600/20 text-blue-400 p-1.5 rounded border border-blue-500/30" aria-label="Install App">
              <Download className="w-5 h-5 shrink-0" />
            </button>
          )}

          {user && (
            <Link href="/dashboard" className="bg-zinc-800 px-3 py-1.5 rounded flex items-center gap-1.5 text-xs text-emerald-500 border border-zinc-700 font-bold">
              <Wallet className="w-3.5 h-3.5 shrink-0" /> ₹{balance}
            </Link>
          )}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-zinc-300 hover:text-orange-500 p-1">
            {mobileMenuOpen ? <X className="w-7 h-7 shrink-0" /> : <Menu className="w-7 h-7 shrink-0" />}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-zinc-950 border-b border-zinc-900 p-6 flex flex-col gap-2 md:hidden shadow-2xl">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className={`text-base font-bold py-3 ${pathname === '/' ? 'text-orange-500' : 'text-zinc-300 hover:text-white'}`}>HOME</Link>
            <Link href="/tournaments" onClick={() => setMobileMenuOpen(false)} className={`text-base font-bold py-3 ${pathname.includes('/tournaments') ? 'text-orange-500' : 'text-zinc-300 hover:text-white'}`}>TOURNAMENTS</Link>
            <Link href="/leaderboard" onClick={() => setMobileMenuOpen(false)} className={`text-base font-bold py-3 ${pathname === '/leaderboard' ? 'text-orange-500' : 'text-zinc-300 hover:text-white'}`}>LEADERBOARD</Link>
            <Link href="/rules" onClick={() => setMobileMenuOpen(false)} className={`text-base font-bold py-3 ${pathname === '/rules' ? 'text-orange-500' : 'text-zinc-300 hover:text-white'}`}>RULES</Link>
            
            {user && (
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className={`text-base font-bold py-3 ${pathname === '/dashboard' ? 'text-orange-500' : 'text-zinc-300 hover:text-white'}`}>DASHBOARD</Link>
            )}

            {/* PWA Install Button (Mobile Drawer) */}
            {deferredPrompt && (
              <button onClick={() => { handleInstallClick(); setMobileMenuOpen(false); }} className="bg-blue-600/20 text-blue-400 border border-blue-500/30 py-3 rounded text-center font-black uppercase tracking-wider mt-2 flex items-center justify-center gap-2">
                <Download className="w-4 h-4 shrink-0" /> Install App
              </button>
            )}
            
            {!user && (
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="bg-orange-500 text-black py-3.5 rounded text-center font-black uppercase tracking-wider mt-4 flex items-center justify-center gap-2">
                <LogIn className="w-4 h-4 shrink-0" /> Player Login
              </Link>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
