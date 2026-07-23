import { Router, type IRouter, type Request, type Response } from "express";
import { desc } from "drizzle-orm";
import { db, curriculumTransformationsTable } from "@workspace/db";
import {
  TransformCurriculumBody,
  ListCurriculumHistoryResponse,
} from "@workspace/api-zod";
import OpenAI from "openai";

const router: IRouter = Router();

function getOpenAIClient(): OpenAI | null {
  const apiKey =
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY;
  const baseURL =
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ||
    process.env.OPENAI_BASE_URL;

  if (!apiKey) {
    return null;
  }

  return new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
}

router.post("/curriculum/transform", async (req: Request, res: Response): Promise<void> => {
  const parsed = TransformCurriculumBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { subject, topic, gradeLevel, language } = parsed.data;
  const isArabic = language === "ar";

  const openai = getOpenAIClient();
  if (!openai) {
    res
      .status(503)
      .json({ error: "AI service not configured. Please set OPENAI_API_KEY." });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const systemPrompt = isArabic
    ? `أنت معلم قصصي إبداعي للأطفال. مهمتك تحويل مفاهيم المناهج الدراسية إلى قصص شيقة وتعليمية للأطفال. اكتب قصة بالعربية تشرح المفهوم التعليمي بطريقة ممتعة ومبسطة، مع الحفاظ على المحتوى التعليمي. القصة يجب أن تكون مناسبة للعمر ومشوقة.`
    : `You are a creative storytelling teacher for children. Your mission is to transform curriculum concepts into engaging educational stories for kids. Write a story in English that explains the educational concept in a fun and simple way, while preserving the educational content. The story should be age-appropriate and captivating.`;

  const userPrompt = isArabic
    ? `حول هذا الموضوع إلى قصة تعليمية شيقة:
المادة: ${subject}
الموضوع: ${topic}
المرحلة الدراسية: ${gradeLevel}

اكتب قصة إبداعية تعليمية تعلّم الطلاب هذا المفهوم بطريقة ممتعة. ابدأ بعنوان جذاب للقصة على سطر منفصل، ثم اكتب القصة.`
    : `Transform this topic into an engaging educational story:
Subject: ${subject}
Topic: ${topic}
Grade Level: ${gradeLevel}

Write a creative educational story that teaches students this concept in a fun way. Start with a catchy story title on a separate line, then write the story.`;

  let fullContent = "";
  let storyTitle = "";
  let titleResolved = false;
  let titleBuffer = "";

  try {
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
      const content = chunk.choices[0]?.delta?.content;
      if (!content) continue;

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
      storyTitle = titleBuffer.trim() || `${subject}: ${topic}`;
      fullContent = "";
      res.write(`data: ${JSON.stringify({ title: storyTitle })}\n\n`);
    }

    await db.insert(curriculumTransformationsTable).values({
      subject,
      topic,
      gradeLevel,
      storyTitle,
      storyContent: fullContent.trim(),
    } as any);

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    (req as any).log?.error({ err }, "Curriculum transform error");
    res.write(
      `data: ${JSON.stringify({ error: "Failed to generate story" })}\n\n`,
    );
    res.end();
  }
});

router.get("/curriculum/history", async (_req: Request, res: Response): Promise<void> => {
  const history = await db
    .select()
    .from(curriculumTransformationsTable)
    .orderBy(desc(curriculumTransformationsTable.createdAt));

  res.json(ListCurriculumHistoryResponse.parse(history));
});

export default router;