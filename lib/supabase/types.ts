export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Extend this interface to add your database schema types.
 * See: https://supabase.com/docs/guides/api/generating-types
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          display_name: string | null;
          city: string | null;
          is_anonymous: boolean;
          created_at: string;
          auth_user_id: string | null;
        };
        Insert: {
          id?: string;
          display_name?: string | null;
          city?: string | null;
          is_anonymous?: boolean;
          created_at?: string;
          auth_user_id?: string | null;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          city?: string | null;
          is_anonymous?: boolean;
          created_at?: string;
          auth_user_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_clicks: {
        Args: {
          p_user_id: string;
          p_amount: number;
        };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
  };
}
