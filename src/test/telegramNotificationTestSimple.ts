/**
 * Test đơn giản cho Telegram Notification Service
 * Không phụ thuộc vào browser APIs
 */

// Mock localStorage cho Node.js environment
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    length: 0,
    key: () => null
  } as Storage;
}

// Mock fetch nếu cần
if (typeof fetch === 'undefined') {
  global.fetch = async (url: string, options?: any) => {
    console.log(`🌐 Mock fetch call to: ${url}`);
    console.log('📤 Request options:', options);
    
    // Mock response cho Telegram API
    return {
      ok: true,
      status: 200,
      json: async () => ({ ok: true, result: { message_id: 123 } })
    } as Response;
  };
}

import type { BankTransactionData } from '../utils/bankWebhookService';

// Interface cho Telegram Message (copy từ telegramNotificationService)
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

// Constants (copy từ telegramNotificationService)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8019114116:AAGdPUMJI_ECNIRWm7ZtmPNd3MMUXb6ci_E';
const BALANCE_NOTIFICATION_CHAT_ID = process.env.BALANCE_NOTIFICATION_CHAT_ID || '-4833394087';

/**
 * Test service đơn giản
 */
class SimpleTelegramTest {
  /**
   * Gửi message test đến Telegram
   */
  static async sendTestMessage(message: TelegramMessage): Promise<void> {
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      
      console.log('📱 Sending Telegram message...');
      console.log('🎯 Chat ID:', message.chat_id);
      console.log('📝 Message:', message.text.substring(0, 100) + '...');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Message sent successfully:', result.result?.message_id);
      } else {
        console.error('❌ Failed to send message:', response.status);
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  }

  /**
   * Test thông báo tiền vào
   */
  static async testMoneyInNotification(): Promise<void> {
    console.log('\n💰 Testing money in notification...');
    
    const message: TelegramMessage = {
      chat_id: BALANCE_NOTIFICATION_CHAT_ID,
      text: `💰 <b>TIỀN VÀO</b>\n\n` +
        `🏦 <b>Ngân hàng:</b> Vietcombank\n` +
        `💵 <b>Số tiền:</b> +150,000 VND\n` +
        `📝 <b>Nội dung:</b> NGUYEN VAN A chuyen tien DH001\n` +
        `🆔 <b>Mã GD:</b> TEST_001\n` +
        `⏰ <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}\n\n` +
        `🔍 <b>Đơn hàng:</b> DH001\n` +
        `📊 <i>Thông báo tự động từ hệ thống</i>`,
      parse_mode: 'HTML'
    };

    await this.sendTestMessage(message);
  }

  /**
   * Test thông báo tiền ra
   */
  static async testMoneyOutNotification(): Promise<void> {
    console.log('\n💸 Testing money out notification...');
    
    const message: TelegramMessage = {
      chat_id: BALANCE_NOTIFICATION_CHAT_ID,
      text: `💸 <b>TIỀN RA</b>\n\n` +
        `🏦 <b>Ngân hàng:</b> Vietcombank\n` +
        `💵 <b>Số tiền:</b> -50,000 VND\n` +
        `📝 <b>Nội dung:</b> Rut tien ATM\n` +
        `🆔 <b>Mã GD:</b> TEST_002\n` +
        `⏰ <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}\n\n` +
        `📊 <i>Thông báo tự động từ hệ thống</i>`,
      parse_mode: 'HTML'
    };

    await this.sendTestMessage(message);
  }

