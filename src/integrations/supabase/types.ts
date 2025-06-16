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
          max_passengers: number
          model: string
          name: string
          registration: string
          status: Database["public"]["Enums"]["aircraft_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          hourly_rate?: number
          id?: string
          max_passengers?: number
          model: string
          name: string
          registration: string
          status?: Database["public"]["Enums"]["aircraft_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          hourly_rate?: number
          id?: string
          max_passengers?: number
          model?: string
          name?: string
          registration?: string
          status?: Database["public"]["Enums"]["aircraft_status"]
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          aircraft_id: string
          airport_fees: number
          created_at: string
          departure_date: string
          departure_time: string
          destination: string
          flight_hours: number
          id: string
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
          created_at?: string
          departure_date: string
          departure_time: string
          destination: string
          flight_hours: number
          id?: string
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
          created_at?: string
          departure_date?: string
          departure_time?: string
          destination?: string
          flight_hours?: number
          id?: string
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
          updated_at?: string
        }
        Relationships: []
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
