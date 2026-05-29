import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, syllabusTopicsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ExplainTopicBody, GenerateQuestionBody } from "@workspace/api-zod";

const router = Router();

const EXPLANATIONS: Record<string, { beginner: string; intermediate: string; advanced: string }> = {
  default: {
    beginner:
      "This topic is foundational. Think of it like learning the alphabet before writing essays. Start with the basic definitions and examples, and practice recognizing them before moving to application.",
    intermediate:
      "You have the basics. Now connect this concept to related topics. Look for patterns, exceptions, and how questions are framed in previous year papers. Apply what you know to unseen scenarios.",
    advanced:
      "At this level, focus on edge cases, analytical reasoning, and synthesis across topics. Predict exam question patterns. Review PYQs and identify what the examiner wants you to demonstrate.",
  },
};

const KEY_POINTS: Record<string, string[]> = {
  default: [
    "Understand the core definition clearly",
    "Practice 5-10 examples before moving on",
    "Connect with related concepts in the same subject",
    "Review previous year questions on this topic",
    "Test yourself with mock questions before moving forward",
  ],
};

const EXAM_TIPS: Record<string, string[]> = {
  default: [
    "Questions on this topic often have tricky distractors — read all options carefully",
    "Focus on PYQs — 60-70% of exam questions follow previous patterns",
    "Time-box your revision: 20 minutes max per topic in the final week",
    "Write key formulas/definitions from memory to reinforce retention",
  ],
};

const PRACTICE_QUESTIONS = [
  {
    question: "Which of the following is NOT a characteristic of a computer?",
    options: ["Speed", "Accuracy", "Diligence", "Intelligence"],
    correctAnswer: 3,
    explanation:
      "Computers do not possess intelligence in the human sense. They process instructions without understanding. Speed, Accuracy, and Diligence are well-known characteristics of computers.",
  },
  {
    question: "The full form of ALU in a computer system is:",
    options: [
      "Arithmetic Logic Unit",
      "Array Logic Unit",
      "Application Logic Unit",
      "Arithmetic Language Unit",
    ],
    correctAnswer: 0,
    explanation:
      "ALU stands for Arithmetic Logic Unit. It performs arithmetic (addition, subtraction) and logical (AND, OR, NOT) operations within the CPU.",
  },
  {
    question: "Which generation of computers uses VLSI technology?",
    options: ["Second Generation", "Third Generation", "Fourth Generation", "Fifth Generation"],
    correctAnswer: 2,
    explanation:
      "Fourth generation computers (1971-present) use VLSI (Very Large Scale Integration) technology, which allowed thousands of transistors to be placed on a single chip.",
  },
  {
    question: "What does RAM stand for?",
    options: [
      "Random Access Memory",
      "Read Access Memory",
      "Rapid Access Module",
      "Read And Modify",
    ],
    correctAnswer: 0,
    explanation:
      "RAM stands for Random Access Memory. It is volatile memory — data is lost when power is turned off. It is the primary working memory of a computer.",
  },
  {
    question: "Which of the following is an example of an output device?",
    options: ["Keyboard", "Scanner", "Monitor", "Mouse"],
    correctAnswer: 2,
    explanation:
      "A Monitor is an output device because it displays information to the user. Keyboard, Scanner, and Mouse are all input devices.",
  },
];

const MOTIVATION_MESSAGES = [
  { message: "You're showing up — that already puts you ahead of 70% of aspirants. Keep going!", type: "encouragement" as const },
  { message: "आज की मेहनत कल का selection है। हर topic एक कदम है मंजिल की तरफ।", type: "encouragement" as const },
  { message: "Warning: You've missed 2 days this week. Recovery is possible but act NOW.", type: "warning" as const },
  { message: "🔥 5-Day Streak! Consistency is your superpower. Keep the momentum alive!", type: "streak" as const },
  { message: "50% syllabus done — halfway there! The finish line is visible now.", type: "milestone" as const },
  { message: "Selection probability is improving. Your effort is showing in the numbers.", type: "encouragement" as const },
  { message: "The exam doesn't reward talent — it rewards preparation. You're building yours.", type: "encouragement" as const },
];

router.post("/ai/explain", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const body = ExplainTopicBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [topic] = await db
    .select()
    .from(syllabusTopicsTable)
    .where(eq(syllabusTopicsTable.id, body.data.topicId))
    .limit(1);

  const topicName = topic?.topicName ?? "Unknown Topic";
  const mode = body.data.mode ?? "intermediate";
  const style = body.data.learningStyle ?? "exam_oriented";
  const lang = body.data.language ?? "english";

  const explanations = EXPLANATIONS[topicName] ?? EXPLANATIONS.default;
  const baseExplanation = explanations[mode];

  let explanation = baseExplanation;
  if (style === "story") {
    explanation = `Let's imagine you are a teacher explaining "${topicName}" to a student for the first time. ${baseExplanation}`;
  } else if (style === "quick_revision") {
    explanation = `⚡ Quick Revision — "${topicName}": ${baseExplanation.split(".")[0]}.`;
  }

  res.json({
    topicName,
    explanation,
    keyPoints: KEY_POINTS[topicName] ?? KEY_POINTS.default,
    examTips: EXAM_TIPS[topicName] ?? EXAM_TIPS.default,
    mode,
    language: lang,
  });
});

router.post("/ai/question", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const body = GenerateQuestionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [topic] = await db
    .select()
    .from(syllabusTopicsTable)
    .where(eq(syllabusTopicsTable.id, body.data.topicId))
    .limit(1);

  const idx = Math.floor(Math.random() * PRACTICE_QUESTIONS.length);
  const q = PRACTICE_QUESTIONS[idx];

  res.json({
    id: idx + 1,
    topicName: topic?.topicName ?? "Computer Fundamentals",
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    difficulty: body.data.difficulty,
  });
});

router.get("/ai/motivation", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const idx = Math.floor(Date.now() / 86400000) % MOTIVATION_MESSAGES.length;
  const msg = MOTIVATION_MESSAGES[idx];

  res.json({
    message: msg.message,
    type: msg.type,
    date: new Date().toISOString().split("T")[0],
  });
});

export default router;
