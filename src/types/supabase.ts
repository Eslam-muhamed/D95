export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      gaming_stations: {
        Row: {
          category: string
          created_at: string | null
          device_type: string
          display_order: number | null
          id: string
          is_active: boolean
          multi_rate_per_hour: number | null
          name: string
          rate_per_hour: number
          rate_per_match: number | null
          status: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          device_type?: string
          display_order?: number | null
          id: string
          is_active?: boolean
          multi_rate_per_hour?: number | null
          name: string
          rate_per_hour?: number
          rate_per_match?: number | null
          status?: string
        }
        Update: {
          category?: string
          created_at?: string | null
          device_type?: string
          display_order?: number | null
          id?: string
          is_active?: boolean
          multi_rate_per_hour?: number | null
          name?: string
          rate_per_hour?: number
          rate_per_match?: number | null
          status?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          badge: string | null
          created_at: string
          description: string | null
          detail: string | null
          display_order: number | null
          highlight: boolean | null
          icon: string | null
          id: string
          is_active: boolean | null
          original_price: string | null
          price: string | null
          title: string
        }
        Insert: {
          badge?: string | null
          created_at?: string
          description?: string | null
          detail?: string | null
          display_order?: number | null
          highlight?: boolean | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          original_price?: string | null
          price?: string | null
          title: string
        }
        Update: {
          badge?: string | null
          created_at?: string
          description?: string | null
          detail?: string | null
          display_order?: number | null
          highlight?: boolean | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          original_price?: string | null
          price?: string | null
          title?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          delivery_address: string | null
          id: string
          items: Json
          notes: string | null
          order_number: string
          order_type: string
          payment_method: string | null
          status: string
          subtotal: number
          table_number: string | null
          total_amount: number
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_number: string
          order_type?: string
          payment_method?: string | null
          status?: string
          subtotal?: number
          table_number?: string | null
          total_amount?: number
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          order_type?: string
          payment_method?: string | null
          status?: string
          subtotal?: number
          table_number?: string | null
          total_amount?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          badge: string | null
          category_id: string | null
          created_at: string
          currency: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_available: boolean | null
          is_cold: boolean | null
          is_hot: boolean | null
          name: string
          original_price: number | null
          price: number
          slug: string | null
          tags: string[] | null
        }
        Insert: {
          badge?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_cold?: boolean | null
          is_hot?: boolean | null
          name: string
          original_price?: number | null
          price?: number
          slug?: string | null
          tags?: string[] | null
        }
        Update: {
          badge?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_cold?: boolean | null
          is_hot?: boolean | null
          name?: string
          original_price?: number | null
          price?: number
          slug?: string | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      ps_bookings: {
        Row: {
          booking_date: string
          created_at: string
          customer_name: string
          customer_phone: string
          discount_amount: number | null
          duration_hours: number | null
          end_datetime: string
          end_time: string
          id: string
          notes: string | null
          payment_method: string
          reservation_id: string
          room_id: string
          room_name: string
          snacks: Json | null
          snacks_total: number | null
          start_datetime: string
          start_time: string
          status: string
          subtotal: number | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          booking_date: string
          created_at?: string
          customer_name: string
          customer_phone: string
          discount_amount?: number | null
          duration_hours?: number | null
          end_datetime: string
          end_time: string
          id?: string
          notes?: string | null
          payment_method: string
          reservation_id: string
          room_id?: string
          room_name: string
          snacks?: Json | null
          snacks_total?: number | null
          start_datetime: string
          start_time: string
          status?: string
          subtotal?: number | null
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          booking_date?: string
          created_at?: string
          customer_name?: string
          customer_phone?: string
          discount_amount?: number | null
          duration_hours?: number | null
          end_datetime?: string
          end_time?: string
          id?: string
          notes?: string | null
          payment_method?: string
          reservation_id?: string
          room_id?: string
          room_name?: string
          snacks?: Json | null
          snacks_total?: number | null
          start_datetime?: string
          start_time?: string
          status?: string
          subtotal?: number | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      staff_users: {
        Row: {
          created_at: string | null
          email: string
          role: string
        }
        Insert: {
          created_at?: string | null
          email: string
          role: string
        }
        Update: {
          created_at?: string | null
          email?: string
          role?: string
        }
        Relationships: []
      }
      station_sessions: {
        Row: {
          created_at: string | null
          customer_name: string | null
          customer_phone: string | null
          discount_amount: number | null
          elapsed_seconds: number | null
          ended_at: string | null
          grand_total: number | null
          hourly_rate: number
          id: string
          is_multi: boolean | null
          notes: string | null
          orders: Json | null
          orders_total: number | null
          pause_time: string | null
          payment_method: string | null
          pricing_mode: string
          start_time: string
          started_by: string | null
          station_id: string
          status: string
          target_minutes: number | null
          time_system: string
          total_time_cost: number | null
        }
        Insert: {
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number | null
          elapsed_seconds?: number | null
          ended_at?: string | null
          grand_total?: number | null
          hourly_rate?: number
          id?: string
          is_multi?: boolean | null
          notes?: string | null
          orders?: Json | null
          orders_total?: number | null
          pause_time?: string | null
          payment_method?: string | null
          pricing_mode?: string
          start_time?: string
          started_by?: string | null
          station_id: string
          status?: string
          target_minutes?: number | null
          time_system?: string
          total_time_cost?: number | null
        }
        Update: {
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number | null
          elapsed_seconds?: number | null
          ended_at?: string | null
          grand_total?: number | null
          hourly_rate?: number
          id?: string
          is_multi?: boolean | null
          notes?: string | null
          orders?: Json | null
          orders_total?: number | null
          pause_time?: string | null
          payment_method?: string | null
          pricing_mode?: string
          start_time?: string
          started_by?: string | null
          station_id?: string
          status?: string
          target_minutes?: number | null
          time_system?: string
          total_time_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "station_sessions_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "gaming_stations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_cancel_expired_pending_bookings: { Args: never; Returns: number }
      cleanup_test_bookings: { Args: never; Returns: number }
      confirm_booking_and_resolve_conflicts: {
        Args: { p_auto_cancel_conflicts?: boolean; p_booking_id: string }
        Returns: Json
      }
      create_booking_atomic: { Args: { p_booking: Json }; Returns: Json }
      create_order_atomic: { Args: { p_order: Json }; Returns: Json }
      create_ps_booking_atomic: {
        Args: {
          p_booking_date: string
          p_customer_name: string
          p_customer_phone: string
          p_duration_hours: number
          p_notes?: string
          p_payment_method: string
          p_promo_code?: string
          p_reservation_id: string
          p_room_id: string
          p_room_name: string
          p_snacks?: Json
          p_start_datetime: string
        }
        Returns: {
          booking_date: string
          created_at: string
          customer_name: string
          customer_phone: string
          discount_amount: number | null
          duration_hours: number | null
          end_datetime: string
          end_time: string
          id: string
          notes: string | null
          payment_method: string
          reservation_id: string
          room_id: string
          room_name: string
          snacks: Json | null
          snacks_total: number | null
          start_datetime: string
          start_time: string
          status: string
          subtotal: number | null
          total_amount: number
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "ps_bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      extend_booking_atomic: {
        Args: { p_booking_id: string; p_shifts: Json; p_target_updates: Json }
        Returns: Json
      }
      get_booking_by_reservation_id: {
        Args: { p_reservation_id: string }
        Returns: Json
      }
      get_booking_metrics_v2: { Args: never; Returns: Json }
      get_order_metrics_v2: { Args: never; Returns: Json }
      get_room_occupied_intervals:
        | {
            Args: { p_business_date: string; p_room_id: string }
            Returns: {
              end_datetime: string
              start_datetime: string
            }[]
          }
        | {
            Args: {
              p_business_date: string
              p_room_id: string
              p_window_end?: string
              p_window_start?: string
            }
            Returns: {
              end_datetime: string
              start_datetime: string
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

