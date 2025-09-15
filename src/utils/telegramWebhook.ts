import { OrderService } from './orderService';
import { OrderStatusAPI } from './orderStatusApi';

interface TelegramCallbackQuery {
  id: string;
  from: {
    id: number;
    first_name: string;
    username?: string;
  };
  message?: {
    message_id: number;
    chat: {
      id: number;
    };
    text: string;
  };
  data: string;
}

interface TelegramUpdate {
  update_id: number;
  callback_query?: TelegramCallbackQuery;
}

const TELEGRAM_BOT_TOKEN = '7227042614:AAGeG3EZqSFVysFA-UU8mCw6o76UJrbCtJE';

export class TelegramWebhookHandler {
  // Xử lý webhook từ Telegram
  static async handleWebhook(update: TelegramUpdate): Promise<{ success: boolean; message?: string }> {
    try {
      if (!update.callback_query) {
        return { success: false, message: 'No callback query found' };
      }

      const callbackQuery = update.callback_query;
      const callbackData = callbackQuery.data;
      
      // Parse callback data (format: "confirm_orderId" hoặc "reject_orderId")
      const [action, orderId] = callbackData.split('_');
      
      if (!orderId || !['confirm', 'reject'].includes(action)) {
        return { success: false, message: 'Invalid callback data format' };
      }

      // Cập nhật trạng thái đơn hàng
      const status = action === 'confirm' ? 'confirmed' : 'rejected';
      const updateSuccess = await OrderService.updateOrderStatus(
        orderId, 
        status, 
        callbackQuery.from.id
      );

      if (!updateSuccess) {
        await this.answerCallbackQuery(
          callbackQuery.id, 
          '❌ Lỗi cập nhật trạng thái đơn hàng'
        );
        return { success: false, message: 'Failed to update order status' };
      }

      // Gửi phản hồi cho người dùng Telegram
      const responseText = action === 'confirm' 
        ? `✅ Đơn hàng ${orderId} đã được xác nhận bởi ${callbackQuery.from.first_name}`
        : `❌ Đơn hàng ${orderId} đã bị từ chối bởi ${callbackQuery.from.first_name}`;

      await this.answerCallbackQuery(callbackQuery.id, responseText);

      // Cập nhật tin nhắn gốc để hiển thị trạng thái mới
      if (callbackQuery.message) {
        await this.editMessageReplyMarkup(
          callbackQuery.message.chat.id,
          callbackQuery.message.message_id,
          orderId,
          status,
          callbackQuery.from.first_name
        );
      }

      // Thông báo cho website về việc cập nhật trạng thái
      await this.notifyWebsite(orderId, status);

      return { success: true, message: `Order ${orderId} ${status}` };
    } catch (error) {
      console.error('Error handling webhook:', error);
      return { success: false, message: 'Internal server error' };
    }
  }

  // Trả lời callback query
  private static async answerCallbackQuery(callbackQueryId: string, text: string): Promise<void> {
    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text,
          show_alert: true
        })
      });
    } catch (error) {
      console.error('Error answering callback query:', error);
    }
  }

  // Cập nhật tin nhắn để hiển thị trạng thái mới
  private static async editMessageReplyMarkup(
    chatId: number, 
    messageId: number, 
    orderId: string, 
    status: 'confirmed' | 'rejected',
    confirmedBy: string
  ): Promise<void> {
    try {
      const statusText = status === 'confirmed' ? '✅ ĐÃ XÁC NHẬN' : '❌ ĐÃ TỪ CHỐI';
      const statusEmoji = status === 'confirmed' ? '✅' : '❌';
      
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageReplyMarkup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: `${statusEmoji} ${statusText} - ${confirmedBy}`,
                  callback_data: `status_${orderId}_${status}`
                }
              ]
            ]
          }
        })
      });
    } catch (error) {
      console.error('Error editing message reply markup:', error);
    }
  }

  // Thông báo cho website về việc cập nhật trạng thái (có thể sử dụng WebSocket hoặc polling)
  private static async notifyWebsite(orderId: string, status: 'confirmed' | 'rejected'): Promise<void> {
    try {
      console.log(`📢 Notifying website: Order ${orderId} status updated to ${status}`);
      
      // Lưu thông báo vào OrderStatusAPI để client có thể polling
      OrderStatusAPI.notifyStatusUpdate(orderId, status);
      
      // Nếu chạy trên client-side (có window object), cũng dispatch event
      if (typeof window !== 'undefined') {
        // Dispatch custom event cho các component đang lắng nghe
        window.dispatchEvent(new CustomEvent('orderStatusUpdate', {
          detail: { orderId, status, timestamp: new Date().toISOString() }
        }));
        
        console.log(`🔔 Custom event dispatched for order ${orderId}`);
      }
      
      console.log(`✅ Website notification completed for order ${orderId}`);
    } catch (error) {
      console.error('❌ Error notifying website:', error);
    }
  }

  // Thiết lập webhook URL cho Telegram bot
  static async setWebhook(webhookUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['callback_query']
        })
      });

      const result = await response.json();
      return result.ok;
    } catch (error) {
      console.error('Error setting webhook:', error);
      return false;
    }
  }

  // Xóa webhook
  static async deleteWebhook(): Promise<boolean> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook`, {
        method: 'POST'
      });

      const result = await response.json();
      return result.ok;
    } catch (error) {
      console.error('Error deleting webhook:', error);
      return false;
    }
  }
}