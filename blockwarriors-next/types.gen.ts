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
      game_teams: {
        Row: {
          bots: number[]
          created_at: string | null
          game_team_id: number
        }
        Insert: {
          bots: number[]
          created_at?: string | null
          game_team_id?: never
        }
        Update: {
          bots?: number[]
          created_at?: string | null
          game_team_id?: never
        }
        Relationships: []
      }
      matches: {
        Row: {
          blue_team_id: number | null
          created_at: string | null
          expires_at: string | null
          match_elo: number | null
          match_id: number
          match_status: string | null
          match_type: string | null
          mode: string | null
          red_team_id: number | null
          winner_team_id: number | null
        }
        Insert: {
          blue_team_id?: number | null
          created_at?: string | null
          expires_at?: string | null
          match_elo?: number | null
          match_id?: number
          match_status?: string | null
          match_type?: string | null
          mode?: string | null
          red_team_id?: number | null
          winner_team_id?: number | null
        }
        Update: {
          blue_team_id?: number | null
          created_at?: string | null
          expires_at?: string | null
          match_elo?: number | null
          match_id?: number
          match_status?: string | null
          match_type?: string | null
          mode?: string | null
          red_team_id?: number | null
          winner_team_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_blue_team_id_fkey"
            columns: ["blue_team_id"]
            isOneToOne: false
            referencedRelation: "game_teams"
            referencedColumns: ["game_team_id"]
          },
          {
            foreignKeyName: "matches_red_team_id_fkey"
            columns: ["red_team_id"]
            isOneToOne: false
            referencedRelation: "game_teams"
            referencedColumns: ["game_team_id"]
          },
        ]
      }
      settings: {
        Row: {
          banner_button_content: string | null
          banner_text_content: string | null
          created_at: string
          id: string
          show_banner: boolean
          start_tournament: boolean
          updated_at: string
        }
        Insert: {
          banner_button_content?: string | null
          banner_text_content?: string | null
          created_at?: string
          id?: string
          show_banner?: boolean
          start_tournament?: boolean
          updated_at?: string
        }
        Update: {
          banner_button_content?: string | null
          banner_text_content?: string | null
          created_at?: string
          id?: string
          show_banner?: boolean
          start_tournament?: boolean
          updated_at?: string
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
          time_zone: string | null
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
          time_zone?: string | null
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
          time_zone?: string | null
        }
        Relationships: []
      }
      tokens: {
        Row: {
          bot_id: number | null
          created_at: string | null
          expires_at: string | null
          game_team_id: number | null
          is_active: boolean | null
          match_id: number | null
          token: string | null
          token_id: string
          user_id: string | null
        }
        Insert: {
          bot_id?: number | null
          created_at?: string | null
          expires_at?: string | null
          game_team_id?: number | null
          is_active?: boolean | null
          match_id?: number | null
          token?: string | null
          token_id?: string
          user_id?: string | null
        }
        Update: {
          bot_id?: number | null
          created_at?: string | null
          expires_at?: string | null
          game_team_id?: number | null
          is_active?: boolean | null
          match_id?: number | null
          token?: string | null
          token_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tokens_game_team_id_fkey"
            columns: ["game_team_id"]
            isOneToOne: false
            referencedRelation: "game_teams"
            referencedColumns: ["game_team_id"]
          },
          {
            foreignKeyName: "tokens_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
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
        Args: { team_id_param: number; leader_id_param: string }
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

