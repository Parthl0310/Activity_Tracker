import { embed, embedBatch } from "../embeddings/localModel";

export type HallucinationCheckResult = {
  supported: boolean;
  flaggedSentences: string[];
};

/**
 * Computes the cosine similarity between two vectors.
 */
function cosineSim(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function validateClaims(
  sectionText: string,
  sourceChunks: string[]
): Promise<HallucinationCheckResult> {
  // Split the text into sentences based on punctuation followed by whitespace.
  const sentences = sectionText.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  
  const safeSourceChunks = Array.isArray(sourceChunks) ? sourceChunks : [];

  // If there are no source chunks to compare against, all claims are technically unsupported.
  // We'll handle this by returning false if there's text but no context.
  if (safeSourceChunks.length === 0) {
    return {
      supported: sentences.length === 0,
      flaggedSentences: sentences,
    };
  }

  const sourceEmbeddings = await embedBatch(safeSourceChunks);
  const flagged: string[] = [];

  for (const sentence of sentences) {
    const claimVec = await embed(sentence);
    
    // Find the highest similarity score against any source chunk
    const bestScore = Math.max(...sourceEmbeddings.map((v) => cosineSim(claimVec, v)));
    
    if (bestScore < 0.55) {
      flagged.push(sentence);
    }
  }

  return {
    supported: flagged.length === 0,
    flaggedSentences: flagged,
  };
}
