import type { ReactNode } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { Package, CheckCircle, CreditCard, Settings, HelpCircle, ScanLine, Bell, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const ShopkeeperLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const { profile, loading, isShopkeeper, isAdmin } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!isShopkeeper && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  const getInitials = (name: string) => {
    if (!name) return 'ES';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const menuItems = [
    { path: '/esnaf/dashboard', name: 'Dashboard', icon: <Package size={20} /> },
    { path: '/esnaf/barkod', name: 'Karekod İşlemleri', icon: <ScanLine size={20} /> },
    { path: '/esnaf/paketler', name: 'Gelen Paketler', icon: <Package size={20} /> },
    { path: '/esnaf/dogrulananlar', name: 'Doğrulananlar', icon: <CheckCircle size={20} /> },
    { path: '/esnaf/odemeler', name: 'Ödemeler', icon: <CreditCard size={20} /> },
    { path: '/esnaf/ayarlar', name: 'Ayarlar', icon: <Settings size={20} /> },
    { path: '/esnaf/destek', name: 'Destek', icon: <HelpCircle size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#044c34] text-white flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-emerald-400 p-2 rounded-lg">
            <Package color="white" size={24} />
          </div>
          <span className="text-xl font-bold tracking-wide">TurtleNokta</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive 
                    ? 'bg-[#0a6648] text-white font-medium shadow-sm' 
                    : 'text-emerald-100 hover:bg-[#065b3f] hover:text-white'
                }`}
              >
                <div className={isActive ? 'text-emerald-300' : 'opacity-80'}>
                  {item.icon}
                </div>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-[#065b3f]/50">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-emerald-100 hover:bg-[#065b3f] hover:text-white">
            <div className="opacity-80">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            Mağazaya Dön
          </Link>
          <div className="mt-4 text-center text-xs text-emerald-200/50">
            TurtleNokta © 2026
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Topbar */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 z-10">
          <h1 className="text-2xl font-bold text-gray-800">
            {menuItems.find(m => location.pathname.startsWith(m.path))?.name || 'Dashboard'}
          </h1>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Takip No veya İsim..." 
                className="bg-gray-100/70 border-none rounded-full pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none"
              />
            </div>
            
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200 cursor-pointer">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{profile?.full_name || 'Kullanıcı'}</div>
                <div className="text-xs text-gray-500">Esnaf Profili</div>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold border border-emerald-200">
                {getInitials(profile?.full_name || '')}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ShopkeeperLayout;
