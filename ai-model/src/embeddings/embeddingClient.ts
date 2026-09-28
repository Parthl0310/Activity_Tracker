// embeddings/embeddingClient.ts
// Public interface — delegates to localModel.ts
// Ref: AI-MODEL-README.md § 5. Embedding Client

export { embed, embedBatch, embed as embedText } from "./localModel";
