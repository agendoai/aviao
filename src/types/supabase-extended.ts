
import type { Tables } from '@/integrations/supabase/types';

// Extended profile type that includes the role field
export interface ProfileWithRole extends Omit<Tables<'profiles'>, 'role'> {
  role: 'admin' | 'client' | 'support' | 'concierge' | 'pilot' | 'owner';
}

// Function response types
export interface BookingResponse {
  success?: boolean;
  booking_id?: string;
  error?: string;
}

export interface PriorityRotationResponse {
  success?: boolean;
  error?: string;
}

export interface PreReservationResponse {
  success?: boolean;
  pre_reservation_id?: string;
  priority_position?: number;
  expires_at?: string;
  can_confirm_immediately?: boolean;
  overnight_stays?: number;
  overnight_fee?: number;
  final_cost?: number;
  error?: string;
}

export interface ConfirmReservationResponse {
  success?: boolean;
  booking_id?: string;
  final_cost?: number;
  card_fee?: number;
  blocked_until?: string;
  error?: string;
}

// Extended types for new tables
export type PreReservation = Tables<'pre_reservations'>;
export type PrioritySlot = Tables<'priority_slots'>;
export type ChatRoom = Tables<'chat_rooms'>;
export type ChatMessage = Tables<'chat_messages'>;
export type SeatSharing = Tables<'seat_sharing'>;
export type Passenger = Tables<'passengers'>;

// Aircraft with seat configuration
export interface AircraftWithSeats extends Tables<'aircraft'> {
  seat_configuration: {
    total_seats: number;
    layout: string;
    seats: Array<{
      number: number;
      row: number;
      position: string;
      type: string;
    }>;
  };
}

// Booking with extended information - fix passengers type conflict
export interface BookingWithDetails extends Omit<Tables<'bookings'>, 'passengers'> {
  aircraft: Tables<'aircraft'>;
  passenger_list?: Passenger[];
  passenger_count: number;
}

// Database function names for RPC calls - Updated to include new functions
export type DatabaseFunction = 
  | 'create_booking_secure'
  | 'rotate_priorities'
  | 'create_pre_reservation'
  | 'confirm_pre_reservation'
  | 'auto_confirm_expired_reservations';
