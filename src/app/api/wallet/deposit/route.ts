import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    // 1. Initialize Supabase Admin inside the request to prevent Vercel build errors
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { userId, amount, utrNumber, userEmail } = await req.json();

    if (!userId || !amount || !utrNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const numAmount = Number(amount);
    if (numAmount < 50 || numAmount > 50000) {
      return NextResponse.json({ error: 'Deposit amount must be between ₹50 and ₹50,000' }, { status: 400 });
    }

    if (utrNumber.length < 12) {
      return NextResponse.json({ error: 'Please enter a valid 12-digit UTR number' }, { status: 400 });
    }

    const { error: txError } = await supabaseAdmin
      .from('transactions')
      .insert([{
        user_id: userId,
        type: 'DEPOSIT',
        amount: numAmount,
        reference_id: utrNumber,
        description: 'Wallet Deposit via UPI'
      }]);

    if (txError) throw txError;

    await supabaseAdmin
      .from('admin_notifications')
      .insert([{
        type: 'DEPOSIT',
        message: 'New Deposit Request',
        player_name: userEmail || 'Unknown Player',
        amount: numAmount
      }]);

    return NextResponse.json({ success: true, message: 'Deposit request submitted successfully' });
  } catch (error: any) {
    console.error('Deposit API Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
