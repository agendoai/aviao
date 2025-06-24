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
      aircraft: {
        Row: {
          created_at: string
          hourly_rate: number
          id: string
          last_maintenance: string | null
          maintenance_status: string | null
          max_passengers: number
          model: string
          name: string
          next_maintenance: string | null
          owner_id: string | null
          registration: string
          seat_configuration: Json | null
          status: Database["public"]["Enums"]["aircraft_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          hourly_rate?: number
          id?: string
          last_maintenance?: string | null
          maintenance_status?: string | null
          max_passengers?: number
          model: string
          name: string
          next_maintenance?: string | null
          owner_id?: string | null
          registration: string
          seat_configuration?: Json | null
          status?: Database["public"]["Enums"]["aircraft_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          hourly_rate?: number
          id?: string
          last_maintenance?: string | null
          maintenance_status?: string | null
          max_passengers?: number
          model?: string
          name?: string
          next_maintenance?: string | null
          owner_id?: string | null
          registration?: string
          seat_configuration?: Json | null
          status?: Database["public"]["Enums"]["aircraft_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aircraft_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_passengers: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          passenger_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          passenger_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          passenger_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_passengers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_passengers_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "passengers"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          aircraft_id: string
          airport_fees: number
          blocked_until: string | null
          created_at: string
          departure_date: string
          departure_time: string
          destination: string
          flight_hours: number
          id: string
          maintenance_buffer_hours: number | null
          notes: string | null
          origin: string
          overnight_fee: number
          overnight_stays: number
          passengers: number
          priority_expires_at: string | null
          return_date: string
          return_time: string
          status: Database["public"]["Enums"]["booking_status"]
          stops: string | null
          total_cost: number
          updated_at: string
          user_id: string
        }
        Insert: {
          aircraft_id: string
          airport_fees: number
          blocked_until?: string | null
          created_at?: string
          departure_date: string
          departure_time: string
          destination: string
          flight_hours: number
          id?: string
          maintenance_buffer_hours?: number | null
          notes?: string | null
          origin: string
          overnight_fee?: number
          overnight_stays?: number
          passengers?: number
          priority_expires_at?: string | null
          return_date: string
          return_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          stops?: string | null
          total_cost: number
          updated_at?: string
          user_id: string
        }
        Update: {
          aircraft_id?: string
          airport_fees?: number
          blocked_until?: string | null
          created_at?: string
          departure_date?: string
          departure_time?: string
          destination?: string
          flight_hours?: number
          id?: string
          maintenance_buffer_hours?: number | null
          notes?: string | null
          origin?: string
          overnight_fee?: number
          overnight_stays?: number
          passengers?: number
          priority_expires_at?: string | null
          return_date?: string
          return_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          stops?: string | null
          total_cost?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          message_type: string
          metadata: Json | null
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          message_type?: string
          metadata?: Json | null
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          message_type?: string
          metadata?: Json | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          id: string
          joined_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          booking_id: string | null
          created_at: string
          created_by: string
          id: string
          pre_reservation_id: string | null
          title: string
          type: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          pre_reservation_id?: string | null
          title: string
          type?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          pre_reservation_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_pre_reservation_id_fkey"
            columns: ["pre_reservation_id"]
            isOneToOne: false
            referencedRelation: "pre_reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_recharges: {
        Row: {
          amount: number
          created_at: string
          external_payment_id: string | null
          id: string
          metadata: Json | null
          payment_method_id: string | null
          payment_method_type: string
          processed_at: string | null
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          external_payment_id?: string | null
          id?: string
          metadata?: Json | null
          payment_method_id?: string | null
          payment_method_type: string
          processed_at?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          external_payment_id?: string | null
          id?: string
          metadata?: Json | null
          payment_method_id?: string | null
          payment_method_type?: string
          processed_at?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_recharges_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      passengers: {
        Row: {
          birth_date: string
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          rg: string | null
          updated_at: string
        }
        Insert: {
          birth_date: string
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          rg?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          rg?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          bank_account_info: Json | null
          card_brand: string | null
          card_holder_name: string | null
          card_number_last_four: string | null
          created_at: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          pix_key: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_account_info?: Json | null
          card_brand?: string | null
          card_holder_name?: string | null
          card_number_last_four?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          pix_key?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_account_info?: Json | null
          card_brand?: string | null
          card_holder_name?: string | null
          card_number_last_four?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          pix_key?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pre_reservations: {
        Row: {
          aircraft_id: string
          created_at: string
          departure_date: string
          departure_time: string
          destination: string
          expires_at: string
          flight_hours: number
          id: string
          origin: string
          overnight_fee: number | null
          overnight_stays: number | null
          passengers: number
          payment_method: string | null
          priority_position: number
          return_date: string
          return_time: string
          status: string
          total_cost: number
          updated_at: string
          user_id: string
        }
        Insert: {
          aircraft_id: string
          created_at?: string
          departure_date: string
          departure_time: string
          destination: string
          expires_at: string
          flight_hours: number
          id?: string
          origin: string
          overnight_fee?: number | null
          overnight_stays?: number | null
          passengers?: number
          payment_method?: string | null
          priority_position: number
          return_date: string
          return_time: string
          status?: string
          total_cost: number
          updated_at?: string
          user_id: string
        }
        Update: {
          aircraft_id?: string
          created_at?: string
          departure_date?: string
          departure_time?: string
          destination?: string
          expires_at?: string
          flight_hours?: number
          id?: string
          origin?: string
          overnight_fee?: number | null
          overnight_stays?: number | null
          passengers?: number
          payment_method?: string | null
          priority_position?: number
          return_date?: string
          return_time?: string
          status?: string
          total_cost?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pre_reservations_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      priority_slots: {
        Row: {
          acquired_date: string | null
          created_at: string
          id: string
          is_available: boolean
          owner_id: string | null
          price_paid: number | null
          slot_number: number
          updated_at: string
        }
        Insert: {
          acquired_date?: string | null
          created_at?: string
          id?: string
          is_available?: boolean
          owner_id?: string | null
          price_paid?: number | null
          slot_number: number
          updated_at?: string
        }
        Update: {
          acquired_date?: string | null
          created_at?: string
          id?: string
          is_available?: boolean
          owner_id?: string | null
          price_paid?: number | null
          slot_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "priority_slots_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          balance: number
          created_at: string
          email: string
          id: string
          membership_tier: Database["public"]["Enums"]["membership_tier"]
          monthly_fee_status: Database["public"]["Enums"]["monthly_fee_status"]
          name: string
          priority_position: number
          role: string | null
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          email: string
          id: string
          membership_tier?: Database["public"]["Enums"]["membership_tier"]
          monthly_fee_status?: Database["public"]["Enums"]["monthly_fee_status"]
          name: string
          priority_position: number
          role?: string | null
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          email?: string
          id?: string
          membership_tier?: Database["public"]["Enums"]["membership_tier"]
          monthly_fee_status?: Database["public"]["Enums"]["monthly_fee_status"]
          name?: string
          priority_position?: number
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      seat_sharing: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          passenger_id: string | null
          price_per_seat: number | null
          seat_number: number
          seat_owner_id: string
          seat_passenger_id: string | null
          status: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          passenger_id?: string | null
          price_per_seat?: number | null
          seat_number: number
          seat_owner_id: string
          seat_passenger_id?: string | null
          status?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          passenger_id?: string | null
          price_per_seat?: number | null
          seat_number?: number
          seat_owner_id?: string
          seat_passenger_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "seat_sharing_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seat_sharing_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "passengers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seat_sharing_seat_owner_id_fkey"
            columns: ["seat_owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seat_sharing_seat_passenger_id_fkey"
            columns: ["seat_passenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          description: string
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          description: string
          id?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          description?: string
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_confirm_expired_reservations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      confirm_pre_reservation: {
        Args: { p_pre_reservation_id: string; p_payment_method: string }
        Returns: Json
      }
      create_booking_secure: {
        Args: {
          p_aircraft_id: string
          p_departure_date: string
          p_departure_time: string
          p_return_date: string
          p_return_time: string
          p_origin: string
          p_destination: string
          p_passengers: number
          p_flight_hours: number
          p_airport_fees: number
          p_overnight_stays?: number
          p_stops?: string
          p_notes?: string
        }
        Returns: Json
      }
      create_pre_reservation: {
        Args: {
          p_aircraft_id: string
          p_departure_date: string
          p_departure_time: string
          p_return_date: string
          p_return_time: string
          p_origin: string
          p_destination: string
          p_passengers: number
          p_flight_hours: number
          p_total_cost: number
        }
        Returns: Json
      }
      process_credit_recharge: {
        Args: {
          p_amount: number
          p_payment_method_id?: string
          p_payment_method_type?: string
          p_external_payment_id?: string
        }
        Returns: Json
      }
      rotate_priorities: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      aircraft_status: "available" | "in_flight" | "maintenance"
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      membership_tier: "basic" | "premium" | "vip"
      monthly_fee_status: "paid" | "pending" | "overdue"
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
    Enums: {
      aircraft_status: ["available", "in_flight", "maintenance"],
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      membership_tier: ["basic", "premium", "vip"],
      monthly_fee_status: ["paid", "pending", "overdue"],
    },
  },
} as const
