import { SchemaType } from "@google/generative-ai";

export type MonthlySummaryResponse = {
  majorWorkAreas: string[];
  skillsDemonstrated: string[];
  aiSummary: string;
};

export const monthlySummarySchema = {
  type: SchemaType.OBJECT,
  properties: {
    majorWorkAreas: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "List of major work areas synthesized from the weekly summaries.",
    },
    skillsDemonstrated: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "List of specific technical areas or skills demonstrated over the month.",
    },
    aiSummary: {
      type: SchemaType.STRING,
      description: "A synthesized month-level narrative summary of the work.",
    },
  },
  required: ["majorWorkAreas", "skillsDemonstrated", "aiSummary"],
};
