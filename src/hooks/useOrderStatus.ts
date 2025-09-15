import { useState, useEffect, useCallback } from 'react';
import { OrderService } from '@/utils/orderService';
import { OrderStatusAPI } from '@/utils/orderStatusApi';

interface OrderStatusUpdate {
  orderId: string;
  status: 'pending' | 'confirmed' | 'rejected';
  timestamp: string;
}

export const useOrderStatus = (orderId: string | null) => {
  const [orderStatus, setOrderStatus] = useState<'pending' | 'confirmed' | 'rejected' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kiểm tra trạng thái đơn hàng từ API (cache + database)
  const checkOrderStatus = useCallback(async () => {
    if (!orderId) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Sử dụng OrderStatusAPI để lấy trạng thái (kiểm tra cache trước, sau đó database)
      const statusResult = await OrderStatusAPI.getOrderStatus(orderId);
      
      if (statusResult.status && statusResult.status !== orderStatus) {
        setOrderStatus(statusResult.status);
        console.log(`🔄 Order ${orderId} status updated to ${statusResult.status}${statusResult.fromCache ? ' (from cache)' : ' (from database)'}`);
      }
    } catch (err) {
      console.error('❌ Error checking order status:', err);
      setError('Không thể kiểm tra trạng thái đơn hàng');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, orderStatus]);

  // Lắng nghe sự kiện cập nhật trạng thái từ webhook
  useEffect(() => {
    if (!orderId) return;

    const handleOrderStatusUpdate = (event: CustomEvent<OrderStatusUpdate>) => {
      if (event.detail.orderId === orderId) {
        console.log(`🔔 Received real-time update for order ${orderId}: ${event.detail.status}`);
        setOrderStatus(event.detail.status);
        setError(null); // Clear any previous errors
      }
    };

    // Lắng nghe custom event từ webhook
    window.addEventListener('orderStatusUpdate', handleOrderStatusUpdate as EventListener);

    // Kiểm tra cache ngay khi component mount
    const checkInitialStatus = async () => {
      try {
        const statusResult = await OrderStatusAPI.getOrderStatus(orderId);
        if (statusResult.status) {
          setOrderStatus(statusResult.status);
          console.log(`📋 Initial status for order ${orderId}: ${statusResult.status}`);
        }
      } catch (err) {
        console.error('Error checking initial status:', err);
      }
    };

    checkInitialStatus();

    return () => {
      window.removeEventListener('orderStatusUpdate', handleOrderStatusUpdate as EventListener);
    };
  }, [orderId]);

  // Polling định kỳ để kiểm tra trạng thái từ API (giảm tần suất vì có real-time updates)
  useEffect(() => {
    if (!orderId || orderStatus === 'confirmed' || orderStatus === 'rejected') {
      return;
    }

    // Polling ít thường xuyên hơn vì có real-time updates từ webhook
    const interval = setInterval(checkOrderStatus, 30000); // Kiểm tra mỗi 30 giây

    return () => clearInterval(interval);
  }, [orderId, orderStatus, checkOrderStatus]);

  // Kiểm tra trạng thái ngay lập tức
  const refreshStatus = useCallback(() => {
    checkOrderStatus();
  }, [checkOrderStatus]);

  return {
    orderStatus,
    isLoading,
    error,
    refreshStatus
  };
};