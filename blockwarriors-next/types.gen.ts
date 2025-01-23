export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      active_tokens: {
        Row: {
          created_at: string | null
          expires_at: string | null
          match_id: number | null
          token: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          match_id?: number | null
          token?: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          match_id?: number | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "active_tokens_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["match_id"]
          },
        ]
      }
      matches: {
        Row: {
          blue_team_id: number | null
          match_elo: number | null
          match_id: number
          match_status: number | null
          mode: string | null
          red_team_id: number | null
          winner_team_id: number | null
        }
        Insert: {
          blue_team_id?: number | null
          match_elo?: number | null
          match_id?: number
          match_status?: number | null
          mode?: string | null
          red_team_id?: number | null
          winner_team_id?: number | null
        }
        Update: {
          blue_team_id?: number | null
          match_elo?: number | null
          match_id?: number
          match_status?: number | null
          mode?: string | null
          red_team_id?: number | null
          winner_team_id?: number | null
        }
        Relationships: []
      }
      matches_duplicate: {
        Row: {
          blue_team_id: number | null
          match_elo: number | null
          match_id: number
          match_status: number | null
          red_team_id: number | null
          winner_team_id: number | null
        }
        Insert: {
          blue_team_id?: number | null
          match_elo?: number | null
          match_id?: number
          match_status?: number | null
          red_team_id?: number | null
          winner_team_id?: number | null
        }
        Update: {
          blue_team_id?: number | null
          match_elo?: number | null
          match_id?: number
          match_status?: number | null
          red_team_id?: number | null
          winner_team_id?: number | null
        }
        Relationships: []
      }
      teams: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          leader_id: string | null
          team_elo: number
          team_losses: number
          team_name: string
          team_wins: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          leader_id?: string | null
          team_elo?: number
          team_losses?: number
          team_name: string
          team_wins?: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          leader_id?: string | null
          team_elo?: number
          team_losses?: number
          team_name?: string
          team_wins?: number
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          geographic_location: string | null
          institution: string | null
          last_name: string | null
          team_id: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          geographic_location?: string | null
          institution?: string | null
          last_name?: string | null
          team_id?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          geographic_location?: string | null
          institution?: string | null
          last_name?: string | null
          team_id?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      disband_team: {
        Args: {
          team_id_param: number
          leader_id_param: string
        }
        Returns: undefined
      }
      get_all_teams_with_members: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: number
          team_name: string
          leader_id: string
          team_elo: number
          team_wins: number
          team_losses: number
          members: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

