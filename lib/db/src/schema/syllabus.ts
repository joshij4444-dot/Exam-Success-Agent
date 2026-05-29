import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const syllabusTopicsTable = pgTable("syllabus_topics", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  topicName: text("topic_name").notNull(),
  weightage: real("weightage").notNull().default(0),
  pyqFrequency: integer("pyq_frequency").notNull().default(0),
  difficultyScore: real("difficulty_score").notNull().default(5),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userTopicMasteryTable = pgTable("user_topic_mastery", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  topicId: integer("topic_id").notNull().references(() => syllabusTopicsTable.id),
  masteryScore: real("mastery_score").notNull().default(0),
  status: text("status").notNull().default("not_started"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSyllabusTopicSchema = createInsertSchema(syllabusTopicsTable).omit({ id: true, createdAt: true });
export type InsertSyllabusTopic = z.infer<typeof insertSyllabusTopicSchema>;
export type SyllabusTopic = typeof syllabusTopicsTable.$inferSelect;

export const insertUserTopicMasterySchema = createInsertSchema(userTopicMasteryTable).omit({ id: true, updatedAt: true });
export type InsertUserTopicMastery = z.infer<typeof insertUserTopicMasterySchema>;
export type UserTopicMastery = typeof userTopicMasteryTable.$inferSelect;
