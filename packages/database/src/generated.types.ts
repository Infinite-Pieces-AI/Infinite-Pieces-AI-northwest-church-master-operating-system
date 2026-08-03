
/**
 * Bootstrap placeholder only.
 *
 * Replace this file from the applied local database before treating database
 * calls as end-to-end typed:
 *
 *   pnpm supabase:start
 *   pnpm supabase:reset
 *   pnpm supabase:types
 */
export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
