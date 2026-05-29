import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, profilesTable, syllabusTopicsTable, userTopicMasteryTable, studySessionsTable } from "@workspace/db";
import { eq, gte } from "drizzle-orm";

const router = Router();

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

router.get("/progress", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const topics = await db.select().from(syllabusTopicsTable);
  const masteries = await db
    .select()
    .from(userTopicMasteryTable)
    .where(eq(userTopicMasteryTable.clerkUserId, userId));

  const masteryMap = new Map(masteries.map((m) => [m.topicId, m.masteryScore]));
  const allSessions = await db
    .select()
    .from(studySessionsTable)
    .where(eq(studySessionsTable.clerkUserId, userId));

  const totalStudyHours = allSessions.reduce((acc, s) => acc + s.hours, 0);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const weeklyHours = allSessions
    .filter((s) => new Date(s.date) >= sevenDaysAgo)
    .reduce((acc, s) => acc + s.hours, 0);

  const subjects = [...new Set(topics.map((t) => t.subject))];
  const subjectBreakdown = subjects.map((subject) => {
    const subTopics = topics.filter((t) => t.subject === subject);
    const masteredCount = subTopics.filter(
      (t) => (masteryMap.get(t.id) ?? 0) >= 75,
    ).length;
    const avgMastery =
      subTopics.length > 0
        ? subTopics.reduce((acc, t) => acc + (masteryMap.get(t.id) ?? 0), 0) /
          subTopics.length
        : 0;
    return {
      subject,
      masteryPercent: Math.round(avgMastery),
      topicsTotal: subTopics.length,
      topicsCompleted: masteredCount,
    };
  });

  const overallMastery =
    topics.length > 0
      ? topics.reduce((acc, t) => acc + (masteryMap.get(t.id) ?? 0), 0) /
        topics.length
      : 0;

  const syllabusCompletion =
    topics.length > 0
      ? (topics.filter((t) => (masteryMap.get(t.id) ?? 0) >= 75).length /
          topics.length) *
        100
      : 0;

  const readinessScore = Math.min(
    100,
    Math.round(overallMastery * 0.6 + Math.min(totalStudyHours / 2, 40)),
  );

  res.json({
    overallMasteryPercent: Math.round(overallMastery),
    syllabusCompletionPercent: Math.round(syllabusCompletion),
    totalStudyHours: Math.round(totalStudyHours * 10) / 10,
    weeklyStudyHours: Math.round(weeklyHours * 10) / 10,
    readinessScore,
    subjectBreakdown,
  });
});

router.get("/progress/heatmap", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const topics = await db.select().from(syllabusTopicsTable);
  const masteries = await db
    .select()
    .from(userTopicMasteryTable)
    .where(eq(userTopicMasteryTable.clerkUserId, userId));

  const masteryMap = new Map(masteries.map((m) => [m.topicId, m.masteryScore]));

  const heatmap = topics.map((t) => {
    const score = masteryMap.get(t.id) ?? 0;
    let level: string;
    if (score < 25) level = "weak";
    else if (score < 50) level = "moderate";
    else if (score < 75) level = "strong";
    else level = "mastered";

    return {
      topicId: t.id,
      topicName: t.topicName,
      subject: t.subject,
      masteryScore: score,
      level,
    };
  });

  res.json(heatmap);
});

router.get("/progress/streak", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const sessions = await db
    .select()
    .from(studySessionsTable)
    .where(eq(studySessionsTable.clerkUserId, userId));

  const studiedDates = new Set(sessions.map((s) => s.date));
  const totalStudyDays = studiedDates.size;

  // Build last 30 days
  const last30: Array<{ date: string; hours: number; studied: boolean }> = [];
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d);
    const dayHours = sessions
      .filter((s) => s.date === dateStr)
      .reduce((acc, s) => acc + s.hours, 0);
    const studied = dayHours > 0;
    last30.push({ date: dateStr, hours: dayHours, studied });
  }

  // calc streaks from oldest to newest
  for (const day of last30) {
    if (day.studied) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }
  // current streak = trailing consecutive studied days
  for (let i = last30.length - 1; i >= 0; i--) {
    if (last30[i].studied) currentStreak++;
    else break;
  }

  const missedDays = last30.filter((d) => !d.studied).length;
  const studiedCount = last30.filter((d) => d.studied).length;
  const productivityScore = Math.round((studiedCount / 30) * 100);

  res.json({
    currentStreak,
    longestStreak,
    totalStudyDays,
    last30Days: last30,
    missedDays,
    productivityScore,
  });
});

router.get("/progress/selection-probability", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.clerkUserId, userId))
    .limit(1);

  const topics = await db.select().from(syllabusTopicsTable);
  const masteries = await db
    .select()
    .from(userTopicMasteryTable)
    .where(eq(userTopicMasteryTable.clerkUserId, userId));

  const masteryMap = new Map(masteries.map((m) => [m.topicId, m.masteryScore]));
  const avgMastery =
    topics.length > 0
      ? topics.reduce((acc, t) => acc + (masteryMap.get(t.id) ?? 0), 0) /
        topics.length
      : 0;

  const sessions = await db
    .select()
    .from(studySessionsTable)
    .where(eq(studySessionsTable.clerkUserId, userId));
  const totalHours = sessions.reduce((acc, s) => acc + s.hours, 0);

  const baseline = profile?.successProbabilityBaseline ?? 30;
  const current = Math.min(
    90,
    Math.round(baseline + avgMastery * 0.3 + Math.min(totalHours * 0.1, 20)),
  );
  const projected = Math.min(92, current + 8);

  const weakTopics = topics
    .filter((t) => (masteryMap.get(t.id) ?? 0) < 30 && t.weightage > 5)
    .sort((a, b) => b.weightage - a.weightage)
    .slice(0, 4)
    .map((t) => t.topicName);

  const trend: "improving" | "stable" | "declining" =
    current > baseline ? "improving" : current === baseline ? "stable" : "declining";

  res.json({ current, projected, baseline, riskAreas: weakTopics, trend });
});

export default router;
