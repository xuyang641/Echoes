import { useState } from 'react';
import { Check, Star, Zap, Crown, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

export function SubscriptionView() {
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  const plans = [
    {
      id: 'free',
      name: 'Starter',
      price: '0',
      description: t('subscription.features.starter.storage'),
      features: [
        t('subscription.features.starter.storage'),
        t('subscription.features.starter.sync'),
        t('subscription.features.starter.ai'),
        t('subscription.features.starter.theme'),
        t('subscription.features.export')
      ],
      icon: Star,
      color: 'blue'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: billingCycle === 'monthly' ? '10.00' : '96.00',
      period: billingCycle === 'monthly' ? '/mo' : '/yr',
      currency: '¥',
      description: t('subscription.features.ai'),
      features: [
        t('subscription.features.unlimited'),
        t('subscription.features.ai'),
        t('subscription.features.quality'),
        t('subscription.features.support'),
        t('subscription.features.themes')
      ],
      popular: true,
      icon: Zap,
      color: 'purple'
    },
    {
      id: 'lifetime',
      name: 'Lifetime',
      price: '198.00',
      period: 'one-time',
      currency: '¥',
      description: t('subscription.features.lifetime'),
      features: [
        t('subscription.features.unlimited'),
        t('subscription.features.lifetime'),
        t('subscription.features.badge'),
        t('subscription.features.beta'),
        t('subscription.features.vip'),
        t('subscription.features.themes')
      ],
      icon: Crown,
      color: 'amber'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
          {t('subscription.title')}
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {t('subscription.subtitle')}
        </p>
        
        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
            {t('subscription.monthly')}
          </span>
          <button 
            onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
            className="w-14 h-8 bg-gray-200 dark:bg-gray-700 rounded-full p-1 relative transition-colors"
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${billingCycle === 'yearly' ? 'translate-x-6' : ''}`} />
          </button>
          <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
            {t('subscription.yearly')} <span className="text-green-500 font-bold ml-1">({t('subscription.save')})</span>
          </span>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={`relative bg-white dark:bg-gray-800 rounded-3xl p-8 border-2 transition-all duration-300 hover:scale-105 ${
              plan.popular 
                ? 'border-purple-500 shadow-xl shadow-purple-500/10 z-10' 
                : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 shadow-lg'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                {t('subscription.mostPopular')}
              </div>
            )}

            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-${plan.color}-100 text-${plan.color}-600 dark:bg-${plan.color}-900/30 dark:text-${plan.color}-400`}>
              <plan.icon className="w-6 h-6" />
            </div>

            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 min-h-[40px]">{plan.description}</p>

            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.currency || '$'}{plan.price}</span>
              {plan.period && <span className="text-gray-500 dark:text-gray-400">{plan.period}</span>}
            </div>

            <button 
              onClick={() => {
                if (plan.price === '0') return;
                window.open('https://afdian.com/a/houxuyang', '_blank');
              }}
              className={`w-full py-3 rounded-xl font-bold transition-all ${
                plan.id === 'free'
                  ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
                  : 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
              }`}
            >
              {plan.id === 'free' ? t('subscription.currentPlan') : t('subscription.getStarted')}
            </button>

            <div className="mt-8 space-y-4">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check className={`w-5 h-5 flex-shrink-0 ${plan.popular ? 'text-purple-500' : 'text-blue-500'}`} />
                  <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Donation Section */}
      <div className="mt-16 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-800 rounded-3xl p-8 md:p-12 border border-amber-100 dark:border-gray-700 text-center">
         <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-coffee"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>
         </div>
         <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{t('account.sponsor')}</h2>
         <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            {t('account.sponsor_desc')}
         </p>
         <button
            onClick={() => window.open('https://afdian.com/a/houxuyang', '_blank')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-amber-500/30"
         >
            {t('account.donate_afdian')}
         </button>
      </div>

      {/* Trust Badges */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 pt-12 text-gray-400 text-sm">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span>{t('subscription.payment.secure')}</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{t('common.cancel')} Anytime</span>
        </div>
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4" />
          <span>30-Day Money Back</span>
        </div>
      </div>
    </div>
  );
}