import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    // 1. Initialize Supabase Admin strictly inside the request to prevent Vercel build errors
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { userId, amount, upiId, userEmail } = await req.json();

    // 2. Validate input presence
    if (!userId || !amount || !upiId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const numAmount = Number(amount);
    
    // 3. Server-side limits validation
    if (numAmount < 100 || numAmount > 20000) {
      return NextResponse.json({ error: 'Withdrawal amount must be between ₹100 and ₹20,000' }, { status: 400 });
    }

    // 4. Secure server-side wallet balance check
    const { data: wallet, error: walletFetchErr } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (walletFetchErr || !wallet) {
      return NextResponse.json({ error: 'Wallet record not found' }, { status: 404 });
    }

    if (Number(wallet.balance) < numAmount) {
      return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 });
    }

    // 5. Insert Withdrawal Transaction 
    // (Note: The admin panel handles actual deduction when status changes, or if your app deducts immediately, 
    // we would update the wallet here. Based on your frontend code, the frontend didn't deduct balance instantly for withdrawals).
    const { error: txError } = await supabaseAdmin
      .from('transactions')
      .insert([{
        user_id: userId,
        type: 'WITHDRAWAL',
        amount: numAmount,
        upi_id: upiId,
        description: 'Withdrawal to UPI'
      }]);

    if (txError) throw txError;

    // 6. Notify Admin
    await supabaseAdmin
      .from('admin_notifications')
      .insert([{
        type: 'WITHDRAWAL',
        message: 'New Withdrawal Request',
        player_name: userEmail || 'Unknown Player',
        amount: numAmount
      }]);

    return NextResponse.json({ success: true, message: 'Withdrawal request submitted successfully' });
  } catch (error: any) {
    console.error('Withdrawal API Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
