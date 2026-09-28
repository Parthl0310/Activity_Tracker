import { GoogleGenerativeAI, ResponseSchema } from "@google/generative-ai";
import { withBackoff } from "../utils/retry";

let genAIInstance: GoogleGenerativeAI | null = null;

export function getGenAI(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables.');
  }
  if (!genAIInstance) {
    genAIInstance = new GoogleGenerativeAI(apiKey);
  }
  return genAIInstance;
}

const DEFAULT_TIMEOUT_MS = parseInt(process.env.GEMINI_TIMEOUT_MS || '15000', 10);

function getCandidateModels(): string[] {
  const preferred = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
  const list = [
    preferred,
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-flash-latest',
  ];
  return Array.from(new Set(list));
}

function withTimeout<T>(promise: Promise<T>, ms: number = DEFAULT_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini request timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export async function complete(
  systemPrompt: string,
  userPrompt: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<string> {
  const modelsToTry = getCandidateModels();
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      return await withBackoff(async () => {
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
        });
        const result = await withTimeout(model.generateContent(userPrompt), timeoutMs);
        return result.response.text();
      }, 1);
    } catch (err: any) {
      lastError = err;
      console.warn(`[geminiClient] Model '${modelName}' failed (${err?.message || 'unknown'}), trying next candidate if available...`);
    }
  }

  throw lastError || new Error('All Gemini candidate models failed to generate content.');
}

export async function completeJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  responseSchema: ResponseSchema | object,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const modelsToTry = getCandidateModels();
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      return await withBackoff(async () => {
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchema as ResponseSchema,
            temperature: 0.2,
          },
        });
        
        const result = await withTimeout(model.generateContent(userPrompt), timeoutMs);
        const rawText = result.response.text();
        
        try {
          return JSON.parse(rawText) as T;
        } catch {
          const match = rawText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
          if (match) {
            return JSON.parse(match[0]) as T;
          }
          throw new Error(`Invalid JSON returned: ${rawText.slice(0, 100)}`);
        }
      }, 1);
    } catch (err: any) {
      lastError = err;
      console.warn(`[geminiClient] Model '${modelName}' JSON generation failed (${err?.message || 'unknown'}), trying next candidate if available...`);
    }
  }

  throw lastError || new Error('All Gemini candidate models failed for JSON generation.');
}
