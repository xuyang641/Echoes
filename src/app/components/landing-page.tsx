import { motion, useScroll, useTransform } from 'framer-motion';
import { BookOpen, Camera, Map, Sparkles, Download, ArrowRight, Shield, Heart, Lock, Smartphone, Globe, Cloud, Palette, Star, MessageCircle, Printer, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRef } from 'react';

export function LandingPage() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"]
  });

  const features = [
    {
      icon: <Camera className="w-6 h-6 text-blue-500" />,
      title: "多模态记录",
      description: "支持文字、照片、语音，全方位捕捉生活瞬间。"
    },
    {
      icon: <Sparkles className="w-6 h-6 text-purple-500" />,
      title: "AI 智能伴侣",
      description: "自动生成日记回顾、情绪分析，甚至为你绘图。"
    },
    {
      icon: <Map className="w-6 h-6 text-green-500" />,
      title: "足迹地图",
      description: "在地图上点亮你的旅程，重温走过的每一个角落。"
    },
    {
      icon: <Printer className="w-6 h-6 text-pink-500" />,
      title: "回忆冲印",
      description: "将珍贵的电子日记一键制作成精美的实体照片书。"
    },
    {
      icon: <Shield className="w-6 h-6 text-orange-500" />,
      title: "隐私安全",
      description: "数据本地加密存储，支持云端同步与生物识别锁。"
    }
  ];

  const testimonials = [
    {
      quote: "Echoes 改变了我记录生活的方式。AI 生成的回顾总是能让我发现被忽略的小确幸。",
      author: "Alex",
      role: "设计师"
    },
    {
      quote: "作为一个注重隐私的人，Echoes 的本地加密功能让我非常安心。终于可以毫无顾虑地写日记了。",
      author: "Sarah",
      role: "开发者"
    },
    {
      quote: "地图功能太棒了！看着足迹遍布世界各地，那种成就感无与伦比。",
      author: "Mike",
      role: "旅行博主"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full p-6 flex justify-between items-center z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-all">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-800 p-0.5">
             <img 
                src="/assets/icon.png" 
                alt="Echoes" 
                className="w-full h-full object-contain"
                onError={(e) => {
                    // Fallback to public SVG if assets png fails (Vite mapping)
                    const target = e.currentTarget;
                    if (target.src.endsWith('icon.png')) {
                        target.src = '/PWA/icon.svg';
                    } else {
                        target.style.display = 'none';
                        target.parentElement!.classList.add('bg-gradient-to-br', 'from-blue-600', 'to-purple-600');
                        target.parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open w-6 h-6"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>';
                    }
                }}
             />
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 font-display tracking-tight">
            Echoes
          </span>
        </Link>
        <div className="flex items-center gap-4">
            <a href="#features" className="hidden md:block text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">特性</a>
            <a href="#reviews" className="hidden md:block text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">评价</a>
            <Link 
            to="/login" 
            className="px-6 py-2 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20"
            >
            网页版登录
            </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 pt-40 pb-24 flex flex-col md:flex-row items-center gap-12 md:gap-24 relative z-10">
        {/* Left Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex-1 text-center md:text-left space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-4 animate-fade-in-up">
            <Sparkles className="w-4 h-4" />
            <span className="animate-pulse">AI 2.0 现已上线</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white leading-[1.1] font-display tracking-tight">
            记录生活的 <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
              每一次回响
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-xl mx-auto md:mx-0 leading-relaxed">
            Echoes 不仅仅是日记本。它是你的 AI 记忆伴侣，帮你整理思绪、回顾美好，让每一段回忆都栩栩如生。
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
            <a 
              href="#" 
              onClick={(e) => {
                 e.preventDefault();
                 alert("Android 版本即将上线，敬请期待！");
              }}
              className="px-8 py-4 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-lg flex items-center justify-center gap-3 hover:scale-105 transition-transform shadow-xl hover:shadow-2xl shadow-blue-500/20"
            >
              <Download className="w-6 h-6" />
              下载 Android 版
            </a>
            <Link 
              to="/login"
              className="px-8 py-4 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-lg flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors shadow-lg hover:shadow-xl"
            >
              网页版试用 <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="pt-8 flex items-center gap-4 justify-center md:justify-start text-sm text-gray-500 dark:text-gray-400">
            <div className="flex -space-x-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white dark:border-gray-900 overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="user" />
                </div>
              ))}
            </div>
            <div className="flex flex-col items-start">
                <div className="flex text-yellow-400">
                    <Star className="w-3 h-3 fill-current" />
                    <Star className="w-3 h-3 fill-current" />
                    <Star className="w-3 h-3 fill-current" />
                    <Star className="w-3 h-3 fill-current" />
                    <Star className="w-3 h-3 fill-current" />
                </div>
                <p>已有 10,000+ 用户正在记录</p>
            </div>
          </div>
        </motion.div>

        {/* Right Visual */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex-1 relative hidden md:block"
          whileHover={{ rotate: 0, scale: 1.02 }}
        >
          <div className="relative z-10 w-full max-w-md mx-auto aspect-[9/19] bg-gray-900 rounded-[3rem] border-8 border-gray-900 shadow-2xl overflow-hidden ring-8 ring-black/10 transform transition-transform duration-500 hover:shadow-blue-500/20">
             {/* Mockup Screen Content */}
             <div className="w-full h-full bg-white dark:bg-gray-900 overflow-hidden relative group cursor-pointer">
                <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/50 to-transparent z-20 pointer-events-none" />
                <img 
                  src="/assets/splash.jpg" 
                  alt="App Screenshot" 
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out"
                  onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                  }}
                />
                
                {/* Floating Cards */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="absolute bottom-32 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/50 group-hover:translate-y-[-5px] transition-transform"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-bold text-gray-800 text-sm">AI 情感分析</span>
                  </div>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    “检测到你今天的心情非常愉悦，充满创造力。建议标记为 #灵感时刻 ✨”
                  </p>
                </motion.div>
             </div>
          </div>
          
          {/* Decorative Blobs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-gradient-to-tr from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-full blur-3xl -z-10 animate-blob group-hover:opacity-70 transition-opacity" />
        </motion.div>
      </main>

      {/* Features Grid */}
      <section id="features" className="container mx-auto px-4 py-24 relative z-10">
        <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">为什么选择 Echoes？</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">不仅仅是记录文字，我们用科技赋予回忆生命力。</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-8 rounded-3xl border border-white/50 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-all hover:shadow-xl group"
            >
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-gray-900 shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-3">{feature.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Deep Dive Section 1: AI */}
      <section className="py-24 bg-white dark:bg-gray-900/50 relative overflow-hidden">
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm font-medium">
                      <Sparkles className="w-4 h-4" /> 智能伴侣
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                      让回忆 <br/> <span className="text-purple-600">开口说话</span>
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                      Echoes 的 AI 引擎会深入理解你的文字，为你生成温暖的周回顾，甚至根据你的描述自动绘制插画。它不仅是记录工具，更是懂你的倾听者。
                  </p>
                  <ul className="space-y-4 pt-4">
                      {[
                          "智能生成每日/每周回顾",
                          "情感趋势分析图表",
                          "Dream Painter 文生图功能",
                          "自动提取智能标签"
                      ].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              </div>
                              {item}
                          </li>
                      ))}
                  </ul>
              </div>
              <div className="flex-1 relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-200 to-blue-200 dark:from-purple-900/40 dark:to-blue-900/40 rounded-full blur-3xl opacity-50" />
                  <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-gray-700 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                      <div className="flex items-center gap-4 mb-4 border-b border-gray-100 dark:border-gray-700 pb-4">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <Sparkles className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                              <div className="font-bold text-gray-900 dark:text-white">AI 周报</div>
                              <div className="text-xs text-gray-500">刚刚生成</div>
                          </div>
                      </div>
                      <div className="space-y-3">
                          <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-3/4" />
                          <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-full" />
                          <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-5/6" />
                          <div className="h-32 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mt-4 border-2 border-dashed border-purple-200 dark:border-purple-800">
                              <div className="text-center">
                                  <Palette className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                                  <span className="text-xs text-purple-500">AI 为你生成的插画</span>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* Deep Dive Section 2: Multimodal */}
      <section className="py-24 bg-gray-50 dark:bg-gray-800/30 relative overflow-hidden">
          <div className="container mx-auto px-4 flex flex-col md:flex-row-reverse items-center gap-16">
              <div className="flex-1 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium">
                      <Camera className="w-4 h-4" /> 多模态记录
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                      记录生活的 <br/> <span className="text-blue-600">每一个维度</span>
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                      文字不足以承载全部的回忆。Echoes 支持照片、语音、位置等多模态记录，让那一刻的感官体验完整重现。
                  </p>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shrink-0">
                             <Camera className="w-5 h-5" />
                          </div>
                          <div>
                              <h4 className="font-bold text-gray-900 dark:text-white text-sm">高清图库</h4>
                              <p className="text-xs text-gray-500 mt-1">记录美好瞬间</p>
                          </div>
                      </div>
                      <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 shrink-0">
                             <MessageCircle className="w-5 h-5" />
                          </div>
                          <div>
                              <h4 className="font-bold text-gray-900 dark:text-white text-sm">语音日记</h4>
                              <p className="text-xs text-gray-500 mt-1">倾诉真实心声</p>
                          </div>
                      </div>
                  </div>
              </div>
              <div className="flex-1 relative">
                   <div className="relative w-full max-w-sm mx-auto aspect-square bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 rotate-3 hover:rotate-0 transition-transform duration-500 border border-gray-100 dark:border-gray-700">
                      <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-100 dark:bg-blue-900/50 rounded-full blur-xl -z-10" />
                      <div className="flex gap-4 mb-4">
                          <div className="w-2/3 h-32 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
                             <img src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover" alt="Event" />
                          </div>
                          <div className="w-1/3 space-y-2">
                              <div className="h-14 bg-pink-50 dark:bg-pink-900/20 rounded-xl flex items-center justify-center text-pink-500">
                                  <Heart className="w-6 h-6 fill-current" />
                              </div>
                              <div className="h-14 bg-gray-100 dark:bg-gray-700 rounded-xl" />
                          </div>
                      </div>
                      <div className="space-y-2">
                          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-full" />
                          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-5/6" />
                          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-4/6" />
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                          <Map className="w-3 h-3" />
                          <span>Central Park, NY</span>
                      </div>
                   </div>
              </div>
          </div>
      </section>

      {/* Deep Dive Section 3: Map */}
      <section className="py-24 bg-white dark:bg-gray-900/50 relative overflow-hidden">
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-medium">
                      <Map className="w-4 h-4" /> 足迹地图
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                      点亮你的 <br/> <span className="text-green-600">世界地图</span>
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                      每一篇日记都是地图上的一个坐标。随着时间的推移，看着足迹点亮一个个城市，那是你独特的人生轨迹。
                  </p>
                  <ul className="space-y-4 pt-4">
                      {[
                          "自动提取位置信息",
                          "可视化热力图展示",
                          "按地点回顾往事",
                          "生成旅行专属相册"
                      ].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                                  <Globe className="w-4 h-4" />
                              </div>
                              {item}
                          </li>
                      ))}
                  </ul>
              </div>
              <div className="flex-1 relative">
                  <div className="relative w-full aspect-video bg-blue-50 dark:bg-gray-800 rounded-3xl overflow-hidden shadow-xl border border-blue-100 dark:border-gray-700">
                      {/* Simple Map Visualization */}
                      <div className="absolute inset-0 opacity-50">
                          <svg className="w-full h-full text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 100 100" preserveAspectRatio="none">
                              <path d="M0 100 L100 100 L100 80 C80 80 80 60 60 60 C40 60 40 40 20 40 L0 40 Z" />
                              <path d="M40 0 L100 0 L100 20 C80 20 60 40 40 40 Z" />
                          </svg>
                      </div>
                      {/* Pins */}
                      {[1,2,3].map(i => (
                          <div key={i} className="absolute w-8 h-8 -ml-4 -mt-8" style={{ top: `${30 + i * 20}%`, left: `${20 + i * 25}%` }}>
                              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto shadow-lg animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                              <div className="w-8 h-8 bg-green-500/20 rounded-full animate-ping absolute top-0 left-0" style={{ animationDelay: `${i * 0.2}s` }} />
                          </div>
                      ))}
                      {/* Card Overlay */}
                      <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur p-3 rounded-xl shadow-lg flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden">
                              <img src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80" className="w-full h-full object-cover" alt="Paris" />
                          </div>
                          <div>
                              <div className="text-xs font-bold text-gray-900 dark:text-white">巴黎之旅</div>
                              <div className="text-[10px] text-gray-500">2023.10.15</div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* Deep Dive Section 4: Print Shop */}
      <section className="py-24 bg-pink-50 dark:bg-pink-900/10 relative overflow-hidden">
          <div className="container mx-auto px-4 flex flex-col md:flex-row-reverse items-center gap-16">
              <div className="flex-1 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 text-sm font-medium">
                      <Printer className="w-4 h-4" /> 回忆冲印店
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                      把美好 <br/> <span className="text-pink-600">捧在手心</span>
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                      数字记忆虽然便捷，但实体照片的温度无可替代。Echoes 内置冲印店，支持将你的月度精选或特定相册一键排版，印制成高品质的照片书。
                  </p>
                  <ul className="space-y-4 pt-4">
                      {[
                          "AI 智能排版，一键生成",
                          "多种封面材质与纸张选择",
                          "支持拍立得风格单片打印",
                          "精美礼盒包装，珍藏美好"
                      ].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                              <div className="w-6 h-6 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600">
                                  <ImageIcon className="w-4 h-4" />
                              </div>
                              {item}
                          </li>
                      ))}
                  </ul>
              </div>
              <div className="flex-1 relative perspective-1000">
                  {/* Photo Book Mockup */}
                  <div className="relative w-full max-w-md mx-auto aspect-[4/3] bg-white dark:bg-gray-800 rounded-lg shadow-2xl transform rotate-y-12 hover:rotate-y-0 transition-transform duration-700 preserve-3d border-l-8 border-gray-200 dark:border-gray-700">
                      {/* Cover Image */}
                      <div className="absolute inset-0 overflow-hidden rounded-r-lg">
                          <img 
                            src="https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                            alt="Photobook Cover" 
                            className="w-full h-full object-cover opacity-90"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
                      </div>
                      
                      {/* Book Spine Effect */}
                      <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-gray-300 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-l-sm" />

                      {/* Title Overlay */}
                      <div className="absolute bottom-8 left-8 right-8 text-white">
                          <h3 className="text-3xl font-serif font-bold mb-2">2023</h3>
                          <p className="text-sm opacity-90 font-medium tracking-widest uppercase">Annual Collection</p>
                      </div>

                      {/* Floating Polaroids */}
                      <motion.div 
                        animate={{ y: [0, -15, 0], rotate: [5, 10, 5] }}
                        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                        className="absolute -top-6 -right-6 w-32 bg-white p-2 pb-8 shadow-xl transform rotate-6 border border-gray-100"
                      >
                          <img src="https://images.unsplash.com/photo-1511920170033-f8396924c348?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" className="w-full aspect-square object-cover bg-gray-100" alt="Memory 1" />
                      </motion.div>
                      <motion.div 
                        animate={{ y: [0, 15, 0], rotate: [-5, -10, -5] }}
                        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                        className="absolute -bottom-6 -left-6 w-28 bg-white p-2 pb-6 shadow-xl transform -rotate-6 border border-gray-100 z-20"
                      >
                          <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" className="w-full aspect-square object-cover bg-gray-100" alt="Memory 2" />
                      </motion.div>
                  </div>
              </div>
          </div>
      </section>

      {/* Deep Dive Section 5: Privacy */}
      <section className="py-24 bg-gray-50 dark:bg-gray-800/30">
          <div className="container mx-auto px-4 flex flex-col md:flex-row-reverse items-center gap-16">
              <div className="flex-1 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-sm font-medium">
                      <Lock className="w-4 h-4" /> 极致安全
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                      你的秘密 <br/> <span className="text-orange-500">仅属于你</span>
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                      在这个数据透明的时代，我们捍卫你的隐私权。Echoes 采用离线优先策略，所有数据默认存储在本地设备，并使用生物识别技术加密。
                  </p>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                          <Shield className="w-8 h-8 text-orange-500 mb-3" />
                          <h4 className="font-bold text-gray-900 dark:text-white mb-1">本地存储</h4>
                          <p className="text-xs text-gray-500">数据掌握在自己手中</p>
                      </div>
                      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                          <Smartphone className="w-8 h-8 text-orange-500 mb-3" />
                          <h4 className="font-bold text-gray-900 dark:text-white mb-1">生物识别</h4>
                          <p className="text-xs text-gray-500">FaceID / 指纹解锁</p>
                      </div>
                   </div>
              </div>
              <div className="flex-1 relative flex justify-center">
                  <div className="relative w-64 h-64 bg-white dark:bg-gray-800 rounded-full shadow-2xl flex items-center justify-center border-4 border-orange-100 dark:border-orange-900/30 animate-pulse-slow">
                      <Lock className="w-24 h-24 text-orange-500" />
                      <div className="absolute inset-0 border-t-4 border-orange-500 rounded-full animate-spin-slow" />
                  </div>
              </div>
          </div>
      </section>

      {/* Testimonials */}
      <section id="reviews" className="py-24 container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">用户心声</h2>
            <p className="text-gray-600 dark:text-gray-400">听听他们怎么说</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((t, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 relative hover:shadow-lg transition-shadow">
                      <div className="absolute -top-4 left-8 text-6xl text-blue-100 dark:text-gray-700 font-serif">"</div>
                      <p className="text-gray-600 dark:text-gray-300 mb-6 relative z-10 leading-relaxed italic">
                          {t.quote}
                      </p>
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 overflow-hidden border-2 border-white dark:border-gray-600 shadow-sm">
                              <img 
                                src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${t.author}`} 
                                alt={t.author}
                                className="w-full h-full object-cover"
                              />
                          </div>
                          <div>
                              <div className="font-bold text-gray-900 dark:text-white">{t.author}</div>
                              <div className="text-xs text-gray-500">{t.role}</div>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-blue-900 to-purple-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
          <div className="container mx-auto px-4 text-center relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 font-display">准备好开始记录了吗？</h2>
              <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                  加入 Echoes，开启你的智能回忆之旅。此刻，就是最好的开始。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  to="/login"
                  className="px-8 py-4 rounded-full bg-white text-blue-900 font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg"
                >
                  立即免费开始
                </Link>
              </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center p-0.5">
                        <img 
                            src="/assets/icon.png" 
                            alt="Logo" 
                            className="w-full h-full object-contain" 
                            onError={(e) => {
                                const target = e.currentTarget;
                                if (target.src.endsWith('icon.png')) {
                                    target.src = '/PWA/icon.svg';
                                } else {
                                    target.style.display = 'none';
                                    target.parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open w-5 h-5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>';
                                }
                            }}
                        />
                    </div>
                    <span className="font-bold text-xl text-gray-900 dark:text-white">Echoes</span>
                </div>
                <div className="flex gap-8 text-sm text-gray-500">
                    <Link to="/about" className="hover:text-gray-900 dark:hover:text-white transition-colors">关于我们</Link>
                    <Link to="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">隐私政策</Link>
                    <Link to="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">服务条款</Link>
                </div>
                <p className="text-sm text-gray-400">© 2024 Echoes Diary. All rights reserved.</p>
            </div>
        </div>
      </footer>
    </div>
  );
}