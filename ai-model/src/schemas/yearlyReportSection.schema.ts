import { SchemaType } from "@google/generative-ai";

export type YearlyReportSectionResponse = {
  sectionText: string;
  sourceChunkIds: string[];
};

export const yearlyReportSectionSchema = {
  type: SchemaType.OBJECT,
  properties: {
    sectionText: {
      type: SchemaType.STRING,
      description: "The generated text for this report section.",
    },
    sourceChunkIds: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "List of the chunk IDs used to generate the claims in this section.",
    },
  },
  required: ["sectionText", "sourceChunkIds"],
};
