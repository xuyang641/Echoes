import type { ColorPalette } from '../utils/color-extractor';

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  date: string;
}

export interface DiaryEntry {
  id: string;
  date: string;
  photo: string; // Keep for backward compatibility/primary photo
  media?: MediaItem[]; // Support multiple images and videos
  caption: string;
  content?: string; // Extended text content for long-form entries
  mood: string;
  location?: {
    lat: number;
    lng: number;
    name?: string;
  };
  tags?: string[];
  aiTags?: string[];
  palette?: ColorPalette;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  groupIds?: string[]; // New: Track which groups this entry belongs to
  likes?: string[]; // Array of userIds who liked this entry
  comments?: Comment[];
}
