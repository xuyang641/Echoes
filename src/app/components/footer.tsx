import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-800 dark:text-gray-200">{t('footer.rights')}</span>
            <span>&copy; {year}</span>
            <span className="hidden md:inline text-gray-300 dark:text-gray-600">|</span>
            <span className="flex items-center gap-1 text-sm">
              {t('footer.madeWith')} <Heart className="w-3 h-3 text-red-500 fill-red-500" /> {t('footer.forLovers')}
            </span>
          </div>

          <nav className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <button onClick={() => navigate('/subscription')} className="hover:text-gray-900 dark:hover:text-white transition-colors text-blue-600 dark:text-blue-400 font-semibold">
              {t('footer.pricing') || 'Pricing'}
            </button>
            <button onClick={() => navigate('/about')} className="hover:text-gray-900 dark:hover:text-white transition-colors">
              {t('footer.about')}
            </button>
            <button onClick={() => navigate('/privacy')} className="hover:text-gray-900 dark:hover:text-white transition-colors">
              {t('footer.privacy')}
            </button>
            <button onClick={() => navigate('/terms')} className="hover:text-gray-900 dark:hover:text-white transition-colors">
              {t('footer.terms')}
            </button>
            <a href="mailto:2311752562@qq.com" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              {/* Contact Email Link */}
              {t('footer.contact')}
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}