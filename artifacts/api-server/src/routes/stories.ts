import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and } from "drizzle-orm";
import { db, storiesTable } from "@workspace/db";
import {
  GetStoryParams,
  GetStoryResponse,
  ListStoriesQueryParams,
  ListStoriesResponse,
  ListFeaturedStoriesResponse,
  CreateStoryBody,
  CreateStoryResponse,
  GetLibraryStatsResponse,
} from "@workspace/api-zod";
import { podcastsTable, curriculumTransformationsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/stories", async (req:Request, res:Response): Promise<void> => {
  const params = ListStoriesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];
  if (params.data.category) {
    conditions.push(eq(storiesTable.category, params.data.category));
  }
  if (params.data.ageGroup) {
    conditions.push(eq(storiesTable.ageGroup, params.data.ageGroup));
  }

  const stories = conditions.length > 0
    ? await db.select().from(storiesTable).where(and(...conditions))
    : await db.select().from(storiesTable);

  res.json(ListStoriesResponse.parse(stories));
});

router.post("/stories", async (req:Request, res:Response): Promise<void> => {
  const parsed = CreateStoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [story] = await db.insert(storiesTable).values(parsed.data as any).returning();
  res.status(201).json(CreateStoryResponse.parse(story));
});

router.get("/stories/featured", async (_req:Request, res:Response): Promise<void> => {
  const stories = await db
    .select()
    .from(storiesTable)
    .where(eq(storiesTable.isFeatured, true))
    .limit(8);
  res.json(ListFeaturedStoriesResponse.parse(stories));
});

router.get("/stories/:id", async (req:Request, res:Response): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetStoryParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [story] = await db.select().from(storiesTable).where(eq(storiesTable.id, params.data.id));
  if (!story) {
    res.status(404).json({ error: "Story not found" });
    return;
  }

  res.json(GetStoryResponse.parse(story));
});

router.get("/library/stats", async (_req:Request, res:Response): Promise<void> => {
  const [storiesResult, podcastsResult, transformationsResult, featuredResult] = await Promise.all([
    db.select().from(storiesTable),
    db.select().from(podcastsTable),
    db.select().from(curriculumTransformationsTable),
    db.select().from(storiesTable).where(eq(storiesTable.isFeatured, true)),
  ]);

  res.json(
    GetLibraryStatsResponse.parse({
      totalStories: storiesResult.length,
      totalPodcasts: podcastsResult.length,
      totalTransformations: transformationsResult.length,
      featuredCount: featuredResult.length,
    })
  );
});

export default router;