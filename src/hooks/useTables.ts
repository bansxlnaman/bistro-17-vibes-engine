import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCafe } from '@/context/CafeContext';

export interface Table {
  id: string;
  cafe_id: string;
  table_number: string;
  is_active: boolean;
  qr_code_url: string | null;
  created_at: string;
}

export const useTables = () => {
  const { cafe } = useCafe();

  return useQuery({
    queryKey: ['tables', cafe?.id],
    queryFn: async (): Promise<Table[]> => {
      if (!cafe?.id) return [];

      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('cafe_id', cafe.id)
        .order('table_number', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!cafe?.id,
    staleTime: 1000 * 60 * 5,
  });
};

export const useTableMutations = () => {
  const { cafe } = useCafe();
  const queryClient = useQueryClient();

  const createTable = useMutation({
    mutationFn: async (tableNumber: string) => {
      if (!cafe?.id) throw new Error('No cafe context');

      const { data, error } = await supabase
        .from('tables')
        .insert({
          table_number: tableNumber,
          cafe_id: cafe.id,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables', cafe?.id] });
    },
  });

  const updateTable = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Table> & { id: string }) => {
      const { data, error } = await supabase
        .from('tables')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables', cafe?.id] });
    },
  });

  const deleteTable = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables', cafe?.id] });
    },
  });

  const createBulkTables = useMutation({
    mutationFn: async (count: number) => {
      if (!cafe?.id) throw new Error('No cafe context');

      const tables = Array.from({ length: count }, (_, i) => ({
        table_number: String(i + 1),
        cafe_id: cafe.id,
        is_active: true,
      }));

      const { data, error } = await supabase
        .from('tables')
        .insert(tables)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables', cafe?.id] });
    },
  });

  return { createTable, updateTable, deleteTable, createBulkTables };
};
