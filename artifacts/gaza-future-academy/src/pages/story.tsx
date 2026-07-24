import { Link } from 'wouter';
import { useRoute } from 'wouter';
import { useLanguage } from '@/components/language-provider';
import { ArrowLeft, ArrowRight, BookOpen, User, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetStory, getGetStoryQueryKey } from '@workspace/api-client-react';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════
// خريطة ترجمة التصنيفات من الإنجليزية إلى العربية
// ═══════════════════════════════════════════════════════════════
const CATEGORY_TRANSLATIONS: Record<string, { ar: string; en: string; emoji: string }> = {
  nature:      { ar: 'طبيعة',     en: 'Nature',      emoji: '🌿' },
  science:     { ar: 'علوم',      en: 'Science',     emoji: '🔬' },
  history:     { ar: 'تاريخ',     en: 'History',     emoji: '📜' },
  adventure:   { ar: 'مغامرة',    en: 'Adventure',   emoji: '⚔️' },
  fantasy:     { ar: 'خيال',      en: 'Fantasy',      emoji: '🦄' },
  culture:     { ar: 'ثقافة',     en: 'Culture',      emoji: '🎨' },
  technology:  { ar: 'تكنولوجيا', en: 'Technology',  emoji: '💻' },
  space:       { ar: 'فضاء',      en: 'Space',       emoji: '🚀' },
  animals:     { ar: 'حيوانات',    en: 'Animals',     emoji: '🐾' },
  sports:      { ar: 'رياضة',     en: 'Sports',      emoji: '⚽' },
  stories:     { ar: 'حكايات',    en: 'Stories',     emoji: '📖' },
  education:   { ar: 'تعليم',     en: 'Education',   emoji: '📚' },
  coding:      { ar: 'برمجة',     en: 'Coding',      emoji: '🧩' },
  math:        { ar: 'رياضيات',   en: 'Math',        emoji: '🔢' },
  music:       { ar: 'موسيقى',    en: 'Music',       emoji: '🎵' },
  health:      { ar: 'صحة',       en: 'Health',      emoji: '❤️' },
  environment: { ar: 'بيئة',      en: 'Environment', emoji: '🌍' },
  language:    { ar: 'لغات',      en: 'Language',    emoji: '🗣️' },
  art:         { ar: 'فنون',      en: 'Art',         emoji: '🎨' },
};

function translateCategory(category: string, language: string): string {
  const translated = CATEGORY_TRANSLATIONS[category?.toLowerCase()];
  if (!translated) return category;
  return language === 'ar' ? translated.ar : translated.en;
}

function getCategoryEmoji(category: string): string {
  return CATEGORY_TRANSLATIONS[category?.toLowerCase()]?.emoji ?? '📁';
}

function translateAgeGroup(ageGroup: string, language: string): string {
  if (!ageGroup) return '';
  if (language === 'ar') {
    return `${ageGroup} سنة`;
  }
  return `${ageGroup} years`;
}

export function StoryReader() {
  const [, params] = useRoute('/library/stories/:id');
  const { t, isRtl, language } = useLanguage();
  const id = Number(params?.id);

  const { data: story, isLoading } = useGetStory(id, {
    query: {
      enabled: !!id,
      queryKey: getGetStoryQueryKey(id)
    }
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-6 p-4">
        <div className="h-12 w-32 bg-muted rounded-full animate-pulse" />
        <div className="h-64 bg-card rounded-[3rem] animate-pulse" />
        <div className="h-8 w-3/4 bg-muted rounded-full animate-pulse" />
        <div className="space-y-4 mt-8">
          <div className="h-6 bg-muted rounded-full animate-pulse" />
          <div className="h-6 bg-muted rounded-full animate-pulse" />
          <div className="h-6 bg-muted rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="text-center py-20">
        <h2 className="text-3xl font-black text-foreground mb-4">{t('القصة غير موجودة', 'Story not found')}</h2>
        <Link href="/library">
          <Button className="rounded-full font-bold">{t('العودة للمكتبة', 'Back to Library')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("max-w-3xl mx-auto flex flex-col gap-8 pb-20", isRtl && "text-right")}>
      <Link href="/library" className="w-fit">
        <Button variant="ghost" className="rounded-full font-bold">
          {isRtl ? <ArrowRight className="w-5 h-5 ml-2" /> : <ArrowLeft className="w-5 h-5 mr-2" />}
          {t('العودة للمكتبة', 'Back to Library')}
        </Button>
      </Link>

      <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border-2 border-border/50 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent" />

        <div className="text-8xl md:text-9xl mb-8 drop-shadow-md relative z-10 hover:scale-110 transition-transform duration-500 cursor-default">
          {story.coverEmoji}
        </div>

        <div className={cn("flex flex-wrap items-center justify-center gap-3 mb-6 relative z-10", isRtl && "flex-row-reverse")}>
          <span className="px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-black border border-accent/20 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            {getCategoryEmoji(story.category)} {translateCategory(story.category, language)}
          </span>
          <span className="px-4 py-2 bg-secondary/10 text-secondary-foreground rounded-full text-sm font-black border border-secondary/20 flex items-center gap-2">
            <User className="w-4 h-4" />
            {translateAgeGroup(story.ageGroup, language)}
          </span>
          <span className="px-4 py-2 bg-muted rounded-full text-sm font-black text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {story.readingTimeMinutes} {t('دقيقة', 'min')}
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-foreground leading-[1.3] relative z-10">
          {isRtl ? story.titleAr : story.title}
        </h1>
      </div>

      <div className="bg-card rounded-[3rem] p-8 md:p-12 shadow-sm border-2 border-border/50">
        <div 
          className={cn(
            "prose prose-lg md:prose-xl max-w-none font-medium leading-loose text-foreground",
            isRtl ? "text-right" : "text-left"
          )}
          style={{
             fontFamily: isRtl ? 'var(--app-font-arabic)' : 'var(--app-font-sans)',
          }}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {isRtl ? story.contentAr : story.content}
        </div>
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-green-500" />
          <span className="text-lg font-bold text-muted-foreground">{t('لقد أنهيت القراءة!', 'You finished reading!')}</span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/library">
            <Button className="rounded-full font-bold px-8 h-14 text-lg shadow-md hover:scale-105 transition-transform bg-primary hover:bg-primary/90 text-primary-foreground">
              {isRtl ? <ArrowRight className="w-5 h-5 ml-2" /> : <ArrowLeft className="w-5 h-5 mr-2" />}
              {t('العودة للمكتبة', 'Back to Library')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
