import { Router, type IRouter, type Request, type Response } from "express";
import { desc } from "drizzle-orm";
import OpenAI from "openai";

const router: IRouter = Router();

// ═══════════════════════════════════════════════════
// ║  Database fallback — يعمل حتى لو الجدول غير موجود ║
// ═══════════════════════════════════════════════════

let db: any = null;
let curriculumTransformationsTable: any = null;

try {
  const dbModule = await import("@workspace/db");
  db = dbModule.db;
  curriculumTransformationsTable = dbModule.curriculumTransformationsTable;
  console.log("✅ curriculumTransformationsTable loaded successfully");
} catch (err) {
  console.warn("⚠️ curriculumTransformationsTable not found in @workspace/db — running without DB save");
}

function getOpenAIClient(): any {
  const apiKey =
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY;
  const baseURL =
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ||
    process.env.OPENAI_BASE_URL;

  if (!apiKey) {
    return null;
  }

  const OpenAIClass = OpenAI as any;
  return new OpenAIClass({ apiKey, ...(baseURL ? { baseURL } : {}) });
}

// ═══════════════════════════════════════════════════
// ║  فلتر حروف غير العربية — خط الدفاع الأخير       ║
// ║  يمسح أي حرف صيني، ياباني، كوري من النص         ║
// ═══════════════════════════════════════════════════

function filterNonArabic(text: string, isArabic: boolean): string {
  if (!isArabic) return text; // لا نفلتر إذا كان النص إنجليزي

  // Regex يشمل كل نطاقات CJK (صيني، ياباني، كوري)
  const cjkRegex = /[\u2E80-\u2EFF\u2F00-\u2FDF\u3040-\u309F\u30A0-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uA960-\uA97F\uAC00-\uD7AF\uD7B0-\uD7FF\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFFEF]/g;

  // يمسح أي حرف CJK ويستبدله بمسافة (للحفاظ على ترتيب الكلمات)
  let filtered = text.replace(cjkRegex, ' ');

  // يمسح مسافات متعددة
  filtered = filtered.replace(/ {2,}/g, ' ');

  return filtered;
}

// ═══════════════════════════════════════════════════
// ║  POST /curriculum/transform — تحويل المنهج     ║
// ═══════════════════════════════════════════════════

router.post("/curriculum/transform", async (req: Request, res: Response): Promise<void> => {
  try {
    const { subject, topic, gradeLevel, language } = req.body;

    // Manual validation
    if (!subject || !topic || !gradeLevel || !language) {
      res.status(400).json({ error: "subject, topic, gradeLevel, and language are required" });
      return;
    }

    const isArabic = language === "ar";

    const openai = getOpenAIClient();
    if (!openai) {
      res.status(503).json({ error: "AI service not configured. Please set OPENAI_API_KEY." });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // ═══ إصلاح خلط اللغات: System Prompt مُقوًّى جداً ═══
    const systemPrompt = isArabic
      ? `أنت معلم عربي يكتب قصصاً تعليمية للأطفال. أنت لا تعرف أي لغة غير العربية. لا تستطيع الكتابة بأي لغة أخرى.

قواعد مطلقة:
1. كل حرف في إجابتك يجب أن يكون حرفاً عربياً أو علامة ترقيم عربية (، ؟ ! . -)
2. الأرقام مسموحة: 0123456789
3. ممنوع تماماً استخدام أي حرف ليس عربياً
4. ممنوع الحروف الصينية واليابانية والكورية
5. ممنوع الكلمات الإندونيسية والماليزية
6. إذا احتجت لاسم أجنبي، اكتبه بالحروف العربية (مثلاً: "بايثون" بدلاً من "Python")

اكتب فقط بالعربية الفصحى المبسطة المناسبة للأطفال.`
      : `You are a storytelling teacher for children. Write educational stories in English only. Do not mix any other language.`;

    // ═══ إصلاح خلط اللغات: User Prompt مع تأكيد ═══
    const userPrompt = isArabic
      ? `المهمة: اكتب قصة تعليمية قصيرة للأطفال باللغة العربية فقط.

المادة: ${subject}
الموضوع: ${topic}
المرحلة: ${gradeLevel}

تنبيه: أنت تكتب بالعربية فقط. لا تخرج عن العربية أبداً. لا تستخدم حرفاً واحداً من أي لغة أخرى.

ابدأ بعنوان القصة على سطر منفصل، ثم اكتب القصة.`
      : `Task: Write a short educational story for children in English only.

Subject: ${subject}
Topic: ${topic}
Grade: ${gradeLevel}

Start with a story title on a separate line, then write the story.`;

    let fullContent = "";
    let storyTitle = "";
    let titleResolved = false;
    let titleBuffer = "";

    const stream = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 2048,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const rawContent = chunk.choices[0]?.delta?.content;
      if (!rawContent) continue;

      // ═══ فلتر: يمسح أي حروف CJK ═══
      const content = filterNonArabic(rawContent, isArabic);

      if (!titleResolved) {
        titleBuffer += content;
        const newlineIdx = titleBuffer.indexOf("\n");
        if (newlineIdx === -1) {
          continue;
        }

        storyTitle = titleBuffer
          .slice(0, newlineIdx)
          .trim()
          .replace(/^#+\s*/, "");
        const rest = titleBuffer.slice(newlineIdx + 1);
        titleResolved = true;

        res.write(`data: ${JSON.stringify({ title: storyTitle })}\n\n`);

        if (rest) {
          fullContent += rest;
          res.write(`data: ${JSON.stringify({ content: rest })}\n\n`);
        }
        continue;
      }

      fullContent += content;
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }

    if (!titleResolved) {
      storyTitle = filterNonArabic(titleBuffer.trim() || `${subject}: ${topic}`, isArabic);
      fullContent = "";
      res.write(`data: ${JSON.stringify({ title: storyTitle })}\n\n`);
    }

    // ═══ حفظ في قاعدة البيانات (اختياري) ═══
    if (db && curriculumTransformationsTable) {
      try {
        await db.insert(curriculumTransformationsTable).values({
          subject,
          topic,
          gradeLevel,
          storyTitle,
          storyContent: fullContent.trim(),
        } as any);
      } catch (dbErr) {
        console.warn("⚠️ Failed to save curriculum transformation to DB:", dbErr);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    (req as any).log?.error?.({ err }, "Curriculum transform error");
    res.write(
      `data: ${JSON.stringify({ error: "Failed to generate story" })}\n\n`,
    );
    res.end();
  }
});

// ═══════════════════════════════════════════════════
// ║  GET /curriculum/history — سجل التحويلات        ║
// ═══════════════════════════════════════════════════

router.get("/curriculum/history", async (_req: Request, res: Response): Promise<void> => {
  try {
    if (!db || !curriculumTransformationsTable) {
      res.json({ history: [] });
      return;
    }

    const history = await db
      .select()
      .from(curriculumTransformationsTable)
      .orderBy(desc(curriculumTransformationsTable.createdAt));

    res.json(history);
  } catch (err) {
    // If table doesn't exist, return empty array instead of crashing
    console.warn("⚠️ Failed to fetch curriculum history:", err);
    res.json({ history: [] });
  }
});

export default router;