  /**
   * Test thông báo giao dịch bất thường
   */
  static async testSuspiciousNotification(): Promise<void> {
    console.log('\n🚨 Testing suspicious transaction notification...');
    
    const message: TelegramMessage = {
      chat_id: BALANCE_NOTIFICATION_CHAT_ID,
      text: `🚨 <b>CẢNH BÁO GIAO DỊCH BẤT THƯỜNG</b>\n\n` +
        `🏦 <b>Ngân hàng:</b> Vietcombank\n` +
        `💰 <b>Số tiền:</b> +5,000,000 VND\n` +
        `📝 <b>Nội dung:</b> Chuyen tien khong ro nguon goc\n` +
        `🆔 <b>Mã GD:</b> TEST_SUS_001\n` +
        `⏰ <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}\n\n` +
        `⚠️ <i>Vui lòng kiểm tra và xác nhận giao dịch này!</i>`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          {
            text: '✅ Xác nhận hợp lệ',
            callback_data: 'confirm_transaction_TEST_SUS_001'
          },
          {
            text: '❌ Báo cáo bất thường',
            callback_data: 'report_suspicious_TEST_SUS_001'
          }
        ]]
      }
    };

    await this.sendTestMessage(message);
  }

  /**
   * Test báo cáo cuối ngày
   */
  static async testDailySummary(): Promise<void> {
    console.log('\n📊 Testing daily summary notification...');
    
    const totalIncome = 2500000;
    const totalExpense = 800000;
    const netAmount = totalIncome - totalExpense;
    const transactionCount = 15;
    
    const message: TelegramMessage = {
      chat_id: BALANCE_NOTIFICATION_CHAT_ID,
      text: `📊 <b>BÁO CÁO CUỐI NGÀY</b>\n\n` +
        `📅 <b>Ngày:</b> ${new Date().toLocaleDateString('vi-VN')}\n` +
        `💰 <b>Tổng thu:</b> +${totalIncome.toLocaleString('vi-VN')} VND\n` +
        `💸 <b>Tổng chi:</b> -${totalExpense.toLocaleString('vi-VN')} VND\n` +
        `📈 <b>Lãi:</b> +${netAmount.toLocaleString('vi-VN')} VND\n` +
        `🔢 <b>Số giao dịch:</b> ${transactionCount}\n\n` +
        `📈 <i>Báo cáo tự động từ hệ thống ngân hàng</i>`,
      parse_mode: 'HTML'
    };

    await this.sendTestMessage(message);
  }

  /**
   * Test trích xuất Order ID
   */
  static testOrderIdExtraction(): void {
    console.log('\n🔍 Testing Order ID extraction...');
    
    const testContents = [
      'NGUYEN VAN A chuyen tien DH001 thanh toan don hang',
      'Thanh toan don hang DH123 qua chuyen khoan',
      'ORDER456 payment from customer',
      'Chuyen tien khong co ma don hang',
      'DH789 - Thanh toan mon an'
    ];
    
    testContents.forEach(content => {
      // Simple regex để tìm Order ID
      const orderIdMatch = content.match(/(?:DH|ORDER)(\d+)/i);
      const orderId = orderIdMatch ? orderIdMatch[0] : null;
      console.log(`📝 "${content}" => Order ID: ${orderId || 'Không tìm thấy'}`);
    });
  }
}

/**
 * Hàm delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Chạy tất cả các test
 */
async function runAllTests() {
  console.log('🚀 Bắt đầu test Telegram Notification...');
  console.log('=' .repeat(50));
  
  // Kiểm tra cấu hình
  console.log('🔧 Cấu hình:');
  console.log('- Bot Token:', TELEGRAM_BOT_TOKEN.substring(0, 10) + '...');
  console.log('- Chat ID:', BALANCE_NOTIFICATION_CHAT_ID);
  console.log('');
  
  try {
    // Test trích xuất Order ID
    SimpleTelegramTest.testOrderIdExtraction();
    
    // Test các loại thông báo
    await SimpleTelegramTest.testMoneyInNotification();
    await delay(2000);
    
    await SimpleTelegramTest.testMoneyOutNotification();
    await delay(2000);
    
    await SimpleTelegramTest.testSuspiciousNotification();
    await delay(2000);
    
    await SimpleTelegramTest.testDailySummary();
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ Hoàn thành tất cả các test!');
    console.log('\n💡 Lưu ý:');
    console.log('- Kiểm tra Telegram để xem các thông báo');
    console.log('- Đảm bảo cấu hình đúng TELEGRAM_BOT_TOKEN và CHAT_ID trong .env');
    
  } catch (error) {
    console.error('❌ Lỗi trong quá trình test:', error);
  }
}

// Chạy test
runAllTests().catch(console.error);

export { SimpleTelegramTest, runAllTests };