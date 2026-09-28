import { SchemaType } from "@google/generative-ai";

export type WeeklySummaryResponse = {
  majorWork: string[];
  technicalAreas: string[];
  aiInsight: string;
};

export const weeklySummarySchema = {
  type: SchemaType.OBJECT,
  properties: {
    majorWork: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "List of major work areas or grouped accomplishments.",
    },
    technicalAreas: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "List of specific technical areas or technologies touched.",
    },
    aiInsight: {
      type: SchemaType.STRING,
      description: "A single sentence insight grounded only in the provided activities.",
    },
  },
  required: ["majorWork", "technicalAreas", "aiInsight"],
};
