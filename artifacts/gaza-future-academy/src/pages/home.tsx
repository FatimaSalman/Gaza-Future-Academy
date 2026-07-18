import { Link } from 'wouter';
import { useLanguage } from '@/components/language-provider';
import { ArrowRight, BookOpen, Sparkles, MessageCircleCode, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useListFeaturedStories, useGetLibraryStats } from '@workspace/api-client-react';

export function Home() {
  const { t, isRtl } = useLanguage();
  const { data: featuredStories, isLoading: loadingStories } = useListFeaturedStories();
  const { data: stats } = useGetLibraryStats();

  return (
    <div className="flex flex-col gap-12">
      {/* Hero Section */}
      <section className="relative rounded-[3rem] bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 border-4 border-white p-8 md:p-16 text-center overflow-hidden shadow-xl">
        <div className="absolute top-10 left-10 text-primary opacity-20 rotate-12">
          <Sparkles className="w-24 h-24" />
        </div>
        <div className="absolute bottom-10 right-10 text-accent opacity-20 -rotate-12">
          <Heart className="w-32 h-32" />
        </div>
        
        <div className="max-w-3xl mx-auto relative z-10 flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white font-bold text-primary shadow-sm border-2 border-primary/10">
            <Sparkles className="w-5 h-5" />
            <span>{t('مرحباً بك في عالمنا السحري', 'Welcome to our magical world')}</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-foreground leading-[1.2]">
            {t('تعلم، العب،', 'Learn, Play,')} <br/>
            <span className="text-primary">{t('وابتكر مستقبلك!', 'and Build Your Future!')}</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl">
            {t(
              'أكاديمية غزة للمستقبل هي مكانك الآمن لاستكشاف القصص الممتعة، وتعلم البرمجة، وتحويل دروسك إلى مغامرات شيقة.',
              'Gaza Future Academy is your safe place to explore fun stories, learn coding, and turn your lessons into exciting adventures.'
            )}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
            <Link href="/library" className="group">
              <Button size="lg" className="rounded-full text-lg px-8 h-14 font-bold shadow-md hover:scale-105 transition-transform bg-primary hover:bg-primary/90 text-primary-foreground">
                <BookOpen className={isRtl ? "ml-2 w-6 h-6" : "mr-2 w-6 h-6"} />
                {t('اقرأ قصة', 'Read a Story')}
              </Button>
            </Link>
            <Link href="/tutor" className="group">
              <Button size="lg" variant="outline" className="rounded-full text-lg px-8 h-14 font-bold shadow-sm hover:scale-105 transition-transform border-2 border-accent text-accent hover:bg-accent/10">
                <MessageCircleCode className={isRtl ? "ml-2 w-6 h-6" : "mr-2 w-6 h-6"} />
                {t('تحدث مع رفيق', 'Chat with Rafiq')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {stats && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl p-6 text-center shadow-sm border-2 border-border/50">
            <div className="text-4xl font-black text-primary mb-2">{stats.totalStories}</div>
            <div className="text-muted-foreground font-bold">{t('قصة تفاعلية', 'Interactive Stories')}</div>
          </div>
          <div className="bg-white rounded-3xl p-6 text-center shadow-sm border-2 border-border/50">
            <div className="text-4xl font-black text-secondary mb-2">{stats.totalPodcasts}</div>
            <div className="text-muted-foreground font-bold">{t('بودكاست صوتي', 'Audio Podcasts')}</div>
          </div>
          <div className="bg-white rounded-3xl p-6 text-center shadow-sm border-2 border-border/50">
            <div className="text-4xl font-black text-accent mb-2">{stats.totalTransformations}</div>
            <div className="text-muted-foreground font-bold">{t('درس سحري', 'Magic Lessons')}</div>
          </div>
          <div className="bg-white rounded-3xl p-6 text-center shadow-sm border-2 border-border/50">
            <div className="text-4xl font-black text-destructive mb-2">{stats.featuredCount}</div>
            <div className="text-muted-foreground font-bold">{t('قصص مميزة', 'Featured Stories')}</div>
          </div>
        </section>
      )}

      {/* Featured Stories */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black text-foreground flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl shadow-sm">⭐</span>
            {t('قصص مختارة لك', 'Featured Stories for You')}
          </h2>
          <Link href="/library">
            <Button variant="ghost" className="font-bold rounded-full">
              {t('عرض الكل', 'View All')}
              <ArrowRight className={isRtl ? "mr-2 w-5 h-5 rotate-180" : "ml-2 w-5 h-5"} />
            </Button>
          </Link>
        </div>

        {loadingStories ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-card rounded-3xl border-2 border-border/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {featuredStories?.map((story) => (
              <Link key={story.id} href={`/library/stories/${story.id}`}>
                <div className="group bg-card hover:bg-muted/30 rounded-[2.5rem] p-6 border-4 border-transparent hover:border-primary/20 transition-all cursor-pointer h-full flex flex-col gap-4 shadow-sm hover:shadow-md">
                  <div className="w-full aspect-video rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-7xl shadow-inner group-hover:scale-105 transition-transform">
                    {story.coverEmoji}
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-secondary/20 text-secondary-foreground rounded-full text-sm font-bold">
                        {story.ageGroup}
                      </span>
                      <span className="px-3 py-1 bg-muted rounded-full text-sm font-bold text-muted-foreground flex items-center gap-1">
                        ⏱ {story.readingTimeMinutes} {t('د', 'm')}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-foreground line-clamp-2">
                      {isRtl ? story.titleAr : story.title}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
