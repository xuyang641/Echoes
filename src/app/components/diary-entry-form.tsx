import { useState, useEffect, useRef } from 'react';
import { Camera, Loader2, MapPin, Tag, X, Wand2, Users, Check, Lock, Sparkles, Calendar as CalendarIcon, Map as MapIcon, Clock } from 'lucide-react';
import { optimizeImage } from '../utils/image-utils';
import * as mobilenet from '@tensorflow-models/mobilenet';
import '@tensorflow/tfjs';
import { useGroup } from '../context/GroupContext';
import { MOODS } from '../utils/mood-constants';
import { useTranslation } from 'react-i18next';
import { extractPalette, ColorPalette } from '../utils/color-extractor';
import { format } from 'date-fns';
import { wgs84ToGcj02, gcj02ToWgs84 } from '../utils/coord-transform';
import { AmapLocationPicker } from './amap-location-picker';

interface DiaryEntryFormProps {
  onAddEntry?: (entry: DiaryEntry, targetGroups: string[]) => void;
  onSave?: (entry: DiaryEntry, targetGroups: string[]) => void;
  saving?: boolean;
  initialData?: DiaryEntry;
  isEdit?: boolean;
}

export interface DiaryEntry {
  id: string;
  date: string;
  photo: string;
  caption: string;
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

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  date: string;
}

