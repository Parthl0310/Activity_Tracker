import { SchemaType } from "@google/generative-ai";

export type ActivityEnrichmentResponse = {
  category:
    | "Bug Fix"
    | "Feature"
    | "Optimization"
    | "Refactor"
    | "Learning"
    | "Discussion"
    | "Production Issue"
    | "Documentation"
    | "Other";
  project: string | null;
  skills: string[];
  keywords: string[];
  workType: "Technical" | "Non-Technical" | "Learning";
  aiRefinedText: string;
};

export const activityEnrichmentSchema = {
  type: SchemaType.OBJECT,
  properties: {
    category: {
      type: SchemaType.STRING,
      enum: [
        "Bug Fix",
        "Feature",
        "Optimization",
        "Refactor",
        "Learning",
        "Discussion",
        "Production Issue",
        "Documentation",
        "Other",
      ],
      description: "Categorize the activity",
    },
    project: {
      type: SchemaType.STRING,
      nullable: true,
      description: "The name of the project if present, otherwise null",
    },
    skills: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "List of technical or soft skills demonstrated",
    },
    keywords: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Key concepts or technologies",
    },
    workType: {
      type: SchemaType.STRING,
      enum: ["Technical", "Non-Technical", "Learning"],
      description: "High-level classification of the work",
    },
    aiRefinedText: {
      type: SchemaType.STRING,
      description: "A beautifully written, professional summary (1-2 sentences) of the activity based on the raw text provided.",
    },
  },
  required: ["category", "project", "skills", "keywords", "workType", "aiRefinedText"],
};
