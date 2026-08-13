import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    // 1. Initialize Supabase Admin strictly inside the request to prevent Vercel build errors
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { tournamentId, userId, userEmail, selectedSlot, team } = await req.json();

    // 2. Validate inputs
    if (!tournamentId || !userId || !selectedSlot || !team) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 3. Fetch tournament details server-side (Never trust frontend pricing)
    const { data: tourney, error: tourneyErr } = await supabaseAdmin
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (tourneyErr || !tourney) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // 4. Secure Status & Time Checks
    if (['FULL', 'COMPLETED', 'CANCELLED', 'UNDER REVIEW'].includes(tourney.status)) {
      return NextResponse.json({ error: `Registration failed: Match is currently ${tourney.status}` }, { status: 400 });
    }

    if (tourney.registration_closing_time) {
      const closingTime = new Date(tourney.registration_closing_time).getTime();
      if (Date.now() >= closingTime) {
        return NextResponse.json({ error: 'Registration window for this match has officially closed' }, { status: 400 });
      }
    }

    // 5. Server-side Slot Collision Check (Prevents double-booking same slot)
    const { data: existingReg } = await supabaseAdmin
      .from('registrations')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('slot_number', selectedSlot)
      .single();

    if (existingReg) {
      return NextResponse.json({ error: `Slot S${selectedSlot} is already booked` }, { status: 400 });
    }

    const isFree = tourney.entry_type === 'FREE' || Number(tourney.fee) === 0;
    const fee = Number(tourney.fee || 0);

    // 6. Verify and deduct wallet balance for paid tournaments
    if (!isFree) {
      const { data: wallet, error: walletErr } = await supabaseAdmin
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (walletErr || !wallet || Number(wallet.balance) < fee) {
        return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 });
      }

      // Deduct Wallet
      const newBalance = Number(wallet.balance) - fee;
      const { error: walletUpdateErr } = await supabaseAdmin
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', userId);

      if (walletUpdateErr) {
        return NextResponse.json({ error: 'Failed to update wallet balance' }, { status: 500 });
      }
    }

    // 7. Insert Player Registration
    const playerCount = tourney.type === 'SOLO' ? 1 : tourney.type === 'DUO' ? 2 : 4;
    const uniqueWalletTxId = `WALLET_tx_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const { error: regErr } = await supabaseAdmin
      .from('registrations')
      .insert([{
        tournament_id: tournamentId,
        user_id: userId,
        squad_name: team.p1_ign + "'s Squad",
        igl_email: userEmail,
        player_1_id: team.p1_id,
        player_1_ign: team.p1_ign,
        player_2_id: playerCount >= 2 ? team.p2_id : null,
        player_2_ign: playerCount >= 2 ? team.p2_ign : null,
        player_3_id: playerCount >= 4 ? team.p3_id : null,
        player_3_ign: playerCount >= 4 ? team.p3_ign : null,
        player_4_id: playerCount >= 4 ? team.p4_id : null,
        player_4_ign: playerCount >= 4 ? team.p4_ign : null,
        utr_number: isFree ? `FREE_ENTRY_${Date.now()}` : uniqueWalletTxId,
        payment_status: 'Verified',
        slot_number: selectedSlot
      }]);

    if (regErr) {
      // Revert wallet deduction if database insertion fails
      if (!isFree) {
        const { data: wallet } = await supabaseAdmin.from('wallets').select('balance').eq('user_id', userId).single();
        if (wallet) {
          await supabaseAdmin.from('wallets').update({ balance: Number(wallet.balance) + fee }).eq('user_id', userId);
        }
      }
      return NextResponse.json({ error: regErr.message }, { status: 500 });
    }

    // 8. Insert Transaction Record for Paid Tournaments
    if (!isFree) {
      await supabaseAdmin.from('transactions').insert([{
        user_id: userId,
        type: 'TOURNAMENT_FEE',
        amount: fee,
        status: 'SUCCESS',
        description: `Entry fee for ${tourney.name} (Slot S${selectedSlot})`
      }]);
    }

    // 9. Notify Admin
    await supabaseAdmin.from('admin_notifications').insert([{
      type: 'SLOT_BOOKING',
      message: `New Slot Booking: ${tourney.name} (Slot S${selectedSlot})`,
      player_name: userEmail || team.p1_ign || 'Unknown Player',
      amount: isFree ? 0 : fee
    }]);

    return NextResponse.json({ success: true, message: 'Slot booked successfully' });

  } catch (error: any) {
    console.error('Join Tournament API Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
