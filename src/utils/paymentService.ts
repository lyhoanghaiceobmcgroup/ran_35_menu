import { OrderService } from './orderService';
import { SepayService } from './sepayService';
import { TelegramNotificationService } from './telegramNotificationService';

interface PaymentData {
  orderId: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
  amount: number;
  tableCode: string;
  customerPhone: string;
  timestamp?: string;
}

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown';
  reply_markup?: {
    inline_keyboard: Array<Array<{
      text: string;
      callback_data: string;
    }>>;
  };
}

const TELEGRAM_BOT_TOKEN = '7227042614:AAGeG3EZqSFVysFA-UU8mCw6o76UJrbCtJE';
const TELEGRAM_CHAT_ID = '-4852894219'; // Order Menu group ID
const WEBHOOK_SERVER_URL = 'http://localhost:3001';

export class PaymentService {
  // Gửi thông tin thanh toán về webhook server và telegram bot
  static async processPayment(paymentData: PaymentData): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🔄 Processing payment:', paymentData);
      
      // 1. Lưu thông tin thanh toán vào database
      const orderUpdateSuccess = await this.updateOrderPaymentInfo(paymentData);
      if (!orderUpdateSuccess) {
        throw new Error('Failed to update order payment information');
      }
      
      // 2. Log thông tin thanh toán chuyển khoản (webhook đã được cấu hình tự động)
      if (paymentData.paymentMethod === 'BANK_TRANSFER') {
        console.log('🔗 Bank transfer payment initiated for order:', paymentData.orderId);
        console.log('💰 Amount:', paymentData.amount);
        console.log('📱 Webhook URL configured:', import.meta.env.VITE_SEPAY_WEBHOOK_URL);
      }
      
      // 3. Gửi thông báo đến Telegram bot
      const telegramSuccess = await this.sendTelegramNotification(paymentData);
      if (!telegramSuccess) {
        console.warn('⚠️ Failed to send Telegram notification, but payment was processed');
      }
      
      // 4. Gửi thông tin đến webhook server (nếu có)
      await this.notifyWebhookServer(paymentData);
      
