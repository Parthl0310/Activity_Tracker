import { complete } from "../llm/geminiClient.js";

const IMPROVE_SYSTEM_PROMPT = `You are a staff software engineer and professional technical reviewer.
Your task is to take an engineer's raw work log entry and rewrite it into a clear, concise, professional, high-impact summary.

Rules:
1. Write 1 to 2 clear sentences using strong technical action verbs (e.g. "Engineered", "Implemented", "Architected", "Resolved", "Refactored", "Integrated").
2. Accurately reflect the exact work and technologies mentioned in the raw entry.
3. Do NOT invent achievements, metrics, numbers, or technologies not present in the input.
4. Do NOT add boilerplate prefixes or suffixes like "Delivered and verified:" or "Ensured cross-service stability...".
5. Output ONLY the improved text string. Do not include quotes, markdown bold, or commentary.`;

function seniorHeuristicImprove(clean: string): string {
  let text = clean;
  const verbMap: [RegExp, string][] = [
    [/^(?:i\s+)?(?:fixed|fixing|fix)\s+/i, 'Resolved and verified '],
    [/^(?:i\s+)?(?:added|adding|add)\s+/i, 'Architected and implemented '],
    [/^(?:i\s+)?(?:worked on|working on)\s+/i, 'Engineered core deliverables for '],
    [/^(?:i\s+)?(?:created|creating|create)\s+/i, 'Designed and established '],
    [/^(?:i\s+)?(?:refactored|refactoring|refactor)\s+/i, 'Refactored and optimized '],
    [/^(?:i\s+)?(?:updated|updating|update)\s+/i, 'Enhanced and upgraded '],
    [/^(?:i\s+)?(?:migrated|migrating|migrate)\s+/i, 'Spearheaded migration for '],
    [/^(?:i\s+)?(?:debugged|debugging|debug)\s+/i, 'Investigated and eliminated defect in '],
    [/^(?:i\s+)?(?:tested|testing|test)\s+/i, 'Authored comprehensive test suites and verified '],
    [/^(?:i\s+)?(?:deployed|deploying|deploy)\s+/i, 'Executed zero-downtime deployment for '],
  ];

  for (const [pattern, replacement] of verbMap) {
    if (pattern.test(text)) {
      text = text.replace(pattern, replacement);
      break;
    }
  }

  const capitalized = text.charAt(0).toUpperCase() + text.slice(1);
  return capitalized.endsWith('.') ? capitalized : capitalized + '.';
}

export async function improveActivityDescription(text: string): Promise<string> {
  // Strip any prior stacked prefixes like "Delivered and verified:" or repetitive suffixes
  const clean = text
    .replace(/^(?:Delivered and verified:\s*)+/gi, '')
    .replace(/(?:\s*Ensured cross-service stability, robust error handling, and documentation\.?)+/gi, '')
    .trim();

  if (!clean) return '';

  try {
    const result = await complete(IMPROVE_SYSTEM_PROMPT, `Raw entry: "${clean}"`);
    const trimmed = result.trim().replace(/^["']|["']$/g, '');
    if (trimmed.length > 5) {
      return trimmed;
    }
  } catch (err: any) {
    console.warn('[improveActivityDescription] AI call failed, using senior heuristic formatter:', err.message);
  }

  return seniorHeuristicImprove(clean);
}
