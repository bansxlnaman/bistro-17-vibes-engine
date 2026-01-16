import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MenuItem } from '@/hooks/useMenuItems';

export interface CartItem extends Omit<MenuItem, 'isAvailable'> {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  tableNumber: string;
  setTableNumber: (table: string) => void;
  addItem: (item: MenuItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
  specialInstructions: string;
  setSpecialInstructions: (instructions: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const addItem = (item: MenuItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      // Convert MenuItem to CartItem
      const cartItem: CartItem = {
        id: item.id,
        name: item.name,
        price: item.price,
        description: item.description,
        isVeg: item.isVeg,
        category_id: item.category_id,
        category_name: item.category_name,
        image: item.image,
        isPopular: item.isPopular,
        quantity: 1
      };
      return [...prev, cartItem];
    });
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems(prev => prev.map(i => 
      i.id === itemId ? { ...i, quantity } : i
    ));
  };

  const clearCart = () => {
    setItems([]);
    setSpecialInstructions('');
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      items,
      tableNumber,
      setTableNumber,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalAmount,
      specialInstructions,
      setSpecialInstructions,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
