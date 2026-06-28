import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import ShopkeeperLayout from '../../layouts/ShopkeeperLayout';
import { Package, Truck, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ShopkeeperPackages() {
  const { user } = useAuth();
  const [shop, setShop] = useState<any>(null);
  const [outgoingPackages, setOutgoingPackages] = useState<any[]>([]); // Kargolanacaklar (report_approved)
  const [incomingPackages, setIncomingPackages] = useState<any[]>([]); // Gelen Kargolar (in_transit, buyer_shop)
  const [awaitingPickup, setAwaitingPickup] = useState<any[]>([]); // Alıcıyı Bekleyenler (arrived_at_buyer_shop)
  const [loading, setLoading] = useState(true);

  // Kargo Modal
  const [activeTx, setActiveTx] = useState<any>(null);
  const [trackingNo, setTrackingNo] = useState('');

  useEffect(() => {
    if (user) {
      fetchShopAndPackages();
    }
  }, [user]);

  async function fetchShopAndPackages() {
    setLoading(true);
    const { data: shopData } = await supabase
      .from('shop_locations')
      .select('id')
      .eq('profile_id', user?.id)
      .maybeSingle();

    if (shopData) {
      setShop(shopData);
      
      // Fetch Transactions where shop is involved
      const { data: txs } = await supabase
        .from('transactions')
        .select(`
          *,
          listings(title, images),
          buyer_shop:shop_locations!transactions_buyer_shop_id_fkey(shop_name, city, full_address)
        `)
        .or(`seller_shop_id.eq.${shopData.id},buyer_shop_id.eq.${shopData.id}`)
        .order('created_at', { ascending: false });

      if (txs) {
        setOutgoingPackages(txs.filter(tx => tx.seller_shop_id === shopData.id && tx.status === 'report_approved'));
        setIncomingPackages(txs.filter(tx => tx.buyer_shop_id === shopData.id && tx.status === 'in_transit'));
        setAwaitingPickup(txs.filter(tx => tx.buyer_shop_id === shopData.id && tx.status === 'arrived_at_buyer_shop'));
      }
    }
    setLoading(false);
  }

  const handleShipPackage = async () => {
    if (!trackingNo) return alert('Lütfen bir kargo takip numarası girin.');
    
    const { error } = await supabase
      .from('transactions')
      .update({ 
        status: 'in_transit', 
        logistics_tracking_no: trackingNo 
      })
      .eq('id', activeTx.id);

    if (!error) {
      alert('Paket kargoya verildi olarak işaretlendi!');
      setActiveTx(null);
      setTrackingNo('');
      fetchShopAndPackages();
    } else {
      alert('Bir hata oluştu.');
    }
  };

  const handleReceivePackage = async (txId: number) => {
    const confirm = window.confirm('Paketi fiziki olarak teslim aldığınızı onaylıyor musunuz?');
    if (!confirm) return;

    const { error } = await supabase
      .from('transactions')
      .update({ status: 'arrived_at_buyer_shop' })
      .eq('id', txId);

    if (!error) {
      alert('Paket teslim alındı! Alıcı kod okutarak cihazı alabilir.');
      fetchShopAndPackages();
    } else {
      alert('Bir hata oluştu.');
    }
  };

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
        <div className="text-red-500 p-8">Esnaf profiliniz bulunamadı. Lütfen yetkiliyle iletişime geçin.</div>
      </ShopkeeperLayout>
    );
  }

  return (
    <ShopkeeperLayout>
      <div className="space-y-8">
        
        {/* Kargolanacaklar (Nokta A) */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Package className="text-emerald-500" /> Kargoya Verilecek Paketler
          </h2>
          {outgoingPackages.length === 0 ? (
            <p className="text-gray-500 bg-white p-6 rounded-2xl border border-gray-100">Kargolanması gereken paket yok.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {outgoingPackages.map(tx => (
                <div key={tx.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
                  <div className="flex gap-4">
                    <img src={tx.listings?.images?.[0] || 'https://via.placeholder.com/100'} className="w-16 h-16 rounded-xl object-cover bg-gray-100" />
                    <div>
                      <p className="font-bold text-gray-900">{tx.listings?.title}</p>
                      <p className="text-sm text-gray-500">İşlem No: {tx.id}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Alıcı Teslim Noktası:</p>
                    <p className="text-sm font-semibold text-gray-800">{tx.buyer_shop?.shop_name} - {tx.buyer_shop?.city}</p>
                    <p className="text-xs text-gray-600 mt-1">{tx.buyer_shop?.full_address}</p>
                  </div>
                  <button 
                    onClick={() => setActiveTx(tx)}
                    className="w-full bg-emerald-600 text-white py-2 rounded-xl font-bold hover:bg-emerald-700 transition"
                  >
                    Kargoya Verildi Olarak İşaretle
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Yoldaki / Gelecek Paketler (Nokta B) */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Truck className="text-blue-500" /> Dükkana Gelecek Paketler (Yolda)
          </h2>
          {incomingPackages.length === 0 ? (
            <p className="text-gray-500 bg-white p-6 rounded-2xl border border-gray-100">Yolda olan paket yok.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incomingPackages.map(tx => (
                <div key={tx.id} className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Truck className="text-blue-500" size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{tx.listings?.title}</p>
                      <p className="text-sm text-gray-500">Takip No: <span className="font-mono text-gray-800 font-bold">{tx.logistics_tracking_no}</span></p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleReceivePackage(tx.id)}
                    className="w-full bg-blue-600 text-white py-2 rounded-xl font-bold hover:bg-blue-700 transition"
                  >
                    Fiziki Olarak Teslim Aldım
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alıcıyı Bekleyenler (Nokta B) */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle2 className="text-teal-500" /> Alıcıyı Bekleyen Cihazlar
          </h2>
          {awaitingPickup.length === 0 ? (
            <p className="text-gray-500 bg-white p-6 rounded-2xl border border-gray-100">Bekleyen cihaz yok.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {awaitingPickup.map(tx => (
                <div key={tx.id} className="bg-white p-5 rounded-2xl border border-teal-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                    <Package className="text-teal-500" size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{tx.listings?.title}</p>
                    <p className="text-sm text-gray-500">Alıcının gelip QR kod okutması bekleniyor.</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Kargo Modal */}
      {activeTx && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Kargoya Ver</h2>
            <p className="text-sm text-gray-600 mb-4">
              Cihazı belirtilen teslimat noktasına kargoladıktan sonra kargo takip numarasını buraya girin.
            </p>
            <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Alıcı Dükkan Adresi</p>
              <p className="text-sm font-semibold text-gray-800">{activeTx.buyer_shop?.shop_name}</p>
              <p className="text-xs text-gray-600 mt-1">{activeTx.buyer_shop?.full_address} - {activeTx.buyer_shop?.city}</p>
            </div>
            <input 
              type="text" 
              placeholder="Kargo Takip No (Örn: YK-123456789)" 
              value={trackingNo}
              onChange={(e) => setTrackingNo(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex gap-3">
              <button onClick={() => setActiveTx(null)} className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-gray-600 font-medium">İptal</button>
              <button onClick={handleShipPackage} className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-xl font-bold">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </ShopkeeperLayout>
  );
}
