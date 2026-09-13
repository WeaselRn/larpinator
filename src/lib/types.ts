export type ScoreType = "cv" | "github" | "music" | "combined" | "quiz" | "daily" | "battle";

export interface Finding {
  title: string;
  evidence: string;
  roast: string;
}

export interface Profile {
  id: string;
  clerk_user_id: string;
  username: string;
  avatar_url: string | null;
  overall_larp_score: number;
  larp_tier: string;
  category_scores: Record<string, number>;
  xp: number;
  streak: number;
  last_daily_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Analysis {
  id: string;
  user_id: string;
  type: ScoreType;
  score: number;
  category_scores: Record<string, number>;
  roast: string;
  improvements: string[];
  findings: Finding[];
  raw_result: unknown;
  created_at: string;
}

export interface LarpAnalysisResult {
  overall_score: number;
  categories: Record<string, number>;
  findings: Finding[];
  roast: string;
  improvements: string[];
}

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
}

export interface LatestAnalysisSummary {
  type: ScoreType;
  score: number;
  category_scores: Record<string, number>;
  roast: string;
  created_at: string;
}

export interface AnalysisResponse {
  type: ScoreType;
  result: LarpAnalysisResult;
  profile: Profile;
  newAchievements: Achievement[];
}
