export interface AchievedGoal {
  id: string;
  userId: string;
  title: string;
  description: string;
  completedAt: string; // ISO date
  quarter?: string; // e.g. "Q3 2026"
  year: number;
  project?: string;
  category?: string;
  impactScore?: number;
  relatedActivityIds: string[];
  keyOutcomes?: string[];
  createdAt: string;
}

export interface CreateGoalInput {
  title: string;
  description: string;
  completedAt: string;
  project?: string;
  category?: string;
  relatedActivityIds: string[];
  keyOutcomes?: string[];
}
