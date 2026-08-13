import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    // Initialize Supabase Admin strictly inside the request to prevent Vercel build errors
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { tournamentId, registrationId, userId, imageUrl } = await req.json();

    if (!tournamentId || !registrationId || !userId || !imageUrl) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 1. Check if a result already exists for this registration
    const { data: existingResult, error: checkErr } = await supabaseAdmin
      .from('match_results')
      .select('id')
      .eq('registration_id', registrationId)
      .single();

    if (existingResult) {
      // 2. Update existing result (set to PENDING and clear admin notes)
      const { error: updateErr } = await supabaseAdmin
        .from('match_results')
        .update({ 
          image_url: imageUrl, 
          status: 'PENDING', 
          admin_note: null 
        })
        .eq('id', existingResult.id);

      if (updateErr) throw updateErr;

    } else {
      // 3. Insert new result
      const { error: insertErr } = await supabaseAdmin
        .from('match_results')
        .insert([{
          tournament_id: tournamentId,
          registration_id: registrationId,
          user_id: userId,
          image_url: imageUrl
        }]);

      if (insertErr) throw insertErr;
    }

    return NextResponse.json({ success: true, message: 'Result submitted successfully' });

  } catch (error: any) {
    console.error('Submit Result API Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
