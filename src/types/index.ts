export interface ColumnDefinition {
  id?: string;
  user_id?: string;
  column_key: string;
  display_name: string;
  column_order: number;
  is_active: boolean;
}

export interface TrackerEntry {
  id?: string;
  user_id?: string;
  day: number;
  column_values: Record<string, boolean | string>; // boolean for checkboxes, string for text? We'll keep boolean for simplicity
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