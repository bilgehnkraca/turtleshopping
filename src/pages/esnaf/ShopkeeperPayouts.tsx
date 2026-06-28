import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import ShopkeeperLayout from '../../layouts/ShopkeeperLayout';
import { Wallet, TrendingUp, DollarSign } from 'lucide-react';

export default function ShopkeeperPayouts() {
  const { user } = useAuth();
  const [shop, setShop] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchShopAndPayouts();
    }
  }, [user]);

  async function fetchShopAndPayouts() {
    setLoading(true);
    const { data: shopData } = await supabase
      .from('shop_locations')
      .select('id')
      .eq('profile_id', user?.id)
      .maybeSingle();

    if (shopData) {
      setShop(shopData);
      
      const { data: txs } = await supabase
        .from('transactions')
        .select(`
          *,
          listings(title, price)
        `)
        .or(`seller_shop_id.eq.${shopData.id},buyer_shop_id.eq.${shopData.id}`)
        .eq('status', 'verified')
        .order('updated_at', { ascending: false });

      if (txs) {
        setTransactions(txs);
      }
    }
    setLoading(false);
  }

  // Hesaplama Mantığı
  // Toplam Komisyon = (İlan Fiyatı) * 0.05
  // Satıcı Esnaf (Nokta A) = %30
  // Alıcı Esnaf (Nokta B) = %30
  // Turtle Sistem = %40
  // Eğer Nokta A ve B aynı esnafsa %60 alır.
  
  const calculateEarnings = (tx: any) => {
    const totalCommission = tx.commission || (tx.price * 0.05);
    let myEarning = 0;
    if (tx.seller_shop_id === shop?.id) {
      myEarning += totalCommission * 0.30;
    }
    if (tx.buyer_shop_id === shop?.id) {
      myEarning += totalCommission * 0.30;
    }
    return myEarning;
  };

  const totalEarnings = transactions.reduce((sum, tx) => sum + calculateEarnings(tx), 0);

  if (loading) {
    return (
      <ShopkeeperLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
        </div>
      </ShopkeeperLayout>
    );
  }

  if (!shop) {
    return (
      <ShopkeeperLayout>
        <div className="text-red-500 p-8">Esnaf profiliniz bulunamadı.</div>
      </ShopkeeperLayout>
    );
  }

  return (
    <ShopkeeperLayout>
      <div className="space-y-8">
        
        {/* Metrikler */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-200">
            <div className="flex items-center gap-2 mb-4 opacity-80">
              <Wallet size={20} />
              <h3 className="font-medium text-sm uppercase tracking-wider">Toplam Hakediş (Net)</h3>
            </div>
            <p className="text-4xl font-black">{totalEarnings.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</p>
            <p className="text-emerald-100 mt-2 text-sm">Başarıyla tamamlanan işlemlerden</p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-gray-500">
              <TrendingUp size={20} />
              <h3 className="font-medium text-sm uppercase tracking-wider">Tamamlanan İşlem</h3>
            </div>
            <p className="text-4xl font-black text-gray-800">{transactions.length}</p>
            <p className="text-gray-400 mt-2 text-sm">Adet</p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-3">
              <DollarSign className="text-amber-500" size={24} />
            </div>
            <h3 className="font-bold text-gray-800">Bekleyen Ödeme Yok</h3>
            <p className="text-xs text-gray-500 mt-1">Ödemeler her cuma otomatik hesabınıza aktarılır.</p>
          </div>
        </div>

        {/* Döküm */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-800">İşlem Bazlı Kazançlar</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-medium">İşlem ID</th>
                  <th className="px-6 py-4 font-medium">İlan</th>
                  <th className="px-6 py-4 font-medium">Satış Fiyatı</th>
                  <th className="px-6 py-4 font-medium">Rolünüz</th>
                  <th className="px-6 py-4 font-medium text-right">Kazancınız</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Henüz tamamlanmış (kazanç sağlanan) işleminiz yok.
                    </td>
                  </tr>
                ) : (
                  transactions.map(tx => {
                    const roles = [];
                    if (tx.seller_shop_id === shop.id) roles.push('Gönderen (Nokta A)');
                    if (tx.buyer_shop_id === shop.id) roles.push('Teslim Eden (Nokta B)');
                    
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-gray-500 font-mono">#{tx.id.substring(0,8)}</td>
                        <td className="px-6 py-4 font-medium text-gray-800">{tx.listings?.title}</td>
                        <td className="px-6 py-4 text-gray-600">{tx.price.toLocaleString('tr-TR')} ₺</td>
                        <td className="px-6 py-4 text-emerald-600 font-medium">
                          <span className="bg-emerald-50 px-2 py-1 rounded border border-emerald-100 text-xs">
                            {roles.join(' & ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-emerald-600">
                          +{calculateEarnings(tx).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </ShopkeeperLayout>
  );
}
