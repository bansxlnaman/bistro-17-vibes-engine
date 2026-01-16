import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCafe } from '@/context/CafeContext';

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  order_number: number | null;
  status: string;
  items: OrderItem[];
  total_amount: number;
  table_number: string;
  special_instructions: string | null;
  created_at: string;
}

export const useOrderTracking = (orderNumberOrId: string | null) => {
  const { cafe } = useCafe();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderNumberOrId || !cafe?.id) {
      setOrder(null);
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);

      // Try to parse as order number (remove # if present)
      const orderNum = orderNumberOrId.replace(/^#/, '');
      const isNumeric = /^\d+$/.test(orderNum);

      let query = supabase
        .from('orders')
        .select('*')
        .eq('cafe_id', cafe.id);

      // Search by order_number if numeric, otherwise by id
      if (isNumeric) {
        query = query.eq('order_number', parseInt(orderNum, 10));
      } else {
        query = query.eq('id', orderNumberOrId);
      }

      const { data, error: fetchError } = await query.single();

      if (fetchError) {
        setError('Order not found. Please check your order ID.');
        setOrder(null);
      } else {
        // Parse JSONB items
        const parsedItems = Array.isArray(data.items) 
          ? (data.items as unknown as OrderItem[])
          : [];
        setOrder({
          ...data,
          items: parsedItems,
        });
      }
      setLoading(false);
    };

    fetchOrder();

    // Subscribe to realtime updates (use order.id if found)
    const subscriptionId = order?.id || orderNumberOrId;
    const channel = supabase
      .channel(`order-${subscriptionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const newData = payload.new as any;
          const parsedItems = Array.isArray(newData.items) 
            ? (newData.items as unknown as OrderItem[])
            : [];
          setOrder({
            ...newData,
            items: parsedItems,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderNumberOrId, cafe?.id]);

  return { order, loading, error };
};
