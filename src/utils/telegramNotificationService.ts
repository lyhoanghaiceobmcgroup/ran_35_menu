import { OrderService } from './orderService';
import { 
  NOTIFICATION_TEMPLATES, 
  NOTIFICATION_SETTINGS, 
  NotificationFormatter,
  NotificationTemplate 
} from '../config/telegramNotificationConfig';

interface BankTransactionData {
  transactionId: string;
  accountNumber: string;
  amount: number;
  content: string;
  transactionDate: string;
  bankName: string;
  transferType: 'in' | 'out';
  orderId?: string;
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

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN || '8019114116:AAGdPUMJI_ECNIRWm7ZtmPNd3MMUXb6ci_E';
const TELEGRAM_CHAT_ID = '-4852894219'; // Order Menu group ID
const BALANCE_NOTIFICATION_CHAT_ID = process.env.BALANCE_NOTIFICATION_CHAT_ID || process.env.VITE_TELEGRAM_CHAT_ID || '-4833394087'; // Có thể tạo group riêng cho thông báo số dư

export class TelegramNotificationService {
  /**
   * Gửi thông báo biến động số dư từ ngân hàng
   */
  static async sendBalanceNotification(transactionData: BankTransactionData): Promise<void> {
    try {
      const template = transactionData.transferType === 'in' 
        ? NOTIFICATION_TEMPLATES.MONEY_IN 
        : NOTIFICATION_TEMPLATES.MONEY_OUT;
      
      // Chuẩn bị dữ liệu để format
      const formatData = {
        ...transactionData,
        transactionDate: NotificationFormatter.formatDateTime(transactionData.transactionDate),
        amount: NotificationFormatter.formatCurrency(transactionData.amount),
        content: NotificationFormatter.formatText(transactionData.content),
        bankName: NotificationFormatter.formatText(transactionData.bankName || 'Ngân hàng'),
        accountNumber: NotificationFormatter.formatText(transactionData.accountNumber)
      };

      // Nếu có orderId, thêm thông tin đơn hàng
      if (transactionData.orderId) {
        try {
          const order = await OrderService.getOrderById(transactionData.orderId);
          if (order) {
            formatData.tableCode = order.table_code;
            formatData.customerPhone = NotificationFormatter.formatPhone(order.customer_phone);
          }
        } catch (error) {
          console.warn('Could not fetch order details:', error);
        }
      }

      const message = this.buildMessageFromTemplate(template, formatData, BALANCE_NOTIFICATION_CHAT_ID);
      await this.sendTelegramMessage(message);
      console.log('📱 Balance notification sent to Telegram');
    } catch (error) {
      console.error('❌ Error sending balance notification:', error);
    }
  }

  /**
   * Gửi thông báo tổng hợp số dư cuối ngày
   */
  static async sendDailySummary(summaryData: {
    totalIncome: number;
    totalExpense: number;
    transactionCount: number;
    date: string;
  }): Promise<void> {
    try {
      const { totalIncome, totalExpense, transactionCount, date } = summaryData;
      const netAmount = totalIncome - totalExpense;
      
      const formatData = {
        date,
        totalIncome,
        totalExpense,
        netAmount: Math.abs(netAmount),
        transactionCount: transactionCount.toString()
      };

      const message = this.buildMessageFromTemplate(
        NOTIFICATION_TEMPLATES.DAILY_SUMMARY, 
        formatData, 
        BALANCE_NOTIFICATION_CHAT_ID
      );

      await this.sendTelegramMessage(message);
      console.log('📱 Daily summary sent to Telegram');
    } catch (error) {
      console.error('❌ Error sending daily summary:', error);
    }
  }

  /**
   * Gửi cảnh báo giao dịch bất thường
   */
  static async sendSuspiciousTransactionAlert(transactionData: BankTransactionData): Promise<void> {
    try {
      const formatData = {
        transactionId: transactionData.transactionId,
        amount: transactionData.amount,
        content: NotificationFormatter.formatText(transactionData.content),
        transactionDate: NotificationFormatter.formatDateTime(transactionData.transactionDate),
        bankName: NotificationFormatter.formatText(transactionData.bankName || 'Ngân hàng')
      };

      const message = this.buildMessageFromTemplate(
        NOTIFICATION_TEMPLATES.SUSPICIOUS_TRANSACTION, 
        formatData, 
        BALANCE_NOTIFICATION_CHAT_ID
      );

      await this.sendTelegramMessage(message);
      console.log('📱 Suspicious transaction alert sent to Telegram');
    } catch (error) {
      console.error('❌ Error sending suspicious transaction alert:', error);
    }
  }

  /**
   * Xây dựng tin nhắn từ template
   */
  private static buildMessageFromTemplate(
    template: NotificationTemplate, 
    data: Record<string, any>, 
    chatId: string
  ): TelegramMessage {
    // Xây dựng tiêu đề
    let messageText = `${template.icon} <b>${template.title}</b>\n\n`;
    
    // Thêm các trường dữ liệu
    template.fields.forEach(field => {
      if (field.required && !data[field.key]) {
        console.warn(`Missing required field: ${field.key}`);
        return;
      }
      
      if (data[field.key] !== undefined && data[field.key] !== null) {
        let value = data[field.key];
        
        // Format dữ liệu theo loại
        switch (field.format) {
          case 'currency':
            value = NotificationFormatter.formatCurrency(Number(value));
            break;
          case 'datetime':
            value = typeof value === 'string' ? value : NotificationFormatter.formatDateTime(value);
            break;
          case 'phone':
            value = NotificationFormatter.formatPhone(String(value));
            break;
          case 'text':
          default:
            value = NotificationFormatter.formatText(String(value));
            break;
        }
        
        messageText += `${NOTIFICATION_SETTINGS.EMOJIS.INFO} <b>${field.label}:</b> ${value}\n`;
      }
    });
    
    // Thêm footer nếu có
    if (template.footer) {
      messageText += `\n${template.footer}`;
    }
    
    // Truncate nếu quá dài
    messageText = NotificationFormatter.truncateMessage(messageText);
    
    const message: TelegramMessage = {
      chat_id: chatId,
      text: messageText,
      parse_mode: NOTIFICATION_SETTINGS.DEFAULT_PARSE_MODE
    };
    
    // Thêm buttons nếu có
    if (template.buttons && template.buttons.length > 0) {
      const validButtons = template.buttons.filter(button => {
        return !button.condition || button.condition(data);
      });
      
      if (validButtons.length > 0) {
        message.reply_markup = {
          inline_keyboard: [validButtons.map(button => ({
            text: button.text,
            callback_data: NotificationFormatter.replaceVariables(button.callbackData, data)
          }))]
        };
      }
    }
    
    return message;
  }

  /**
   * Hàm helper để gửi tin nhắn Telegram
   */
  private static async sendTelegramMessage(message: TelegramMessage): Promise<void> {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Telegram API error: ${response.status} - ${errorText}`);
    }
  }

  /**
   * Trích xuất orderId từ nội dung giao dịch
   */
  static extractOrderIdFromContent(content: string): string | null {
    // Tìm UUID pattern trong nội dung
    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const uuidMatch = content.match(uuidPattern);
    if (uuidMatch) {
      return uuidMatch[0];
    }

    // Tìm pattern RAN{code}{timestamp}
    const ranPattern = /RAN([A-Z0-9]+)/i;
    const ranMatch = content.match(ranPattern);
    if (ranMatch) {
      return ranMatch[1];
    }

    return null;
  }
}