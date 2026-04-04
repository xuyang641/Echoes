import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { useBucketListStore } from '../store/bucket-list-store';
import { Plane, Coffee, Book, Camera, Dumbbell, Star, Heart, Music, Palmtree, Trophy } from 'lucide-react';
import { cn } from './ui/utils';

interface AddWishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PREDEFINED_ICONS = [
  { name: 'Plane', icon: Plane },
  { name: 'Coffee', icon: Coffee },
  { name: 'Book', icon: Book },
  { name: 'Camera', icon: Camera },
  { name: 'Dumbbell', icon: Dumbbell },
  { name: 'Star', icon: Star },
  { name: 'Heart', icon: Heart },
  { name: 'Music', icon: Music },
  { name: 'Palmtree', icon: Palmtree },
  { name: 'Trophy', icon: Trophy },
];

const PREDEFINED_COLORS = [
  'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  'text-purple-500 bg-purple-100 dark:bg-purple-900/30',
  'text-green-500 bg-green-100 dark:bg-green-900/30',
  'text-amber-500 bg-amber-100 dark:bg-amber-900/30',
  'text-pink-500 bg-pink-100 dark:bg-pink-900/30',
  'text-rose-500 bg-rose-100 dark:bg-rose-900/30',
  'text-teal-500 bg-teal-100 dark:bg-teal-900/30',
  'text-cyan-500 bg-cyan-100 dark:bg-cyan-900/30',
];

export function AddWishDialog({ open, onOpenChange }: AddWishDialogProps) {
  const { t } = useTranslation();
  const addBucketListItem = useBucketListStore(state => state.addBucketListItem);

  const [title, setTitle] = useState('');
  const [target, setTarget] = useState<number>(1);
  const [tagsInput, setTagsInput] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Star');
  const [selectedColor, setSelectedColor] = useState(PREDEFINED_COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    addBucketListItem({
      title: title.trim(),
      target: target || 0,
      tags,
      iconName: selectedIcon,
      color: selectedColor,
    });

    // Reset form
    setTitle('');
    setTarget(1);
    setTagsInput('');
    setSelectedIcon('Star');
    setSelectedColor(PREDEFINED_COLORS[0]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('bucketList.addWish', '添加愿望')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('bucketList.wishTitle', '愿望标题')}</Label>
            <Input 
              id="title" 
              placeholder={t('bucketList.wishTitlePlaceholder', '例如：去冰岛看极光')}
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target">{t('bucketList.targetCount', '目标次数')}</Label>
            <Input 
              id="target" 
              type="number"
              min={0}
              placeholder={t('bucketList.targetPlaceholder', '留空或为0则放入"随便想想"')}
              value={target === 0 ? '' : target}
              onChange={e => setTarget(parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              {t('bucketList.targetDesc', '可以是一次性（1次），也可以是长期习惯（如50次）。留空则放入"随便想想"清单')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">{t('bucketList.triggerTags', '触发关键词 (用逗号分隔)')}</Label>
            <Input 
              id="tags" 
              placeholder={t('bucketList.triggerTagsPlaceholder', '例如：冰岛, 极光, 旅行')}
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {t('bucketList.triggerTagsDesc', '日记中包含这些词时，进度将自动增加')}
            </p>
          </div>

          <div className="space-y-2">
            <Label>{t('bucketList.selectIcon', '选择图标')}</Label>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_ICONS.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedIcon(name)}
                  className={cn(
                    "p-2 rounded-xl border transition-all",
                    selectedIcon === name 
                      ? "border-primary bg-primary/10 text-primary" 
                      : "border-transparent hover:bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('bucketList.selectColor', '选择专属色彩')}</Label>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "w-8 h-8 rounded-full ring-2 ring-offset-2 transition-all",
                    color.split(' ')[1], // use the bg color
                    selectedColor === color 
                      ? "ring-primary" 
                      : "ring-transparent hover:scale-110"
                  )}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel', '取消')}
            </Button>
            <Button type="submit">{t('common.save', '保存')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
