
import type { Tables } from '@/integrations/supabase/types';

// Extended profile type that includes the role field
export interface ProfileWithRole extends Omit<Tables<'profiles'>, 'role'> {
  role: 'admin' | 'client' | 'support' | 'concierge' | 'pilot';
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
