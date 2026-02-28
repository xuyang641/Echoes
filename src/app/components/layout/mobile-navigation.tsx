import { useNavigate, useLocation } from 'react-router-dom';
import { Home, PlusCircle, UserCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function MobileNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe z-50 flex justify-around items-center h-16">
      <button 
        onClick={() => navigate('/')}
        className={`flex flex-col items-center justify-center w-16 h-full space-y-1 ${
          location.pathname === '/' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        <Home className={`w-6 h-6 ${location.pathname === '/' ? 'fill-current' : ''}`} />
        <span className="text-[10px] font-medium">{t('nav.timeline')}</span>
      </button>
      
      <button 
        onClick={() => navigate('/add')}
        className="flex flex-col items-center justify-center w-16 h-full -mt-6"
      >
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg text-white">
          <PlusCircle className="w-7 h-7" />
        </div>
      </button>

      <button 
        onClick={() => navigate('/account')}
        className={`flex flex-col items-center justify-center w-16 h-full space-y-1 ${
          location.pathname === '/account' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        <UserCircle className={`w-6 h-6 ${location.pathname === '/account' ? 'fill-current' : ''}`} />
        <span className="text-[10px] font-medium">{t('nav.account')}</span>
      </button>
    </nav>
  );
}