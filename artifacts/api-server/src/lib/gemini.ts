import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "./logger";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  logger.warn("GEMINI_API_KEY is not set — AI features will be unavailable");
}

export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function generateText(prompt: string): Promise<string> {
  if (!genAI) throw new Error("GEMINI_API_KEY is not configured");
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export function parseJSON<T>(text: string): T {
  const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(clean) as T;
}
