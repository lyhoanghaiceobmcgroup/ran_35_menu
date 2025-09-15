import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Minus, Plus, Trash2, Send } from 'lucide-react';
import { CartItem, MenuItem } from '@/data/menuData';

interface CartSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cartItems: CartItem[];
  menuItems: MenuItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onSubmitOrder: (notes?: string) => void;
  isSubmitting?: boolean;
}

export const CartSheet: React.FC<CartSheetProps> = ({
  isOpen,
  onOpenChange,
  cartItems,
  menuItems,
  onUpdateQuantity,
  onRemoveItem,
  onSubmitOrder,
  isSubmitting = false
}) => {
  const [notes, setNotes] = React.useState('');
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const getMenuItem = (itemId: string) => {
    return menuItems.find(item => item.id === itemId);
  };

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="w-full max-w-md mx-auto h-[75vh] flex flex-col p-0 rounded-t-2xl shadow-2xl">
        <SheetHeader className="px-4 py-3 border-b bg-background sticky top-0 z-10">
          <SheetTitle className="flex items-center gap-2 text-left">
            Giỏ hàng
            <Badge variant="secondary" className="text-xs">{totalItems} món</Badge>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Xem và quản lý các món ăn trong giỏ hàng của bạn
          </SheetDescription>
        </SheetHeader>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <span className="text-2xl">🛒</span>
              </div>
              <p className="text-muted-foreground">Giỏ hàng trống</p>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Tiếp tục chọn món
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 max-h-[45vh]">
              {cartItems.map((cartItem) => {
                const menuItem = getMenuItem(cartItem.item_id);
                if (!menuItem) return null;

                return (
                  <div key={cartItem.id} className="border border-border rounded-lg p-2.5 bg-card/50 backdrop-blur-sm">
                    <div className="flex gap-2.5">
                      <img 
                        src={menuItem.image} 
                        alt={menuItem.name}
                        className="w-12 h-12 object-cover rounded-lg flex-shrink-0 shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm leading-tight mb-1 truncate">{menuItem.name}</h4>
                        {Object.keys(cartItem.modifiers).length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1">
                            {Object.entries(cartItem.modifiers).map(([key, value]) => (
                              <Badge key={key} variant="outline" className="text-[9px] px-1.5 py-0.5 h-4 bg-bistro-cream/30">
                                {value}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {cartItem.note && (
                          <p className="text-[10px] text-muted-foreground/80 mb-1 line-clamp-1 italic">
                            {cartItem.note}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-bistro-primary text-sm">
                            {formatPrice(cartItem.price)}đ
                          </p>
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-7 h-7 p-0 rounded-full"
                              onClick={() => onUpdateQuantity(cartItem.id, cartItem.quantity - 1)}
                              disabled={cartItem.quantity <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="font-semibold text-sm min-w-[2rem] text-center bg-muted/50 rounded px-2 py-0.5">
                              {cartItem.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-7 h-7 p-0 rounded-full"
                              onClick={() => onUpdateQuantity(cartItem.id, cartItem.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(cartItem.id)}
                        className="text-destructive hover:text-destructive w-7 h-7 p-0 flex-shrink-0 rounded-full hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    
                    <div className="flex justify-end mt-2 pt-2 border-t border-border/50">
                      <span className="font-bold text-sm text-bistro-primary">
                        {formatPrice(cartItem.price * cartItem.quantity)}đ
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t bg-background/95 backdrop-blur-sm px-3 py-3 space-y-2.5 sticky bottom-0 shadow-lg">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-base">Tổng cộng:</span>
                  <span className="font-bold text-xl text-bistro-primary">{formatPrice(total)}đ</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  *Giá đã bao gồm thuế VAT
                </p>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Ghi chú đơn hàng
                  </label>
                  <Textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ít cay, không hành..."
                    className="text-sm resize-none border-bistro-cream/30 focus:border-bistro-primary"
                    rows={2}
                    disabled={isSubmitting}
                  />
                </div>

                <Button 
                  onClick={() => onSubmitOrder(notes)}
                  disabled={isSubmitting}
                  className="w-full h-12 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  variant="bistro"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Gửi yêu cầu gọi món
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};