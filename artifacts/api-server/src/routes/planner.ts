import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, studyTasksTable, studySessionsTable, profilesTable, syllabusTopicsTable, userTopicMasteryTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CompleteTaskParams, CompleteTaskBody, LogStudySessionBody } from "@workspace/api-zod";
import { generateText, parseJSON } from "../lib/gemini";

const router = Router();

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function taskToJson(t: typeof studyTasksTable.$inferSelect) {
  return {
    id: t.id,
    title: t.title,
    subject: t.subject,
    topicName: t.topicName,
    durationMinutes: t.durationMinutes,
    taskType: t.taskType,
    completed: t.completed === "true",
    scheduledDate: t.scheduledDate,
    completedAt: t.completedAt?.toISOString() ?? null,
  };
}

async function generateAITasks(userId: string, date: string) {
  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.clerkUserId, userId))
    .limit(1);

  const topics = await db.select().from(syllabusTopicsTable);
  if (topics.length === 0) return null;

  const masteries = await db
    .select()
    .from(userTopicMasteryTable)
    .where(eq(userTopicMasteryTable.clerkUserId, userId));

  const masteryMap = new Map(masteries.map((m) => [m.topicId, m.masteryScore]));

  const topicSummary = topics
    .map((t) => ({
      id: t.id,
      subject: t.subject,
      topicName: t.topicName,
      weightage: t.weightage,
      pyqFrequency: t.pyqFrequency,
      difficultyScore: t.difficultyScore,
      masteryScore: masteryMap.get(t.id) ?? 0,
    }))
    .sort((a, b) => {
      const priorityA = (a.weightage * (100 - a.masteryScore) * (1 + a.pyqFrequency * 0.1)) / 100;
      const priorityB = (b.weightage * (100 - b.masteryScore) * (1 + b.pyqFrequency * 0.1)) / 100;
      return priorityB - priorityA;
    })
    .slice(0, 10);

  const studyHours = profile?.dailyStudyHours ?? 4;
  const strengths = profile?.strengthAreas ?? [];
  const weaknesses = profile?.weakAreas ?? [];
  const learningStyle = profile?.learningStyle ?? "exam_oriented";

  const prompt = `You are an expert study planner for the Rajasthan Basic Computer Instructor government exam.

Student profile:
- Daily study hours available: ${studyHours} hours (${studyHours * 60} minutes total)
- Strength areas: ${strengths.join(", ") || "not specified"}
- Weak areas: ${weaknesses.join(", ") || "not specified"}
- Learning style: ${learningStyle}

Top priority topics (sorted by priority score):
${topicSummary.map((t) => `- ${t.topicName} (${t.subject}): mastery=${t.masteryScore}%, weightage=${t.weightage}, PYQ frequency=${t.pyqFrequency}`).join("\n")}

Create a focused study plan for today (${date}) with exactly 4 tasks.
Tasks must cover study, practice, and revision. Total duration must equal exactly ${studyHours * 60} minutes.

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "tasks": [
    {
      "title": "Task title (e.g. 'Study: Memory & Storage')",
      "subject": "Subject name",
      "topicName": "Topic name",
      "durationMinutes": 60,
      "taskType": "study"
    }
  ]
}

taskType must be one of: study, practice, revision, mock_test
Choose topics that maximize the student's selection probability based on their mastery gaps and topic weightage.`;

  const raw = await generateText(prompt);
  const parsed = parseJSON<{
    tasks: Array<{
      title: string;
      subject: string;
      topicName: string;
      durationMinutes: number;
      taskType: string;
    }>;
  }>(raw);

  return parsed.tasks;
}

