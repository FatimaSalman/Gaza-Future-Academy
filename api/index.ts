/**
 * Gaza Future Academy - Vercel Serverless API
 * 
 * هذا الملف مستقل تماماً — لا يستورد أي شيء من المونوريبو
 * وضعه في: api/index.ts (مجلد api في جذر المشروع)
 * 
 * الملف التالي يجنبك 3 مشاكل:
 * 1. لا يوجد app.listen() — Vercel يدير البورت تلقائياً
 * 2. لا يستخدم SQLite — لأنه لا يعمل على Serverless
 * 3. لا يستورد من @workspace/* — لأن Vercel لا يفهم المونوريبو
 */

import express from 'express';
import cors from 'cors';

const app = express();

// ─── Middleware ───
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.url} → ${res.statusCode} [${Date.now() - start}ms]`);
  });
  next();
});

// ═══════════════════════════════════════════════════
// ║  HEALTH CHECK                                   ║
// ═══════════════════════════════════════════════════
app.get('/api/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Gaza Future Academy API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ═══════════════════════════════════════════════════
// ║  STORIES ROUTES                                 ║
// ═══════════════════════════════════════════════════

// GET /api/stories - List stories
app.get('/api/stories', async (req, res) => {
  try {
    const { category, ageGroup } = req.query;
    res.json({ 
      message: 'Stories endpoint working',
      filters: { category, ageGroup },
      note: 'Connect database for real data'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

// GET /api/stories/featured - Featured stories
app.get('/api/stories/featured', async (_req, res) => {
  try {
    res.json({ 
      message: 'Featured stories endpoint working',
      note: 'Connect database for real data'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch featured stories' });
  }
});

// GET /api/stories/:id - Get story by ID
app.get('/api/stories/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid story ID' });
      return;
    }
    res.json({ 
      message: `Story ${id} endpoint working`,
      note: 'Connect database for real data'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch story' });
  }
});

// GET /api/library/stats - Library statistics
app.get('/api/library/stats', async (_req, res) => {
  try {
    res.json({
      totalStories: 0,
      totalPodcasts: 0,
      totalTransformations: 0,
      featuredCount: 0,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ═══════════════════════════════════════════════════
// ║  PODCASTS ROUTES                               ║
// ═══════════════════════════════════════════════════

app.get('/api/podcasts', async (req, res) => {
  try {
    const { category } = req.query;
    res.json({ 
      message: 'Podcasts endpoint working',
      filters: { category },
      note: 'Connect database for real data'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch podcasts' });
  }
});

app.get('/api/podcasts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid podcast ID' });
      return;
    }
    res.json({ 
      message: `Podcast ${id} endpoint working`,
      note: 'Connect database for real data'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch podcast' });
  }
});

// ═══════════════════════════════════════════════════
// ║  CURRICULUM ROUTES (AI Streaming)              ║
// ═══════════════════════════════════════════════════

app.post('/api/curriculum/transform', async (req, res) => {
  try {
    const { subject, topic, gradeLevel, language } = req.body;

    if (!subject || !topic || !gradeLevel) {
      res.status(400).json({ error: 'subject, topic, and gradeLevel are required' });
      return;
    }

    const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.status(503).json({ error: 'AI service not configured. Set OPENAI_API_KEY.' });
      return;
    }

    const { default: OpenAI } = await import('openai');
    const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || process.env.OPENAI_BASE_URL;
    const openai = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });

    const isArabic = language === 'ar';

    const systemPrompt = isArabic
      ? `أنت معلم قصصي إبداعي للأطفال. مهمتك تحويل مفاهيم المناهج الدراسية إلى قصص شيقة وتعليمية.`
      : `You are a creative storytelling teacher for children. Transform curriculum concepts into engaging stories.`;

    const userPrompt = isArabic
      ? `حول هذا الموضوع إلى قصة تعليمية:\nالمادة: ${subject}\nالموضوع: ${topic}\nالمرحلة: ${gradeLevel}`
      : `Transform this topic into an educational story:\nSubject: ${subject}\nTopic: ${topic}\nGrade: ${gradeLevel}`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      max_tokens: 2048,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Curriculum transform error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate story' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Generation failed' })}\n\n`);
      res.end();
    }
  }
});

app.get('/api/curriculum/history', async (_req, res) => {
  try {
    res.json({ history: [], note: 'Connect database for real data' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ═══════════════════════════════════════════════════
// ║  TUTOR ROUTES (AI Chat)                       ║
// ═══════════════════════════════════════════════════

const TUTOR_SYSTEM_PROMPT = `أنت "رفيق"، مدرس البرمجة الودود للأطفال المبتدئين. تساعد الأطفال على تعلم أساسيات البرمجة بطريقة ممتعة وبسيطة.

أسلوبك:
- استخدم لغة بسيطة ومشجعة
- اشرح المفاهيم بأمثلة من الحياة اليومية
- كن صبوراً ومحفزاً دائماً
- استخدم التشبيهات الممتعة
- احتفل بتقدم الطفل

You can also respond in English if the child writes in English.`;

app.get('/api/tutor/conversations', async (_req, res) => {
  try {
    res.json({ conversations: [], note: 'Connect database for real data' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

app.post('/api/tutor/conversations', async (req, res) => {
  try {
    const { title } = req.body || {};
    const conversation = {
      id: Date.now(),
      title: title || 'محادثة جديدة',
      createdAt: new Date().toISOString(),
    };
    res.status(201).json(conversation);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

app.get('/api/tutor/conversations/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid conversation ID' });
      return;
    }
    res.json({
      id,
      title: 'محادثة',
      messages: [],
      note: 'Connect database for real data',
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

app.post('/api/tutor/conversations/:id/messages', async (req, res) => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);
    const { content } = req.body;

    if (isNaN(id) || !content) {
      res.status(400).json({ error: 'Valid conversation ID and content are required' });
      return;
    }

    const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      const fallbackMsg = 'عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً.';
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.write(`data: ${JSON.stringify({ content: fallbackMsg })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    const { default: OpenAI } = await import('openai');
    const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || process.env.OPENAI_BASE_URL;
    const openai = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const chatMessages = [
      { role: 'system' as const, content: TUTOR_SYSTEM_PROMPT },
      { role: 'user' as const, content },
    ];

    const stream = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      max_tokens: 1024,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Tutor message error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to send message' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Failed to send message' })}\n\n`);
      res.end();
    }
  }
});

// ═══════════════════════════════════════════════════
// ║  VERCEL EXPORT — لا تغير هذا السطر!            ║
// ═══════════════════════════════════════════════════
export default app;
