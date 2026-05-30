import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, syllabusTopicsTable, profilesTable, studySessionsTable, userTopicMasteryTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ExplainTopicBody, GenerateQuestionBody } from "@workspace/api-zod";
import { generateText, parseJSON } from "../lib/gemini";

const router = Router();

router.post("/ai/explain", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const body = ExplainTopicBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const [topic] = await db
    .select()
    .from(syllabusTopicsTable)
    .where(eq(syllabusTopicsTable.id, body.data.topicId))
    .limit(1);

  const topicName = topic?.topicName ?? "Unknown Topic";
  const subject = topic?.subject ?? "Computer Science";
  const mode = body.data.mode ?? "intermediate";
  const style = body.data.learningStyle ?? "exam_oriented";
  const lang = body.data.language ?? "english";

  const modeDesc: Record<string, string> = {
    beginner: "simple foundational explanation for a complete beginner",
    intermediate: "solid intermediate-level explanation connecting concepts",
    advanced: "advanced analysis with edge cases, patterns, and exam strategy",
  };

  const styleDesc: Record<string, string> = {
    exam_oriented: "focused on how this topic appears in government exams, with exam strategy",
    visual: "using analogies and mental images to make concepts stick",
    story: "using a relatable story or real-world scenario",
    quick_revision: "a concise bullet-point revision summary",
  };

  const langDesc: Record<string, string> = {
    english: "in clear English",
    hindi: "in Hindi (Devanagari script)",
    hinglish: "in Hinglish (casual mix of Hindi and English, like how students talk)",
  };

  const prompt = `You are an expert teacher for the Rajasthan Basic Computer Instructor government exam.

Topic: "${topicName}" (Subject: ${subject})
Depth: ${modeDesc[mode] ?? modeDesc.intermediate}
Teaching style: ${styleDesc[style] ?? styleDesc.exam_oriented}
Language: ${langDesc[lang] ?? langDesc.english}

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "explanation": "2-4 paragraph explanation of the topic",
  "keyPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "examTips": ["tip 1", "tip 2", "tip 3", "tip 4"]
}

Keep explanation under 400 words. Key points should be exam-relevant facts. Exam tips should be actionable strategy.`;

  try {
    const raw = await generateText(prompt);
    const parsed = parseJSON<{ explanation: string; keyPoints: string[]; examTips: string[] }>(raw);

    res.json({
      topicName,
      explanation: parsed.explanation,
      keyPoints: parsed.keyPoints,
      examTips: parsed.examTips,
      mode,
      language: lang,
    });
  } catch (err) {
    req.log.error({ err }, "Gemini explain error");
    res.status(500).json({ error: "AI explanation failed. Please try again." });
  }
});

router.post("/ai/question", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const body = GenerateQuestionBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const [topic] = await db
    .select()
    .from(syllabusTopicsTable)
    .where(eq(syllabusTopicsTable.id, body.data.topicId))
    .limit(1);

  const topicName = topic?.topicName ?? "Computer Fundamentals";
  const subject = topic?.subject ?? "Computer Science";
  const difficulty = body.data.difficulty ?? "medium";

  const prompt = `You are an expert question setter for the Rajasthan Basic Computer Instructor government exam.

Generate ONE multiple-choice question on: "${topicName}" (Subject: ${subject})
Difficulty: ${difficulty}

Rules:
- Question must be exam-realistic (government exam style)
- Exactly 4 options
- One clearly correct answer
- Options should have plausible distractors
- Explanation must be clear and educational

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "question": "The question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Why this answer is correct and others are wrong"
}

correctAnswer is the 0-based index of the correct option.`;

  try {
    const raw = await generateText(prompt);
    const parsed = parseJSON<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }>(raw);

    res.json({
      id: Date.now(),
      topicName,
      question: parsed.question,
      options: parsed.options,
      correctAnswer: parsed.correctAnswer,
      explanation: parsed.explanation,
      difficulty,
    });
  } catch (err) {
    req.log.error({ err }, "Gemini question error");
    res.status(500).json({ error: "AI question generation failed. Please try again." });
  }
});

router.get("/ai/motivation", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.clerkUserId, userId))
    .limit(1);

  const sessions = await db
    .select()
    .from(studySessionsTable)
    .where(eq(studySessionsTable.clerkUserId, userId));

  const masteries = await db
    .select()
    .from(userTopicMasteryTable)
    .where(eq(userTopicMasteryTable.clerkUserId, userId));

  const totalHours = sessions.reduce((acc, s) => acc + s.hours, 0);

  const studiedDates = new Set(sessions.map((s) => s.date));
  let streakDays = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    if (studiedDates.has(dateStr)) streakDays++;
    else break;
  }

  const avgMastery = masteries.length > 0
    ? Math.round(masteries.reduce((acc, m) => acc + m.masteryScore, 0) / masteries.length)
    : 0;

  const name = profile?.name ?? "Aspirant";
  const exam = profile?.targetExam ?? "Rajasthan Basic Computer Instructor";

  const prompt = `You are a motivational coach for Indian government exam aspirants.

Student: ${name}
Target exam: ${exam}
Study streak: ${streakDays} days
Total study hours: ${Math.round(totalHours)} hours
Average topic mastery: ${avgMastery}%

Write a SHORT, powerful motivational message (1-2 sentences max) that is:
- Personal and specific to their progress
- In Hinglish (casual mix of Hindi and English) OR pure English — pick whichever feels more natural
- Honest — acknowledge where they are, push them forward
- Never generic or cheesy

Respond ONLY with valid JSON (no markdown):
{
  "message": "Your motivational message here",
  "type": "encouragement"
}

type must be one of: encouragement, warning, streak, milestone`;

  try {
    const raw = await generateText(prompt);
    const parsed = parseJSON<{ message: string; type: string }>(raw);

    res.json({
      message: parsed.message,
      type: parsed.type,
      date: new Date().toISOString().split("T")[0],
    });
  } catch (err) {
    req.log.error({ err }, "Gemini motivation error");
    res.json({
      message: "Keep going — every hour of study today is an investment in your selection tomorrow.",
      type: "encouragement",
      date: new Date().toISOString().split("T")[0],
    });
  }
});

export default router;
