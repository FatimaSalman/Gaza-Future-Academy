import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const podcastsTable = pgTable("podcasts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleAr: text("title_ar").notNull(),
  description: text("description").notNull(),
  descriptionAr: text("description_ar").notNull(),
  category: text("category").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(10),
  audioUrl: text("audio_url").notNull(),
  coverEmoji: text("cover_emoji").notNull().default("🎙️"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPodcastSchema = createInsertSchema(podcastsTable).omit({ id: true, createdAt: true });
export type InsertPodcast = z.infer<typeof insertPodcastSchema>;
export type Podcast = typeof podcastsTable.$inferSelect;
