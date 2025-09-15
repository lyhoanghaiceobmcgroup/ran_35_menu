import React, { useState, useEffect } from 'react';
import { TableHeader } from '@/components/TableHeader';
import { PhoneVerification } from '@/components/PhoneVerification';
import { MenuCategories } from '@/components/MenuCategories';
import { MenuGrid } from '@/components/MenuGrid';
import { CartFloatingButton } from '@/components/CartFloatingButton';
import { CartSheet } from '@/components/CartSheet';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { PaymentOptions } from '@/components/PaymentOptions';
import { QRPayment } from '@/components/QRPayment';
import { PaymentService } from '@/utils/paymentService';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { useOrderStatus } from '@/hooks/useOrderStatus';
import { OrderService } from '@/utils/orderService';
import { 
  tableInfo, 
  menuCategories, 
  menuItems, 
  MenuItem 
} from '@/data/menuData';

type AppStep = 'phone-verification' | 'menu' | 'confirmation' | 'payment' | 'qr-payment' | 'completed';

const Index = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>('phone-verification');
  const [customerPhone, setCustomerPhone] = useState('');
  const [activeCategory, setActiveCategory] = useState('new');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | null>(null);
  
  const { 
    cartItems, 
    addToCart, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    getTotalPrice 
  } = useCart();
  
  const { toast } = useToast();
  const { orderStatus, refreshStatus } = useOrderStatus(orderNumber || null);

  // Get table code from URL params (simulating QR scan)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tableParam = urlParams.get('table');
    if (tableParam) {
      // Update table info if needed
    }
  }, []);

  const handlePhoneVerified = (phone: string) => {
    setCustomerPhone(phone);
    setCurrentStep('menu');
  };

  const handleAddToCart = (item: MenuItem) => {
    addToCart(item);
    toast({
      title: "Đã thêm vào giỏ hàng",
      description: `${item.name} đã được thêm vào giỏ hàng`,
    });
  };

  const handleSubmitOrder = async (notes?: string) => {
    if (cartItems.length === 0) return;
    
    setIsSubmittingOrder(true);
    
    try {
      const orderData = {
        phone: customerPhone,
        tableCode: tableInfo.table_code,
        items: cartItems,
        totalAmount: getTotalPrice(),
        notes: notes || orderNotes
      };

      const result = await OrderService.processOrder(orderData);
      
      if (result.success && result.orderId) {
         setOrderNumber(result.orderId);
         setIsCartOpen(false);
         setIsConfirmationOpen(true);
         setCurrentStep('confirmation');
        
        toast({
          title: "Đơn hàng đã gửi",
          description: "Đơn hàng của bạn đã được gửi tới nhà bếp để xác nhận",
        });
      } else {
        toast({
          title: "Lỗi gửi đơn hàng",
          description: result.error || "Không thể gửi đơn hàng. Vui lòng thử lại.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      toast({
        title: "Lỗi gửi đơn hàng",
        description: "Đã xảy ra lỗi khi gửi đơn hàng. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
       setIsSubmittingOrder(false);
     }
   };

  const handleOrderConfirmed = () => {
    setIsConfirmationOpen(false);
    setCurrentStep('payment');
  };

  // Xử lý khi trạng thái đơn hàng thay đổi
  useEffect(() => {
    if (orderStatus === 'confirmed' && currentStep === 'confirmation') {
      toast({
        title: "Đơn hàng đã được xác nhận!",
        description: "Nhà hàng đã xác nhận đơn hàng của bạn. Vui lòng chọn phương thức thanh toán.",
      });
      handleOrderConfirmed();
    } else if (orderStatus === 'rejected' && currentStep === 'confirmation') {
      toast({
        title: "Đơn hàng bị từ chối",
        description: "Rất tiếc, đơn hàng của bạn đã bị từ chối. Vui lòng thử lại hoặc liên hệ nhà hàng.",
        variant: "destructive"
      });
      setCurrentStep('menu');
      setIsConfirmationOpen(false);
    }
  }, [orderStatus, currentStep, toast]);

  const handleAddMore = () => {
    setCurrentStep('menu');
    setIsConfirmationOpen(false);
  };

  const handlePaymentMethodSelect = (method: 'CASH' | 'BANK_TRANSFER') => {
    setSelectedPaymentMethod(method);
    
    if (method === 'CASH') {
      // Xử lý thanh toán tiền mặt - gửi thông tin về database và telegram
      handleCashPayment();
    } else if (method === 'BANK_TRANSFER') {
      // Chuyển đến màn hình QR payment
      setCurrentStep('qr-payment');
    }
  };

  const handleCashPayment = async () => {
    try {
      setIsSubmittingOrder(true);
      
      // Gửi thông tin thanh toán tiền mặt về webhook và telegram
      const paymentData = {
        orderId: orderNumber,
        paymentMethod: 'CASH' as const,
        amount: getTotalPrice(),
        tableCode: tableInfo.table_code,
        customerPhone: customerPhone
      };

      const result = await PaymentService.processPayment(paymentData);
      
      if (result.success) {
        toast({
          title: "Đã xác nhận thanh toán tiền mặt",
          description: "Thông tin đã được gửi đến nhà hàng",
        });
        setCurrentStep('completed');
      } else {
        throw new Error(result.message || 'Payment processing failed');
      }
    } catch (error) {
      console.error('Error processing cash payment:', error);
      toast({
        title: "Lỗi xử lý thanh toán",
        description: "Không thể xử lý thanh toán. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleQRPaymentComplete = async () => {
    try {
      setIsSubmittingOrder(true);
      
      // Xử lý khi người dùng xác nhận đã chuyển khoản
      const paymentData = {
        orderId: orderNumber,
        paymentMethod: 'BANK_TRANSFER' as const,
        amount: getTotalPrice(),
        tableCode: tableInfo.table_code,
        customerPhone: customerPhone
      };

      const result = await PaymentService.processPayment(paymentData);
      
      if (result.success) {
        toast({
          title: "Đã xác nhận chuyển khoản",
          description: "Thông tin đã được gửi đến nhà hàng để xác minh",
        });
        setCurrentStep('completed');
      } else {
        throw new Error(result.message || 'Payment processing failed');
      }
    } catch (error) {
      console.error('Error processing bank transfer:', error);
      toast({
        title: "Lỗi xử lý thanh toán",
        description: "Không thể xử lý thanh toán. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleBackToPaymentOptions = () => {
    setCurrentStep('payment');
    setSelectedPaymentMethod(null);
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (activeCategory === 'new') return item.tags.includes('new');
    if (activeCategory === 'bestseller') return item.tags.includes('bestseller');
    return item.category_id === activeCategory;
  });

  if (currentStep === 'phone-verification') {
    return (
      <PhoneVerification 
        tableCode={tableInfo.table_code}
        onVerified={handlePhoneVerified}
      />
    );
  }

  if (currentStep === 'payment') {
    return (
      <PaymentOptions 
        orderTotal={getTotalPrice()}
        onPaymentMethodSelect={handlePaymentMethodSelect}
      />
    );
  }

  if (currentStep === 'qr-payment') {
    return (
      <QRPayment 
        orderTotal={getTotalPrice()}
        orderId={orderNumber}
        onPaymentComplete={handleQRPaymentComplete}
        onBack={handleBackToPaymentOptions}
      />
    );
  }

  if (currentStep === 'completed') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 mx-auto bg-bistro-success/10 rounded-full flex items-center justify-center">
            <span className="text-3xl">🎉</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-bistro-success mb-2">
              Đặt món thành công!
            </h1>
            <p className="text-muted-foreground">
              Đơn hàng của bạn đang được chế biến. Cảm ơn bạn đã sử dụng dịch vụ RanBistro!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TableHeader tableInfo={tableInfo} />
      
      <MenuCategories 
        categories={menuCategories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      
      <main className="pb-24">
        <MenuGrid 
          items={filteredMenuItems}
          onAddToCart={handleAddToCart}
        />
      </main>

      <CartFloatingButton 
        cartItems={cartItems}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <CartSheet 
        isOpen={isCartOpen}
        onOpenChange={setIsCartOpen}
        cartItems={cartItems}
        menuItems={menuItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onSubmitOrder={handleSubmitOrder}
        isSubmitting={isSubmittingOrder}
      />

      <ConfirmationModal 
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        orderNumber={orderNumber}
        tableCode={tableInfo.table_code}
        onConfirmed={handleOrderConfirmed}
        onAddMore={handleAddMore}
        orderStatus={orderStatus}
        onRefreshStatus={refreshStatus}
      />
    </div>
  );
};

export default Index;
