import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const curriculumTransformationsTable = pgTable("curriculum_transformations", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  topic: text("topic").notNull(),
  gradeLevel: text("grade_level").notNull(),
  storyTitle: text("story_title").notNull(),
  storyContent: text("story_content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCurriculumTransformationSchema = createInsertSchema(curriculumTransformationsTable).omit({ id: true, createdAt: true });
export type InsertCurriculumTransformation = z.infer<typeof insertCurriculumTransformationSchema>;
export type CurriculumTransformation = typeof curriculumTransformationsTable.$inferSelect;
