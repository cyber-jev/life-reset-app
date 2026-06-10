// src/types/index.ts
export interface TrackerEntry {
  id?: string;
  user_id?: string;
  day: number;
  coding: boolean;
  income_work: boolean;
  social_contact: boolean;
  left_house: boolean;
  exercise: boolean;
  cannabis: boolean;
  notes: string;
  created_at?: string;
  updated_at?: string;
}

export interface WeeklyReflection {
  id?: string;
  user_id?: string;
  week_number: number;
  improved: string;
  failed: string;
  change_next_week: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  email: string;
}