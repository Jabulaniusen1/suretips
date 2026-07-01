// Hand-written to match supabase/migrations/*.sql while there is no live
// project to generate against yet. Once you run `supabase start` (local) or
// `supabase link` (remote) for real, regenerate the authoritative version
// with:
//   supabase gen types typescript --local > types/database.ts
// and delete this notice.

export type PlanStatus = "inactive" | "pending" | "pending_activation" | "active" | "expired";
export type PaymentType = "subscription" | "activation";
export type TransactionStatus = "pending" | "completed" | "failed" | "refunded";
export type PredictionStatus = "not_started" | "live" | "finished";
export type PredictionResult = "win" | "loss" | "push" | "pending";
export type WinningResult = "win" | "loss" | "push";
export type PaymentMethodType = "bank_transfer" | "crypto" | "mobile_money" | "other";
export type CompetitionStatus = "active" | "inactive";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          country: string;
          avatar_url: string | null;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> & { id: string; email: string };
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
          Relationships: [];
      };
      plans: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          benefits: string[];
          requires_activation: boolean;
          is_active: boolean;
          max_predictions_per_day: number | null;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["plans"]["Row"]> & { name: string; slug: string };
        Update: Partial<Database["public"]["Tables"]["plans"]["Row"]>;
          Relationships: [];
      };
      plan_prices: {
        Row: {
          id: string;
          plan_id: string;
          country: string;
          duration_days: 7 | 30;
          price: number;
          activation_fee: number | null;
          currency: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["plan_prices"]["Row"]> & {
          plan_id: string;
          country: string;
          duration_days: 7 | 30;
          price: number;
          currency: string;
        };
        Update: Partial<Database["public"]["Tables"]["plan_prices"]["Row"]>;
          Relationships: [];
      };
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          plan_status: PlanStatus;
          subscription_fee_paid: boolean;
          activation_fee_paid: boolean;
          start_date: string | null;
          expiry_date: string | null;
          expiry_reminder_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["user_subscriptions"]["Row"]> & {
          user_id: string;
          plan_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_subscriptions"]["Row"]>;
          Relationships: [];
      };
      predictions: {
        Row: {
          id: string;
          plan_id: string;
          home_team: string;
          away_team: string;
          league: string | null;
          league_id: number | null;
          external_fixture_id: number | null;
          home_team_logo: string | null;
          away_team_logo: string | null;
          prediction_type: string;
          odds: number | null;
          confidence: number | null;
          kickoff_time: string;
          status: PredictionStatus;
          result: PredictionResult;
          home_score: number | null;
          away_score: number | null;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["predictions"]["Row"]> & {
          plan_id: string;
          home_team: string;
          away_team: string;
          prediction_type: string;
          kickoff_time: string;
        };
        Update: Partial<Database["public"]["Tables"]["predictions"]["Row"]>;
          Relationships: [];
      };
      vip_winnings: {
        Row: {
          id: string;
          plan_id: string;
          league: string | null;
          home_team: string;
          away_team: string;
          prediction_type: string;
          home_score: number | null;
          away_score: number | null;
          result: WinningResult;
          date: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["vip_winnings"]["Row"]> & {
          plan_id: string;
          home_team: string;
          away_team: string;
          prediction_type: string;
          result: WinningResult;
          date: string;
        };
        Update: Partial<Database["public"]["Tables"]["vip_winnings"]["Row"]>;
          Relationships: [];
      };
      payment_methods: {
        Row: {
          id: string;
          name: string;
          type: PaymentMethodType;
          currency: string | null;
          details: Record<string, unknown>;
          countries: string[];
          is_active: boolean;
          display_order: number;
          logo_url: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["payment_methods"]["Row"]> & {
          name: string;
          type: PaymentMethodType;
        };
        Update: Partial<Database["public"]["Tables"]["payment_methods"]["Row"]>;
          Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string | null;
          subscription_id: string | null;
          plan_id: string;
          amount: number;
          currency: string;
          payment_method_name: string | null;
          payment_type: PaymentType;
          status: TransactionStatus;
          metadata: {
            payment_proof_url?: string;
            duration_days?: 7 | 30;
            payment_method_id?: string;
            rejection_reason?: string;
            contact_name?: string;
            contact_email?: string;
            contact_phone?: string;
            [key: string]: unknown;
          };
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["transactions"]["Row"]> & {
          plan_id: string;
          amount: number;
          currency: string;
          payment_type: PaymentType;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Row"]>;
          Relationships: [];
      };
      access_codes: {
        Row: {
          id: string;
          code: string;
          plan_id: string;
          plan_slug: string;
          duration_days: number;
          expires_at: string;
          transaction_id: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["access_codes"]["Row"]> & {
          code: string;
          plan_id: string;
          plan_slug: string;
          duration_days: number;
          expires_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["access_codes"]["Row"]>;
          Relationships: [];
      };
      blog_posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          content: string | null;
          excerpt: string | null;
          featured_image: string | null;
          author_id: string | null;
          published: boolean;
          published_at: string | null;
          scheduled_at: string | null;
          meta_title: string | null;
          meta_description: string | null;
          tags: string[];
          view_count: number;
          competition_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["blog_posts"]["Row"]> & { title: string; slug: string };
        Update: Partial<Database["public"]["Tables"]["blog_posts"]["Row"]>;
          Relationships: [];
      };
      competitions: {
        Row: {
          id: string;
          slug: string;
          name: string;
          league_id: number | null;
          featured_image: string | null;
          status: CompetitionStatus;
          seo_title: string | null;
          seo_description: string | null;
          heading: string | null;
          subheading: string | null;
          introduction: string | null;
          country: string | null;
          competition_type: string | null;
          current_season: number | null;
          display_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["competitions"]["Row"]> & { slug: string; name: string };
        Update: Partial<Database["public"]["Tables"]["competitions"]["Row"]>;
          Relationships: [];
      };
      custom_pages: {
        Row: {
          id: string;
          slug: string;
          title: string;
          heading: string | null;
          subheading: string | null;
          description: string | null;
          filter_id: string | null;
          is_published: boolean;
          show_in_footer: boolean;
          footer_section: string | null;
          footer_label: string | null;
          footer_order: number | null;
          meta_title: string | null;
          meta_description: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["custom_pages"]["Row"]> & { slug: string; title: string };
        Update: Partial<Database["public"]["Tables"]["custom_pages"]["Row"]>;
          Relationships: [];
      };
      site_config: {
        Row: { key: string; value: Record<string, unknown>; updated_at: string };
        Insert: { key: string; value: Record<string, unknown>; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["site_config"]["Row"]>;
          Relationships: [];
      };
      ad_links: {
        Row: {
          id: string;
          title: string;
          url: string;
          description: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ad_links"]["Row"]> & { title: string; url: string };
        Update: Partial<Database["public"]["Tables"]["ad_links"]["Row"]>;
          Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & {
          user_id: string;
          type: string;
          title: string;
          message: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
          Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          user_id: string;
          sender_id: string;
          content: string;
          read: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["messages"]["Row"]> & {
          user_id: string;
          sender_id: string;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Row"]>;
          Relationships: [];
      };
      free_games_entries: {
        Row: {
          id: string;
          user_id: string;
          game_date: string;
          prediction: Record<string, unknown>;
          points_earned: number;
          graded: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["free_games_entries"]["Row"]> & {
          user_id: string;
          game_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["free_games_entries"]["Row"]>;
          Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_blog_post_views: {
        Args: { post_id: string };
        Returns: undefined;
      };
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
