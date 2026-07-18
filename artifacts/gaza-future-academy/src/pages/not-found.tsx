import { useRoute } from "wouter";
import { AlertCircle } from "lucide-react";
import { useLanguage } from '@/components/language-provider';

export default function NotFound() {
  const [match] = useRoute("/404");
  const { t } = useLanguage();

  return (
    <div className="flex w-full items-center justify-center min-h-[60vh]">
      <div className="bg-card rounded-[3rem] p-12 text-center border-4 border-border/50 shadow-sm max-w-md w-full">
        <AlertCircle className="w-20 h-20 text-destructive mx-auto mb-6" />
        <h1 className="text-4xl font-black text-foreground mb-4">
          {t('أوه لا!', 'Oops!')}
        </h1>
        <p className="text-xl text-muted-foreground font-bold">
          {t('الصفحة غير موجودة', 'Page not found')}
        </p>
      </div>
    </div>
  );
}
