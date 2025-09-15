import { useState, useCallback } from 'react';
import { CartItem, MenuItem } from '@/data/menuData';

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = useCallback((item: MenuItem, quantity: number = 1, modifiers: { [key: string]: string } = {}, note?: string) => {
    const cartItem: CartItem = {
      id: `${item.id}-${Date.now()}`,
      item_id: item.id,
      quantity,
      modifiers,
      note,
      price: item.price // This should calculate with modifiers in real app
    };

    setCartItems(prev => [...prev, cartItem]);
  }, []);

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    setCartItems(prev => 
      prev.map(item => 
        item.id === cartItemId 
          ? { ...item, quantity }
          : item
      )
    );
  }, []);

  const removeFromCart = useCallback((cartItemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== cartItemId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getTotalItems = useCallback(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const getTotalPrice = useCallback(() => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cartItems]);

  return {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalItems,
    getTotalPrice
  };
};