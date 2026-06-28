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

    // İlgili kodu ara
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('id, status, drop_off_code, pick_up_code')
      .eq('shop_id', shop.id)
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
      if (tx.status !== 'pending') {
        setMessage({ type: 'error', text: 'Bu ürün zaten teslim alınmış.' });
      } else {
        await supabase.from('transactions').update({ status: 'dropped_off' }).eq('id', tx.id);
        setMessage({ type: 'success', text: '✅ Ürün satıcıdan başarıyla teslim alındı. Durum güncellendi.' });
      }
    } else if (tx.pick_up_code === code) {
      if (tx.status !== 'dropped_off') {
        setMessage({ type: 'error', text: 'Ürün henüz dükkana teslim edilmemiş veya zaten alıcıya verilmiş.' });
      } else {
        await supabase.from('transactions').update({ status: 'verified' }).eq('id', tx.id);
        setMessage({ type: 'success', text: '🎉 Ürün alıcıya teslim edildi! Ödeme işlemi tamamlandı.' });
      }
    }

    setLoading(false);
    setCode('');
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

        <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100">
          <form onSubmit={handleVerifyCode} className="space-y-6">
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Güvenlik Kodu</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                placeholder="ÖRN: AB12C3"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-5 text-4xl text-center font-mono font-bold tracking-[0.5em] focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-300 placeholder:font-normal placeholder:tracking-normal uppercase"
              />
            </div>

            <button
              disabled={loading || code.length !== 6}
              className="w-full bg-[#044c34] text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
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

        <div className="text-center text-gray-400 text-sm">
          Barkod okuyucu cihazlar da bu alana veri girebilir. İmleci kod kutusuna odaklayıp okutmanız yeterlidir.
        </div>
      </div>
    </ShopkeeperLayout>
  );
}
