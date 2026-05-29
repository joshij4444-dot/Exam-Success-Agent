import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, profilesTable, studyTasksTable, studySessionsTable, userTopicMasteryTable, syllabusTopicsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

const MOTIVATION_MESSAGES = [
  "Every page you read today brings you closer to your goal. Keep going!",
  "Selection is not about luck — it's about preparation. You're doing the work.",
  "आज की मेहनत कल का result है। Focus करो!",
  "Consistency beats intensity. Show up every day and you will make it.",
  "Your competitors are resting. You are preparing. That's your edge.",
  "Hard days build strong candidates. Push through today!",
  "The exam is not your enemy — incomplete preparation is. Fix that today.",
  "Trust your process. Keep studying, keep improving.",
];

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

router.get("/dashboard", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.clerkUserId, userId))
    .limit(1);

  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  const today = formatDate(new Date());

  const todayTasks = await db
    .select()
    .from(studyTasksTable)
    .where(
      and(
        eq(studyTasksTable.clerkUserId, userId),
        eq(studyTasksTable.scheduledDate, today),
      ),
    );

  const completedTasks = todayTasks.filter((t) => t.completed === "true");

  const todaySessions = await db
    .select()
    .from(studySessionsTable)
    .where(
      and(
        eq(studySessionsTable.clerkUserId, userId),
        eq(studySessionsTable.date, today),
      ),
    );

  const studyHoursToday = todaySessions.reduce((acc, s) => acc + s.hours, 0);

  const topics = await db.select().from(syllabusTopicsTable);
  const masteries = await db
    .select()
    .from(userTopicMasteryTable)
    .where(eq(userTopicMasteryTable.clerkUserId, userId));

  const masteryMap = new Map(masteries.map((m) => [m.topicId, m.masteryScore]));
  const syllabusCompletion =
    topics.length > 0
      ? (topics.filter((t) => (masteryMap.get(t.id) ?? 0) >= 75).length / topics.length) * 100
      : 0;

  const avgMastery =
    topics.length > 0
      ? topics.reduce((acc, t) => acc + (masteryMap.get(t.id) ?? 0), 0) / topics.length
      : 0;

  const allSessions = await db
    .select()
    .from(studySessionsTable)
    .where(eq(studySessionsTable.clerkUserId, userId));
  const totalHours = allSessions.reduce((acc, s) => acc + s.hours, 0);
  const baseline = profile.successProbabilityBaseline;
  const selectionProbability = Math.min(
    90,
    Math.round(baseline + avgMastery * 0.3 + Math.min(totalHours * 0.1, 20)),
  );

  // Streak
  const studiedDates = new Set(allSessions.map((s) => s.date));
  let streakDays = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (studiedDates.has(formatDate(d))) streakDays++;
    else break;
  }

  const weakTopics = topics
    .filter((t) => (masteryMap.get(t.id) ?? 0) < 35)
    .sort((a, b) => b.weightage - a.weightage)
    .slice(0, 5)
    .map((t) => t.topicName);

  const strongTopics = topics
    .filter((t) => (masteryMap.get(t.id) ?? 0) >= 75)
    .sort((a, b) => b.weightage - a.weightage)
    .slice(0, 5)
    .map((t) => t.topicName);

  const motivationMessage =
    MOTIVATION_MESSAGES[Math.floor(Date.now() / 86400000) % MOTIVATION_MESSAGES.length];

  const upcomingMilestones = [
    {
      id: 1,
      title: "Complete 50% Syllabus",
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      completed: syllabusCompletion >= 50,
    },
    {
      id: 2,
      title: "10-Day Study Streak",
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      completed: streakDays >= 10,
    },
    {
      id: 3,
      title: "Master 5 High-Priority Topics",
      dueDate: new Date(Date.now() + 21 * 86400000).toISOString().split("T")[0],
      completed: strongTopics.length >= 5,
    },
  ];

  res.json({
    profile: {
      id: profile.id,
      clerkUserId: profile.clerkUserId,
      name: profile.name,
      category: profile.category,
      qualification: profile.qualification,
      targetExam: profile.targetExam,
      dailyStudyHours: profile.dailyStudyHours,
      previousAttempts: profile.previousAttempts,
      strengthAreas: profile.strengthAreas,
      weakAreas: profile.weakAreas,
      learningStyle: profile.learningStyle,
      language: profile.language,
      successProbabilityBaseline: profile.successProbabilityBaseline,
      createdAt: profile.createdAt.toISOString(),
    },
    todayTasksCount: todayTasks.length,
    completedTasksCount: completedTasks.length,
    studyHoursToday: Math.round(studyHoursToday * 10) / 10,
    syllabusCompletionPercent: Math.round(syllabusCompletion),
    selectionProbability,
    streakDays,
    weakTopics,
    strongTopics,
    upcomingMilestones,
    motivationMessage,
  });
});

export default router;
