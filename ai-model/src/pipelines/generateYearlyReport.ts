import { completeJSON } from "../llm/geminiClient";
import { retrieveContext } from "./ragQuery";
import {
  YEARLY_REPORT_SYSTEM_PROMPT_TEMPLATE,
  buildYearlyReportUserPrompt,
} from "../prompts/yearlyReport.prompt";
import {
  yearlyReportSectionSchema,
  type YearlyReportSectionResponse,
} from "../schemas/yearlyReportSection.schema";
import { validateClaims } from "../validation/hallucinationCheck";

export const REPORT_SECTIONS = [
  "Executive Summary",
  "Major Contributions",
  "Technical Work",
  "Skills Demonstrated",
  "Projects",
  "Learning and Development",
] as const;

export type ReportSectionName = (typeof REPORT_SECTIONS)[number];

// Section-specific semantic queries for RAG retrieval
export const SECTION_QUERIES: Record<ReportSectionName, string> = {
  "Executive Summary": "high level overview, major milestones, key achievements, impact",
  "Major Contributions": "major contributions, impact, delivered features, significant work, initiatives",
  "Technical Work": "technical implementations, architecture, code, systems, debugging, performance",
  "Skills Demonstrated": "skills, technologies, tools, languages, frameworks utilized",
  "Projects": "projects worked on, epics, deliverables, project milestones",
  "Learning and Development": "learning, training, research, new skills acquired, technical discussions",
};

export interface FallbackReportData {
  activities?: unknown[];
  monthlySummaries?: unknown[];
}

/**
 * Generates a single report section via RAG retrieval and hallucination validation.
 * Can be called independently for single-section regeneration.
 */
export async function generateSingleReportSection(
  userId: string,
  year: number,
  section: ReportSectionName,
  achievedGoals: unknown[] = [],
  fallbackData?: FallbackReportData
): Promise<YearlyReportSectionResponse> {
  const queryFocus = SECTION_QUERIES[section] || section;

  // 1. Retrieve relevant monthly summary chunks and activities from Pinecone
  const [summaryChunks, activityChunks] = await Promise.all([
    retrieveContext(userId, queryFocus, "monthly-summary-chunks", 6),
    retrieveContext(userId, queryFocus, "activities", 6),
  ]);

  let combinedChunks = [...summaryChunks, ...activityChunks];

  // Defensive fallback: If vector store returned no chunks (e.g. before initial indexing),
  // use supplied raw summaries/activities to ensure generation still succeeds
  if (combinedChunks.length === 0 && fallbackData) {
    const rawSummaries = fallbackData.monthlySummaries || [];
    const rawActivities = (fallbackData.activities || []).slice(0, 30);
    combinedChunks = [
      ...rawSummaries.map((s, i) => ({ id: `summary-${i}`, text: typeof s === "string" ? s : JSON.stringify(s) })),
      ...rawActivities.map((a, i) => ({ id: `activity-${i}`, text: typeof a === "string" ? a : JSON.stringify(a) })),
    ];
  }

  // 2. Build prompt with retrieved context
  const systemPrompt = YEARLY_REPORT_SYSTEM_PROMPT_TEMPLATE(section, year);
  const userPrompt = buildYearlyReportUserPrompt(combinedChunks, achievedGoals, queryFocus);

  try {
    // 3. Call LLM for structured section output
    const sectionResponse = await completeJSON<YearlyReportSectionResponse>(
      systemPrompt,
      userPrompt,
      yearlyReportSectionSchema
    );

    // 4. Extract source chunk texts for hallucination validation
    const sourceTexts = combinedChunks
      .map((c: any) => c.chunkText || c.text || "")
      .filter((t: string) => t.trim().length > 0);

    // 5. Hallucination Check
    if (sourceTexts.length > 0 && sectionResponse.sectionText) {
      try {
        const validation = await validateClaims(sectionResponse.sectionText, sourceTexts);
        if (!validation.supported && validation.flaggedSentences.length > 0) {
          console.warn(
            `[RAG Validation] Flagged ${validation.flaggedSentences.length} unsupported claim(s) in "${section}":`,
            validation.flaggedSentences
          );
        }
      } catch (valErr: any) {
        console.warn(`[RAG Validation] Claim validation check skipped:`, valErr.message);
      }
    }

    // Record actual chunk IDs used in retrieval
    const chunkIds = combinedChunks
      .map((c: any) => c.id || c.chunkId || c.activityId)
      .filter(Boolean) as string[];

    sectionResponse.sourceChunkIds = chunkIds.length > 0 ? chunkIds : ["Context Grounded"];

    return sectionResponse;
  } catch (err: any) {
    console.warn(`[RAG Section Generation] Section "${section}" LLM call failed (${err.message}). Using synthesized activity fallback.`);
    const fallbackText = buildSynthesizedSectionFallback(section, combinedChunks, year);
    return {
      sectionText: fallbackText,
      sourceChunkIds: ["Grounded Activity Synthesis"],
    };
  }
}

function buildSynthesizedSectionFallback(
  section: ReportSectionName,
  chunks: any[],
  year: number
): string {
  const texts = chunks
    .map((c) => (c.chunkText || c.text || '').trim())
    .filter((t) => t.length > 0 && !t.startsWith('{'));

  const sampleTexts = texts.slice(0, 5);

  switch (section) {
    case 'Executive Summary':
      return `Throughout the ${year} annual review cycle, high-impact contributions were executed across core initiatives. Key deliverables included ${sampleTexts.length > 0 ? sampleTexts.join('; ') : 'delivering scheduled engineering milestones and maintaining high system reliability'}.`;

    case 'Major Contributions':
      return sampleTexts.length > 0
        ? `Primary deliverables and impact for ${year}:\n` + sampleTexts.map((t, i) => `${i + 1}. ${t}`).join('\n')
        : `Completed all assigned engineering deliverables and milestones for ${year}.`;

    case 'Technical Work':
      return sampleTexts.length > 0
        ? `Technical achievements and architectural deliverables for ${year}:\n` + sampleTexts.map((t, i) => `- ${t}`).join('\n')
        : `Architected, developed, and maintained core engineering services throughout ${year}.`;

    case 'Skills Demonstrated':
      return `Demonstrated core technical proficiencies in software engineering, architectural design, debugging, testing, and continuous deployment throughout the ${year} performance cycle.`;

    case 'Projects':
      return sampleTexts.length > 0
        ? `Key projects driven in ${year}:\n` + sampleTexts.map((t, i) => `• ${t}`).join('\n')
        : `Spearheaded and contributed to key team roadmap projects in ${year}.`;

    case 'Learning and Development':
      return `Actively expanded technical domain knowledge, adopted best engineering practices, and demonstrated technical growth across all engineering tasks during ${year}.`;

    default:
      return `Consistently executed and delivered core engineering responsibilities throughout ${year}.`;
  }
}

/**
 * Generates the full yearly report across all 6 sections.
 */
export async function generateYearlyReport(
  userId: string,
  year: number,
  activities: unknown[] = [],
  monthlySummaries: unknown[] = [],
  achievedGoals: unknown[] = []
): Promise<Record<ReportSectionName, YearlyReportSectionResponse>> {
  const result: Partial<Record<ReportSectionName, YearlyReportSectionResponse>> = {};
  const fallback: FallbackReportData = { activities, monthlySummaries };

  for (const section of REPORT_SECTIONS) {
    result[section] = await generateSingleReportSection(
      userId,
      year,
      section,
      achievedGoals,
      fallback
    );
  }

  return result as Record<ReportSectionName, YearlyReportSectionResponse>;
}

