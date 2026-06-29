import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import ShopkeeperLayout from '../../layouts/ShopkeeperLayout';
import { ScanLine, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function ShopkeeperTransactions() {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [activeTransaction, setActiveTransaction] = useState<any>(null);
  
  // Rapor Form State
  const [cosmeticScore, setCosmeticScore] = useState(10);
  const [functionalStatus, setFunctionalStatus] = useState(true);
  const [notWorkingParts, setNotWorkingParts] = useState('');
  const [technicianNotes, setTechnicianNotes] = useState('');

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) {
      setMessage({ type: 'error', text: 'Kod 6 haneli olmalıdır.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    // Esnafın dükkanını bul
    const { data: shop } = await supabase
      .from('shop_locations')
      .select('id')
      .eq('profile_id', user?.id)
      .maybeSingle();

    if (!shop) {
      setMessage({ type: 'error', text: 'Esnaf profiliniz bulunamadı.' });
      setLoading(false);
      return;
    }

    // Sadece kod üzerinden işlemi bul (Shop ID ile kısıtlama, çünkü seller_shop_id henüz atanmamış olabilir)
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('id, status, drop_off_code, pick_up_code, buyer_id, buyer_shop_id')
      .or(`drop_off_code.eq.${code},pick_up_code.eq.${code}`)
      .neq('status', 'cancelled');

    if (error || !transactions || transactions.length === 0) {
      setMessage({ type: 'error', text: 'Geçersiz veya süresi dolmuş kod.' });
      setLoading(false);
      return;
    }

    const tx = transactions[0];

    // Durum analizi
    if (tx.drop_off_code === code) {
      if (tx.status === 'pending' || tx.status === 'dropped_off') {
        // Satıcı ürünü yeni getirdi. Teslim alan bu dükkanı seller_shop_id olarak ata.
        await supabase.from('transactions').update({ 
          status: 'dropped_off_at_seller_shop',
          seller_shop_id: shop.id
        }).eq('id', tx.id);
        
        // Alıcıya Bildirim At (Cihaz Teslim Alındı)
        await supabase.from('notifications').insert({
          user_id: tx.buyer_id,
          title: 'Cihaz Noktaya Teslim Edildi 📍',
          message: `Satıcı ürünü TurtleNokta'ya teslim etti. Birazdan uzmanlarımız tarafından incelenip ekspertiz raporu sana gönderilecek.`,
          type: 'device_dropped_off'
        });

        setActiveTransaction(tx);
        setMessage({ type: 'success', text: '✅ Ürün satıcıdan teslim alındı. Lütfen ekspertiz raporunu doldurun.' });
      } else {
        setMessage({ type: 'error', text: 'Bu ürün zaten teslim alınmış ve işlemi ilerlemiş.' });
      }
    } else if (tx.pick_up_code === code) {
      if (tx.buyer_shop_id && tx.buyer_shop_id !== shop.id) {
        setMessage({ type: 'error', text: 'Bu ürün bu dükkana gönderilmemiş! Teslimat noktası burası değil.' });
        setLoading(false);
        return;
      }

      if (tx.status === 'arrived_at_buyer_shop' || tx.status === 'dropped_off') {
        await supabase.from('transactions').update({ status: 'verified' }).eq('id', tx.id);
        setMessage({ type: 'success', text: '🎉 Ürün alıcıya teslim edildi! Ödeme işlemi tamamlandı.' });
      } else {
        setMessage({ type: 'error', text: 'Ürün henüz dükkana ulaşmamış veya işlem uygun durumda değil.' });
      }
    }

    setLoading(false);
    setCode('');
  }

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTransaction) return;
    setLoading(true);

    const { data: shop } = await supabase.from('shop_locations').select('id, shop_name').eq('profile_id', user?.id).single();

    // Raporu kaydet
    const { error } = await supabase.from('device_reports').insert({
      transaction_id: activeTransaction.id,
      shop_id: shop?.id,
      technician_id: user?.id,
      cosmetic_score: cosmeticScore,
      functional_status: functionalStatus,
      not_working_parts: functionalStatus ? null : notWorkingParts,
      technician_notes: technicianNotes
    });

    if (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Rapor kaydedilirken hata oluştu.' });
    } else {
      // İşlem durumunu güncelle
      await supabase.from('transactions').update({ status: 'report_created' }).eq('id', activeTransaction.id);
      
      // Alıcıya rapor bildirimi gönder
      await supabase.from('notifications').insert({
        user_id: activeTransaction.buyer_id,
        title: 'Ekspertiz Raporu Hazır 📋',
        message: `${shop?.shop_name || 'TurtleNokta'} cihazın kontrolünü tamamladı. Lütfen raporu inceleyip ödemeyi onaylayın.`,
        type: 'report_ready'
      });

      setActiveTransaction(null);
      setMessage({ type: 'success', text: '📄 Ekspertiz raporu alıcıya iletildi. Alıcı onayladığında kargo süreci başlayacak.' });
      // Formu temizle
      setCosmeticScore(10);
      setFunctionalStatus(true);
      setNotWorkingParts('');
      setTechnicianNotes('');
    }
    setLoading(false);
  }

  return (
    <ShopkeeperLayout>
      <div className="max-w-2xl mx-auto space-y-8 py-10">
        
        {/* Başlık */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <ScanLine size={40} className="text-emerald-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Karekod & Barkod İşlemi</h2>
          <p className="text-gray-500 text-lg">Alıcı veya Satıcının size gösterdiği 6 haneli güvenlik kodunu girin.</p>
        </div>

        {/* Kod Giriş Formu (Eğer aktif bir işlem yoksa) */}
        {!activeTransaction ? (
          <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100">
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Güvenlik Kodu</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                  placeholder="ÖRN: AB12C3"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-5 text-4xl text-center font-mono font-bold tracking-[0.5em] focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-300 uppercase"
                />
              </div>

              <button
                disabled={loading || code.length !== 6}
                className="w-full bg-[#044c34] text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
              >
                {loading ? 'Sorgulanıyor...' : 'Kodu Doğrula'}
              </button>
            </form>

            {message && (
              <div className={`mt-8 p-6 rounded-2xl flex items-start gap-4 ${
                message.type === 'success' ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle2 className="text-emerald-500 mt-1" size={28} />
                ) : (
                  <AlertCircle className="text-red-500 mt-1" size={28} />
                )}
                <div className={`font-medium text-lg ${
                  message.type === 'success' ? 'text-emerald-800' : 'text-red-800'
                }`}>
                  {message.text}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100">
            <div className="border-b border-gray-100 pb-6 mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Ekspertiz Raporu Oluştur</h3>
              <p className="text-gray-500 mt-2">Cihazı fiziksel ve donanımsal olarak inceleyip raporlayın.</p>
            </div>

            <form onSubmit={submitReport} className="space-y-6">
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Kozmetik Durum Puanı (1-10)</label>
                <div className="flex items-center gap-4">
                  <input type="range" min="1" max="10" value={cosmeticScore} onChange={e => setCosmeticScore(Number(e.target.value))} className="flex-1 accent-emerald-600" />
                  <span className="text-2xl font-black text-emerald-600 w-10 text-center">{cosmeticScore}</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">1: Çok Kötü (Kırık/Çizik dolu), 10: Sıfır Gibi (Kusursuz)</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Donanım Testi: Cihaz Çalışıyor mu?</label>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setFunctionalStatus(true)} className={`flex-1 py-3 rounded-xl border-2 font-bold transition ${functionalStatus ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>Evet, Sorunsuz</button>
                  <button type="button" onClick={() => setFunctionalStatus(false)} className={`flex-1 py-3 rounded-xl border-2 font-bold transition ${!functionalStatus ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>Hayır, Sorunlu</button>
                </div>
              </div>

              {!functionalStatus && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Çalışmayan Aksamlar</label>
                  <input type="text" value={notWorkingParts} onChange={e => setNotWorkingParts(e.target.value)} placeholder="Örn: Wi-Fi bozuk, ekran dokunmatiği sorunlu" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none" required={!functionalStatus} />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Teknisyen Notu (Alıcı Görecek)</label>
                <textarea rows={4} value={technicianNotes} onChange={e => setTechnicianNotes(e.target.value)} placeholder="Cihaz hakkında alıcının bilmesi gereken detaylar..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none resize-none" required></textarea>
              </div>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setActiveTransaction(null)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition">İptal</button>
                <button type="submit" disabled={loading} className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-200">
                  {loading ? 'Gönderiliyor...' : 'Raporu Gönder'}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </ShopkeeperLayout>
  );
}
