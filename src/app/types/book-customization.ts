
export interface ImageCustomization {
  scale: number;      // 缩放比例，默认 1.0
  offsetX: number;    // X轴偏移百分比 (-50 到 50)
  offsetY: number;    // Y轴偏移百分比 (-50 到 50)
}

export interface TextConfig {
  content?: string;   // 用户修改后的文案
  align?: 'left' | 'center' | 'right' | 'justify'; // 对齐方式
  fontSizeScale?: number; // 字体大小缩放 (0.8 - 1.5)
}

export interface PageCustomization {
  images: Record<number, ImageCustomization>; // 索引 -> 图片配置
  texts?: Record<string, TextConfig>; // 字段名 -> 文本配置 (title, caption, content)
}

export type BookCustomization = Record<string, PageCustomization>; // pageId -> 页面配置