      console.log('✅ Payment processed successfully');
      return { success: true, message: 'Payment processed successfully' };
      
    } catch (error) {
      console.error('❌ Error processing payment:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  // Cập nhật thông tin thanh toán trong database
  private static async updateOrderPaymentInfo(paymentData: PaymentData): Promise<boolean> {
    try {
      // Cập nhật order với thông tin thanh toán
      const updateData = {
        payment_method: paymentData.paymentMethod,
        payment_status: 'pending',
        payment_amount: paymentData.amount,
        updated_at: new Date().toISOString()
      };
      
      const success = await OrderService.updateOrder(paymentData.orderId, updateData);
      console.log(`💾 Database update ${success ? 'successful' : 'failed'} for order ${paymentData.orderId}`);
      
      return success;
    } catch (error) {
      console.error('❌ Error updating order payment info:', error);
      return false;
    }
  }
  
  // Gửi thông báo đến Telegram bot
  private static async sendTelegramNotification(paymentData: PaymentData): Promise<boolean> {
    try {
      const message = this.formatTelegramMessage(paymentData);
      
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      });
      
      const result = await response.json();
      
      if (result.ok) {
        console.log('📱 Telegram notification sent successfully');
        return true;
      } else {
        console.error('❌ Telegram API error:', result);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending Telegram notification:', error);
      return false;
    }
  }
  
  // Format tin nhắn Telegram
  private static formatTelegramMessage(paymentData: PaymentData): TelegramMessage {
    const { orderId, paymentMethod, amount, tableCode, customerPhone } = paymentData;
    const timestamp = new Date().toLocaleString('vi-VN');
    
    const paymentMethodText = paymentMethod === 'CASH' ? '💵 Thanh toán tiền mặt' : '🏦 Thanh toán chuyển khoản';
    const amountFormatted = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
    
    const messageText = `🔔 <b>ĐƠN HÀNG MỚI - THÔNG TIN THANH TOÁN</b>\n\n` +
      `📋 <b>Mã đơn hàng:</b> ${orderId}\n` +
      `🏷️ <b>Bàn số:</b> ${tableCode}\n` +
      `📞 <b>Số điện thoại:</b> ${customerPhone}\n` +
      `💰 <b>Tổng tiền:</b> ${amountFormatted}\n` +
      `💳 <b>Phương thức:</b> ${paymentMethodText}\n` +
      `⏰ <b>Thời gian:</b> ${timestamp}\n\n`;
    
    if (paymentMethod === 'CASH') {
      return {
        chat_id: TELEGRAM_CHAT_ID,
        text: messageText + `✅ <i>Khách hàng sẽ thanh toán tiền mặt khi nhận hàng</i>`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            {
              text: '✅ Xác nhận đơn hàng',
              callback_data: `confirm_${orderId}`
            },
            {
              text: '❌ Từ chối',
              callback_data: `reject_${orderId}`
            }
          ]]
        }
      };
    } else {
      return {
        chat_id: TELEGRAM_CHAT_ID,
        text: messageText + `⏳ <i>Đang chờ khách hàng chuyển khoản. Vui lòng kiểm tra tài khoản ngân hàng.</i>`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            {
              text: '✅ Đã nhận tiền - Xác nhận',
              callback_data: `confirm_${orderId}`
            },
            {
              text: '❌ Chưa nhận tiền - Từ chối',
              callback_data: `reject_${orderId}`
            }
          ]]
        }
      };
    }
  }
  
  // Thông báo đến webhook server (optional)
  private static async notifyWebhookServer(paymentData: PaymentData): Promise<void> {
    // Log payment information instead of calling external webhook server
    console.log('📋 Payment processed:', {
      orderId: paymentData.orderId,
      method: paymentData.paymentMethod,
      amount: paymentData.amount,
      table: paymentData.tableCode,
      timestamp: new Date().toISOString()
    });
    console.log('✅ Payment data logged successfully');
  }
  
  // Kiểm tra trạng thái thanh toán
  static async checkPaymentStatus(orderId: string): Promise<{
    status: 'pending' | 'confirmed' | 'rejected' | null;
    timestamp?: string;
  }> {
    try {
      // Kiểm tra từ webhook server trước
      const response = await fetch(`${WEBHOOK_SERVER_URL}/api/order-status/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return {
            status: data.status,
            timestamp: data.timestamp
          };
        }
      }
      
      // Fallback: kiểm tra từ database
      const order = await OrderService.getOrderById(orderId);
      if (order) {
        return {
          status: order.status || 'pending',
          timestamp: order.updated_at || order.created_at
        };
      }
      
      return { status: null };
    } catch (error) {
      console.error('❌ Error checking payment status:', error);
      return { status: null };
    }
  }
  
  // Xử lý webhook từ Sepay
  static async handleSepayWebhook(webhookData: any): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔄 Processing Sepay webhook:', webhookData);
      
      // Xác thực webhook từ Sepay
      const isValid = SepayService.verifyWebhook(webhookData);
      if (!isValid) {
        return { success: false, message: 'Invalid webhook signature' };
      }

      // Tìm đơn hàng dựa trên reference code
      const orderId = SepayService.extractOrderIdFromWebhook(webhookData);
      if (!orderId) {
        return { success: false, message: 'Order ID not found in webhook data' };
      }

      // Cập nhật trạng thái đơn hàng
      const updateData = {
        payment_status: 'confirmed',
        status: 'confirmed',
        updated_at: new Date().toISOString()
      };
      
      const updateResult = await OrderService.updateOrder(orderId, updateData);
      if (!updateResult) {
        return { success: false, message: 'Failed to update order status' };
      }

      // Lấy thông tin đơn hàng để gửi thông báo
      const order = await OrderService.getOrderById(orderId);
      if (order) {
        // Tạo dữ liệu thanh toán để gửi thông báo
        const paymentData: PaymentData = {
          orderId: order.id,
          paymentMethod: 'BANK_TRANSFER',
          amount: order.total_amount,
          tableCode: order.table_code,
          customerPhone: order.customer_phone,
          timestamp: new Date().toISOString()
        };
        
        // Gửi thông báo Telegram về thanh toán thành công
        await this.sendTelegramPaymentConfirmation(paymentData);
        
        // Gửi thông báo biến động số dư từ ngân hàng
        await TelegramNotificationService.sendBalanceNotification({
          transactionId: webhookData.id || 'UNKNOWN',
          accountNumber: webhookData.accountNumber || webhookData.bankAccount || 'UNKNOWN',
          amount: webhookData.transferAmount || webhookData.amountIn || 0,
          content: webhookData.content || 'Thanh toán đơn hàng',
          transactionDate: webhookData.transactionDate || new Date().toISOString(),
          bankName: webhookData.bankName || 'Ngân hàng',
          transferType: 'in',
          orderId: order.id
        });
      }

      console.log('✅ Payment confirmed for order:', orderId);
      return { success: true, message: 'Payment processed successfully' };
    } catch (error) {
      console.error('❌ Error processing Sepay webhook:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  // Gửi thông báo Telegram khi thanh toán được xác nhận
  private static async sendTelegramPaymentConfirmation(paymentData: PaymentData): Promise<void> {
    try {
      const { orderId, amount, tableCode, customerPhone } = paymentData;
      const timestamp = new Date().toLocaleString('vi-VN');
      
      const amountFormatted = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(amount);
      
      const messageText = `✅ <b>THANH TOÁN THÀNH CÔNG</b>\n\n` +
        `📋 <b>Mã đơn hàng:</b> ${orderId}\n` +
        `🏷️ <b>Bàn số:</b> ${tableCode}\n` +
        `📞 <b>Số điện thoại:</b> ${customerPhone}\n` +
        `💰 <b>Số tiền:</b> ${amountFormatted}\n` +
        `🏦 <b>Phương thức:</b> Chuyển khoản ngân hàng\n` +
        `⏰ <b>Thời gian:</b> ${timestamp}\n\n` +
        `🎉 <i>Đơn hàng đã được thanh toán thành công qua chuyển khoản!</i>`;
      
      const message: TelegramMessage = {
        chat_id: TELEGRAM_CHAT_ID,
        text: messageText,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            {
              text: '🍳 Bắt đầu chế biến',
              callback_data: `start_cooking_${orderId}`
            },
            {
              text: '📋 Xem chi tiết',
              callback_data: `view_details_${orderId}`
            }
          ]]
        }
      };
      
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      });
      
      if (response.ok) {
        console.log('📱 Payment confirmation sent to Telegram');
      } else {
        console.error('❌ Failed to send payment confirmation to Telegram');
      }
    } catch (error) {
      console.error('❌ Error sending payment confirmation:', error);
    }
  }
}