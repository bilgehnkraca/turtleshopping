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
  const [activePrecheck, setActivePrecheck] = useState<any>(null);
  
  // Hızlı Onay State (has_recent_precheck = true için)
  const [activeQuickConfirm, setActiveQuickConfirm] = useState<any>(null);

  // Rapor Form State
  const [cosmeticScore, setCosmeticScore] = useState(10);
  const [screenCondition, setScreenCondition] = useState('Kusursuz');
  const [batteryHealth, setBatteryHealth] = useState('100');
  const [biometricsStatus, setBiometricsStatus] = useState('Çalışıyor');
  const [cameraCondition, setCameraCondition] = useState('Temiz');
  const [technicianNotes, setTechnicianNotes] = useState('');

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) {
      setMessage({ type: 'error', text: 'Kod 6 haneli olmalıdır.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    setActiveTransaction(null);
    setActivePrecheck(null);
    setActiveQuickConfirm(null);

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

    // 1. Önce Transactions tablosunda ara
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .or(`drop_off_code.eq.${code},pick_up_code.eq.${code}`)
      .neq('status', 'cancelled');

    if (transactions && transactions.length > 0) {
      const tx = transactions[0];

      if (tx.drop_off_code === code) {
        if (tx.status === 'pending' || tx.status === 'dropped_off') {
          await supabase.from('transactions').update({ 
            status: 'dropped_off_at_seller_shop',
            seller_shop_id: shop.id
          }).eq('id', tx.id);
          
          await supabase.from('notifications').insert({
            user_id: tx.buyer_id,
            title: 'Cihaz Noktaya Teslim Edildi 📍',
            message: `Satıcı ürünü TurtleNokta'ya teslim etti.`,
            type: 'device_dropped_off'
          });

          if (tx.has_recent_precheck) {
            // Kısa onay ekranını göster
            setActiveQuickConfirm(tx);
            setMessage({ type: 'success', text: '✅ Ürün teslim alındı. Bu ürünün yakın tarihli TurtleGüvence raporu mevcut.' });
          } else {
            // Tam ekspertiz ekranı
            setActiveTransaction(tx);
            setMessage({ type: 'success', text: '✅ Ürün satıcıdan teslim alındı. Lütfen ekspertiz raporunu doldurun.' });
          }
        } else {
          setMessage({ type: 'error', text: 'Bu ürün zaten teslim alınmış ve işlemi ilerlemiş.' });
        }
      } else if (tx.pick_up_code === code) {
        if (tx.buyer_shop_id && tx.buyer_shop_id !== shop.id) {
          setMessage({ type: 'error', text: 'Bu ürün bu dükkana gönderilmemiş! Teslimat noktası burası değil.' });
        } else if (tx.status === 'arrived_at_buyer_shop' || tx.status === 'dropped_off') {
          await supabase.from('transactions').update({ status: 'verified' }).eq('id', tx.id);
          setMessage({ type: 'success', text: '🎉 Ürün alıcıya teslim edildi! Ödeme işlemi tamamlandı.' });
        } else {
          setMessage({ type: 'error', text: 'Ürün henüz dükkana ulaşmamış veya işlem uygun durumda değil.' });
        }
      }
      setLoading(false);
      setCode('');
      return;
    }

    // 2. İşlem bulunamadıysa Precheck (Doğrulama) tablosunda ara
    const { data: prechecks } = await supabase
      .from('listing_precheck_requests')
      .select('*')
      .eq('drop_off_code', code)
      .neq('status', 'cancelled');

    if (prechecks && prechecks.length > 0) {
      const px = prechecks[0];
      if (px.status === 'pending' || px.status === 'dropped_off') {
        await supabase.from('listing_precheck_requests').update({
          status: 'dropped_off',
          shop_id: shop.id
        }).eq('id', px.id);

        setActivePrecheck(px);
        setMessage({ type: 'success', text: '✅ Satış öncesi doğrulama ürünü teslim alındı. Lütfen ekspertiz raporunu doldurun.' });
      } else {
        setMessage({ type: 'error', text: 'Bu doğrulama kodu zaten kullanılmış veya iptal edilmiş.' });
      }
      setLoading(false);
      setCode('');
      return;
    }

    setMessage({ type: 'error', text: 'Geçersiz veya süresi dolmuş kod.' });
    setLoading(false);
  }

  async function handleQuickConfirm(isCompatible: boolean) {
    setLoading(true);
    if (isCompatible) {
      // Önceki rapor geçerli, işlemi doğrudan report_created yap
      await supabase.from('transactions').update({ status: 'report_created' }).eq('id', activeQuickConfirm.id);
      
      const { data: shop } = await supabase.from('shop_locations').select('shop_name').eq('profile_id', user?.id).single();

      await supabase.from('notifications').insert({
        user_id: activeQuickConfirm.buyer_id,
        title: 'Ekspertiz Onaylandı 📋',
        message: `${shop?.shop_name || 'TurtleNokta'} cihazın önceki TurtleGüvence raporuyla uyumlu olduğunu onayladı.`,
        type: 'report_ready'
      });

      setMessage({ type: 'success', text: '✅ İşlem güncellendi. Alıcı ödemeyi onayladığında kargo süreci başlayacak.' });
      setActiveQuickConfirm(null);
    } else {
      // Uyumsuz, tam forma düşür
      setActiveTransaction(activeQuickConfirm);
      setActiveQuickConfirm(null);
      setMessage({ type: 'success', text: 'Lütfen cihaz için yeni tam ekspertiz raporunu doldurun.' });
    }
    setLoading(false);
  }

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTransaction && !activePrecheck) return;
    setLoading(true);

    const { data: shop } = await supabase.from('shop_locations').select('id, shop_name').eq('profile_id', user?.id).single();

    const formattedNotes = `
📱 **Ekspertiz Detayları**
- Ekran Durumu: ${screenCondition}
- Batarya Sağlığı: %${batteryHealth}
- FaceID/TouchID: ${biometricsStatus}
- Kamera Lensi: ${cameraCondition}

📝 **Teknisyenin Ek Notları**
${technicianNotes || 'Ek not bulunmuyor.'}
    `.trim();

    const insertData: any = {
      shop_id: shop?.id,
      technician_id: user?.id,
      cosmetic_score: cosmeticScore,
      functional_status: biometricsStatus === 'Çalışıyor',
      not_working_parts: biometricsStatus === 'Çalışmıyor' ? 'FaceID/TouchID arızalı' : null,
      technician_notes: formattedNotes
    };

    if (activeTransaction) {
      insertData.transaction_id = activeTransaction.id;
    } else {
      insertData.precheck_id = activePrecheck.id;
    }

    const { error } = await supabase.from('device_reports').insert(insertData);

    if (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Rapor kaydedilirken hata oluştu.' });
    } else {
      if (activeTransaction) {
        await supabase.from('transactions').update({ status: 'report_created' }).eq('id', activeTransaction.id);
        
        await supabase.from('notifications').insert({
          user_id: activeTransaction.buyer_id,
          title: 'Ekspertiz Raporu Hazır 📋',
          message: `${shop?.shop_name || 'TurtleNokta'} cihazın kontrolünü tamamladı. Lütfen raporu inceleyip ödemeyi onaylayın.`,
          type: 'report_ready'
        });
        setMessage({ type: 'success', text: '📄 Ekspertiz raporu alıcıya iletildi. Alıcı onayladığında kargo süreci başlayacak.' });
      } else {
        // Precheck tamamlandı (Trigger otomatik update edecek)
        setMessage({ type: 'success', text: '✅ Doğrulama raporu sisteme kaydedildi. İlan artık "TurtleGüvenceli" olarak görünecek.' });
      }

      setActiveTransaction(null);
      setActivePrecheck(null);
      
      setCosmeticScore(10);
      setScreenCondition('Kusursuz');
      setBatteryHealth('100');
      setBiometricsStatus('Çalışıyor');
      setCameraCondition('Temiz');
      setTechnicianNotes('');
    }
    setLoading(false);
  }

  return (
    <ShopkeeperLayout>
      <div className="max-w-2xl mx-auto space-y-8 py-10">
        
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <ScanLine size={40} className="text-emerald-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Karekod & Barkod İşlemi</h2>
          <p className="text-gray-500 text-lg">Alıcı veya Satıcının size gösterdiği 6 haneli güvenlik kodunu girin.</p>
        </div>

        {!activeTransaction && !activePrecheck && !activeQuickConfirm ? (
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
        ) : activeQuickConfirm ? (
          <div className="bg-white rounded-3xl p-10 shadow-xl border border-emerald-500">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} className="text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Yakın Tarihli Rapor Tespit Edildi</h3>
              <p className="text-gray-600">
                Bu ürün son 30 gün içinde TurtleGüvence testinden geçmiş. Ürünü gözle kontrol edin.
                Önceki raporla fiziksel uyumsuzluk veya yeni bir hasar var mı?
              </p>
            </div>
            <div className="flex gap-4">
              <button 
                disabled={loading}
                onClick={() => handleQuickConfirm(true)}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl transition"
              >
                Evet, Raporla Uyumlu (Sorun Yok)
              </button>
              <button 
                disabled={loading}
                onClick={() => handleQuickConfirm(false)}
                className="flex-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold py-4 rounded-xl transition"
              >
                Hayır, Yeni Hasar Var (Yeniden Test)
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100">
            <div className="border-b border-gray-100 pb-6 mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Ekspertiz Raporu Oluştur</h3>
              <p className="text-gray-500 mt-2">Cihazı fiziksel ve donanımsal olarak inceleyip raporlayın.</p>
              {activePrecheck && <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">SATIŞ ÖNCESİ DOĞRULAMA</span>}
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
                <label className="block text-sm font-bold text-gray-700 mb-2">Ekran Durumu</label>
                <select value={screenCondition} onChange={e => setScreenCondition(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-gray-700">
                  <option value="Kusursuz">Kusursuz</option>
                  <option value="Kılcal Çizik">Kılcal Çizik</option>
                  <option value="Derin Çizik">Derin Çizik</option>
                  <option value="Kırık/Çatlak">Kırık/Çatlak</option>
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Batarya Sağlığı (%)</label>
                  <input type="number" min="0" max="100" value={batteryHealth} onChange={e => setBatteryHealth(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-gray-700" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-2">FaceID / TouchID</label>
                  <select value={biometricsStatus} onChange={e => setBiometricsStatus(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-gray-700">
                    <option value="Çalışıyor">Çalışıyor</option>
                    <option value="Çalışmıyor">Çalışmıyor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Kamera & Lensler</label>
                <select value={cameraCondition} onChange={e => setCameraCondition(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-gray-700">
                  <option value="Temiz">Temiz</option>
                  <option value="Tozlu/Lekeli">Tozlu/Lekeli</option>
                  <option value="Çizik/Kırık">Çizik/Kırık</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Teknisyen Ek Notları (Alıcı Görecek)</label>
                <textarea 
                  rows={3} 
                  value={technicianNotes} 
                  onChange={e => setTechnicianNotes(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-gray-700 resize-none"
                  placeholder="Örn: Kasada ufak soyulmalar mevcut ancak çalışmasını etkilemiyor..."
                ></textarea>
              </div>

              <button
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all disabled:opacity-50"
              >
                {loading ? 'Kaydediliyor...' : 'Ekspertiz Raporunu Onayla'}
              </button>
            </form>
          </div>
        )}

      </div>
    </ShopkeeperLayout>
  );
}
