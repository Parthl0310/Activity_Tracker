import { retrieveContext, complete, RAG_ASSISTANT_SYSTEM_PROMPT, buildRagAssistantUserPrompt } from '@activity-tracker/ai';

export class SearchService {
  public async queryAssistant(userId: string, query: string): Promise<{ answer: string; sources: any[] }> {
    // 1. Retrieve chunks from both namespaces (activities and monthly summaries)
    const [activityChunks, summaryChunks] = await Promise.all([
      retrieveContext(userId, query, 'activities'),
      retrieveContext(userId, query, 'monthly-summary-chunks'),
    ]);

    const retrievedContext = [...activityChunks, ...summaryChunks];

    // 2. Build prompt
    const userPrompt = buildRagAssistantUserPrompt(query, retrievedContext);

    // 3. Complete
    const answer = await complete(RAG_ASSISTANT_SYSTEM_PROMPT, userPrompt);

    return {
      answer,
      sources: retrievedContext,
    };
  }

  public async semanticSearch(userId: string, query: string, limit = 10): Promise<any[]> {
    return retrieveContext(userId, query, 'activities', limit);
  }
}
