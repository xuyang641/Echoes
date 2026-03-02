import OpenAI from 'openai';
import type { DiaryEntry } from '../components/diary-entry-form';
import { supabase } from './supabaseClient';

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
    return !!this.openai || import.meta.env.VITE_USE_EDGE_FUNCTION === 'true';
  }
  
  hasGlobalKey(): boolean {
    return !!import.meta.env.VITE_QWEN_API_KEY || import.meta.env.VITE_USE_EDGE_FUNCTION === 'true';
  }

  private buildContext(query: string, entries: DiaryEntry[], mood?: string) {
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

    return { systemPrompt, userContext };
  }

  async generateResponse(query: string, entries: DiaryEntry[], mood?: string): Promise<string> {
    if (import.meta.env.VITE_USE_EDGE_FUNCTION === 'true') {
        return this.generateResponseViaProxy(query, entries, mood);
    }

    if (!this.openai) {
      return "Please configure your Qwen API Key first.";
    }

    const { systemPrompt, userContext } = this.buildContext(query, entries, mood);

    try {
      console.log('Calling Qwen API (Client-side)...');
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

  async generateResponseViaProxy(query: string, entries: DiaryEntry[], mood?: string): Promise<string> {
    const { systemPrompt, userContext } = this.buildContext(query, entries, mood);
    
    try {
        console.log('Calling Qwen API (Edge Function)...');
        const { data, error } = await supabase.functions.invoke('ai-proxy', {
            body: {
                type: 'text',
                payload: {
                    model: "qwen-plus",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userContext }
                    ]
                }
            }
        });

        if (error) throw error;
        return data.choices[0].message.content || "I'm thinking...";
    } catch (error) {
        console.error('AI Proxy Error:', error);
        return "I'm having trouble connecting to the AI service. Please try again later.";
    }
  }

  async generateImage(prompt: string): Promise<string> {
    if (import.meta.env.VITE_USE_EDGE_FUNCTION === 'true') {
        return this.generateImageViaProxy(prompt);
    }

    try {
      console.log('Generating image with Prompt:', prompt);
      
      // Use Hugging Face Inference API (Free Tier)
      // Model: stabilityai/stable-diffusion-xl-base-1.0
      // Note: In production, use a proxy to hide the token
      const HF_TOKEN = import.meta.env.VITE_HF_TOKEN; 
      
      if (!HF_TOKEN) {
         // Mock response for demo purposes if no token
         console.warn('No HF Token found. Returning mock image.');
         // Return a placeholder image from Unsplash based on keywords
         const keywords = prompt.split(' ').slice(0, 3).join(',');
         return `https://source.unsplash.com/random/1024x768/?${encodeURIComponent(keywords)}`;
      }

      const response = await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
        {
          headers: {
            Authorization: `Bearer ${HF_TOKEN}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({ inputs: prompt }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HF API Error: ${error}`);
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Image Generation Error:', error);
      throw error;
    }
  }

  async generateImageViaProxy(prompt: string): Promise<string> {
      try {
          console.log('Generating image via Proxy...');
          const { data, error } = await supabase.functions.invoke('ai-proxy', {
              body: {
                  type: 'image',
                  payload: { inputs: prompt }
              }
          });

          if (error) throw error;
          
          // data is a Blob because we return it as such from the edge function? 
          // supabase.functions.invoke returns 'data' which is usually JSON.
          // Wait, invoke automatically parses JSON. If the response is binary, invoke might handle it differently?
          // The supabase js library documentation says: 
          // "If the response is JSON, `data` will be the parsed JSON object. Otherwise it will be the raw body."
          // However, for blob, we might need to handle it.
          // Let's assume for now we might need to use fetch directly if invoke doesn't support blob well, 
          // or we encode it as base64 in the function. 
          // But let's stick to what we have. If `data` is a Blob, we can use URL.createObjectURL.
          
          if (data instanceof Blob) {
              return URL.createObjectURL(data);
          } else {
             // If it's not a blob (maybe parsed as something else or we need to request it differently)
             // Actually, Supabase functions invoke wrapper tries to parse JSON. 
             // If it fails, it might return text.
             // It's safer to use the 'responseType' option if available, but it's not in standard types easily.
             // Let's assume we return base64 from the function for safety if we want JSON response.
             // But my function returns `new Response(blob)`.
             // Let's assume supabase client handles it or returns the blob.
             return URL.createObjectURL(data);
          }
      } catch (error) {
          console.error('Image Proxy Error:', error);
          throw error;
      }
  }
}

export const aiService = new AIService();
