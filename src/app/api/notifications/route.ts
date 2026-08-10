import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// Configure Web Push with your VAPID keys
webpush.setVapidDetails(
  'mailto:support@bgmiarena.com', // Replace with your actual support email eventually
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: Request) {
  try {
    const { userIds, title, body, url } = await req.json();

    if (!userIds || userIds.length === 0) {
      return NextResponse.json({ success: true, message: "No users to notify." });
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch the push subscriptions for the targeted users
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds);

    if (error || !subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, message: "No active subscriptions found for these users." });
    }

    const payload = JSON.stringify({ title, body, url });

    // Send notifications to all subscriber endpoints
    const pushPromises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        }
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
      } catch (err: any) {
        // If the subscription is expired or unsubscribed, delete it from the database
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        } else {
          console.error('Push error:', err);
        }
      }
    });

    await Promise.all(pushPromises);

    return NextResponse.json({ success: true, message: "Notifications dispatched." });
  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
