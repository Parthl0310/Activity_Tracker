export type ActivityCategory =
  | 'Bug Fix'
  | 'Feature'
  | 'Optimization'
  | 'Refactor'
  | 'Learning'
  | 'Discussion'
  | 'Production Issue'
  | 'Documentation'
  | 'Other';

export type WorkType =
  | 'Technical'
  | 'Non-Technical'
  | 'Learning';

export interface Activity {
  id: string;
  userId: string;
  title: string;
  text: string;
  aiRefinedText?: string;
  workDate: string; // ISO or formatted date e.g. "2026-08-19"
  displayDate?: string; // e.g. "19 AUG"
  dayNum?: string; // e.g. "19"
  monthStr?: string; // e.g. "AUG"
  project: string;
  category: ActivityCategory;
  workType: WorkType;
  skills: string[];
  keywords: string[];
  enrichmentStatus: 'pending' | 'done' | 'failed';
  isAchievement?: boolean;
  aiConfidence?: number;
  aiClassificationSummary?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateActivityInput {
  text: string;
  title?: string;
  project?: string;
  category?: ActivityCategory;
  workType?: WorkType;
  skills?: string[];
  keywords?: string[];
  workDate?: string;
}

export interface ActivityFilterState {
  searchQuery: string;
  tab: 'all' | 'work' | 'achievements' | 'goals';
  project?: string;
  category?: string;
  dateRange?: string;
}
