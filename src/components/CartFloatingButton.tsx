import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
import { CartItem } from '@/data/menuData';

interface CartFloatingButtonProps {
  cartItems: CartItem[];
  onOpenCart: () => void;
}

export const CartFloatingButton: React.FC<CartFloatingButtonProps> = ({
  cartItems,
  onOpenCart
}) => {
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <Button
        onClick={onOpenCart}
        className="w-full h-14 text-base font-semibold bistro-floating-shadow bistro-transition"
        variant="bistro"
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 text-xs bg-bistro-gold">
                {totalItems}
              </Badge>
            </div>
            <span>Giỏ hàng</span>
          </div>
          
          <span className="font-bold">
            {formatPrice(totalPrice)}đ
          </span>
        </div>
      </Button>
    </div>
  );
};