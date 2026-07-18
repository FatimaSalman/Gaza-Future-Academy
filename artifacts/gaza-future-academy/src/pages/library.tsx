import { useLanguage } from '@/components/language-provider';
import { useListStories, useListPodcasts } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Headphones, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Library() {
  const { t, isRtl } = useLanguage();
  const { data: stories, isLoading: loadingStories } = useListStories();
  const { data: podcasts, isLoading: loadingPodcasts } = useListPodcasts();

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

      <Tabs defaultValue="stories" className="w-full">
        <TabsList className="bg-card border-2 border-border/50 h-16 p-2 rounded-full mb-8 inline-flex">
          <TabsTrigger 
            value="stories" 
            className="rounded-full px-8 font-black text-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            <BookOpen className={cn("w-5 h-5", isRtl ? "ml-2" : "mr-2")} />
            {t('القصص', 'Stories')}
          </TabsTrigger>
          <TabsTrigger 
            value="podcasts" 
            className="rounded-full px-8 font-black text-lg data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground transition-all"
          >
            <Headphones className={cn("w-5 h-5", isRtl ? "ml-2" : "mr-2")} />
            {t('البودكاست', 'Podcasts')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stories" className="mt-0 outline-none">
          {loadingStories ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-72 bg-card rounded-[2.5rem] border-2 border-border/50 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {stories?.map(story => (
                <Link key={story.id} href={`/library/stories/${story.id}`}>
                  <div className="group bg-white hover:bg-primary/5 rounded-[2.5rem] p-5 border-2 border-border hover:border-primary/30 transition-all cursor-pointer h-full flex flex-col gap-4 shadow-sm hover:shadow-md">
                    <div className="w-full aspect-square rounded-3xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-7xl shadow-inner group-hover:scale-105 transition-transform">
                      {story.coverEmoji}
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-bold">
                          {story.category}
                        </span>
                        <span className="text-muted-foreground text-sm font-bold">
                          {story.ageGroup}
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
          )}
        </TabsContent>

        <TabsContent value="podcasts" className="mt-0 outline-none">
          {loadingPodcasts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map(i => <div key={i} className="h-48 bg-card rounded-[2.5rem] border-2 border-border/50 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {podcasts?.map(podcast => (
                <div key={podcast.id} className="group bg-white hover:bg-secondary/5 rounded-[2.5rem] p-5 border-2 border-border hover:border-secondary/30 transition-all flex items-center gap-6 shadow-sm hover:shadow-md">
                  <div className="w-32 h-32 shrink-0 rounded-3xl bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center text-5xl shadow-inner relative overflow-hidden">
                    {podcast.coverEmoji}
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <PlayCircle className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <span className="px-3 py-1 bg-secondary/20 text-secondary-foreground rounded-full text-xs font-bold w-fit">
                      {podcast.category}
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
