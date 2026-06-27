import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './web/.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function testChat() {
  const { data: convs, error } = await supabase.from('conversations').select('id, buyer_id, seller_id').limit(1);
  console.log("Conversations:", convs, error);
}
testChat();
