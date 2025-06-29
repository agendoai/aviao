
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Booking = Tables<'bookings'>;
type BookingInsert = Omit<Booking, 'id' | 'created_at' | 'updated_at'>;

export const useBookings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: bookings = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      console.log('Fetching bookings for user:', user.id);
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          aircraft:aircraft_id (
            name,
            model,
            registration
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        throw error;
      }
      
      console.log('Bookings fetched:', data);
      return data || [];
    },
    enabled: !!user,
  });

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: BookingInsert) => {
      console.log('Creating booking:', bookingData);
      
      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (error) {
        console.error('Error creating booking:', error);
        throw error;
      }
      
      console.log('Booking created:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success("Reserva criada com sucesso!");
    },
    onError: (error) => {
      console.error('Error creating booking:', error);
      toast.error("Erro ao criar reserva. Tente novamente.");
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      console.log('Cancelling booking:', bookingId);
      
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) {
        console.error('Error cancelling booking:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success("Reserva cancelada com sucesso.");
    },
    onError: (error) => {
      console.error('Error cancelling booking:', error);
      toast.error("Erro ao cancelar reserva. Tente novamente.");
    },
  });

  return {
    bookings,
    isLoading,
    error,
    createBooking: createBookingMutation.mutate,
    cancelBooking: cancelBookingMutation.mutate,
    isCreating: createBookingMutation.isPending,
    isCancelling: cancelBookingMutation.isPending,
  };
};
