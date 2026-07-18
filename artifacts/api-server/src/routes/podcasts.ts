import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, podcastsTable } from "@workspace/db";
import {
  GetPodcastParams,
  GetPodcastResponse,
  ListPodcastsQueryParams,
  ListPodcastsResponse,
  CreatePodcastBody,
  CreatePodcastResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/podcasts", async (req, res): Promise<void> => {
  const params = ListPodcastsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const podcasts = params.data.category
    ? await db.select().from(podcastsTable).where(eq(podcastsTable.category, params.data.category))
    : await db.select().from(podcastsTable);

  res.json(ListPodcastsResponse.parse(podcasts));
});

router.post("/podcasts", async (req, res): Promise<void> => {
  const parsed = CreatePodcastBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [podcast] = await db.insert(podcastsTable).values(parsed.data).returning();
  res.status(201).json(CreatePodcastResponse.parse(podcast));
});

router.get("/podcasts/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetPodcastParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [podcast] = await db.select().from(podcastsTable).where(eq(podcastsTable.id, params.data.id));
  if (!podcast) {
    res.status(404).json({ error: "Podcast not found" });
    return;
  }

  res.json(GetPodcastResponse.parse(podcast));
});

export default router;
