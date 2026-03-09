import { DiaryEntry } from '../components/diary-entry-form';

export type LayoutStyle = 'classic' | 'grid' | 'magazine' | 'minimal';

export interface BookPage {
  id?: string;
  type: 'cover' | 'intro' | 'entry' | 'collage' | 'outro' | 'grid' | 'photo-full' | 'photo-left' | 'photo-right' | 'grid-2x2' | 'back-cover';
  title?: string;
  subtitle?: string;
  text?: string;
  content?: string; // For longer text content
  entries?: DiaryEntry[]; // For grids/collages
  // Legacy support for single entry pages
  date?: string;
  dates?: string[]; // For grid pages
  mood?: string;
  location?: string;
  photo?: string;
  photos?: string[]; // For pages with multiple photos
  caption?: string;
  captions?: string[]; // For grid pages
  coverPhoto?: string;
  layout?: string; // 'grid-2' | 'grid-3' | 'grid-4'
  year?: string;
}

export const generateBookLayout = (
  entries: DiaryEntry[],
  year: string,
  style: LayoutStyle,
  t: (key: string, defaultValue?: string) => string = (key, defaultValue) => defaultValue || key
): BookPage[] => {
  if (!entries || entries.length === 0) return [];

  const pages: BookPage[] = [];

  // Cover Page
  pages.push({
    id: 'cover',
    type: 'cover',
    title: year,
    subtitle: t('print.myPhotoDiary', '我的影像日记'),
    coverPhoto: entries.find(e => e.photo)?.photo
  });

  // Intro Page
  pages.push({
    id: 'intro',
    type: 'intro',
    title: t('print.preface', '序言'),
    content: t('print.introText', '这一年，每一个平凡的日子都值得被记录。'),
    year: year // Pass year to intro page to fix missing {{year}}
  });

  // Sort entries by date
  const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (style === 'classic') {
    // Classic: 1 photo per page with ample text space, or 2 photos if short text
    // For now, let's do 1 entry per page to ensure text visibility
    sortedEntries.forEach((entry) => {
        pages.push({
            id: entry.id, // Use entry ID for stable reference
            type: 'photo-full',
            photos: entry.photo ? [entry.photo] : [],
            date: new Date(entry.date).toLocaleDateString(),
            caption: entry.caption,
            content: entry.content // Pass content to page
        });
    });
  } else if (style === 'magazine') {
      // Magazine: Mix of full photo pages and text-heavy pages
      // Simple implementation: Alternating left/right layout with text
      sortedEntries.forEach((entry, index) => {
          pages.push({
              id: entry.id, // Use entry ID for stable reference
              type: index % 2 === 0 ? 'photo-left' : 'photo-right', // We can add these types to rendering logic later, mapping to photo-full for now with CSS tweaks
              photos: entry.photo ? [entry.photo] : [],
              date: new Date(entry.date).toLocaleDateString(),
              caption: entry.caption,
              content: entry.content
          });
      });
  } else if (style === 'grid') {
    // Grid: 4 photos per page, minimal text
    for (let i = 0; i < sortedEntries.length; i += 4) {
      const chunk = sortedEntries.slice(i, i + 4);
      pages.push({
        id: `grid-${i}`, // Stable ID for grid pages
        type: 'grid-2x2',
        photos: chunk.map(e => e.photo).filter(Boolean) as string[],
        captions: chunk.map(e => e.caption || ''),
        dates: chunk.map(e => new Date(e.date).toLocaleDateString())
      });
    }
  } else {
     // Minimal (Default fallback)
     sortedEntries.forEach((entry) => {
        pages.push({
            id: entry.id,
            type: 'photo-full',
            photos: entry.photo ? [entry.photo] : [],
            date: new Date(entry.date).toLocaleDateString(),
            caption: entry.caption
        });
    });
  }

  // Back Cover
  pages.push({
    id: 'back-cover',
    type: 'back-cover',
    content: 'Echoes - 记录生活的回响'
  });

  return pages;
};
