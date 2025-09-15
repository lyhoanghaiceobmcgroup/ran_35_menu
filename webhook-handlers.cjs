// CommonJS version của TelegramWebhookHandler và OrderStatusAPI cho webhook server
const fetch = require('node-fetch');

// Mock OrderService cho webhook server
class OrderService {
  static async updateOrderStatus(orderId, status, updatedBy) {
    console.log(`📝 Updating order ${orderId} to ${status} by user ${updatedBy}`);
    // Trong thực tế, đây sẽ kết nối với Supabase
    // Hiện tại chỉ mock để webhook server hoạt động
    return true;
  }

  static async getOrderById(orderId) {
    console.log(`🔍 Getting order ${orderId}`);
    // Mock order data
    return {
      id: orderId,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}

// OrderStatusAPI cho webhook server
class OrderStatusAPI {
  static statusUpdates = new Map();

  static notifyStatusUpdate(orderId, status, updatedBy) {
    this.statusUpdates.set(orderId, {
      status,
      timestamp: new Date().toISOString(),
      updatedBy
    });
    
    console.log(`📢 Order ${orderId} status updated to ${status}`);
    
    // Tự động xóa sau 1 giờ
    setTimeout(() => {
      this.statusUpdates.delete(orderId);
    }, 60 * 60 * 1000);
  }

  static async getOrderStatus(orderId) {
    try {
      const cachedUpdate = this.statusUpdates.get(orderId);
      if (cachedUpdate) {
        return {
          ...cachedUpdate,
          fromCache: true
        };
      }

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

  static getRecentUpdates() {
    return Array.from(this.statusUpdates.entries()).map(([orderId, update]) => ({
      orderId,
      ...update
    }));
  }
}

const TELEGRAM_BOT_TOKEN = '7227042614:AAGeG3EZqSFVysFA-UU8mCw6o76UJrbCtJE';

class TelegramWebhookHandler {
  static async handleWebhook(update) {
    try {
      console.log('📨 Processing webhook update:', JSON.stringify(update, null, 2));
      
      if (!update.callback_query) {
        return { success: false, message: 'No callback query found' };
      }

      const callbackQuery = update.callback_query;
      const callbackData = callbackQuery.data;
      
      console.log(`🔍 Processing callback data: ${callbackData}`);
      
      // Parse callback data (format: "confirm_orderId" hoặc "reject_orderId")
      const [action, orderId] = callbackData.split('_');
      
      if (!orderId || !['confirm', 'reject'].includes(action)) {
        return { success: false, message: 'Invalid callback data format' };
      }

      console.log(`⚡ Action: ${action}, Order ID: ${orderId}`);

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

      // Cập nhật tin nhắn gốc
      if (callbackQuery.message) {
        await this.editMessageReplyMarkup(
          callbackQuery.message.chat.id,
          callbackQuery.message.message_id,
          orderId,
          status,
          callbackQuery.from.first_name
        );
      }

      // Thông báo cho website
      await this.notifyWebsite(orderId, status);

      console.log(`✅ Webhook processed successfully: Order ${orderId} ${status}`);
      return { success: true, message: `Order ${orderId} ${status}` };
    } catch (error) {
      console.error('❌ Error handling webhook:', error);
      return { success: false, message: 'Internal server error' };
    }
  }

  static async answerCallbackQuery(callbackQueryId, text) {
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
      console.log(`📱 Callback query answered: ${text}`);
    } catch (error) {
      console.error('Error answering callback query:', error);
    }
  }

  static async editMessageReplyMarkup(chatId, messageId, orderId, status, confirmedBy) {
    try {
      const statusText = status === 'confirmed' 
        ? `✅ Đã xác nhận bởi ${confirmedBy}`
        : `❌ Đã từ chối bởi ${confirmedBy}`;
      
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageReplyMarkup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [[
              {
                text: statusText,
                callback_data: 'completed'
              }
            ]]
          }
        })
      });
      console.log(`📝 Message updated: ${statusText}`);
    } catch (error) {
      console.error('Error editing message:', error);
    }
  }

  static async notifyWebsite(orderId, status) {
    try {
      console.log(`📢 Notifying website: Order ${orderId} status updated to ${status}`);
      
      // Lưu thông báo vào OrderStatusAPI
      OrderStatusAPI.notifyStatusUpdate(orderId, status);
      
      console.log(`✅ Website notification completed for order ${orderId}`);
    } catch (error) {
      console.error('❌ Error notifying website:', error);
    }
  }

  static async setWebhook(webhookUrl) {
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
}

module.exports = {
  TelegramWebhookHandler,
  OrderStatusAPI,
  OrderService
};