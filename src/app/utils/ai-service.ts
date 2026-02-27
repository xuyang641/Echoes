import OpenAI from 'openai';
import type { DiaryEntry } from '../components/diary-entry-form';

export class AIService {
  private openai: OpenAI | null = null;

  constructor(apiKey?: string) {
    // Qwen API (Aliyun Bailian) Endpoint
    // Base URL: https://dashscope.aliyuncs.com/compatible-mode/v1
    const key = apiKey || import.meta.env.VITE_QWEN_API_KEY;
    if (key) {
      this.init(key);
    }
  }

  init(apiKey: string) {
    try {
      this.openai = new OpenAI({
        apiKey: apiKey,
        baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        dangerouslyAllowBrowser: true // Allowed for this client-side demo, ideally use backend proxy
      });
    } catch (error) {
      console.error('Failed to initialize AI Service:', error);
      this.openai = null;
    }
  }

  isConfigured(): boolean {
    return !!this.openai;
  }
  
  hasGlobalKey(): boolean {
    return !!import.meta.env.VITE_QWEN_API_KEY;
  }

  async generateResponse(query: string, entries: DiaryEntry[], mood?: string): Promise<string> {
    if (!this.openai) {
      return "Please configure your Qwen API Key first.";
    }

    // Prepare context
    const recentEntries = entries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 15) // Qwen handles long context well, but let's keep it focused
      .map(e => ({
        date: new Date(e.date).toLocaleDateString(),
        mood: e.mood,
        content: e.caption,
        tags: e.tags?.join(', ')
      }));

    // System Prompt - Identity & Style
    const systemPrompt = `
      你不仅是用户的回忆助手 "Photo Diary AI"，更是一位深刻、温暖且富有洞察力的生活伴侣。
      你的目标不仅是回答问题，更是通过分析用户的日记，帮助他们发现生活中的美好模式，提供情感支持，并在适当时机给出建议。

      核心人设 (CORE PERSONALITY):
      - 情感共鸣 (Empathetic): 像一位挚友一样交流。如果用户悲伤，给予温暖的安慰；如果用户快乐，一起庆祝。
      - 深度洞察 (Insightful): 不要只看表面。尝试连接过去和现在的事件，发现用户情绪变化的规律（例如："我注意到你每次去海边都很开心..."）。
      - 积极主动 (Proactive): 在回答中适当地引导用户进行深层思考，或回忆更多相关细节。
      - 自然生动 (Natural): 拒绝机械的回答。使用流畅、温暖、现代的中文口语。

      上下文处理 (CONTEXT AWARENESS):
      - 你拥有用户最近的日记记录（已提供）。
      - 回答时，请引用具体的日期、地点或事件细节，让对话充满专属感（例如："这让我想到你上周五在公园的那次..."）。
      - 如果用户问及你不知道的事情，诚实地表示你没有那段记忆，并邀请用户分享。

      语言要求:
      - 默认使用中文回答，除非用户主动使用其他语言。
      - 语气要温柔、包容，避免说教。
    `;

    // User Context Construction
    const formattedEntries = recentEntries.map(e => 
      `- ${e.date} [心情: ${e.mood}] ${e.tags ? `(标签: ${e.tags})` : ''}: ${e.content}`
    ).join('\n');

    const userContext = `
      [用户的近期回忆]
      ${formattedEntries}

      [当前状态]
      用户当前心情: ${mood || '未知'}
      用户的问题: "${query}"
    `;

    try {
      console.log('Calling Qwen API...');
      const completion = await this.openai.chat.completions.create({
        model: "qwen-plus", // Upgraded to Plus for better reasoning
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContext }
        ],
      });

      return completion.choices[0].message.content || "I'm thinking...";

    } catch (error) {
      console.error('AI Service Error:', error);
      return "I'm having trouble connecting to Qwen right now. Please check your API Key or network.";
    }
  }
}

export const aiService = new AIService();
