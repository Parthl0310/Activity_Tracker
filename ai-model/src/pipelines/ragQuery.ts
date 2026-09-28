import { queryVectors, Namespace } from "../vectorstore/pineconeClient";
import { embed } from "../embeddings/localModel";

export type RetrievedContext = {
  id?: string;
  score?: number;
  [key: string]: unknown;
};

export async function retrieveContext(
  userId: string,
  query: string,
  namespace: Namespace,
  k = 8
): Promise<RetrievedContext[]> {
  try {
    const queryVector = await embed(query);
    const matches = await queryVectors(namespace, userId, queryVector, k);

    return matches.map((m) => ({
      id: m.id,
      score: m.score,
      ...m.metadata,
    }));
  } catch (error: any) {
    console.warn(`[RAG] retrieveContext failed for namespace '${namespace}':`, error.message);
    return [];
  }
}

