export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      character_inventory: {
        Row: {
          character_id: string
          created_at: string
          description: string | null
          equipped: boolean | null
          id: string
          image_url: string | null
          name: string
          quantity: number
          rarity: string
          type: string
          updated_at: string
          value: number | null
          weight: number
        }
        Insert: {
          character_id: string
          created_at?: string
          description?: string | null
          equipped?: boolean | null
          id?: string
          image_url?: string | null
          name: string
          quantity?: number
          rarity?: string
          type?: string
          updated_at?: string
          value?: number | null
          weight?: number
        }
        Update: {
          character_id?: string
          created_at?: string
          description?: string | null
          equipped?: boolean | null
          id?: string
          image_url?: string | null
          name?: string
          quantity?: number
          rarity?: string
          type?: string
          updated_at?: string
          value?: number | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_inventory_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          attributes: Json | null
          background: string | null
          class: string | null
          created_at: string
          creation_mode: string | null
          equipment: Json | null
          id: string
          level: number | null
          name: string
          notes: string | null
          proficiencies: Json | null
          race: string | null
          spells: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attributes?: Json | null
          background?: string | null
          class?: string | null
          created_at?: string
          creation_mode?: string | null
          equipment?: Json | null
          id?: string
          level?: number | null
          name: string
          notes?: string | null
          proficiencies?: Json | null
          race?: string | null
          spells?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attributes?: Json | null
          background?: string | null
          class?: string | null
          created_at?: string
          creation_mode?: string | null
          equipment?: Json | null
          id?: string
          level?: number | null
          name?: string
          notes?: string | null
          proficiencies?: Json | null
          race?: string | null
          spells?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          table_id: string
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          table_id: string
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          table_id?: string
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      fog_of_war: {
        Row: {
          created_at: string
          grid_positions: Json
          id: string
          is_revealed: boolean | null
          session_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          grid_positions?: Json
          id?: string
          is_revealed?: boolean | null
          session_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          grid_positions?: Json
          id?: string
          is_revealed?: boolean | null
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fog_of_war_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          properties: string[] | null
          rarity: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          properties?: string[] | null
          rarity?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          properties?: string[] | null
          rarity?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      maps: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      master_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          last_updated: string
          table_id: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          last_updated?: string
          table_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          last_updated?: string
          table_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_notes_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      monsters: {
        Row: {
          ac: number
          alignment: string
          challenge: number
          created_at: string
          hp: number
          id: string
          name: string
          size: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ac?: number
          alignment?: string
          challenge?: number
          created_at?: string
          hp?: number
          id?: string
          name: string
          size?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ac?: number
          alignment?: string
          challenge?: number
          created_at?: string
          hp?: number
          id?: string
          name?: string
          size?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          read: boolean | null
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          read?: boolean | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          read?: boolean | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      npcs: {
        Row: {
          alignment: string | null
          appearance: string | null
          background: string | null
          connections: string | null
          created_at: string
          id: string
          location: string | null
          motivations: string | null
          name: string
          occupation: string | null
          personality: string[] | null
          race: string
          updated_at: string
          user_id: string
          voice: string | null
        }
        Insert: {
          alignment?: string | null
          appearance?: string | null
          background?: string | null
          connections?: string | null
          created_at?: string
          id?: string
          location?: string | null
          motivations?: string | null
          name: string
          occupation?: string | null
          personality?: string[] | null
          race: string
          updated_at?: string
          user_id: string
          voice?: string | null
        }
        Update: {
          alignment?: string | null
          appearance?: string | null
          background?: string | null
          connections?: string | null
          created_at?: string
          id?: string
          location?: string | null
          motivations?: string | null
          name?: string
          occupation?: string | null
          personality?: string[] | null
          race?: string
          updated_at?: string
          user_id?: string
          voice?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          custom_metadata: Json | null
          display_name: string | null
          email: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_metadata?: Json | null
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_metadata?: Json | null
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      session_timers: {
        Row: {
          created_at: string
          current_turn_user_id: string | null
          id: string
          is_active: boolean
          round_number: number
          session_id: string
          turn_ends_at: string | null
          turn_started_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_turn_user_id?: string | null
          id?: string
          is_active?: boolean
          round_number?: number
          session_id: string
          turn_ends_at?: string | null
          turn_started_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_turn_user_id?: string | null
          id?: string
          is_active?: boolean
          round_number?: number
          session_id?: string
          turn_ends_at?: string | null
          turn_started_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      session_tokens: {
        Row: {
          character_id: string | null
          color: string
          created_at: string
          id: string
          image_url: string | null
          name: string
          session_id: string
          size: number
          token_type: string
          updated_at: string
          user_id: string
          x: number
          y: number
        }
        Insert: {
          character_id?: string | null
          color?: string
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          session_id: string
          size?: number
          token_type?: string
          updated_at?: string
          user_id: string
          x: number
          y: number
        }
        Update: {
          character_id?: string | null
          color?: string
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          session_id?: string
          size?: number
          token_type?: string
          updated_at?: string
          user_id?: string
          x?: number
          y?: number
        }
        Relationships: []
      }
      stories: {
        Row: {
          content: string | null
          created_at: string
          creation_mode: string | null
          id: string
          tags: string[] | null
          title: string
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          creation_mode?: string | null
          id?: string
          tags?: string[] | null
          title: string
          type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          creation_mode?: string | null
          id?: string
          tags?: string[] | null
          title?: string
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      table_join_requests: {
        Row: {
          created_at: string | null
          id: string
          status: string
          table_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          status?: string
          table_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          status?: string
          table_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "table_join_requests_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      table_participants: {
        Row: {
          character_id: string | null
          id: string
          joined_at: string
          role: string | null
          table_id: string
          user_id: string
        }
        Insert: {
          character_id?: string | null
          id?: string
          joined_at?: string
          role?: string | null
          table_id: string
          user_id: string
        }
        Update: {
          character_id?: string | null
          id?: string
          joined_at?: string
          role?: string | null
          table_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_participants_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_participants_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          campaign: string | null
          created_at: string
          description: string | null
          id: string
          max_players: number | null
          meeting_url: string | null
          name: string
          session_paused: boolean | null
          status: string | null
          synopsis: string | null
          system: string | null
          time: string | null
          updated_at: string
          user_id: string
          weekday: string | null
        }
        Insert: {
          campaign?: string | null
          created_at?: string
          description?: string | null
          id?: string
          max_players?: number | null
          meeting_url?: string | null
          name: string
          session_paused?: boolean | null
          status?: string | null
          synopsis?: string | null
          system?: string | null
          time?: string | null
          updated_at?: string
          user_id: string
          weekday?: string | null
        }
        Update: {
          campaign?: string | null
          created_at?: string
          description?: string | null
          id?: string
          max_players?: number | null
          meeting_url?: string | null
          name?: string
          session_paused?: boolean | null
          status?: string | null
          synopsis?: string | null
          system?: string | null
          time?: string | null
          updated_at?: string
          user_id?: string
          weekday?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          id: string
          item_id: string
          item_name: string
          payment_intent_id: string | null
          payment_method: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency: string
          id?: string
          item_id: string
          item_name: string
          payment_intent_id?: string | null
          payment_method?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          item_id?: string
          item_name?: string
          payment_intent_id?: string | null
          payment_method?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_balance: {
        Row: {
          coins: number
          created_at: string | null
          gems: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          coins?: number
          created_at?: string | null
          gems?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          coins?: number
          created_at?: string | null
          gems?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
