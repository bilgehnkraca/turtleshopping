import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Users, LayoutDashboard, ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const menuItems = [
    { path: '/admin/dashboard', name: 'Genel Bakış', icon: <LayoutDashboard size={20} /> },
    { path: '/admin/finans', name: 'Finans Raporu', icon: <BarChart3 size={20} /> },
    { path: '/admin/kullanicilar', name: 'Kullanıcılar', icon: <Users size={20} /> },
    { path: '/admin/sikayetler', name: 'İlan Şikayetleri', icon: <ShieldAlert size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* Sidebar - Dark Corporate Theme */}
      <aside className="w-64 bg-[#0a0a0a] text-gray-300 flex flex-col border-r border-gray-800">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <BarChart3 color="white" size={24} />
          </div>
          <span className="text-xl font-bold tracking-wide text-white">TurtleAdmin</span>
        </div>

        <div className="px-6 py-2">
          <div className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-4 mt-4">Yönetim Paneli</div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-blue-600/10 text-blue-500 font-medium' 
                    : 'hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <div className={isActive ? 'text-blue-500' : 'opacity-70'}>
                  {item.icon}
                </div>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={20} />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Topbar */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 z-10 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">
            {menuItems.find(m => location.pathname.startsWith(m.path))?.name || 'Dashboard'}
          </h1>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200 cursor-pointer">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{profile?.full_name || profile?.username || 'Kurucu'}</div>
                <div className="text-xs text-blue-600 font-bold uppercase tracking-wider">Süper Admin</div>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                A
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

export default AdminLayout;
