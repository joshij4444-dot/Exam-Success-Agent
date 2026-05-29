import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const profilesTable = pgTable("profiles", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  qualification: text("qualification").notNull(),
  targetExam: text("target_exam").notNull(),
  dailyStudyHours: real("daily_study_hours").notNull().default(4),
  previousAttempts: integer("previous_attempts").notNull().default(0),
  strengthAreas: text("strength_areas").array().notNull().default([]),
  weakAreas: text("weak_areas").array().notNull().default([]),
  learningStyle: text("learning_style").notNull().default("exam_oriented"),
  language: text("language").notNull().default("english"),
  successProbabilityBaseline: real("success_probability_baseline").notNull().default(30),
  onboardingCompleted: text("onboarding_completed").notNull().default("false"),
  onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProfileSchema = createInsertSchema(profilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profilesTable.$inferSelect;
