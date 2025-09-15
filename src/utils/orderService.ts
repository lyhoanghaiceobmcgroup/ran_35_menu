import { supabase } from '@/integrations/supabase/client';
import { CartItem } from '@/data/menuData';

interface OrderData {
  phone: string;
  tableCode: string;
  items: CartItem[];
  totalAmount: number;
  notes?: string;
}

interface TelegramMessage {
  chat_id: string;
  text: string;
  reply_markup?: {
    inline_keyboard: Array<Array<{
      text: string;
      callback_data: string;
    }>>;
  };
}

const TELEGRAM_BOT_TOKEN = '7227042614:AAGeG3EZqSFVysFA-UU8mCw6o76UJrbCtJE';
const TELEGRAM_GROUP_ID = '-4852894219'; // Order Menu group ID

export class OrderService {
  // Lưu đơn hàng vào Supabase
  static async saveOrder(orderData: OrderData): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          phone: orderData.phone,
          table_code: orderData.tableCode,
          items: orderData.items,
          total_amount: orderData.totalAmount,
          notes: orderData.notes || null,
          status: 'pending'
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error saving order:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error saving order:', error);
      return null;
    }
  }

  // Gửi thông tin đơn hàng đến Telegram
  static async sendOrderToTelegram(orderId: string, orderData: OrderData): Promise<boolean> {
    try {
      // Tạo nội dung tin nhắn
      const itemsList = orderData.items.map(item => 
        `• ${item.name} x${item.quantity} - ${(item.price * item.quantity).toLocaleString('vi-VN')}đ\n` +
        (item.modifiers && item.modifiers.length > 0 ? 
          `  Tùy chọn: ${item.modifiers.join(', ')}\n` : '') +
        (item.notes ? `  Ghi chú: ${item.notes}\n` : '')
      ).join('\n');

      const message = `🍽️ **ĐƠN HÀNG MỚI**\n\n` +
        `📋 Mã đơn: ${orderId}\n` +
        `📞 SĐT: ${orderData.phone}\n` +
        `🪑 Bàn: ${orderData.tableCode}\n\n` +
        `📝 **CHI TIẾT MÓN:**\n${itemsList}\n` +
        `💰 **Tổng tiền: ${orderData.totalAmount.toLocaleString('vi-VN')}đ**\n\n` +
        (orderData.notes ? `📝 Ghi chú: ${orderData.notes}\n\n` : '') +
        `⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}`;

      // Tạo inline keyboard với nút xác nhận/từ chối
      const telegramMessage: TelegramMessage = {
        chat_id: TELEGRAM_GROUP_ID,
        text: message,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '✅ Xác nhận',
                callback_data: `confirm_${orderId}`
              },
              {
                text: '❌ Từ chối',
                callback_data: `reject_${orderId}`
              }
            ]
          ]
        }
      };

      // Gửi tin nhắn đến Telegram
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(telegramMessage)
      });

      if (!response.ok) {
        console.error('Error sending to Telegram:', await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending to Telegram:', error);
      return false;
    }
  }

  // Cập nhật trạng thái đơn hàng
  static async updateOrderStatus(orderId: string, status: 'confirmed' | 'rejected', confirmedBy?: number): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (confirmedBy) {
        updateData.confirmed_by = confirmedBy;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  }

  // Cập nhật thông tin đơn hàng (generic update method)
  static async updateOrder(orderId: string, updateData: Record<string, any>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating order:', error);
      return false;
    }
  }

  // Lấy thông tin đơn hàng theo ID
  static async getOrderById(orderId: string) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Error getting order:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting order:', error);
      return null;
    }
  }

  // Xử lý đơn hàng hoàn chỉnh (lưu + gửi Telegram)
  static async processOrder(orderData: OrderData): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      // Lưu đơn hàng vào database
      const orderId = await this.saveOrder(orderData);
      if (!orderId) {
        return { success: false, error: 'Không thể lưu đơn hàng vào database' };
      }

      // Gửi đến Telegram
      const telegramSuccess = await this.sendOrderToTelegram(orderId, orderData);
      if (!telegramSuccess) {
        return { success: false, orderId, error: 'Đã lưu đơn hàng nhưng không thể gửi đến Telegram' };
      }

      return { success: true, orderId };
    } catch (error) {
      console.error('Error processing order:', error);
      return { success: false, error: 'Lỗi không xác định khi xử lý đơn hàng' };
    }
  }
}