import { SchemaType } from "@google/generative-ai";

export type InsightsResponse = {
  strongestWorkArea: string;
  mostFrequentTechnicalArea: string;
  mostActiveProject: string;
  mostDemonstratedSkills: string[];
  learningPattern: string;
  workPattern: string;
};

export const insightsSchema = {
  type: SchemaType.OBJECT,
  properties: {
    strongestWorkArea: {
      type: SchemaType.STRING,
      description: "The strongest overall work area over the year.",
    },
    mostFrequentTechnicalArea: {
      type: SchemaType.STRING,
      description: "The most frequent technical area engaged in.",
    },
    mostActiveProject: {
      type: SchemaType.STRING,
      description: "The most active project based on frequency data.",
    },
    mostDemonstratedSkills: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "List of the most demonstrated skills.",
    },
    learningPattern: {
      type: SchemaType.STRING,
      description: "Observed learning pattern based on the data.",
    },
    workPattern: {
      type: SchemaType.STRING,
      description: "Observed work pattern based on the data.",
    },
  },
  required: [
    "strongestWorkArea",
    "mostFrequentTechnicalArea",
    "mostActiveProject",
    "mostDemonstratedSkills",
    "learningPattern",
    "workPattern",
  ],
};
