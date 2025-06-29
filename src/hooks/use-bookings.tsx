
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Booking = Tables<'bookings'>;
type BookingInsert = Omit<Booking, 'id' | 'created_at' | 'updated_at'>;

export const useBookings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's bookings
  const {
    data: bookings = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
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

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Create new booking
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: BookingInsert) => {
      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: "Reserva Criada",
        description: "Sua reserva foi criada com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Error creating booking:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar reserva. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Cancel booking
  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: "Reserva Cancelada",
        description: "Sua reserva foi cancelada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Erro",
        description: "Erro ao cancelar reserva. Tente novamente.",
        variant: "destructive",
      });
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