export function DiaryEntryForm({ onAddEntry, onSave, saving = false, initialData, isEdit = false }: DiaryEntryFormProps) {
  const { groups } = useGroup();
  const { t } = useTranslation();
  const [photo, setPhoto] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [compressing, setCompressing] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; name?: string } | undefined>();
  const [gettingLocation, setGettingLocation] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [palette, setPalette] = useState<ColorPalette | undefined>();
  const [tagInput, setTagInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [model, setModel] = useState<mobilenet.MobileNet | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Date State
  const [date, setDate] = useState<string>(new Date().toISOString());
  
  // Map Picker State
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [pickerLocation, setPickerLocation] = useState<{ lat: number; lng: number } | null>(null);

  // New: Group Selection State
  const [selectedGroups, setSelectedGroups] = useState<string[]>(['private']); // Default to private

  useEffect(() => {
    async function loadModel() {
      try {
        const loadedModel = await mobilenet.load();
        setModel(loadedModel);
      } catch (error) {
        console.error('Failed to load MobileNet model:', error);
      }
    }
    loadModel();
  }, []);

  useEffect(() => {
    if (initialData) {
      setPhoto(initialData.photo);
      setPreviewUrl(initialData.photo);
      setCaption(initialData.caption);
      setSelectedMood(initialData.mood);
      setLocation(initialData.location);
      setTags(initialData.tags || []);
      setAiTags(initialData.aiTags || []);
      setPalette(initialData.palette);
      setDate(initialData.date);
      // If editing, we might need to load groupIds. For now default to private if not present
      setSelectedGroups(initialData.groupIds && initialData.groupIds.length > 0 ? initialData.groupIds : ['private']);
    }
  }, [initialData]);

  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroups(prev => {
      // If clicking Private
      if (groupId === 'private') {
        // If Private is already selected, don't allow unselecting if it's the only one (optional logic)
        // Let's allow toggling freely, but maybe ensure at least one is selected?
        if (prev.includes('private')) {
            return prev.filter(id => id !== 'private');
        } else {
            return [...prev, 'private'];
        }
      }
      
      // If clicking a Group
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setCompressing(true);
        
        // Use the new optimization utility
        const compressedFile = await optimizeImage(file, {
          maxSizeMB: 0.8, // Slightly higher quality for main image
          maxWidthOrHeight: 1920,
          fileType: 'image/webp'
        });
        
        const reader = new FileReader();
        reader.onloadend = async () => {
          const result = reader.result as string;
          setPhoto(result);
          setPreviewUrl(result);
          
          // Extract palette
          try {
            const extractedPalette = await extractPalette(result);
            setPalette(extractedPalette);
          } catch (err) {
            console.error('Palette extraction failed:', err);
          }

          setCompressing(false);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Error compressing image:', error);
        setCompressing(false);
        // Fallback to original file if compression fails?
        // For now, just stop spinner.
      }
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('您的浏览器不支持地理定位');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: '当前位置', 
        });
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('无法获取您的位置');
        setGettingLocation(false);
      }
    );
  };

  const handleOpenMapPicker = () => {
    if (location) {
        // location is WGS-84. Convert to GCJ-02 for display on Gaode Map
        const [lat, lng] = wgs84ToGcj02(location.lat, location.lng);
        setPickerLocation({ lat, lng });
    } else {
        // Default to somewhere or try to get current location without setting form state
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const [lat, lng] = wgs84ToGcj02(position.coords.latitude, position.coords.longitude);
                setPickerLocation({ lat, lng });
            },
            () => {
                setPickerLocation({ lat: 39.9042, lng: 116.4074 }); // Default to Beijing (GCJ-02 approx)
            }
        );
    }
    setIsMapPickerOpen(true);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const removeAiTag = (tagToRemove: string) => {
    setAiTags(aiTags.filter(tag => tag !== tagToRemove));
  };

  const handleAIAnalyze = async () => {
    if (!caption && !photo) {
      alert('请先添加照片或写点什么以便分析！');
      return;
    }

    if (!model && photo) {
      alert('AI模型仍在加载中，请稍候...');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const newAiTags = [...aiTags];
      
      if (caption) {
        const words = caption.toLowerCase().split(' ');
        const keywords: Record<string, string[]> = {
          'beach': ['beach', 'sea', 'ocean', 'sand', '海滩', '海', '沙滩'],
          'food': ['food', 'eat', 'dinner', 'lunch', 'breakfast', 'yummy', 'delicious', '美食', '吃', '晚餐', '午餐', '早餐', '好吃'],
          'friends': ['friend', 'friends', 'party', 'social', '朋友', '聚会'],
          'pet': ['cat', 'dog', 'pet', 'animal', 'kitten', 'puppy', '猫', '狗', '宠物'],
          'travel': ['travel', 'trip', 'journey', 'vacation', 'flight', '旅行', '旅游', '度假'],
          'work': ['work', 'office', 'meeting', 'job', '工作', '办公室', '会议'],
          'love': ['love', 'date', 'romantic', '爱', '约会', '浪漫'],
          'nature': ['nature', 'tree', 'flower', 'mountain', 'park', '自然', '树', '花', '山', '公园'],
        };

        Object.entries(keywords).forEach(([tag, matchWords]) => {
          if (matchWords.some(word => words.includes(word))) {
            if (!newAiTags.includes(tag)) newAiTags.push(tag);
          }
        });
      }

      if (photo && model && imgRef.current) {
        const predictions = await model.classify(imgRef.current);
        console.log('AI Predictions:', predictions);
        
        predictions.forEach(prediction => {
          const names = prediction.className.split(',')[0].split(' ');
          const mainTag = names[names.length - 1].toLowerCase();
          
          if (!newAiTags.includes(mainTag)) {
            newAiTags.push(mainTag);
          }
        });
      }

      setAiTags(newAiTags);
    } catch (error) {
      console.error('Error during AI analysis:', error);
      alert('AI分析过程中出错了。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photo || !caption || !selectedMood) {
      alert('请填写所有必填项（照片、描述、心情）');
      return;
    }

    if (selectedGroups.length === 0) {
      alert('请至少选择一个发布目标（私密或群组）');
      return;
    }

    let finalTags = [...tags];
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      finalTags.push(tagInput.trim());
    }
    
    const entry: DiaryEntry = {
      id: initialData?.id || Date.now().toString(),
      date: date, // Use the state date
      photo,
      caption,
      mood: selectedMood,
      location,
      tags: finalTags,
      aiTags: aiTags,
      palette,
      groupIds: selectedGroups
    };

    if (onSave) {
      onSave(entry, selectedGroups);
    } else if (onAddEntry) {
      onAddEntry(entry, selectedGroups);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // When date input changes (YYYY-MM-DD), we need to preserve the current time if possible,
    // or just set to current time of that day.
    const newDateStr = e.target.value;
    if (!newDateStr) return;

    const current = new Date();
    const newDate = new Date(newDateStr);
    
    // Set time to current time
    newDate.setHours(current.getHours());
    newDate.setMinutes(current.getMinutes());
    newDate.setSeconds(current.getSeconds());
    
    setDate(newDate.toISOString());
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
      {/* Date & Time Selection */}
      <div className="text-center">
        <h2 className="text-2xl mb-2">{isEdit ? t('form.titleEdit') : t('form.titleAdd')}</h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-gray-500 text-sm">
            <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                <input 
                    type="date" 
                    value={format(new Date(date), 'yyyy-MM-dd')}
                    onChange={handleDateChange}
                    className="bg-transparent border-b border-gray-200 focus:border-blue-500 outline-none text-center w-32"
                />
            </div>
            <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <input 
                    type="time" 
                    value={format(new Date(date), 'HH:mm')}
                    onChange={(e) => {
                        const timeStr = e.target.value;
                        if (!timeStr) return;
                        const [hours, minutes] = timeStr.split(':').map(Number);
                        const newDate = new Date(date);
                        newDate.setHours(hours);
                        newDate.setMinutes(minutes);
                        setDate(newDate.toISOString());
                    }}
                    className="bg-transparent border-b border-gray-200 focus:border-blue-500 outline-none text-center w-20"
                />
            </div>
        </div>
      </div>

      {/* Group Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" />
          {t('form.shareLabel')}
        </label>
        <div className="flex flex-wrap gap-2">
            {/* Private Option */}
            <button
                type="button"
                onClick={() => toggleGroupSelection('private')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all ${
                    selectedGroups.includes('private')
                        ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-sm'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
            >
                <Lock className="w-3 h-3" />
                {t('form.private')}
                {selectedGroups.includes('private') && <Check className="w-3 h-3 ml-1" />}
            </button>

            {/* Group Options */}
            {groups.map(group => (
                <button
                    key={group.id}
                    type="button"
                    onClick={() => toggleGroupSelection(group.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all ${
                        selectedGroups.includes(group.id)
                            ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />
                    {group.name}
                    {selectedGroups.includes(group.id) && <Check className="w-3 h-3 ml-1" />}
                </button>
            ))}
        </div>
      </div>

      {/* Photo Upload */}
      <div>
        <label className="block text-sm mb-2 text-gray-700">照片</label>
        {compressing ? (
          <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
            <span className="text-sm text-gray-500">正在压缩图片...</span>
          </div>
        ) : previewUrl ? (
          <div className="relative">
            <img 
              ref={imgRef}
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-64 object-cover rounded-xl"
              crossOrigin="anonymous" 
            />
            <button
              type="button"
              onClick={() => {
                setPhoto('');
                setPreviewUrl('');
                const fileInput = document.getElementById('photo-input') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
              }}
              className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
            <Camera className="w-12 h-12 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">{t('form.upload')}</span>
            <input
              id="photo-input"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Mood Selection */}
      <div>
        <label className="block text-sm mb-3 text-gray-700">{t('form.moodLabel')}</label>
        <div className="grid grid-cols-4 gap-2">
          {MOODS.map((mood) => {
            const Icon = mood.icon;
            return (
              <button
                type="button"
                key={mood.name}
                onClick={() => setSelectedMood(mood.name)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                  selectedMood === mood.name
                    ? `${mood.color} ring-2 ring-offset-2 ring-current scale-105`
                    : `${mood.color} opacity-60`
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs">{t(`moods.${mood.name.toLowerCase()}`, mood.name)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm mb-2 text-gray-700 flex justify-between items-center">
          <span>标签</span>
          <button
            type="button"
            onClick={handleAIAnalyze}
            disabled={isAnalyzing}
            className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700 disabled:opacity-50 transition-colors"
          >
            {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
            {isAnalyzing ? t('common.loading') : '智能标签'}
          </button>
        </label>
        
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
              <Tag className="w-3 h-3" />
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-800">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        {aiTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {aiTags.map(tag => (
              <span key={`ai-${tag}`} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-sm border border-purple-100">
                <Sparkles className="w-3 h-3" />
                {tag}
                <button type="button" onClick={() => removeAiTag(tag)} className="hover:text-purple-800">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder="输入标签并回车"
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm mb-2 text-gray-700">{t('form.locationPlaceholder')}</label>
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-2">
            <button
                type="button"
                onClick={handleGetLocation}
                disabled={gettingLocation}
                className="flex items-center justify-center gap-2 px-3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors disabled:opacity-50 min-w-[3rem]"
                title="使用当前位置"
            >
                {gettingLocation ? (
                <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                <MapPin className="w-4 h-4" />
                )}
            </button>
            
            <button
                type="button"
                onClick={handleOpenMapPicker}
                className="flex items-center justify-center gap-2 px-3 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors min-w-[3rem]"
                title="在地图上选择"
            >
                <MapIcon className="w-4 h-4" />
            </button>
          </div>
          
          <input
            type="text"
            value={location?.name || ''}
            onChange={(e) => setLocation(prev => prev ? { ...prev, name: e.target.value } : undefined)}
            placeholder={location ? t('form.locationPlaceholder') : "点击左侧按钮添加位置"}
            disabled={!location}
            className="flex-1 min-w-[150px] px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>
        {location && (
          <p className="mt-1 text-xs text-gray-400">
            纬度: {location.lat.toFixed(4)}, 经度: {location.lng.toFixed(4)}
          </p>
        )}
      </div>

      {/* Caption */}
      <div>
        <label className="block text-sm mb-2 text-gray-700">{t('form.captionPlaceholder')}</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder={t('form.captionPlaceholder')}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={saving || compressing}
        className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {t('form.saving')}
          </>
        ) : (
          isEdit ? t('form.save') : t('form.save')
        )}
      </button>
    </form>

    {/* Map Picker Modal */}
    {isMapPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl h-[500px] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <AmapLocationPicker
                    initialLocation={pickerLocation ? { lat: pickerLocation.lat, lng: pickerLocation.lng } : undefined}
                    onConfirm={(loc: { lat: number, lng: number, name: string }) => {
                        // loc is GCJ-02 from Amap
                        const [lat, lng] = gcj02ToWgs84(loc.lat, loc.lng);
                        setLocation({
                            lat,
                            lng,
                            name: loc.name
                        });
                        setIsMapPickerOpen(false);
                    }}
                    onCancel={() => setIsMapPickerOpen(false)}
                />
            </div>
        </div>
    )}
    </>
  );
}