async function ensureTodayTasks(userId: string, date: string) {
  const existing = await db
    .select()
    .from(studyTasksTable)
    .where(
      and(
        eq(studyTasksTable.clerkUserId, userId),
        eq(studyTasksTable.scheduledDate, date),
      ),
    );
  if (existing.length > 0) return existing;

  let tasks: Array<{
    title: string;
    subject: string;
    topicName: string;
    durationMinutes: number;
    taskType: string;
  }> | null = null;

  try {
    tasks = await generateAITasks(userId, date);
  } catch (err) {
    // Gemini unavailable — fall through to fallback
  }

  if (!tasks) {
    const [profile] = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.clerkUserId, userId))
      .limit(1);
    const topicRows = await db.select().from(syllabusTopicsTable).limit(20);
    if (topicRows.length === 0) return [];
    const studyHours = profile?.dailyStudyHours ?? 4;
    const totalMinutes = studyHours * 60;
    const pick = (n: number) => topicRows[Math.floor(Math.random() * n)];
    tasks = [
      { taskType: "study", durationMinutes: Math.round(totalMinutes * 0.35), ...{ title: `Study: ${pick(topicRows.length).topicName}`, subject: pick(topicRows.length).subject, topicName: pick(topicRows.length).topicName } },
      { taskType: "practice", durationMinutes: Math.round(totalMinutes * 0.25), ...{ title: `Practice: ${pick(topicRows.length).topicName}`, subject: pick(topicRows.length).subject, topicName: pick(topicRows.length).topicName } },
      { taskType: "revision", durationMinutes: Math.round(totalMinutes * 0.25), ...{ title: `Revision: ${pick(topicRows.length).topicName}`, subject: pick(topicRows.length).subject, topicName: pick(topicRows.length).topicName } },
      { taskType: "study", durationMinutes: Math.round(totalMinutes * 0.15), ...{ title: `Study: ${pick(topicRows.length).topicName}`, subject: pick(topicRows.length).subject, topicName: pick(topicRows.length).topicName } },
    ];
  }

  const rows: (typeof studyTasksTable.$inferInsert)[] = tasks.map((t) => ({
    clerkUserId: userId,
    title: t.title,
    subject: t.subject,
    topicName: t.topicName,
    durationMinutes: t.durationMinutes,
    taskType: t.taskType,
    completed: "false",
    scheduledDate: date,
  }));

  return await db.insert(studyTasksTable).values(rows).returning();
}

router.get("/planner/today", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const today = formatDate(new Date());
  const tasks = await ensureTodayTasks(userId, today);

  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.clerkUserId, userId))
    .limit(1);

  const sessions = await db
    .select()
    .from(studySessionsTable)
    .where(
      and(
        eq(studySessionsTable.clerkUserId, userId),
        eq(studySessionsTable.date, today),
      ),
    );

  const completedHours = sessions.reduce((acc, s) => acc + s.hours, 0);
  const totalHours = tasks.reduce((acc, t) => acc + t.durationMinutes, 0) / 60;

  res.json({
    date: today,
    tasks: tasks.map(taskToJson),
    totalHours: Math.round(totalHours * 10) / 10,
    completedHours: Math.round(completedHours * 10) / 10,
    dailyGoalHours: profile?.dailyStudyHours ?? 4,
  });
});

router.get("/planner/weekly", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.clerkUserId, userId))
    .limit(1);

  const plans = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dateStr = formatDate(d);
    const tasks = await ensureTodayTasks(userId, dateStr);
    const sessions = await db
      .select()
      .from(studySessionsTable)
      .where(
        and(
          eq(studySessionsTable.clerkUserId, userId),
          eq(studySessionsTable.date, dateStr),
        ),
      );
    const completedHours = sessions.reduce((acc, s) => acc + s.hours, 0);
    const totalHours = tasks.reduce((acc, t) => acc + t.durationMinutes, 0) / 60;

    plans.push({
      date: dateStr,
      tasks: tasks.map(taskToJson),
      totalHours: Math.round(totalHours * 10) / 10,
      completedHours: Math.round(completedHours * 10) / 10,
      dailyGoalHours: profile?.dailyStudyHours ?? 4,
    });
  }

  res.json(plans);
});

router.patch("/planner/tasks/:id/complete", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const params = CompleteTaskParams.safeParse({ id: Number(req.params.id) });
  const body = CompleteTaskBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const [task] = await db
    .update(studyTasksTable)
    .set({
      completed: body.data.completed ? "true" : "false",
      completedAt: body.data.completed ? new Date() : null,
    })
    .where(
      and(
        eq(studyTasksTable.id, params.data.id),
        eq(studyTasksTable.clerkUserId, userId),
      ),
    )
    .returning();

  if (!task) { res.status(404).json({ error: "Task not found" }); return; }
  res.json(taskToJson(task));
});

router.post("/planner/study-log", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const body = LogStudySessionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [session] = await db
    .insert(studySessionsTable)
    .values({
      clerkUserId: userId,
      hours: body.data.hours,
      date: body.data.date.toISOString().split("T")[0],
      notes: body.data.notes ?? null,
    })
    .returning();

  res.status(201).json({
    id: session.id,
    hours: session.hours,
    date: session.date,
    notes: session.notes,
    createdAt: session.createdAt.toISOString(),
  });
});

export default router;
