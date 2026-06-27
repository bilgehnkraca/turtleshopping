import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.auth.signUp({
    email: 'test_user_' + Date.now() + '@example.com',
    password: 'password123',
  });
  console.log("Signup:", { data, error });
  if (data?.user) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      username: 'test_user_' + Date.now(),
      full_name: 'Test User',
    });
    console.log("Profile insert:", profileError);
  }
}
test();
