import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { SubmitOnboardingBody } from "@workspace/api-zod";

const router = Router();

function calcSuccessProbability(data: {
  previousAttempts: number;
  dailyStudyHours: number;
  strengthAreas: string[];
  weakAreas: string[];
}): number {
  let base = 35;
  base += Math.min(data.dailyStudyHours * 3, 20);
  base += Math.min(data.strengthAreas.length * 3, 15);
  base -= Math.min(data.weakAreas.length * 2, 10);
  if (data.previousAttempts > 0) base += Math.min(data.previousAttempts * 4, 12);
  return Math.max(10, Math.min(85, Math.round(base)));
}

router.post("/onboarding", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = SubmitOnboardingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;

  const prob = calcSuccessProbability({
    previousAttempts: data.previousAttempts,
    dailyStudyHours: data.dailyStudyHours,
    strengthAreas: data.strengthAreas,
    weakAreas: data.weakAreas,
  });

  const [profile] = await db
    .insert(profilesTable)
    .values({
      clerkUserId: userId,
      name: data.name,
      category: data.category,
      qualification: data.qualification,
      targetExam: data.targetExam,
      dailyStudyHours: data.dailyStudyHours,
      previousAttempts: data.previousAttempts,
      strengthAreas: data.strengthAreas,
      weakAreas: data.weakAreas,
      learningStyle: data.learningStyle,
      language: data.language ?? "english",
      successProbabilityBaseline: prob,
      onboardingCompleted: "true",
      onboardingCompletedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: profilesTable.clerkUserId,
      set: {
        name: data.name,
        category: data.category,
        qualification: data.qualification,
        targetExam: data.targetExam,
        dailyStudyHours: data.dailyStudyHours,
        previousAttempts: data.previousAttempts,
        strengthAreas: data.strengthAreas,
        weakAreas: data.weakAreas,
        learningStyle: data.learningStyle,
        language: data.language ?? "english",
        successProbabilityBaseline: prob,
        onboardingCompleted: "true",
        onboardingCompletedAt: new Date(),
      },
    })
    .returning();

  res.status(201).json({
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
  });
});

router.get("/onboarding/status", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.clerkUserId, userId))
    .limit(1);

  if (!profile || profile.onboardingCompleted !== "true") {
    res.json({ completed: false, completedAt: null });
    return;
  }

  res.json({
    completed: true,
    completedAt: profile.onboardingCompletedAt?.toISOString() ?? null,
  });
});

export default router;
