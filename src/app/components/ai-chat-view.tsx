import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, Clock, Heart, Music, ArrowRight, Settings, Key } from 'lucide-react';
import type { DiaryEntry } from './diary-entry-form';
import { format } from 'date-fns';
import { getMoodPlaylist } from '../utils/music-recommender';
import { aiService } from '../utils/ai-service';

interface AIChatViewProps {
  entries: DiaryEntry[];
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  relatedEntryId?: string;
  recommendations?: any[];
}

export function AIChatView({ entries, isOpen, onClose }: AIChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: '你好！我是你的回忆助手。我可以帮你回顾过去、分析心情，或者只是陪你聊聊天。\n试着问我："上个月我开心吗？" 或 "我哪天去过海边？"',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('sk-ba2aac9abdff40f183af300ae493eb93'); // Pre-fill user provided key
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load API key from local storage on mount
  useEffect(() => {
    // Check local storage
    const storedKey = localStorage.getItem('qwen_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      aiService.init(storedKey);
    } else {
      // Initialize with default/hardcoded key if no local storage
      aiService.init('sk-ba2aac9abdff40f183af300ae493eb93');
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('qwen_api_key', apiKey);
      aiService.init(apiKey);
      setShowSettings(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        content: 'API Key 已更新！我现在接入了通义千问 (Qwen) 大模型，让我们开始聊天吧！',
        timestamp: new Date()
      }]);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      let responseContent = '';
      let relatedEntryId: string | undefined;
      let recommendations: any[] | undefined;

      // Check for specific intents first (hybrid approach)
      const lowerQuery = userMessage.content.toLowerCase();
      
      // Intent: Music
      if (lowerQuery.includes('music') || lowerQuery.includes('song') || lowerQuery.includes('playlist')) {
         if (entries.length > 0) {
          const lastEntry = entries[0];
          const playlist = getMoodPlaylist(lastEntry.mood);
          responseContent = `Based on your latest memory ("${lastEntry.mood}"), here is a playlist for you:`;
          recommendations = playlist;
          relatedEntryId = lastEntry.id;
        } else {
          responseContent = "Record a memory first, and I'll curate a playlist for you!";
        }
      } 
      // Intent: Real AI Chat
      else if (aiService.isConfigured()) {
        responseContent = await aiService.generateResponse(userMessage.content, entries);
      } 
      // Fallback: Simulated Rule-based
      else {
        const simResponse = generateSimulatedResponse(userMessage.content, entries);
        responseContent = simResponse.content;
        relatedEntryId = simResponse.relatedEntryId;
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: responseContent,
        timestamp: new Date(),
        relatedEntryId,
        recommendations
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        content: "Sorry, I encountered an error processing your request.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Keep the simulated logic as fallback
  const generateSimulatedResponse = (query: string, data: DiaryEntry[]): { content: string, relatedEntryId?: string } => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('last year') || lowerQuery.includes('year ago')) {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const start = new Date(oneYearAgo);
      start.setMonth(start.getMonth() - 1);
      const end = new Date(oneYearAgo);
      end.setMonth(end.getMonth() + 1);

      const match = data.find(e => {
        const d = new Date(e.date);
        return d >= start && d <= end;
      });

      if (match) {
        return {
          content: `(Simulated) I found a memory from around this time last year (${format(new Date(match.date), 'MMM d, yyyy')}). You were feeling "${match.mood}" and wrote: "${match.caption}".`,
          relatedEntryId: match.id
        };
      }
      return { content: "(Simulated) I couldn't find any entries from exactly a year ago." };
    }
    
    if (lowerQuery.includes('happy') || lowerQuery.includes('joy')) {
      const happyEntries = data.filter(e => e.mood.toLowerCase() === 'happy');
      if (happyEntries.length > 0) {
        const randomEntry = happyEntries[Math.floor(Math.random() * happyEntries.length)];
        return {
          content: `(Simulated) You've had ${happyEntries.length} happy moments! Like on ${format(new Date(randomEntry.date), 'MMM d')}: "${randomEntry.caption}".`,
          relatedEntryId: randomEntry.id
        };
      }
    }

    return { content: "(Simulated Mode) I'm running in basic mode. To have a real conversation with your memories, please click the settings icon and add a Google Gemini API Key." };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl h-[600px] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white">AI 伴侣</h3>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${aiService.isConfigured() ? 'bg-green-500' : 'bg-orange-500'}`} />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {aiService.isConfigured() 
                    ? '由通义千问 (Qwen) 驱动' 
                    : '模拟模式'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {!aiService.hasGlobalKey() && (
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                title="AI 设置"
              >
                <Settings className="w-5 h-5 text-gray-500" />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
              <ArrowRight className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-5">
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Key className="w-4 h-4" />
                通义千问 API Key (阿里云)
              </label>
              <div className="flex gap-2">
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                />
                <button 
                  onClick={handleSaveKey}
                  className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                >
                  保存
                </button>
              </div>
              <p className="text-xs text-gray-500">
                从 <a href="https://dashscope.console.aliyun.com/apiKey" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">阿里云百炼控制台</a> 获取免费 Key。您的 Key 仅存储在本地浏览器中。
              </p>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50 dark:bg-gray-950/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'ai' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {msg.role === 'ai' ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              
              <div className={`flex flex-col max-w-[80%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
                
                {/* Related Entry Card */}
                {msg.relatedEntryId && (
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-purple-100 dark:border-purple-900/30 shadow-sm w-64">
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                      <Clock className="w-3 h-3" />
                      <span>回忆上下文</span>
                    </div>
                    {/* In a real app, we'd fetch the entry details here. For now simpler UI */}
                    <div className="h-20 bg-gray-100 dark:bg-gray-700 rounded-lg mb-2 overflow-hidden relative">
                         {/* Placeholder for entry image */}
                         <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                            <Heart className="w-8 h-8 opacity-20" />
                         </div>
                    </div>
                    <button className="text-xs text-purple-600 font-medium hover:underline">查看完整记录</button>
                  </div>
                )}

                {/* Music Recommendations */}
                {msg.recommendations && (
                  <div className="space-y-2 w-full">
                    {msg.recommendations.map((rec: any, idx: number) => (
                      <a 
                        key={idx}
                        href={rec.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group"
                      >
                        <div className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Music className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate">{rec.title}</p>
                          <p className="text-xs text-gray-500">{rec.platform}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                      </a>
                    ))}
                  </div>
                )}

                <span className="text-[10px] text-gray-400">
                  {format(msg.timestamp, 'h:mm a')}
                </span>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-4">
               <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="询问关于你的回忆..."
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-purple-500 dark:text-white"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-purple-200 dark:shadow-none"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}