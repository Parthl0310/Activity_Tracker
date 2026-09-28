import { Pinecone, RecordMetadata } from "@pinecone-database/pinecone";

export type Namespace = "activities" | "monthly-summary-chunks";

let pineconeClient: Pinecone | null = null;

export function getPineconeIndex() {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX;

  if (!apiKey || !indexName) {
    throw new Error(
      `Pinecone configuration missing: PINECONE_API_KEY and PINECONE_INDEX must be set in environment.`
    );
  }

  if (!pineconeClient) {
    pineconeClient = new Pinecone({ apiKey });
  }

  return pineconeClient.index(indexName);
}

export async function upsertVector(
  namespace: Namespace,
  id: string,
  vector: number[],
  metadata: RecordMetadata // MUST include userId
): Promise<void> {
  const index = getPineconeIndex();
  await index.namespace(namespace).upsert([
    {
      id,
      values: vector,
      metadata,
    },
  ]);
}

export async function queryVectors(
  namespace: Namespace,
  userId: string,
  vector: number[],
  topK = 8
) {
  const index = getPineconeIndex();
  const result = await index.namespace(namespace).query({
    vector,
    topK,
    filter: { userId: { $eq: userId } },
    includeMetadata: true,
  });

  return result.matches ?? [];
}

export async function deleteVector(namespace: Namespace, id: string): Promise<void> {
  const index = getPineconeIndex();
  await index.namespace(namespace).deleteOne(id);
}

export async function deleteVectors(namespace: Namespace, ids: string[]): Promise<void> {
  if (!ids || ids.length === 0) return;
  const index = getPineconeIndex();
  await index.namespace(namespace).deleteMany(ids);
}

