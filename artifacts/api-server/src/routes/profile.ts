import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateProfileBody } from "@workspace/api-zod";

const router = Router();

function profileToJson(p: typeof profilesTable.$inferSelect) {
  return {
    id: p.id,
    clerkUserId: p.clerkUserId,
    name: p.name,
    category: p.category,
    qualification: p.qualification,
    targetExam: p.targetExam,
    dailyStudyHours: p.dailyStudyHours,
    previousAttempts: p.previousAttempts,
    strengthAreas: p.strengthAreas,
    weakAreas: p.weakAreas,
    learningStyle: p.learningStyle,
    language: p.language,
    successProbabilityBaseline: p.successProbabilityBaseline,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/profile", async (req, res): Promise<void> => {
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
  res.json(profileToJson(profile));
});

router.patch("/profile", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [profile] = await db
    .update(profilesTable)
    .set(parsed.data)
    .where(eq(profilesTable.clerkUserId, userId))
    .returning();

  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }
  res.json(profileToJson(profile));
});

export default router;
