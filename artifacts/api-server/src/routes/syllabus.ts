import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, syllabusTopicsTable, userTopicMasteryTable, profilesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { UpdateTopicMasteryBody, UpdateTopicMasteryParams } from "@workspace/api-zod";

const router = Router();

function statusFromMastery(score: number): string {
  if (score === 0) return "not_started";
  if (score < 40) return "in_progress";
  if (score < 75) return "revision_needed";
  return "mastered";
}

function calcPriority(weightage: number, mastery: number, pyqFreq: number): number {
  const weakness = 100 - mastery;
  return Math.round((weightage * weakness * (1 + pyqFreq * 0.1)) / 100);
}

async function getTopicsForUser(userId: string) {
  const topics = await db.select().from(syllabusTopicsTable);
  const masteries = await db
    .select()
    .from(userTopicMasteryTable)
    .where(eq(userTopicMasteryTable.clerkUserId, userId));

  const masteryMap = new Map(masteries.map((m) => [m.topicId, m]));

  return topics.map((t) => {
    const mastery = masteryMap.get(t.id);
    const masteryScore = mastery?.masteryScore ?? 0;
    const status = mastery?.status ?? "not_started";
    const priorityScore = calcPriority(t.weightage, masteryScore, t.pyqFrequency);
    return {
      id: t.id,
      subject: t.subject,
      topicName: t.topicName,
      weightage: t.weightage,
      pyqFrequency: t.pyqFrequency,
      difficultyScore: t.difficultyScore,
      masteryScore,
      priorityScore,
      status,
    };
  });
}

router.get("/syllabus", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const topics = await getTopicsForUser(userId);
  res.json(topics);
});

router.patch("/syllabus/topics/:id/mastery", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const params = UpdateTopicMasteryParams.safeParse({ id: Number(req.params.id) });
  const body = UpdateTopicMasteryBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const topicId = params.data.id;
  const masteryScore = body.data.masteryScore;
  const status = statusFromMastery(masteryScore);

  await db
    .insert(userTopicMasteryTable)
    .values({ clerkUserId: userId, topicId, masteryScore, status })
    .onConflictDoUpdate({
      target: [userTopicMasteryTable.clerkUserId, userTopicMasteryTable.topicId],
      set: { masteryScore, status },
    });

  const [topic] = await db
    .select()
    .from(syllabusTopicsTable)
    .where(eq(syllabusTopicsTable.id, topicId))
    .limit(1);

  if (!topic) { res.status(404).json({ error: "Topic not found" }); return; }

  res.json({
    id: topic.id,
    subject: topic.subject,
    topicName: topic.topicName,
    weightage: topic.weightage,
    pyqFrequency: topic.pyqFrequency,
    difficultyScore: topic.difficultyScore,
    masteryScore,
    priorityScore: calcPriority(topic.weightage, masteryScore, topic.pyqFrequency),
    status,
  });
});

router.get("/syllabus/priority", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const topics = await getTopicsForUser(userId);
  const sorted = [...topics].sort((a, b) => b.priorityScore - a.priorityScore);

  const toStudy = sorted.filter((t) => t.masteryScore < 40).slice(0, 8);
  const toRevise = sorted.filter((t) => t.masteryScore >= 40 && t.masteryScore < 75).slice(0, 6);
  const toIgnore = sorted.filter((t) => t.masteryScore >= 75 && t.weightage < 5).slice(0, 4);

  res.json({ toStudy, toRevise, toIgnore });
});

export default router;
