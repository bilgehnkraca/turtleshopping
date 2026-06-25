import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { verification_id } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Doğrulama bilgilerini al
  const { data: verification } = await supabase
    .from('listing_verifications')
    .select('*, listings(title, price, user_id), turtle_points(name, city, email)')
    .eq('id', verification_id)
    .single()

  if (!verification) {
    return new Response(JSON.stringify({ error: 'Verification not found' }), { status: 404 })
  }

  const point = verification.turtle_points
  const listing = verification.listings

  if (!point?.email) {
    return new Response(JSON.stringify({ error: 'No email for point' }), { status: 400 })
  }

  // Resend ile email gönder
  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'TurtleShopping <bildirim@turtleshopping.com>',
      to: point.email,
      subject: '🐢 Yeni Doğrulama İsteği',
      html: `
        <h2>Merhaba ${point.name},</h2>
        <p>Yeni bir doğrulama isteği aldınız.</p>
        <hr>
        <p><strong>Ürün:</strong> ${listing.title}</p>
        <p><strong>Fiyat:</strong> ${listing.price.toLocaleString('tr-TR')} ₺</p>
        <hr>
        <p>Satıcı ürünü noktanıza getirdiğinde sisteme giriş yaparak doğrulama işlemini tamamlayın.</p>
        <br>
        <p>TurtleShopping Ekibi</p>
      `,
    }),
  })

  return new Response(JSON.stringify({ success: true }), { status: 200 })
})