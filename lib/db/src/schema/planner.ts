import { pgTable, text, serial, timestamp, real, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studyTasksTable = pgTable("study_tasks", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  topicName: text("topic_name").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  taskType: text("task_type").notNull().default("study"),
  completed: text("completed").notNull().default("false"),
  scheduledDate: date("scheduled_date").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const studySessionsTable = pgTable("study_sessions", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  hours: real("hours").notNull(),
  date: date("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStudyTaskSchema = createInsertSchema(studyTasksTable).omit({ id: true, createdAt: true });
export type InsertStudyTask = z.infer<typeof insertStudyTaskSchema>;
export type StudyTask = typeof studyTasksTable.$inferSelect;

export const insertStudySessionSchema = createInsertSchema(studySessionsTable).omit({ id: true, createdAt: true });
export type InsertStudySession = z.infer<typeof insertStudySessionSchema>;
export type StudySession = typeof studySessionsTable.$inferSelect;
