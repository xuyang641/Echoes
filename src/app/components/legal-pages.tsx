import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';

interface LegalPageProps {
  title: string;
  content: React.ReactNode;
}

export function LegalPage({ title, content }: LegalPageProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-8 my-8">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('legal.back')}
      </button>
      
      <h1 className="text-3xl font-bold text-gray-900 mb-8 pb-4 border-b border-gray-100">
        {title}
      </h1>
      
      <div className="prose prose-gray max-w-none text-gray-600 space-y-4 leading-relaxed">
        {content}
      </div>
    </div>
  );
}

export function AboutView() {
  const { t } = useTranslation();
  return (
    <LegalPage 
      title={t('legal.about.title')} 
      content={
        <>
          <p>
            <Trans i18nKey="legal.about.intro1" components={{ strong: <strong /> }} />
          </p>
          <p>
            {t('legal.about.intro2')}
          </p>
          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">{t('legal.about.missionTitle')}</h3>
          <p>
            {t('legal.about.missionText')}
          </p>
        </>
      }
    />
  );
}

export function PrivacyView() {
  const { t } = useTranslation();
  return (
    <LegalPage 
      title={t('legal.privacy.title')} 
      content={
        <>
          <p>{t('legal.privacy.lastUpdated')}</p>
          <p>
            {t('legal.privacy.intro')}
          </p>
          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">{t('legal.privacy.collectionTitle')}</h3>
          <p>
            {t('legal.privacy.collectionText')}
          </p>
          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">{t('legal.privacy.storageTitle')}</h3>
          <p>
            {t('legal.privacy.storageText')}
          </p>
          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">{t('legal.privacy.aiTitle')}</h3>
          <p>
            {t('legal.privacy.aiText')}
          </p>
          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">{t('legal.privacy.rightsTitle')}</h3>
          <p>
            {t('legal.privacy.rightsText')}
          </p>
        </>
      }
    />
  );
}

export function TermsView() {
  const { t } = useTranslation();
  return (
    <LegalPage 
      title={t('legal.terms.title')} 
      content={
        <>
          <p>{t('legal.terms.lastUpdated')}</p>
          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">{t('legal.terms.acceptanceTitle')}</h3>
          <p>
            {t('legal.terms.acceptanceText')}
          </p>
          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">{t('legal.terms.conductTitle')}</h3>
          <p>
            {t('legal.terms.conductText')}
          </p>
          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">{t('legal.terms.accountTitle')}</h3>
          <p>
            {t('legal.terms.accountText')}
          </p>
          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">{t('legal.terms.intellectualTitle')}</h3>
          <p>
            {t('legal.terms.intellectualText')}
          </p>
          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">{t('legal.terms.terminationTitle')}</h3>
          <p>
            {t('legal.terms.terminationText')}
          </p>
        </>
      }
    />
  );
}