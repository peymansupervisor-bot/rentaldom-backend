import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

// Kept as verifyFirebaseToken for minimal diff — now verifies Supabase JWTs
export async function verifyFirebaseToken(accessToken: string): Promise<{ email: string; uid: string }> {
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !user) throw new Error('Invalid or expired token');
  if (!user.email) throw new Error('Token does not contain an email address');
  return { email: user.email, uid: user.id };
}
