import { useLanguage } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'wouter';
import { BookOpen, Sparkles, MessageCircleCode, Home, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Layout({ children }: { children: React.ReactNode }) {
  const { language, setLanguage, t, isRtl } = useLanguage();
  const [location] = useLocation();

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const navItems = [
    { path: '/', icon: Home, labelAr: 'الرئيسية', labelEn: 'Home', color: 'text-primary' },
    { path: '/library', icon: BookOpen, labelAr: 'المكتبة', labelEn: 'Library', color: 'text-accent' },
    { path: '/curriculum', icon: Sparkles, labelAr: 'المحول', labelEn: 'Curriculum', color: 'text-secondary' },
    { path: '/tutor', icon: MessageCircleCode, labelAr: 'رفيق', labelEn: 'Rafiq Tutor', color: 'text-[#2e7d32]' },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <header className="sticky top-0 z-50 w-full border-b-4 border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-foreground leading-tight tracking-tight">
                {t('أكاديمية غزة للمستقبل', 'Gaza Future Academy')}
              </h1>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = location === item.path || (item.path !== '/' && location.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 rounded-full font-bold text-base transition-all",
                    isActive 
                      ? "bg-card shadow-sm border-2 border-border/50" 
                      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", item.color)} />
                  <span>{t(item.labelAr, item.labelEn)}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleLanguage}
              className="rounded-full px-4 border-2 font-bold flex items-center gap-2"
            >
              <Globe className="w-4 h-4 text-primary" />
              <span>{language === 'ar' ? 'English' : 'عربي'}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t-4 border-border/50 pb-safe">
        <nav className="flex items-center justify-around p-2">
          {navItems.map((item) => {
            const isActive = location === item.path || (item.path !== '/' && location.startsWith(item.path));
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-2xl min-w-[4rem]",
                  isActive ? "bg-card shadow-sm border-2 border-border/50" : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("w-6 h-6", isActive ? item.color : "opacity-60")} />
                <span className="text-[10px] font-bold">{t(item.labelAr, item.labelEn)}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8 pb-32 md:pb-12 relative z-10">
        {children}
      </main>
    </div>
  );
}
