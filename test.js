import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://qlghrharoplhtiiojfvx.supabase.co',
  'sb_publishable_hILzvV_bKrCBEIfLkjUdKg_lwRV36zf'
);

async function test() {
  const { data, error } = await supabase.auth.signUp({
    email: 'test_user_' + Date.now() + '@gmail.com',
    password: 'password123',
  });
  console.log("Signup error:", error?.message);
  if (data?.user) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      username: 'test_user_' + Date.now(),
      full_name: 'Test User',
    });
    console.log("Profile insert error:", profileError);
  }
}
test();
