// ═══════════════════════════════════════════════════════════════════════════
// ║  SEO Component — أضف هذا الملف في:                                  ║
// ║  artifacts/gaza-future-academy/src/components/Seo.tsx                ║
// ║                                                                        ║
// ║  ثم في ملف App.tsx (أو main.tsx) أضف:                                 ║
// ║  import { Seo } from './components/Seo';                               ║
// ║  وضعه كأول عنصر داخل الجذر:                                            ║
// ║  <Seo />                                                               ║
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect } from 'react';

const SEO_DATA = {
  title: 'أكاديمية غزة للمستقبل | تعلم، العب، وابتكر — قصص أطفال، برمجة، ومناهج تفاعلية',
  description: 'أكاديمية غزة للمستقبل: منصة تعليمية تفاعلية للأطفال في غزة. قصص تعليمية ممتعة، تعلم البرمجة مع رفيق الذكي، وتحويل المناهج الدراسية إلى مغامرات شيقة.',
  keywords: 'أكاديمية غزة, تعليم أطفال, قصص أطفال, برمجة للأطفال, مناهج فلسطينية, تعليم تفاعلي, رفيق, المحول',
  url: 'https://gaza-future-academy--fatoom2119911.replit.app',
  ogImage: 'https://gaza-future-academy--fatoom2119911.replit.app/og-image.png',
  siteName: 'أكاديمية غزة للمستقبل',
};

export function Seo() {
  useEffect(() => {
    // ─── Title ───
    document.title = SEO_DATA.title;

    // ─── Helper to set/update meta ───
    const setMeta = (attr: string, key: string, value: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    };

    // ─── Basic Meta ───
    setMeta('name', 'description', SEO_DATA.description);
    setMeta('name', 'keywords', SEO_DATA.keywords);
    setMeta('name', 'author', 'Gaza Future Academy');
    setMeta('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1');

    // ─── Canonical ───
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', SEO_DATA.url);

    // ─── Open Graph ───
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:title', SEO_DATA.title);
    setMeta('property', 'og:description', SEO_DATA.description);
    setMeta('property', 'og:url', SEO_DATA.url);
    setMeta('property', 'og:site_name', SEO_DATA.siteName);
    setMeta('property', 'og:locale', 'ar_PS');
    setMeta('property', 'og:image', SEO_DATA.ogImage);
    setMeta('property', 'og:image:width', '1344');
    setMeta('property', 'og:image:height', '768');
    setMeta('property', 'og:image:alt', 'أكاديمية غزة للمستقبل — منصة تعليمية للأطفال');

    // ─── Twitter Card ───
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', SEO_DATA.title);
    setMeta('name', 'twitter:description', SEO_DATA.description);
    setMeta('name', 'twitter:image', SEO_DATA.ogImage);

    // ─── JSON-LD Structured Data ───
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "name": "أكاديمية غزة للمستقبل",
        "alternateName": "Gaza Future Academy",
        "url": SEO_DATA.url,
        "description": SEO_DATA.description,
        "inLanguage": ["ar", "en"],
        "audience": {
          "@type": "PeopleAudience",
          "suggestedMinAge": "6",
          "suggestedMaxAge": "14"
        }
      });
      document.head.appendChild(script);
    }
  }, []);

  return null; // لا يُرسم أي عنصر في الصفحة
}
