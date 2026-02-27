import { GitCommit, Rocket, Zap, Shield, Map as MapIcon, Sparkles, Palette, Share2, Heart, BarChart3, Printer, Database, Languages, Sprout, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Release {
  version: string;
  date: string;
  titleKey: string;
  icon: any;
  color: string;
  changesKey: string; // Using a key prefix to map array
}

const releases: Release[] = [
  // Feb 27
  {
    version: 'v3.6.0',
    date: '2026-02-27',
    titleKey: '体验升级与功能优化',
    icon: Zap,
    color: 'bg-blue-100 text-blue-700',
    changesKey: 'changelog.features.v3.6.0'
  },
  // Feb 13
  {
    version: 'v3.5.0',
    date: '2026-02-13',
    titleKey: 'changelog.print',
    icon: Printer,
    color: 'bg-cyan-100 text-cyan-700',
    changesKey: 'changelog.features.printShopV2'
  },
  // Feb 12
  {
    version: 'v3.3.0',
    date: '2026-02-12',
    titleKey: 'changelog.milestones',
    icon: Target,
    color: 'bg-amber-100 text-amber-700',
    changesKey: 'changelog.features.milestones'
  },
  // Jan 22
  {
    version: 'v3.1.0',
    date: '2026-01-22',
    titleKey: '3D 花园体验升级',
    icon: Sprout,
    color: 'bg-green-100 text-green-700',
    changesKey: 'changelog.features.garden3d'
  },
  // Jan 20
  {
    version: 'v2.6.0',
    date: '2026-01-20',
    titleKey: 'changelog.colordna',
    icon: Rocket,
    color: 'bg-purple-100 text-purple-700',
    changesKey: 'changelog.features.colorDna'
  },
  {
    version: 'v2.5.0',
    date: '2026-01-20',
    titleKey: '国际化支持',
    icon: Languages,
    color: 'bg-red-100 text-red-700',
    changesKey: 'changelog.features.i18n'
  },
  {
    version: 'v2.4.0',
    date: '2026-01-20',
    titleKey: '个人中心升级',
    icon: Shield,
    color: 'bg-orange-100 text-orange-700',
    changesKey: 'changelog.features.profile'
  },
  // Jan 19
  {
    version: 'v2.3.0',
    date: '2026-01-19',
    titleKey: 'changelog.share',
    icon: Share2,
    color: 'bg-green-100 text-green-700',
    changesKey: 'changelog.features.shareCard'
  },
  {
    version: 'v2.2.0',
    date: '2026-01-19',
    titleKey: 'changelog.personalization',
    icon: Palette,
    color: 'bg-indigo-100 text-indigo-700',
    changesKey: 'changelog.features.darkMode'
  },
  {
    version: 'v2.1.0',
    date: '2026-01-19',
    titleKey: 'changelog.ai',
    icon: Sparkles,
    color: 'bg-pink-100 text-pink-700',
    changesKey: 'changelog.features.ai'
  },
  // Jan 18
  {
    version: 'v2.0.0',
    date: '2026-01-18',
    titleKey: 'changelog.couple',
    icon: Heart,
    color: 'bg-rose-100 text-rose-700',
    changesKey: 'changelog.features.coupleSync'
  },
  {
    version: 'v1.9.0',
    date: '2026-01-18',
    titleKey: 'changelog.insights',
    icon: BarChart3,
    color: 'bg-yellow-100 text-yellow-700',
    changesKey: 'changelog.features.insightsCharts'
  },
  {
    version: 'v1.8.0',
    date: '2026-01-18',
    titleKey: 'changelog.map',
    icon: MapIcon,
    color: 'bg-emerald-100 text-emerald-700',
    changesKey: 'changelog.features.mapView'
  },
  {
    version: 'v1.7.0',
    date: '2026-01-18',
    titleKey: 'changelog.print',
    icon: Printer,
    color: 'bg-cyan-100 text-cyan-700',
    changesKey: 'changelog.features.printShop'
  },
  {
    version: 'v1.0.0',
    date: '2026-01-18',
    titleKey: 'changelog.core',
    icon: Database,
    color: 'bg-blue-100 text-blue-700',
    changesKey: 'changelog.features.supabase'
  }
];

export function ChangelogView() {
  const { t } = useTranslation();

  // Helper to get changes array based on version
  const getChanges = (version: string) => {
    if (version === 'v3.6.0') return [
      'UI 优化: 修复移动端菜单溢出抖动问题，优化顶部导航栏布局',
      '地图功能: 新增热力图模式、轨迹回放功能，优化移动端地图控制面板（底部抽屉式）',
      '国际化: 全面汉化“全部功能”菜单、“回忆盘点”页面及日志表单',
      '性能与质量: 修复大量代码规范问题（Linter errors），优化代码结构，提升稳定性'
    ];
    if (version === 'v3.5.0') return [
      t('changelog.features.printShopV2'),
      t('changelog.features.printEditor'),
      t('changelog.features.shareOnline')
    ];
    if (version === 'v3.4.0') return [
      t('changelog.features.mapV2'),
      t('changelog.features.aiV2'),
      t('changelog.features.visuals')
    ];
    if (version === 'v3.3.0') return [
      t('changelog.features.milestones'),
      t('changelog.features.smartGallery'),
      t('changelog.features.smartTags')
    ];
    if (version === 'v3.1.0') return [
      '3D 花园模式支持显示回忆的日期与地点信息',
      '优化场景交互体验'
    ];
    if (version === 'v3.0.0') return [
      t('changelog.features.garden3d'),
      t('changelog.features.weather'),
      t('changelog.features.models')
    ];
    if (version === 'v2.6.0') return [
      t('changelog.features.colorDna'),
      t('changelog.features.planetUI')
    ];
    if (version === 'v2.5.0') return [
      '新增多语言支持（中文/英文）',
      '体验优化与细节打磨'
    ];
    if (version === 'v2.4.0') return [
      '个人中心界面重构',
      '新增数据统计与成就系统',
      '支持修改头像与昵称'
    ];
    if (version === 'v2.3.0') return [
      t('changelog.features.shareCard'),
      t('changelog.features.qr'),
      t('changelog.features.download')
    ];
    if (version === 'v2.2.0') return [
      t('changelog.features.darkMode'),
      t('changelog.features.theme'),
      t('changelog.features.ui'),
      t('changelog.features.readability')
    ];
    if (version === 'v2.1.0') return [
      t('changelog.features.vision'),
      t('changelog.features.analysis')
    ];
    if (version === 'v2.0.0') return [
      t('changelog.features.coupleSync'),
      t('changelog.features.coupleShare')
    ];
    if (version === 'v1.9.0') return [
      t('changelog.features.insightsCharts'),
      t('changelog.features.insightsStreak')
    ];
    if (version === 'v1.8.0') return [
      t('changelog.features.mapView'),
      t('changelog.features.mapInteraction')
    ];
    if (version === 'v1.7.0') return [
      t('changelog.features.printShop'),
      t('changelog.features.printCart')
    ];
    if (version === 'v1.0.0') return [
      t('changelog.features.init'),
      t('changelog.features.basic'),
      t('changelog.features.responsive'),
      t('changelog.features.pwa')
    ];
    return [];
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-white rounded-xl shadow-sm">
          <GitCommit className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('changelog.title')}</h2>
          <p className="text-gray-500 dark:text-gray-400">{t('changelog.subtitle')}</p>
        </div>
      </div>

      <div className="space-y-6">
        {releases.map((release, index) => {
          const Icon = release.icon;
          const changes = getChanges(release.version);
          
          return (
            <div key={release.version} className="relative pl-8 sm:pl-0">
              {/* Connector Line (Desktop) */}
              {index !== releases.length - 1 && (
                <div className="hidden sm:block absolute left-[8.5rem] top-16 bottom-[-2rem] w-px bg-gray-200 dark:bg-gray-700"></div>
              )}

              <div className="flex flex-col sm:flex-row gap-6 group">
                {/* Date & Version (Desktop) */}
                <div className="hidden sm:flex flex-col items-end w-32 pt-2 flex-shrink-0">
                  <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{release.version}</span>
                  <span className="text-xs text-gray-500">{release.date}</span>
                </div>

                {/* Timeline Node */}
                <div className={`
                  absolute left-0 top-2 sm:static sm:top-0 sm:mt-2 
                  w-8 h-8 rounded-full flex items-center justify-center 
                  border-4 border-white dark:border-gray-800 shadow-sm z-10
                  ${release.color}
                `}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Content Card */}
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-transparent hover:border-blue-100 dark:hover:border-blue-900 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {release.titleKey.includes('changelog.') ? t(release.titleKey) : release.titleKey}
                    </h3>
                    {/* Mobile Version Badge */}
                    <div className="sm:hidden flex items-center gap-2">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-xs font-mono dark:text-gray-300">{release.version}</span>
                      <span className="text-xs text-gray-500">{release.date}</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-3">
                    {changes.map((change, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-600 dark:text-gray-300 text-sm">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0 group-hover:bg-blue-400 transition-colors"></span>
                        <span className="leading-relaxed">{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
