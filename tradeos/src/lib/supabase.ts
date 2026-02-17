import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users_profile: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          company_name: string;
          trade_type: string;
          region: string;
          phone: string;
          onboarding_completed: boolean;
          subscription_tier: 'free' | 'pro' | 'elite';
          stripe_customer_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users_profile']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['users_profile']['Insert']>;
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          client_gc: string;
          region: string;
          contract_value: number;
          approved_cos: number;
          cost_to_date: number;
          percent_complete: number;
          forecast_margin: number;
          risk_flag: 'green' | 'yellow' | 'red';
          notes: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['projects']['Insert']>;
      };
      change_orders: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          co_number: string;
          description: string;
          labor_cost: number;
          material_cost: number;
          markup_pct: number;
          total_value: number;
          submitted_date: string;
          approved_status: boolean;
          invoiced_status: boolean;
          paid_status: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['change_orders']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['change_orders']['Insert']>;
      };
      labor_profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          wage: number;
          cpp_ei_pct: number;
          worksafe_pct: number;
          vacation_pct: number;
          fuel_per_hr: number;
          tool_wear_per_hr: number;
          insurance_per_hr: number;
          overhead_pct: number;
          target_margin_pct: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['labor_profiles']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['labor_profiles']['Insert']>;
      };
      scope_library: {
        Row: {
          id: string;
          user_id: string;
          scope_item: string;
          unit: string;
          default_low: number;
          default_high: number;
          pricing_method: string;
          notes: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['scope_library']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['scope_library']['Insert']>;
      };
      quotes: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          quote_name: string;
          client_gc: string;
          region: string;
          tier_level: 'spec' | 'custom' | 'luxury';
          profit_target_pct: number;
          subtotal: number;
          total: number;
          exclusions: string;
          terms: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['quotes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['quotes']['Insert']>;
      };
      quote_lines: {
        Row: {
          id: string;
          user_id: string;
          quote_id: string;
          scope_item: string;
          qty: number;
          unit: string;
          unit_price: number;
          line_total: number;
          price_choice: 'low' | 'avg' | 'high' | 'custom';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['quote_lines']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['quote_lines']['Insert']>;
      };
      production_logs: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          log_date: string;
          crew_count: number;
          crew_names: string;
          scope_completed: string;
          units_installed: number;
          hours_worked: number;
          issues: string;
          shortages_bool: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['production_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['production_logs']['Insert']>;
      };
    };
  };
};
