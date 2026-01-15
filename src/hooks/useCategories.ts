import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCafe } from '@/context/CafeContext';

export interface Category {
  id: string;
  cafe_id: string;
  name: string;
  icon: string;
  description: string | null;
  display_order: number;
}

export const useCategories = () => {
  const { cafe } = useCafe();

  return useQuery({
    queryKey: ['categories', cafe?.id],
    queryFn: async (): Promise<Category[]> => {
      if (!cafe?.id) return [];

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('cafe_id', cafe.id)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!cafe?.id,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCategoryMutations = () => {
  const { cafe } = useCafe();
  const queryClient = useQueryClient();

  const createCategory = useMutation({
    mutationFn: async (category: Omit<Category, 'id' | 'cafe_id'>) => {
      if (!cafe?.id) throw new Error('No cafe context');

      const { data, error } = await supabase
        .from('categories')
        .insert({
          ...category,
          cafe_id: cafe.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', cafe?.id] });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Category> & { id: string }) => {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', cafe?.id] });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', cafe?.id] });
    },
  });

  return { createCategory, updateCategory, deleteCategory };
};
