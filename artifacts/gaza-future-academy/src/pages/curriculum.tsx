import { useState, useRef } from 'react';
import { useLanguage } from '@/components/language-provider';
import { useListCurriculumHistory } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Wand2, BookOpen, Clock, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function Curriculum() {
  const { t, isRtl } = useLanguage();
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStory, setGeneratedStory] = useState('');
  const [generatedTitle, setGeneratedTitle] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: history, refetch: refetchHistory } = useListCurriculumHistory();

  const handleTransform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !topic || !gradeLevel) return;

    setIsGenerating(true);
    setGeneratedStory('');
    setGeneratedTitle('');

    // Smooth scroll to the result area
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    try {
      const response = await fetch('/api/curriculum/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          topic,
          gradeLevel,
          language: isRtl ? 'ar' : 'en'
        }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process SSE format: "data: {...}\n\n"
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') continue;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.title) {
                setGeneratedTitle(data.title);
              }
              if (data.content) {
                setGeneratedStory(prev => prev + data.content);
              }
            } catch (e) {
              console.error('Failed to parse JSON chunk', e);
            }
          }
        }
      }
      
      refetchHistory();
    } catch (error) {
      console.error('Failed to transform curriculum', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-10 max-w-5xl mx-auto">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center text-white shadow-lg rotate-3">
          <Wand2 className="w-10 h-10" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-foreground">
          {t('المحول السحري للدروس', 'Magic Lesson Transformer')}
        </h1>
        <p className="text-xl text-muted-foreground font-bold max-w-2xl mx-auto">
          {t(
            'أدخل أي درس مدرسي ممل، وسأحوله إلى قصة مغامرة شيقة وممتعة!',
            'Enter any boring school lesson, and I will transform it into an exciting adventure story!'
          )}
        </p>
      </div>

      <div className="bg-card rounded-[3rem] p-8 md:p-10 shadow-sm border-4 border-primary/20 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-secondary/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-20px] left-[-20px] w-40 h-40 bg-accent/20 rounded-full blur-2xl pointer-events-none" />

        <form onSubmit={handleTransform} className="relative z-10 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <Label className="text-lg font-bold flex items-center gap-2">
                📚 {t('المادة الدراسية', 'Subject')}
              </Label>
              <Input 
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder={t('مثال: رياضيات، علوم...', 'e.g. Math, Science...')}
                className="h-14 rounded-2xl text-lg font-bold bg-muted/50 border-2 border-transparent focus:bg-background focus:border-primary"
                disabled={isGenerating}
              />
            </div>
            <div className="space-y-3">
              <Label className="text-lg font-bold flex items-center gap-2">
                🎯 {t('موضوع الدرس', 'Lesson Topic')}
              </Label>
              <Input 
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder={t('مثال: الكسور، الكواكب...', 'e.g. Fractions, Planets...')}
                className="h-14 rounded-2xl text-lg font-bold bg-muted/50 border-2 border-transparent focus:bg-background focus:border-secondary"
                disabled={isGenerating}
              />
            </div>
            <div className="space-y-3">
              <Label className="text-lg font-bold flex items-center gap-2">
                👧 {t('العمر / الصف', 'Age / Grade')}
              </Label>
              <Input 
                value={gradeLevel}
                onChange={e => setGradeLevel(e.target.value)}
                placeholder={t('مثال: 8 سنوات، الصف الثالث', 'e.g. 8 years, 3rd grade')}
                className="h-14 rounded-2xl text-lg font-bold bg-muted/50 border-2 border-transparent focus:bg-background focus:border-accent"
                disabled={isGenerating}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={!subject || !topic || !gradeLevel || isGenerating}
            size="lg"
            className="w-full h-16 text-xl font-black rounded-full mt-4 bg-primary text-white hover:bg-primary/90 hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-50 disabled:hover:scale-100"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2 animate-pulse">
                <Sparkles className="w-6 h-6 animate-spin" />
                {t('جاري التحويل السحري...', 'Casting magic spell...')}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Wand2 className="w-6 h-6" />
                {t('حَوِّل درسي إلى قصة!', 'Transform my lesson!')}
              </span>
            )}
          </Button>
        </form>
      </div>

      <div ref={scrollRef}>
        {(isGenerating || generatedStory) && (
          <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-md border-2 border-border/50 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {generatedTitle && (
              <h2 className="text-3xl md:text-4xl font-black text-primary mb-8 text-center leading-tight">
                {generatedTitle}
              </h2>
            )}
            
            <div className={cn(
              "prose prose-lg md:prose-xl max-w-none font-medium leading-loose",
              isRtl ? "text-right" : "text-left"
            )}>
              {generatedStory ? (
                generatedStory.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="mb-6">{paragraph}</p>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-4 opacity-50">
                  <BookOpen className="w-16 h-16 animate-bounce" />
                  <p className="text-2xl font-bold">{t('نكتب القصة الآن...', 'Writing the story...')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {history && history.length > 0 && (
        <div className="mt-12 space-y-6">
          <h3 className="text-2xl font-black flex items-center gap-3">
            <Clock className="w-6 h-6 text-accent" />
            {t('قصص سابقة', 'Previous Stories')}
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {history.map(item => (
              <Collapsible key={item.id} className="bg-card rounded-3xl border-2 border-border/50 overflow-hidden">
                <CollapsibleTrigger className="w-full flex items-center justify-between p-6 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4 text-right">
                    <div className="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center text-xl">
                      📚
                    </div>
                    <div>
                      <h4 className="text-lg font-black">{item.storyTitle}</h4>
                      <p className="text-sm font-bold text-muted-foreground flex gap-2">
                        <span>{item.subject}</span> • <span>{item.topic}</span>
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="w-6 h-6 text-muted-foreground" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-6 pt-0 border-t-2 border-border/50 mt-2">
                    <div className="prose max-w-none text-foreground leading-loose mt-4 font-medium" dir={isRtl ? 'rtl' : 'ltr'}>
                      {item.storyContent.split('\n\n').map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
