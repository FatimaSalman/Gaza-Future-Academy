import { Router, type IRouter } from "express";
import { db, curriculumTransformationsTable } from "@workspace/db";
import {
  TransformCurriculumBody,
  ListCurriculumHistoryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getOpenAIClient() {
  const apiKey =
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY;
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;

  if (!apiKey) {
    return null;
  }

  const { default: OpenAI } = require("openai");
  return new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
}

router.post("/curriculum/transform", async (req, res): Promise<void> => {
  const parsed = TransformCurriculumBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { subject, topic, gradeLevel, language } = parsed.data;
  const isArabic = language === "ar";

  const openai = getOpenAIClient();
  if (!openai) {
    res.status(503).json({ error: "AI service not configured. Please set OPENAI_API_KEY." });
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

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.6-luna",
      max_completion_tokens: 2048,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: true,
    });

    let isFirstLine = true;
    let titleBuffer = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullContent += content;

        // Extract title from first line
        if (isFirstLine) {
          titleBuffer += content;
          const newlineIdx = titleBuffer.indexOf("\n");
          if (newlineIdx !== -1) {
            storyTitle = titleBuffer.substring(0, newlineIdx).trim().replace(/^#+\s*/, "");
            isFirstLine = false;
          }
        }

        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    if (!storyTitle) {
      storyTitle = `${subject}: ${topic}`;
    }

    // Save to DB
    await db.insert(curriculumTransformationsTable).values({
      subject,
      topic,
      gradeLevel,
      storyTitle,
      storyContent: fullContent,
    });

    res.write(`data: ${JSON.stringify({ done: true, storyTitle })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Curriculum transform error");
    res.write(`data: ${JSON.stringify({ error: "Failed to generate story" })}\n\n`);
    res.end();
  }
});

router.get("/curriculum/history", async (_req, res): Promise<void> => {
  const history = await db
    .select()
    .from(curriculumTransformationsTable)
    .orderBy(curriculumTransformationsTable.createdAt);

  res.json(ListCurriculumHistoryResponse.parse(history));
});

export default router;
