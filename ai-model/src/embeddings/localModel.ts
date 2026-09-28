import { pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";

// Cache the extractor in memory so it's only loaded once per process.
let extractor: FeatureExtractionPipeline | null = null;

async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractor) {
    const modelName = process.env.EMBEDDING_MODEL ?? "Xenova/all-MiniLM-L6-v2";
    extractor = await pipeline("feature-extraction", modelName);
  }
  return extractor;
}

export async function embed(text: string): Promise<number[]> {
  const model = await getExtractor();
  const output = await model(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  // Using Promise.all to map over texts and embed each one.
  return Promise.all(texts.map(text => embed(text)));
}
