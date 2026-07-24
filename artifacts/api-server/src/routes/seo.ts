// ═══════════════════════════════════════════════════════════════════════════
// ║  SEO Routes — أضف هذا الملف إلى: src/routes/seo.ts            ║
// ║  ثم سجّله في: src/routes/index.ts                               ║
// ║  import seoRouter from "./seo";                                   ║
// ║  router.use(seoRouter);                                          ║
// ═══════════════════════════════════════════════════════════════════════════

import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

// ─── GET /seo/robots.txt ───
router.get("/seo/robots.txt", (_req: Request, res: Response): void => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send(`User-agent: *
Allow: /
Sitemap: https://gaza-future-academy--fatoom2119911.replit.app/sitemap.xml
`);
});

// ─── GET /seo/sitemap.xml ───
router.get("/seo/sitemap.xml", (_req: Request, res: Response): void => {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  const baseUrl = "https://gaza-future-academy--fatoom2119911.replit.app";
  const today = new Date().toISOString().split("T")[0];

  const urls = [
    { loc: "/", priority: "1.0", changeFreq: "weekly" },
    { loc: "/library", priority: "0.9", changeFreq: "weekly" },
    { loc: "/library/stories/1", priority: "0.7", changeFreq: "monthly" },
    { loc: "/library/stories/2", priority: "0.7", changeFreq: "monthly" },
    { loc: "/library/stories/3", priority: "0.7", changeFreq: "monthly" },
    { loc: "/library/stories/4", priority: "0.7", changeFreq: "monthly" },
    { loc: "/library/stories/5", priority: "0.7", changeFreq: "monthly" },
    { loc: "/curriculum", priority: "0.8", changeFreq: "weekly" },
    { loc: "/tutor", priority: "0.8", changeFreq: "weekly" },
  ];

  const xmlUrls = urls
    .map(
      (u) => `  <url>
    <loc>${baseUrl}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changeFreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join("\n");

  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>`);
});

// ─── GET /seo/meta — يرجع meta tags للاستخدام في الصفحات الديناميكية ───
router.get("/seo/meta", (_req: Request, res: Response): void => {
  res.json({
    title: "أكاديمية غزة للمستقبل | تعلم، العب، وابتكر — قصص أطفال، برمجة، ومناهج تفاعلية",
    description: "أكاديمية غزة للمستقبل: منصة تعليمية تفاعلية للأطفال في غزة. قصص تعليمية ممتعة، تعلم البرمجة مع رفيق الذكي، وتحويل المناهج الدراسية إلى مغامرات شيقة.",
    keywords: "أكاديمية غزة, تعليم أطفال, قصص أطفال, برمجة للأطفال, مناهج فلسطينية, تعليم تفاعلي, رفيق, المحول",
    og: {
      title: "أكاديمية غزة للمستقبل | تعلم، العب، وابتكر",
      description: "منصة تعليمية تفاعلية للأطفال. قصص ممتعة، تعلم البرمجة، وتحويل المناهج إلى مغامرات.",
      url: "https://gaza-future-academy--fatoom2119911.replit.app",
      siteName: "أكاديمية غزة للمستقبل",
      locale: "ar_PS",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "أكاديمية غزة للمستقبل | تعلم، العب، وابتكر",
      description: "منصة تعليمية تفاعلية للأطفال. قصص ممتعة، تعلم البرمجة، وتحويل المناهج إلى مغامرات.",
    },
  });
});

export default router;
