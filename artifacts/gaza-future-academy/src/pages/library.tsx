import { useState, useMemo } from 'react';
import { useLanguage } from '@/components/language-provider';
import { useListStories, useListPodcasts } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Headphones, PlayCircle, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════
// خريطة ترجمة التصنيفات من الإنجليزية إلى العربية
// ═══════════════════════════════════════════════════════════════
const CATEGORY_TRANSLATIONS: Record<string, { ar: string; en: string; emoji: string }> = {
  nature:      { ar: 'طبيعة',     en: 'Nature',      emoji: '🌿' },
  science:     { ar: 'علوم',      en: 'Science',     emoji: '🔬' },
  history:     { ar: 'تاريخ',     en: 'History',     emoji: '📜' },
  adventure:   { ar: 'مغامرة',    en: 'Adventure',   emoji: '⚔️' },
  fantasy:     { ar: 'خيال',      en: 'Fantasy',     emoji: '🦄' },
  culture:     { ar: 'ثقافة',     en: 'Culture',     emoji: '🎨' },
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
};

// دالة ترجمة التصنيف
function translateCategory(category: string, language: string): string {
  const translated = CATEGORY_TRANSLATIONS[category?.toLowerCase()];
  if (!translated) return category; // إذا لم نجد ترجمة، نرجع الأصل
  return language === 'ar' ? translated.ar : translated.en;
}

// أيقونة التصنيف
function getCategoryEmoji(category: string): string {
  return CATEGORY_TRANSLATIONS[category?.toLowerCase()]?.emoji ?? '📁';
}

// ترجمة الفئة العمرية
function translateAgeGroup(ageGroup: string, language: string): string {
  if (!ageGroup) return '';
  if (language === 'ar') {
    return `${ageGroup} سنة`;
  }
  return `${ageGroup} years`;
}

