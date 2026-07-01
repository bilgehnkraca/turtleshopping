import AdminLayout from '../../layouts/AdminLayout';
import { Construction } from 'lucide-react';

export default function AdminComingSoon() {
  return (
    <AdminLayout>
      <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
          <Construction className="text-blue-500" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Bu Sayfa Çok Yakında!</h2>
        <p className="text-gray-500 max-w-md text-center">
          Yönetim panelini geliştirmeye devam ediyoruz. Bu özellik kısa süre içerisinde kullanıma açılacaktır. Anlayışınız için teşekkür ederiz.
        </p>
      </div>
    </AdminLayout>
  );
}
