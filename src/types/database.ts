export interface QuarterlyGoal {
  id: string;
  user_id: string;
  year: number;
  quarter: number;
  osv_goal: number;
  np_goal: number;
  close_goal: number;
  revenue_goal: number;
  weekly_osv_target: number;
  weekly_np_target: number;
  weekly_close_target: number;
  weekly_revenue_target: number;
  created_at: string;
  updated_at: string;
}

export interface QuarterlyMetrics {
  id: string;
  user_id: string;
  year: number;
  quarter: number;
  osvs: number;
  nps: number;
  closes: number;
  total_revenue: number;
  distance_miles: number;
  osv_to_np_ratio: number;
  close_ratio: number;
  avg_deal_size: number;
  created_at: string;
  updated_at: string;
}

export interface YearlyMetrics {
  id: string;
  user_id: string;
  year: number;
  osvs: number;
  nps: number;
  closes: number;
  total_revenue: number;
  distance_miles: number;
  osv_to_np_ratio: number;
  close_ratio: number;
  avg_deal_size: number;
  created_at: string;
  updated_at: string;
}

export interface AIPerformanceSummary {
  id: string;
  user_id: string;
  period_type: 'weekly' | 'quarterly' | 'yearly';
  period_start: string;
  period_end: string;
  summary_text: string | null;
  top_strengths: string[];
  top_improvements: string[];
  pace_vs_goal: number | null;
  conversion_insights: string | null;
  recommendations: string[];
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  starting_point_address: string | null;
  starting_point_latitude: number | null;
  starting_point_longitude: number | null;
  default_start_time: string | null;
  team_code: string | null;
  manager_id: string | null;
  is_manager: boolean;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  team_code: string;
  team_name: string;
  manager_id: string;
  created_at: string;
  updated_at: string;
}

export interface AITeamSummary {
  id: string;
  team_code: string;
  manager_id: string;
  period_type: 'weekly' | 'quarterly' | 'yearly';
  period_start: string;
  period_end: string;
  summary_text: string | null;
  team_health_score: number | null;
  top_performers: TeamPerformer[];
  bottom_performers: TeamPerformer[];
  coaching_priorities: string[];
  team_strengths: string[];
  team_improvements: string[];
  action_items: string[];
  kpi_insights: Record<string, unknown>;
  created_at: string;
}

export interface TeamPerformer {
  user_id: string;
  email: string;
  osv_count: number;
  np_count: number;
  close_count: number;
  pace_score: number;
}

export interface LeaderboardEntry {
  user_id: string;
  user_email: string;
  osv_count: number;
  np_count: number;
  close_count: number;
  total_revenue: number;
  conversion_rate: number;
  close_ratio: number;
  pace_score: number;
  rank: number;
}

export interface Lead {
  id: string;
  business_name: string | null;
  industry: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: number | string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  owner_name: string | null;
  decision_maker_title: string | null;
  decision_maker_confidence: number | null;
  decision_maker_last_updated: string | null;
  decision_maker_email: string | null;
  decision_maker_email_confidence: number | null;
  decision_maker_email_last_updated: string | null;
  google_rating: number | null;
  user_ratings_total: number | null;
  place_id: string | null;
  source_method: string | null;
  competitor: string | null;
  pain_points: string | null;
  notes: string | null;
  status: string | null;
  next_touch_date: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  appointment_type: string | null;
  appointment_duration: number | null;
  meeting_with: string | null;
  follow_up_date: string | null;
  follow_up_notes: string | null;
  np_set: boolean | null;
  osv_completed: boolean | null;
  deal_stage: string | null;
  deal_value: number | null;
  closing_ratio: number | null;
  avg_deal_size: number | null;
  pipeline_value: number | null;
  route_order: number | null;
  distance_from_current_location: number | null;
  kpi_week: number | null;
  kpi_month: number | null;
  kpi_quarter: number | null;
  np_total: number | null;
  osv_total: number | null;
  close_ratio: number | null;
  pace_vs_goal: number | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

export interface LeadFilters {
  search?: string;
  industries?: string[];
  zipCodes?: string[];
  statuses?: string[];
  dealStages?: string[];
  hasAppointment?: boolean;
  needsFollowUp?: boolean;
}

export interface Activity {
  id: string;
  user_id: string;
  lead_id: string | null;
  business_name: string | null;
  event_type: string;
  revenue: number;
  distance_miles: number;
  duration_minutes: number;
  notes: string | null;
  meta_json: Record<string, unknown>;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  voice_transcript: string | null;
  source: string;
  details_completed: boolean;
  client_contact_name: string | null;
  outcome: string | null;
  next_steps: string | null;
}

export interface KPIMetrics {
  np_total: number;
  osv_total: number;
  close_ratio: number;
  pipeline_value: number;
  avg_deal_size: number;
  pace_vs_goal: number;
}
