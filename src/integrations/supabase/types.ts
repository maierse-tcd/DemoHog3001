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
      content_images: {
        Row: {
          content_id: string
          created_at: string
          height: number
          id: string
          image_path: string
          image_type: string
          mime_type: string
          original_filename: string | null
          updated_at: string
          user_id: string
          width: number
        }
        Insert: {
          content_id: string
          created_at?: string
          height: number
          id?: string
          image_path: string
          image_type: string
          mime_type: string
          original_filename?: string | null
          updated_at?: string
          user_id: string
          width: number
        }
        Update: {
          content_id?: string
          created_at?: string
          height?: number
          id?: string
          image_path?: string
          image_type?: string
          mime_type?: string
          original_filename?: string | null
          updated_at?: string
          user_id?: string
          width?: number
        }
        Relationships: []
      }
      content_items: {
        Row: {
          age_rating: string | null
          backdrop_url: string | null
          created_at: string | null
          description: string | null
          duration: string | null
          genre: string[]
          id: string
          poster_url: string | null
          release_year: string | null
          title: string
          trending: boolean | null
          type: string
          updated_at: string | null
        }
        Insert: {
          age_rating?: string | null
          backdrop_url?: string | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          genre?: string[]
          id?: string
          poster_url?: string | null
          release_year?: string | null
          title: string
          trending?: boolean | null
          type: string
          updated_at?: string | null
        }
        Update: {
          age_rating?: string | null
          backdrop_url?: string | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          genre?: string[]
          id?: string
          poster_url?: string | null
          release_year?: string | null
          title?: string
          trending?: boolean | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          access_password: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          is_admin: boolean | null
          is_kids: boolean | null
          name: string | null
          updated_at: string
        }
        Insert: {
          access_password?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          is_admin?: boolean | null
          is_kids?: boolean | null
          name?: string | null
          updated_at?: string
        }
        Update: {
          access_password?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_admin?: boolean | null
          is_kids?: boolean | null
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string
          features: string[]
          id: string
          image_url: string | null
          name: string
          price: string
          recommended: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          features?: string[]
          id: string
          image_url?: string | null
          name: string
          price: string
          recommended?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          features?: string[]
          id?: string
          image_url?: string | null
          name?: string
          price?: string
          recommended?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      user_my_list: {
        Row: {
          content_ids: string[] | null
          created_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content_ids?: string[] | null
          created_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content_ids?: string[] | null
          created_at?: string | null
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
      seed_content_items: {
        Args: { content_items: Json }
        Returns: undefined
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
  public: {
    Enums: {},
  },
} as const
