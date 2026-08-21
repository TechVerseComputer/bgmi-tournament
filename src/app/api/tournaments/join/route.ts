import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    // ---------------------------------------------------------
    // 1. Get the ACTUAL authenticated Supabase user
    //    Never trust userId/userEmail sent by the browser.
    // ---------------------------------------------------------
    const cookieStore = await cookies();

    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Safe to ignore when cookies cannot be written
              // in the current request context.
            }
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in to join a tournament.' },
        { status: 401 }
      );
    }

    // ---------------------------------------------------------
    // 2. Supabase Admin client
    // ---------------------------------------------------------
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ---------------------------------------------------------
    // 3. Only receive non-auth data from frontend
    // ---------------------------------------------------------
    const { tournamentId, selectedSlot, team } = await req.json();

    if (!tournamentId || !selectedSlot || !team) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 4. Fetch tournament server-side
    // ---------------------------------------------------------
    const { data: tourney, error: tourneyErr } = await supabaseAdmin
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (tourneyErr || !tourney) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // 5. Tournament status validation
    // ---------------------------------------------------------
    if (
      ['FULL', 'COMPLETED', 'CANCELLED', 'UNDER REVIEW'].includes(
        tourney.status
      )
    ) {
      return NextResponse.json(
        {
          error: `Registration failed: Match is currently ${tourney.status}`,
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 6. Registration closing time
    // ---------------------------------------------------------
    if (tourney.registration_closing_time) {
      const closingTime = new Date(
        tourney.registration_closing_time
      ).getTime();

      if (Date.now() >= closingTime) {
        return NextResponse.json(
          {
            error:
              'Registration window for this match has officially closed',
          },
          { status: 400 }
        );
      }
    }

    // ---------------------------------------------------------
    // 7. IMPORTANT:
    //    Check whether THIS authenticated user already joined.
    // ---------------------------------------------------------
    const { data: existingUserRegistration, error: userRegCheckError } =
      await supabaseAdmin
        .from('registrations')
        .select('id, slot_number')
        .eq('tournament_id', tournamentId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

    if (userRegCheckError) {
      console.error(
        'Existing user registration check failed:',
        userRegCheckError
      );

      return NextResponse.json(
        { error: 'Unable to verify your existing registration.' },
        { status: 500 }
      );
    }

    if (existingUserRegistration) {
      return NextResponse.json(
        {
          error: `You have already joined this tournament in Slot S${existingUserRegistration.slot_number}.`,
        },
        { status: 409 }
      );
    }

    // ---------------------------------------------------------
    // 8. Slot collision check
    // ---------------------------------------------------------
    const { data: existingSlot, error: slotCheckError } =
      await supabaseAdmin
        .from('registrations')
        .select('id')
        .eq('tournament_id', tournamentId)
        .eq('slot_number', selectedSlot)
        .limit(1)
        .maybeSingle();

    if (slotCheckError) {
      console.error('Slot availability check failed:', slotCheckError);

      return NextResponse.json(
        { error: 'Unable to verify slot availability.' },
        { status: 500 }
      );
    }

    if (existingSlot) {
      return NextResponse.json(
        { error: `Slot S${selectedSlot} is already booked` },
        { status: 409 }
      );
    }

    // ---------------------------------------------------------
    // 9. Determine tournament fee server-side
    // ---------------------------------------------------------
    const isFree =
      tourney.entry_type === 'FREE' || Number(tourney.fee) === 0;

    const fee = Number(tourney.fee || 0);

    // ---------------------------------------------------------
    // 10. Verify and deduct wallet
    // ---------------------------------------------------------
    if (!isFree) {
      const { data: wallet, error: walletErr } = await supabaseAdmin
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (walletErr || !wallet || Number(wallet.balance) < fee) {
        return NextResponse.json(
          { error: 'Insufficient wallet balance' },
          { status: 400 }
        );
      }

      const newBalance = Number(wallet.balance) - fee;

      const { error: walletUpdateErr } = await supabaseAdmin
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', user.id);

      if (walletUpdateErr) {
        console.error('Wallet update failed:', walletUpdateErr);

        return NextResponse.json(
          { error: 'Failed to update wallet balance' },
          { status: 500 }
        );
      }
    }

    // ---------------------------------------------------------
    // 11. Create registration
    // ---------------------------------------------------------
    const playerCount =
      tourney.type === 'SOLO'
        ? 1
        : tourney.type === 'DUO'
          ? 2
          : 4;

    const uniqueWalletTxId =
      `WALLET_tx_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const { error: regErr } = await supabaseAdmin
      .from('registrations')
      .insert([
        {
          tournament_id: tournamentId,
          user_id: user.id,

          squad_name: `${team.p1_ign}'s Squad`,
          igl_email: user.email || '',

          player_1_id: team.p1_id,
          player_1_ign: team.p1_ign,

          player_2_id: playerCount >= 2 ? team.p2_id : null,
          player_2_ign: playerCount >= 2 ? team.p2_ign : null,

          player_3_id: playerCount >= 4 ? team.p3_id : null,
          player_3_ign: playerCount >= 4 ? team.p3_ign : null,

          player_4_id: playerCount >= 4 ? team.p4_id : null,
          player_4_ign: playerCount >= 4 ? team.p4_ign : null,

          utr_number: isFree
            ? `FREE_ENTRY_${Date.now()}`
            : uniqueWalletTxId,

          payment_status: 'Verified',
          slot_number: selectedSlot,
        },
      ]);

    // ---------------------------------------------------------
    // 12. Handle registration failure
    // ---------------------------------------------------------
    if (regErr) {
      console.error('Registration insert failed:', regErr);

      // Refund wallet if paid registration failed
      if (!isFree) {
        const { data: wallet } = await supabaseAdmin
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id)
          .single();

        if (wallet) {
          await supabaseAdmin
            .from('wallets')
            .update({
              balance: Number(wallet.balance) + fee,
            })
            .eq('user_id', user.id);
        }
      }

      // PostgreSQL duplicate-key violation.
      // This protects us against two requests arriving at once.
      if (regErr.code === '23505') {
        const { data: latestRegistration } = await supabaseAdmin
          .from('registrations')
          .select('slot_number')
          .eq('tournament_id', tournamentId)
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        if (latestRegistration) {
          return NextResponse.json(
            {
              error: `You have already joined this tournament in Slot S${latestRegistration.slot_number}.`,
            },
            { status: 409 }
          );
        }

        return NextResponse.json(
          {
            error: `Slot S${selectedSlot} is already booked.`,
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: regErr.message },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // 13. Transaction record
    // ---------------------------------------------------------
    if (!isFree) {
      const { error: transactionError } = await supabaseAdmin
        .from('transactions')
        .insert([
          {
            user_id: user.id,
            type: 'TOURNAMENT_FEE',
            amount: fee,
            status: 'SUCCESS',
            description: `Entry fee for ${tourney.name} (Slot S${selectedSlot})`,
          },
        ]);

      if (transactionError) {
        console.error(
          'Tournament transaction record failed:',
          transactionError
        );
      }
    }

    // ---------------------------------------------------------
    // 14. Admin notification
    // ---------------------------------------------------------
    const { error: notificationError } = await supabaseAdmin
      .from('admin_notifications')
      .insert([
        {
          type: 'SLOT_BOOKING',
          message: `New Slot Booking: ${tourney.name} (Slot S${selectedSlot})`,
          player_name: user.email || team.p1_ign || 'Unknown Player',
          amount: isFree ? 0 : fee,
        },
      ]);

    if (notificationError) {
      console.error(
        'Admin notification failed:',
        notificationError
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Slot booked successfully',
    });
  } catch (error: any) {
    console.error('Join Tournament API Error:', error);

    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
