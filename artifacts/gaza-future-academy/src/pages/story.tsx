import { useLanguage } from '@/components/language-provider';
import { useGetStory, getGetStoryQueryKey } from '@workspace/api-client-react';
import { useRoute } from 'wouter';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Clock, User, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StoryReader() {
  const [, params] = useRoute('/library/stories/:id');
  const { t, isRtl } = useLanguage();
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
    <div className="max-w-3xl mx-auto flex flex-col gap-8 pb-20">
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
        
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6 relative z-10">
          <span className="px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-black border border-accent/20 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            {story.category}
          </span>
          <span className="px-4 py-2 bg-secondary/10 text-secondary-foreground rounded-full text-sm font-black border border-secondary/20 flex items-center gap-2">
            <User className="w-4 h-4" />
            {story.ageGroup}
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
             fontSize: isRtl ? '1.35rem' : '1.25rem',
             lineHeight: '2.2'
          }}
        >
          {(isRtl ? story.contentAr : story.content).split('\n\n').map((paragraph, i) => (
            <p key={i} className="mb-6">{paragraph}</p>
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <Button size="lg" className="rounded-full px-12 h-16 text-xl font-black bg-primary text-white hover:bg-primary/90 hover:scale-105 transition-transform shadow-lg">
          {t('لقد أنهيت القراءة! 🎉', 'I finished reading! 🎉')}
        </Button>
      </div>
    </div>
  );
}