export function Library() {
  const { t, isRtl, language } = useLanguage();
  const { data: stories, isLoading: loadingStories } = useListStories();
  const { data: podcasts, isLoading: loadingPodcasts } = useListPodcasts();

  // ═══════════════════════════════════════════════════════════
  // حالة الفلاتر
  // ═══════════════════════════════════════════════════════════
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeAgeGroup, setActiveAgeGroup] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // استخراج التصنيفات الفريدة من البيانات
  const availableCategories = useMemo(() => {
    if (!stories) return [];
    const cats = new Set<string>();
    stories.forEach(s => { if (s.category) cats.add(s.category); });
    return Array.from(cats);
  }, [stories]);

  // استخراج الفئات العمرية الفريدة من البيانات
  const availableAgeGroups = useMemo(() => {
    if (!stories) return [];
    const ages = new Set<string>();
    stories.forEach(s => { if (s.ageGroup) ages.add(s.ageGroup); });
    return Array.from(ages);
  }, [stories]);

  // تصفية القصص حسب الفلاتر المفعّلة
  const filteredStories = useMemo(() => {
    if (!stories) return [];
    return stories.filter(story => {
      if (activeCategory && story.category !== activeCategory) return false;
      if (activeAgeGroup && story.ageGroup !== activeAgeGroup) return false;
      return true;
    });
  }, [stories, activeCategory, activeAgeGroup]);

  // تصفية البودكاست حسب الفلتر المفعّل
  const filteredPodcasts = useMemo(() => {
    if (!podcasts) return [];
    return podcasts.filter(podcast => {
      if (activeCategory && podcast.category !== activeCategory) return false;
      return true;
    });
  }, [podcasts, activeCategory]);

  // إعادة تعيين الفلاتر
  const clearFilters = () => {
    setActiveCategory(null);
    setActiveAgeGroup(null);
  };

  const hasActiveFilters = activeCategory !== null || activeAgeGroup !== null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black flex items-center gap-3">
          <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-white shadow-sm">
            <BookOpen className="w-7 h-7" />
          </div>
          {t('المكتبة السحرية', 'Magical Library')}
        </h1>
        <p className="text-xl text-muted-foreground font-bold">
          {t('اكتشف قصصاً ممتعة وبودكاست ملهم.', 'Discover fun stories and inspiring podcasts.')}
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* زر الفلاتر + مؤشر الفلاتر النشطة                   */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm transition-all border-2",
            showFilters || hasActiveFilters
              ? "bg-primary text-primary-foreground border-primary shadow-md"
              : "bg-card text-foreground border-border/50 hover:border-primary/30"
          )}
        >
          <Filter className="w-5 h-5" />
          {t('تصفية', 'Filter')}
          {hasActiveFilters && (
            <span className="w-6 h-6 bg-white text-primary rounded-full text-xs font-black flex items-center justify-center">
              {(activeCategory ? 1 : 0) + (activeAgeGroup ? 1 : 0)}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive font-bold transition-colors"
          >
            <X className="w-4 h-4" />
            {t('مسح الفلاتر', 'Clear filters')}
          </button>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* لوحة الفلاتر                                         */}
      {/* ═══════════════════════════════════════════════════════ */}
      {showFilters && (
        <div className={cn(
          "bg-card rounded-3xl border-2 border-border/50 p-6 space-y-6 transition-all",
          "animate-in slide-in-from-top-2 duration-200"
        )}>
          {/* تصنيفات القصص */}
          <div className="space-y-3">
            <h3 className="text-lg font-black text-foreground flex items-center gap-2">
              {t('التصنيف', 'Category')}
              <span className="text-sm font-bold text-muted-foreground">— {t('اختر تصنيفاً', 'Choose a category')}</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map(cat => {
                const isActive = activeCategory === cat;
                const translated = translateCategory(cat, language);
                const emoji = getCategoryEmoji(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(isActive ? null : cat)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-all border-2",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                        : "bg-background text-foreground border-border/50 hover:border-primary/30 hover:bg-primary/5"
                    )}
                  >
                    <span className="text-lg">{emoji}</span>
                    {translated}
                  </button>
                );
              })}
            </div>
          </div>

          {/* الفئة العمرية */}
          {availableAgeGroups.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                {t('الفئة العمرية', 'Age Group')}
                <span className="text-sm font-bold text-muted-foreground">— {t('اختر الفئة العمرية', 'Choose age group')}</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableAgeGroups.map(age => {
                  const isActive = activeAgeGroup === age;
                  return (
                    <button
                      key={age}
                      onClick={() => setActiveAgeGroup(isActive ? null : age)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-all border-2",
                        isActive
                          ? "bg-secondary text-secondary-foreground border-secondary shadow-md scale-105"
                          : "bg-background text-foreground border-border/50 hover:border-secondary/30 hover:bg-secondary/5"
                      )}
                    >
                      👶 {translateAgeGroup(age, language)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* بطاقات النتائج مع الفلاتر المفعّلة                   */}
      {/* ═══════════════════════════════════════════════════════ */}
      {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {activeCategory && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-bold">
              {getCategoryEmoji(activeCategory)} {translateCategory(activeCategory, language)}
              <button onClick={() => setActiveCategory(null)} className="hover:text-destructive transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {activeAgeGroup && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 text-secondary-foreground rounded-full text-sm font-bold">
              👶 {translateAgeGroup(activeAgeGroup, language)}
              <button onClick={() => setActiveAgeGroup(null)} className="hover:text-destructive transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
        </div>
      )}

      <Tabs defaultValue="stories" className="w-full">
        <TabsList className="bg-card border-2 border-border/50 h-16 p-2 rounded-full mb-8 inline-flex">
          <TabsTrigger 
            value="stories" 
            className="rounded-full px-8 font-black text-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            <BookOpen className={cn("w-5 h-5", isRtl ? "ml-2" : "mr-2")} />
            {t('القصص', 'Stories')}
            {hasActiveFilters && filteredStories && (
              <span className="mr-2 text-xs bg-primary-foreground/20 px-2 py-0.5 rounded-full">
                {filteredStories.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="podcasts" 
            className="rounded-full px-8 font-black text-lg data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground transition-all"
          >
            <Headphones className={cn("w-5 h-5", isRtl ? "ml-2" : "mr-2")} />
            {t('البودكاست', 'Podcasts')}
            {hasActiveFilters && filteredPodcasts && (
              <span className="mr-2 text-xs bg-secondary-foreground/20 px-2 py-0.5 rounded-full">
                {filteredPodcasts.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stories" className="mt-0 outline-none">
          {loadingStories ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-72 bg-card rounded-[2.5rem] border-2 border-border/50 animate-pulse" />)}
            </div>
          ) : filteredStories && filteredStories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredStories.map(story => (
                <Link key={story.id} href={`/library/stories/${story.id}`}>
                  <div className="group bg-white hover:bg-primary/5 rounded-[2.5rem] p-5 border-2 border-border hover:border-primary/30 transition-all cursor-pointer h-full flex flex-col gap-4 shadow-sm hover:shadow-md">
                    <div className="w-full aspect-square rounded-3xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-7xl shadow-inner group-hover:scale-105 transition-transform">
                      {story.coverEmoji}
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-bold flex items-center gap-1">
                          <span>{getCategoryEmoji(story.category)}</span>
                          {translateCategory(story.category, language)}
                        </span>
                        <span className="text-muted-foreground text-sm font-bold">
                          {translateAgeGroup(story.ageGroup, language)}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-foreground leading-tight">
                        {isRtl ? story.titleAr : story.title}
                      </h3>
                      <div className="mt-auto pt-2 text-sm text-muted-foreground font-bold flex items-center gap-1">
                        ⏱ {story.readingTimeMinutes} {t('دقيقة', 'min read')}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="text-6xl">📚</div>
              <h3 className="text-2xl font-black text-foreground">
                {t('لا توجد قصص', 'No stories found')}
              </h3>
              <p className="text-muted-foreground font-bold max-w-md">
                {t(
                  'لم نجد قصصاً تطابق الفلاتر المحددة. جرب تغيير التصنيف أو الفئة العمرية.',
                  'No stories match the selected filters. Try changing the category or age group.'
                )}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold text-sm hover:bg-primary/90 transition-colors shadow-md"
                >
                  {t('مسح الفلاتر', 'Clear filters')}
                </button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="podcasts" className="mt-0 outline-none">
          {loadingPodcasts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map(i => <div key={i} className="h-48 bg-card rounded-[2.5rem] border-2 border-border/50 animate-pulse" />)}
            </div>
          ) : filteredPodcasts && filteredPodcasts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPodcasts.map(podcast => (
                <div key={podcast.id} className="group bg-white hover:bg-secondary/5 rounded-[2.5rem] p-5 border-2 border-border hover:border-secondary/30 transition-all flex items-center gap-6 shadow-sm hover:shadow-md">
                  <div className="w-32 h-32 shrink-0 rounded-3xl bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center text-5xl shadow-inner relative overflow-hidden">
                    {podcast.coverEmoji}
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <PlayCircle className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <span className="px-3 py-1 bg-secondary/20 text-secondary-foreground rounded-full text-xs font-bold w-fit flex items-center gap-1">
                      <span>{getCategoryEmoji(podcast.category)}</span>
                      {translateCategory(podcast.category, language)}
                    </span>
                    <h3 className="text-2xl font-black text-foreground leading-tight">
                      {isRtl ? podcast.titleAr : podcast.title}
                    </h3>
                    <p className="text-muted-foreground font-medium line-clamp-2">
                      {isRtl ? podcast.descriptionAr : podcast.description}
                    </p>
                    <div className="mt-2 text-sm text-secondary-foreground font-bold flex items-center gap-1">
                      🎧 {podcast.durationMinutes} {t('دقيقة', 'min listen')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="text-6xl">🎧</div>
              <h3 className="text-2xl font-black text-foreground">
                {t('لا يوجد بودكاست', 'No podcasts found')}
              </h3>
              <p className="text-muted-foreground font-bold max-w-md">
                {t(
                  'لم نجد بودكاست يطابق الفلاتر المحددة. جرب تغيير التصنيف.',
                  'No podcasts match the selected filters. Try changing the category.'
                )}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-full font-bold text-sm hover:bg-secondary/90 transition-colors shadow-md"
                >
                  {t('مسح الفلاتر', 'Clear filters')}
                </button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
