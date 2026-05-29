import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, studyTasksTable, studySessionsTable, profilesTable, syllabusTopicsTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { CompleteTaskParams, CompleteTaskBody, LogStudySessionBody } from "@workspace/api-zod";

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

  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.clerkUserId, userId))
    .limit(1);

  const topics = await db.select().from(syllabusTopicsTable).limit(20);

  if (topics.length === 0) return [];

  const studyHours = profile?.dailyStudyHours ?? 4;
  const totalMinutes = studyHours * 60;

  const taskTemplates = [
    { taskType: "study", durationMinutes: Math.round(totalMinutes * 0.35) },
    { taskType: "practice", durationMinutes: Math.round(totalMinutes * 0.25) },
    { taskType: "revision", durationMinutes: Math.round(totalMinutes * 0.25) },
    { taskType: "study", durationMinutes: Math.round(totalMinutes * 0.15) },
  ];

  const picks = [
    topics[Math.floor(Math.random() * topics.length)],
    topics[Math.floor(Math.random() * topics.length)],
    topics[Math.floor(Math.random() * topics.length)],
    topics[Math.floor(Math.random() * topics.length)],
  ];

  const taskLabels: Record<string, string> = {
    study: "Study",
    practice: "Practice Questions",
    revision: "Quick Revision",
    mock_test: "Mock Test",
  };

  const values = taskTemplates.map((tmpl, i) => ({
    clerkUserId: userId,
    title: `${taskLabels[tmpl.taskType] ?? "Study"}: ${picks[i].topicName}`,
    subject: picks[i].subject,
    topicName: picks[i].topicName,
    durationMinutes: tmpl.durationMinutes,
    taskType: tmpl.taskType,
    completed: "false",
    scheduledDate: date,
  }));

  return await db.insert(studyTasksTable).values(values).returning();
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
      date: body.data.date,
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
