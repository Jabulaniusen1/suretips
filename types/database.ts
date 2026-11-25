// Hand-written to match supabase/migrations/20261125120000_initial_schema.sql while there is no live
// project to generate against yet. Once you run `supabase start` (local) or
// `supabase link` (remote) for real, regenerate the authoritative version
// with:
//   supabase gen types typescript --local > types/database.ts
// and delete this notice.

import type { MarketKey } from "@/lib/predictions/markets";

export type PredictionStatus = "not_started" | "live" | "finished";
export type PredictionResult = "win" | "loss" | "push" | "pending";
export type PredictionSource = "manual" | "api_sync" | "live_fallback";
export type CompetitionStatus = "active" | "inactive";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface RelatedLink {
  label: string;
  href: string;
}

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
      predictions: {
        Row: {
          id: string;
          home_team: string;
          away_team: string;
          league: string | null;
          league_id: number | null;
          external_fixture_id: number | null;
          home_team_logo: string | null;
          away_team_logo: string | null;
          prediction_type: string;
          /** Normalised market; null for bespoke picks. Maintained by a DB trigger. */
          market: MarketKey | null;
          odds: number | null;
          confidence: number | null;
          kickoff_time: string;
          status: PredictionStatus;
          result: PredictionResult;
          result_approved: boolean;
          result_approved_at: string | null;
          result_approved_by: string | null;
          source: PredictionSource;
          home_score: number | null;
          away_score: number | null;
          /** Public explanation of the pick. */
          analysis: string | null;
          /** Private; never rendered publicly. */
          admin_notes: string | null;
          /** Selection as published -- frozen at kickoff by a DB trigger. */
          original_prediction_type: string;
          original_odds: number | null;
          published_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["predictions"]["Row"]> & {
          home_team: string;
          away_team: string;
          prediction_type: string;
          kickoff_time: string;
        };
        Update: Partial<Database["public"]["Tables"]["predictions"]["Row"]>;
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
          featured_image_alt: string | null;
          category: string | null;
          author_id: string | null;
          /** Public byline. Null means the post is credited to the editorial team. */
          author_name: string | null;
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
          og_image: string | null;
          status: CompetitionStatus;
          seo_title: string | null;
          seo_description: string | null;
          heading: string | null;
          subheading: string | null;
          introduction: string | null;
          main_content: string | null;
          country: string | null;
          competition_type: string | null;
          current_season: number | null;
          display_order: number;
          created_at: string;
          updated_at: string;
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
          introduction: string | null;
          main_content: string | null;
          faq: FaqItem[];
          related_links: RelatedLink[];
          filter_id: string | null;
          is_published: boolean;
          noindex: boolean;
          canonical_url: string | null;
          og_image: string | null;
          show_in_footer: boolean;
          footer_section: string | null;
          footer_label: string | null;
          footer_order: number | null;
          meta_title: string | null;
          meta_description: string | null;
          created_at: string;
          updated_at: string;
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
    };
    Views: Record<string, never>;
    Functions: {
      increment_blog_post_views: {
        Args: { post_id: string };
        Returns: undefined;
      };
      prediction_result_summary: {
        Args: { p_from?: string | null; p_to?: string | null; p_market?: string | null; p_league_id?: number | null };
        Returns: Array<{ total: number; wins: number; losses: number; pushes: number; pending: number; awaiting_verification: number }>;
      };
      prediction_result_summary_by_market: {
        Args: { p_from?: string | null; p_to?: string | null };
        Returns: Array<{ market: string; total: number; wins: number; losses: number; pushes: number; pending: number }>;
      };
      sitemap_match_pages: {
        Args: { p_since: string; p_until: string };
        Returns: Array<{ external_fixture_id: number; last_modified: string }>;
      };
      prediction_result_leagues: {
        Args: Record<string, never>;
        Returns: Array<{ league_id: number; league: string; settled: number }>;
      };
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
