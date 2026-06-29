const url = 'https://qlghrharoplhtiiojfvx.supabase.co/rest/v1/transactions?select=*&drop_off_code=eq.U5KNUN';
fetch(url, {
  headers: {
    'apikey': 'sb_publishable_hILzvV_bKrCBEIfLkjUdKg_lwRV36zf',
    'Authorization': 'Bearer sb_publishable_hILzvV_bKrCBEIfLkjUdKg_lwRV36zf'
  }
}).then(res => res.json()).then(console.log).catch(console.error);
