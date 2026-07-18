import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tutorConversationsTable = pgTable("tutor_conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tutorMessagesTable = pgTable("tutor_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => tutorConversationsTable.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTutorConversationSchema = createInsertSchema(tutorConversationsTable).omit({ id: true, createdAt: true });
export const insertTutorMessageSchema = createInsertSchema(tutorMessagesTable).omit({ id: true, createdAt: true });

export type InsertTutorConversation = z.infer<typeof insertTutorConversationSchema>;
export type InsertTutorMessage = z.infer<typeof insertTutorMessageSchema>;
export type TutorConversation = typeof tutorConversationsTable.$inferSelect;
export type TutorMessage = typeof tutorMessagesTable.$inferSelect;
