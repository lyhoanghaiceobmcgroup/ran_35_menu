import { OrderService } from './orderService';

// API service để xử lý polling trạng thái đơn hàng
export class OrderStatusAPI {
  private static statusUpdates: Map<string, {
    status: 'pending' | 'confirmed' | 'rejected';
    timestamp: string;
    updatedBy?: number;
  }> = new Map();

  // Lưu thông báo cập nhật trạng thái từ webhook
  static notifyStatusUpdate(
    orderId: string, 
    status: 'confirmed' | 'rejected', 
    updatedBy?: number
  ): void {
    this.statusUpdates.set(orderId, {
      status,
      timestamp: new Date().toISOString(),
      updatedBy
    });
    
    console.log(`📢 Order ${orderId} status updated to ${status}`);
    
    // Tự động xóa sau 1 giờ để tránh memory leak
    setTimeout(() => {
      this.statusUpdates.delete(orderId);
    }, 60 * 60 * 1000);
  }

  // Lấy trạng thái đơn hàng từ webhook server API hoặc database
  static async getOrderStatus(orderId: string): Promise<{
    status: 'pending' | 'confirmed' | 'rejected' | null;
    timestamp?: string;
    updatedBy?: number;
    fromCache?: boolean;
  }> {
    try {
      // Kiểm tra cache local trước
      const cachedUpdate = this.statusUpdates.get(orderId);
      if (cachedUpdate) {
        return {
          ...cachedUpdate,
          fromCache: true
        };
      }

      // Thử gọi webhook server API trước
      try {
        const response = await fetch(`http://localhost:3001/api/order-status/${orderId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.status) {
            console.log(`🌐 Got status from webhook server: ${data.status}${data.fromCache ? ' (cached)' : ' (database)'}`);
            return {
              status: data.status,
              timestamp: data.timestamp,
              updatedBy: data.updatedBy,
              fromCache: data.fromCache
            };
          }
        }
      } catch (webhookError) {
        console.log('⚠️ Webhook server not available, falling back to direct database');
      }

      // Fallback: Lấy từ database trực tiếp
      const order = await OrderService.getOrderById(orderId);
      if (order) {
        return {
          status: order.status,
          timestamp: order.updated_at || order.created_at,
          fromCache: false
        };
      }

      return { status: null };
    } catch (error) {
      console.error('Error getting order status:', error);
      return { status: null };
    }
  }

  // Lấy tất cả cập nhật gần đây (cho debugging)
  static getRecentUpdates(): Array<{
    orderId: string;
    status: string;
    timestamp: string;
    updatedBy?: number;
  }> {
    return Array.from(this.statusUpdates.entries()).map(([orderId, update]) => ({
      orderId,
      ...update
    }));
  }

  // Xóa cache cho một đơn hàng
  static clearOrderCache(orderId: string): void {
    this.statusUpdates.delete(orderId);
  }

  // Xóa tất cả cache
  static clearAllCache(): void {
    this.statusUpdates.clear();
  }
}

// Export singleton instance
export const orderStatusAPI = OrderStatusAPI;