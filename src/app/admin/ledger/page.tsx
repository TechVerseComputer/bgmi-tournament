'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldAlert, Download, Filter, Search, DollarSign, ArrowDownCircle, ArrowUpCircle, RefreshCw, Layers } from 'lucide-react';

export default function AdminRevenueLedger() {
  const supabase = createClient();
  const router = useRouter();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  // Raw Database Data
  const [rawTransactions, setRawTransactions] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterTournament, setFilterTournament] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setStartDateEnd] = useState('');

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: adminData } = await supabase.from('admins').select('*').eq('email', session.user.email).single();
        if (adminData) {
          setIsAuthorized(true);
          fetchLedgerData();
        }
      }
      setAuthLoading(false);
    };
    checkAuthAndFetch();
  }, []);

  const fetchLedgerData = async () => {
    setLoading(true);
    const [txRes, tourneyRes, regRes] = await Promise.all([
      supabase.from('transactions').select('*').order('created_at', { ascending: false }),
      supabase.from('tournaments').select('*'),
      supabase.from('registrations').select('*')
    ]);

    if (txRes.data) setRawTransactions(txRes.data);
    if (tourneyRes.data) setTournaments(tourneyRes.data);
    if (regRes.data) setRegistrations(regRes.data);
    setLoading(false);
  };

  // --- LEDGER RECONCILIATION ENGINE ---
  // Transforms raw wallet transactions into GAAP-standard accounting items
  const ledgerEntries = rawTransactions.map((tx) => {
    let credit = 0; // Money coming to platform/wallet
    let debit = 0;  // Money leaving platform/wallet
    let normalizedCategory = tx.type;

    if (['DEPOSIT', 'TOURNAMENT_FEE'].includes(tx.type)) {
      credit = Number(tx.amount || 0);
    } else if (['WITHDRAWAL', 'PRIZE_WIN', 'REFUND'].includes(tx.type)) {
      debit = Number(tx.amount || 0);
    }

    // Identify Tournament Name from registration or description match
    let matchName = 'N/A';
    if (tx.description) {
      const matchedTourney = tournaments.find(t => tx.description.includes(t.name));
      if (matchedTourney) matchName = matchedTourney.name;
    }

    return {
      id: tx.id,
      date: tx.created_at,
      userId: tx.user_id,
      type: tx.type,
      category: normalizedCategory,
      amount: Number(tx.amount || 0),
      credit,
      debit,
      status: tx.status || 'SUCCESS',
      reference: tx.reference_id || tx.upi_id || tx.id.slice(0, 8),
      description: tx.description || 'N/A',
      matchName
    };
  });

  // --- FILTERING ENGINE ---
  const filteredEntries = ledgerEntries.filter((entry) => {
    // Search
    const matchesSearch = 
      entry.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Type Filter
    const matchesType = filterType === 'ALL' || entry.type === filterType;

    // Status Filter
    const matchesStatus = filterStatus === 'ALL' || entry.status === filterStatus;

    // Tournament Filter
    const matchesTourney = filterTournament === 'ALL' || entry.matchName === filterTournament;

    // Date Range Filter
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && new Date(entry.date) >= new Date(startDate);
    }
    if (endDate) {
      matchesDate = matchesDate && new Date(entry.date) <= new Date(endDate);
    }

    return matchesSearch && matchesType && matchesStatus && matchesTourney && matchesDate;
  });

  // --- SUMMARY CALCULATIONS (Accounting Standard) ---
  const totalDeposits = ledgerEntries
    .filter(e => e.type === 'DEPOSIT' && e.status === 'SUCCESS')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalEntryFees = ledgerEntries
    .filter(e => e.type === 'TOURNAMENT_FEE' && e.status === 'SUCCESS')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalPrizesPaid = ledgerEntries
    .filter(e => e.type === 'PRIZE_WIN' && e.status === 'SUCCESS')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalRefunds = ledgerEntries
    .filter(e => e.type === 'REFUND' && e.status === 'SUCCESS')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalWithdrawals = ledgerEntries
    .filter(e => e.type === 'WITHDRAWAL' && e.status === 'SUCCESS')
    .reduce((sum, e) => sum + e.amount, 0);

  const pendingAmount = ledgerEntries
    .filter(e => e.status === 'PENDING')
    .reduce((sum, e) => sum + e.amount, 0);

  // Accounting Platform Revenue = Net Collections (Entry Fees - Refunds - Prizes Paid)
  const grossTournamentCollection = totalEntryFees - totalRefunds;
  const platformRevenue = grossTournamentCollection - totalPrizesPaid;
  const netPoolBalance = totalDeposits - totalWithdrawals;

  // --- EXPORT TO CSV ENGINE ---
  const exportToCSV = () => {
    const headers = ["Transaction ID", "Date", "User ID", "Type", "Credit (₹)", "Debit (₹)", "Status", "Reference", "Description"];
    const rows = filteredEntries.map(e => [
      e.id,
      new Date(e.date).toLocaleString('en-IN'),
      e.userId,
      e.type,
      e.credit,
      e.debit,
      e.status,
      `"${e.reference}"`,
      `"${e.description}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BGMI_Arena_Financial_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (authLoading) return <div className="min-h-screen bg-[#050505] text-emerald-500 font-black flex items-center justify-center animate-pulse">Loading Financial Records...</div>;
  if (!isAuthorized) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 text-center text-white">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-3xl font-black uppercase">Access Denied</h1>
      <button onClick={() => router.push('/admin')} className="mt-6 bg-orange-500 text-black font-black px-6 py-3 rounded uppercase">Back to Admin Hub</button>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
          <div>
            <button onClick={() => router.push('/admin')} className="inline-flex items-center gap-2 text-zinc-400 hover:text-orange-500 text-xs font-bold uppercase tracking-wider mb-3 transition-colors bg-zinc-900 px-4 py-2 rounded border border-zinc-800">
              <ArrowLeft className="w-4 h-4"/> Back to Admin Hub
            </button>
            <h1 className="text-3xl font-black italic tracking-wider text-emerald-500 uppercase flex items-center gap-2">
              <DollarSign className="w-8 h-8"/> Financial Revenue Ledger
            </h1>
            <p className="text-zinc-400 text-sm mt-1 font-bold">Auditable Tally-style ledger reconciling all platform transactions, entry fees, and house margins.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={exportToCSV} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider px-5 py-3 rounded text-xs flex items-center justify-center gap-2 transition-all">
              <Download className="w-4 h-4"/> Export Excel / CSV
            </button>
            <button onClick={fetchLedgerData} className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold px-4 py-3 rounded text-xs border border-zinc-700 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4"/> Refresh
            </button>
          </div>
        </div>

        {/* Dashboard Financial Summaries */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Gross Player Deposits</p>
            <p className="text-3xl font-black text-emerald-400">₹{totalDeposits}</p>
            <p className="text-[10px] text-zinc-500 mt-1 font-bold">Approved UPI Deposits</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Gross Entry Fees</p>
            <p className="text-3xl font-black text-orange-400">₹{totalEntryFees}</p>
            <p className="text-[10px] text-zinc-500 mt-1 font-bold">Collected Slot Fees</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Prize Payouts Issued</p>
            <p className="text-3xl font-black text-amber-400">₹{totalPrizesPaid}</p>
            <p className="text-[10px] text-zinc-500 mt-1 font-bold">Distributed Winner Cash</p>
          </div>
          <div className="bg-zinc-900 border border-emerald-500/30 bg-emerald-950/10 p-5 rounded-xl">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Net Platform Revenue</p>
            <p className="text-3xl font-black text-emerald-400">₹{platformRevenue}</p>
            <p className="text-[10px] text-emerald-500/80 mt-1 font-bold">(Entry Fees - Refunds - Prizes)</p>
          </div>
        </div>

        {/* Secondary Accounting Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-xs font-bold">
          <div><span className="text-zinc-500">Total Refunds:</span> <span className="text-red-400">₹{totalRefunds}</span></div>
          <div><span className="text-zinc-500">Total Withdrawals:</span> <span className="text-white">₹{totalWithdrawals}</span></div>
          <div><span className="text-zinc-500">Pending Approvals:</span> <span className="text-amber-400">₹{pendingAmount}</span></div>
          <div><span className="text-zinc-500">Net Pool Liquidity:</span> <span className="text-emerald-400">₹{netPoolBalance}</span></div>
        </div>

        {/* Filters & Search Controls */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-orange-500 tracking-wider mb-2">
            <Filter className="w-4 h-4"/> Filter & Audit Controls
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search ID, Ref, Note..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                className="w-full bg-zinc-950 border border-zinc-800 rounded pl-9 pr-3 py-2 text-xs font-bold focus:border-orange-500 outline-none text-white" 
              />
            </div>

            {/* Type Filter */}
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded p-2 text-xs font-bold text-zinc-300 focus:border-orange-500 outline-none">
              <option value="ALL">All Transaction Types</option>
              <option value="DEPOSIT">Player Deposits</option>
              <option value="TOURNAMENT_FEE">Entry Fees</option>
              <option value="PRIZE_WIN">Prize Payouts</option>
              <option value="REFUND">Refunds</option>
              <option value="WITHDRAWAL">Withdrawals</option>
            </select>

            {/* Status Filter */}
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded p-2 text-xs font-bold text-zinc-300 focus:border-orange-500 outline-none">
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="PENDING">PENDING</option>
              <option value="REJECTED">REJECTED</option>
            </select>

            {/* Match Filter */}
            <select value={filterTournament} onChange={e => setFilterTournament(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded p-2 text-xs font-bold text-zinc-300 focus:border-orange-500 outline-none">
              <option value="ALL">All Tournaments</option>
              {tournaments.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>

          </div>
        </div>

        {/* Detailed Tally Ledger Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
            <h2 className="text-lg font-black uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-500"/> Audit Ledger ({filteredEntries.length} Records)
            </h2>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 font-bold uppercase tracking-wider">No matching transaction entries found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans text-zinc-300">
                <thead className="bg-zinc-950 text-zinc-400 uppercase font-black tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="p-4">Date / Time</th>
                    <th className="p-4">Transaction Details</th>
                    <th className="p-4">Type</th>
                    <th className="p-4 text-right text-emerald-400">Credit (+₹)</th>
                    <th className="p-4 text-right text-red-400">Debit (-₹)</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4">Reference / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredEntries.map((e) => (
                    <tr key={e.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="p-4 whitespace-nowrap text-zinc-400 font-mono">
                        {new Date(e.date).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-white max-w-xs truncate">{e.description}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">User: {e.userId}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase tracking-wider ${
                          e.type === 'DEPOSIT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          e.type === 'TOURNAMENT_FEE' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                          e.type === 'PRIZE_WIN' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          e.type === 'REFUND' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {e.type}
                        </span>
                      </td>
                      <td className="p-4 text-right font-black text-emerald-400 text-sm">
                        {e.credit > 0 ? `+₹${e.credit}` : '-'}
                      </td>
                      <td className="p-4 text-right font-black text-red-400 text-sm">
                        {e.debit > 0 ? `-₹${e.debit}` : '-'}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                          e.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' :
                          e.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="p-4 text-zinc-400 font-mono text-[10px] max-w-xs truncate">
                        {e.reference}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
