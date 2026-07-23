import { Router, type IRouter , type Request, type Response} from "express";
import { eq, desc } from "drizzle-orm";
import { db, tutorConversationsTable, tutorMessagesTable } from "@workspace/db";
import {
  CreateTutorConversationBody,
  CreateTutorConversationResponse,
  GetTutorConversationParams,
  GetTutorConversationResponse,
  DeleteTutorConversationParams,
  ListTutorConversationsResponse,
  ListTutorMessagesParams,
  ListTutorMessagesResponse,
  SendTutorMessageParams,
  SendTutorMessageBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const TUTOR_SYSTEM_PROMPT = `أنت "رفيق"، مدرس البرمجة الودود والمشجع للأطفال المبتدئين. تساعد الأطفال على تعلم أساسيات البرمجة بطريقة ممتعة وبسيطة.

أسلوبك:
- استخدم لغة بسيطة ومشجعة مناسبة للأطفال
- اشرح المفاهيم بأمثلة من الحياة اليومية
- كن صبوراً ومحفزاً دائماً
- استخدم التشبيهات الممتعة لشرح مفاهيم البرمجة
- عندما تعطي كوداً، اشرحه سطراً سطراً
- احتفل بتقدم الطفل وشجعه

تعلّم: المتغيرات، الحلقات، الشروط (if/else)، الدوال، وأساسيات البرمجة
اللغات: Python أو Scratch حسب ما يريد الطفل

You can also respond in English if the child writes in English. Always be warm, patient, and encouraging.`;

async function getOpenAIClient() {
  const apiKey =
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY;
  const baseURL =
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ||
    process.env.OPENAI_BASE_URL;

  if (!apiKey) {
    return null;
  }

  const { default: OpenAI } = await import("openai");
  return new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
}

router.get("/tutor/conversations", async (_req:Request, res:Response): Promise<void> => {
  const conversations = await db
    .select()
    .from(tutorConversationsTable)
    .orderBy(desc(tutorConversationsTable.createdAt));
  res.json(ListTutorConversationsResponse.parse(conversations));
});

router.post("/tutor/conversations", async (req:Request, res:Response): Promise<void> => {
  const parsed = CreateTutorConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [conversation] = await db
    .insert(tutorConversationsTable)
    .values(parsed.data as any)
    .returning();

  res.status(201).json(CreateTutorConversationResponse.parse(conversation));
});

router.get("/tutor/conversations/:id", async (req:Request, res:Response): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetTutorConversationParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [conversation] = await db
    .select()
    .from(tutorConversationsTable)
    .where(eq(tutorConversationsTable.id, params.data.id));

  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const messages = await db
    .select()
    .from(tutorMessagesTable)
    .where(eq(tutorMessagesTable.conversationId, params.data.id))
    .orderBy(tutorMessagesTable.createdAt);

  res.json(
    GetTutorConversationResponse.parse({ ...conversation, messages })
  );
});

router.delete("/tutor/conversations/:id", async (req:Request, res:Response): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteTutorConversationParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(tutorConversationsTable)
    .where(eq(tutorConversationsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/tutor/conversations/:id/messages", async (req:Request, res:Response): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ListTutorMessagesParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const messages = await db
    .select()
    .from(tutorMessagesTable)
    .where(eq(tutorMessagesTable.conversationId, params.data.id))
    .orderBy(tutorMessagesTable.createdAt);

  res.json(ListTutorMessagesResponse.parse(messages));
});

router.post("/tutor/conversations/:id/messages", async (req:Request, res:Response): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = SendTutorMessageParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const bodyParsed = SendTutorMessageBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  const { id } = params.data;
  const { content } = bodyParsed.data;

  // Verify conversation exists
  const [conversation] = await db
    .select()
    .from(tutorConversationsTable)
    .where(eq(tutorConversationsTable.id, id));

  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  // Save user message
  await db.insert(tutorMessagesTable).values({
    conversationId: id,
    role: "user",
    content,
  });

  const openai = await getOpenAIClient();

  if (!openai) {
    // Return a friendly message when AI is not configured
    const fallbackMsg = "عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً. يرجى المحاولة لاحقاً. (AI service not available yet. Please try again later.)";
    await db.insert(tutorMessagesTable).values({
      conversationId: id,
      role: "assistant",
      content: fallbackMsg,
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.write(`data: ${JSON.stringify({ content: fallbackMsg })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
    return;
  }

  // Fetch conversation history
  const history = await db
    .select()
    .from(tutorMessagesTable)
    .where(eq(tutorMessagesTable.conversationId, id))
    .orderBy(tutorMessagesTable.createdAt);

  const chatMessages = [
    { role: "system" as const, content: TUTOR_SYSTEM_PROMPT },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  try {
    const stream = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullResponse += delta;
        res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
      }
    }

    await db.insert(tutorMessagesTable).values({
      conversationId: id,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Tutor message error");
    const errorMsg = "عذراً، حدث خطأ. يرجى المحاولة مرة أخرى. (Sorry, an error occurred. Please try again.)";
    res.write(`data: ${JSON.stringify({ content: errorMsg })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  }
});

export default router;
