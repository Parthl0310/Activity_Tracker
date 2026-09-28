import { SchemaType } from "@google/generative-ai";

export type VagueEntryResponse = {
  isVague: boolean;
  suggestion: string | null;
};

export const vagueEntrySchema = {
  type: SchemaType.OBJECT,
  properties: {
    isVague: {
      type: SchemaType.BOOLEAN,
      description: "True if the entry is vague, false otherwise",
    },
    suggestion: {
      type: SchemaType.STRING,
      nullable: true,
      description: "A more specific rewrite adding no new facts. Null if not vague.",
    },
  },
  required: ["isVague", "suggestion"],
};
