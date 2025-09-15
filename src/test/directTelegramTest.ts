/**
 * Test trực tiếp Telegram Notification Service
 * Không phụ thuộc vào browser APIs hoặc Supabase
 */

// Import node-fetch cho Node.js
import fetch from 'node-fetch';

// Mock global fetch
if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = fetch as any;
}

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = '8019114116:AAGdPUMJI_ECNIRWm7ZtmPNd3MMUXb6ci_E';
const BALANCE_NOTIFICATION_CHAT_ID = '-4833394087';

// Interface cho Telegram Message
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

// Interface cho Bank Transaction Data
interface BankTransactionData {
  transactionId: string;
  amount: number;
  content: string;
  transactionDate: string;
  bankName: string;
  accountNumber: string;
  type: 'money_in' | 'money_out';
}

/**
 * Direct Telegram Test Service
 */
class DirectTelegramTest {
  /**
   * Gửi message trực tiếp đến Telegram
   */
  static async sendTelegramMessage(message: TelegramMessage): Promise<boolean> {
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      
      console.log('📱 Sending message to Telegram...');
      console.log('🎯 Chat ID:', message.chat_id);
      console.log('📝 Message preview:', message.text.substring(0, 100) + '...');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Message sent successfully! Message ID:', result.result?.message_id);
        return true;
      } else {
        const error = await response.text();
        console.error('❌ Failed to send message:', response.status, error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      return false;
    }
  }

  /**
   * Format currency
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  /**
   * Format datetime
   */
  static formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('vi-VN');
  }

  /**
   * Extract Order ID from content
   */
  static extractOrderId(content: string): string | null {
    const orderIdMatch = content.match(/(?:DH|ORDER)(\d+)/i);
    return orderIdMatch ? orderIdMatch[0] : null;
  }

  /**
   * Test thông báo tiền vào
   */
  static async testMoneyInNotification(): Promise<void> {
    console.log('\n💰 Testing money in notification...');
    
    const transactionData: BankTransactionData = {
      transactionId: 'TEST_IN_' + Date.now(),
      amount: 285000,
      content: 'NGUYEN VAN MINH chuyen tien DH001 thanh toan pho bo tai chin',
      transactionDate: new Date().toISOString(),
      bankName: 'Vietcombank',
      accountNumber: '9090190899999',
      type: 'money_in'
    };

    const orderId = this.extractOrderId(transactionData.content);
    const amountFormatted = this.formatCurrency(transactionData.amount);
    const timestamp = this.formatDateTime(transactionData.transactionDate);

    const messageText = `💰 <b>TIỀN VÀO</b>\n\n` +
      `🏦 <b>Ngân hàng:</b> ${transactionData.bankName}\n` +
      `💵 <b>Số tiền:</b> ${amountFormatted}\n` +
      `📝 <b>Nội dung:</b> ${transactionData.content}\n` +
      `🆔 <b>Mã GD:</b> ${transactionData.transactionId}\n` +
      `⏰ <b>Thời gian:</b> ${timestamp}\n` +
      (orderId ? `\n🔍 <b>Đơn hàng:</b> ${orderId}\n` : '') +
      `\n📊 <i>Thông báo tự động từ hệ thống ngân hàng</i>`;

    const message: TelegramMessage = {
      chat_id: BALANCE_NOTIFICATION_CHAT_ID,
      text: messageText,
      parse_mode: 'HTML'
    };

    await this.sendTelegramMessage(message);
  }

  /**
   * Test thông báo tiền ra
   */
  static async testMoneyOutNotification(): Promise<void> {
    console.log('\n💸 Testing money out notification...');
    
    const transactionData: BankTransactionData = {
      transactionId: 'TEST_OUT_' + Date.now(),
      amount: 500000,
      content: 'Rut tien ATM tai CN QUAN 1 - SO 123 NGUYEN HUE',
      transactionDate: new Date().toISOString(),
      bankName: 'Vietcombank',
      accountNumber: '9090190899999',
      type: 'money_out'
    };

    const amountFormatted = this.formatCurrency(transactionData.amount);
    const timestamp = this.formatDateTime(transactionData.transactionDate);

    const messageText = `💸 <b>TIỀN RA</b>\n\n` +
      `🏦 <b>Ngân hàng:</b> ${transactionData.bankName}\n` +
      `💵 <b>Số tiền:</b> -${amountFormatted}\n` +
      `📝 <b>Nội dung:</b> ${transactionData.content}\n` +
      `🆔 <b>Mã GD:</b> ${transactionData.transactionId}\n` +
      `⏰ <b>Thời gian:</b> ${timestamp}\n\n` +
      `📊 <i>Thông báo tự động từ hệ thống ngân hàng</i>`;

    const message: TelegramMessage = {
      chat_id: BALANCE_NOTIFICATION_CHAT_ID,
      text: messageText,
      parse_mode: 'HTML'
    };

    await this.sendTelegramMessage(message);
  }

  /**
   * Test cảnh báo giao dịch bất thường
   */
  static async testSuspiciousTransaction(): Promise<void> {
    console.log('\n🚨 Testing suspicious transaction alert...');
    
    const transactionData: BankTransactionData = {
      transactionId: 'TEST_SUS_' + Date.now(),
      amount: 10000000,
      content: 'TRAN THI HONG chuyen tien dau tu kinh doanh',
      transactionDate: new Date().toISOString(),
      bankName: 'Vietcombank',
      accountNumber: '9090190899999',
      type: 'money_in'
    };

    const amountFormatted = this.formatCurrency(transactionData.amount);
    const timestamp = this.formatDateTime(transactionData.transactionDate);

    const messageText = `🚨 <b>CẢNH BÁO GIAO DỊCH BẤT THƯỜNG</b>\n\n` +
      `🏦 <b>Ngân hàng:</b> ${transactionData.bankName}\n` +
      `💰 <b>Số tiền:</b> ${amountFormatted}\n` +
      `📝 <b>Nội dung:</b> ${transactionData.content}\n` +
      `🆔 <b>Mã giao dịch:</b> ${transactionData.transactionId}\n` +
      `⏰ <b>Thời gian:</b> ${timestamp}\n\n` +
      `⚠️ <i>Vui lòng kiểm tra và xác nhận giao dịch này!</i>`;

    const message: TelegramMessage = {
      chat_id: BALANCE_NOTIFICATION_CHAT_ID,
      text: messageText,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          {
            text: '✅ Xác nhận hợp lệ',
            callback_data: `confirm_transaction_${transactionData.transactionId}`
          },
          {
            text: '❌ Báo cáo bất thường',
            callback_data: `report_suspicious_${transactionData.transactionId}`
          }
        ]]
      }
    };

    await this.sendTelegramMessage(message);
  }

  /**
   * Test báo cáo cuối ngày
   */
  static async testDailySummary(): Promise<void> {
    console.log('\n📊 Testing daily summary...');
    
    const totalIncome = 1125000;
    const totalExpense = 500000;
    const netAmount = totalIncome - totalExpense;
    const transactionCount = 6;
    const date = new Date().toLocaleDateString('vi-VN');
    
    const incomeFormatted = this.formatCurrency(totalIncome);
    const expenseFormatted = this.formatCurrency(totalExpense);
    const netFormatted = this.formatCurrency(Math.abs(netAmount));
    const netIcon = netAmount >= 0 ? '📈' : '📉';
    const netText = netAmount >= 0 ? 'Lãi' : 'Lỗ';

    const messageText = `📊 <b>BÁO CÁO CUỐI NGÀY</b>\n\n` +
      `📅 <b>Ngày:</b> ${date}\n` +
      `💰 <b>Tổng thu:</b> ${incomeFormatted}\n` +
      `💸 <b>Tổng chi:</b> ${expenseFormatted}\n` +
      `${netIcon} <b>${netText}:</b> ${netFormatted}\n` +
      `🔢 <b>Số giao dịch:</b> ${transactionCount}\n\n` +
      `📈 <i>Báo cáo tự động từ hệ thống ngân hàng</i>`;

    const message: TelegramMessage = {
      chat_id: BALANCE_NOTIFICATION_CHAT_ID,
      text: messageText,
      parse_mode: 'HTML'
    };

    await this.sendTelegramMessage(message);
  }

  /**
   * Test nhiều đơn hàng
   */
  static async testMultipleOrders(): Promise<void> {
    console.log('\n🍽️ Testing multiple orders...');
    
    const orders = [
      { orderId: 'DH002', amount: 150000, customer: 'LE VAN HUNG', dish: 'bun bo hue' },
      { orderId: 'DH003', amount: 320000, customer: 'PHAM THI LAN', dish: 'com tam suon nuong' },
      { orderId: 'DH004', amount: 95000, customer: 'HOANG VAN NAM', dish: 'banh mi thit nuong' }
    ];

    for (const order of orders) {
      const transactionData: BankTransactionData = {
        transactionId: `ORDER_${order.orderId}_${Date.now()}`,
        amount: order.amount,
        content: `${order.customer} chuyen tien ${order.orderId} thanh toan ${order.dish}`,
        transactionDate: new Date().toISOString(),
        bankName: 'Vietcombank',
        accountNumber: '9090190899999',
        type: 'money_in'
      };

      const amountFormatted = this.formatCurrency(transactionData.amount);
      const timestamp = this.formatDateTime(transactionData.transactionDate);
      const orderId = this.extractOrderId(transactionData.content);

      const messageText = `💰 <b>TIỀN VÀO</b>\n\n` +
        `🏦 <b>Ngân hàng:</b> ${transactionData.bankName}\n` +
        `💵 <b>Số tiền:</b> ${amountFormatted}\n` +
        `📝 <b>Nội dung:</b> ${transactionData.content}\n` +
        `🆔 <b>Mã GD:</b> ${transactionData.transactionId}\n` +
        `⏰ <b>Thời gian:</b> ${timestamp}\n` +
        (orderId ? `\n🔍 <b>Đơn hàng:</b> ${orderId}\n` : '') +
        `\n📊 <i>Thông báo tự động từ hệ thống ngân hàng</i>`;

      const message: TelegramMessage = {
        chat_id: BALANCE_NOTIFICATION_CHAT_ID,
        text: messageText,
        parse_mode: 'HTML'
      };

      await this.sendTelegramMessage(message);
      console.log(`✅ Order ${order.orderId} notification sent!`);
      
      // Delay để tránh spam
      await this.delay(1500);
    }
  }

  /**
   * Delay function
   */
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Chạy tất cả test
 */
async function runDirectTelegramTests() {
  console.log('🏦 Bắt đầu test trực tiếp Telegram Notification...');
  console.log('=' .repeat(60));
  console.log('🤖 Bot Token:', TELEGRAM_BOT_TOKEN.substring(0, 15) + '...');
  console.log('💬 Chat ID:', BALANCE_NOTIFICATION_CHAT_ID);
  console.log('');
  
  try {
    // Test từng loại thông báo
    await DirectTelegramTest.testMoneyInNotification();
    await DirectTelegramTest.delay(2000);
    
    await DirectTelegramTest.testMoneyOutNotification();
    await DirectTelegramTest.delay(2000);
    
    await DirectTelegramTest.testSuspiciousTransaction();
    await DirectTelegramTest.delay(2000);
    
    // Test nhiều đơn hàng
    await DirectTelegramTest.testMultipleOrders();
    await DirectTelegramTest.delay(2000);
    
    // Test báo cáo cuối ngày
    await DirectTelegramTest.testDailySummary();
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 Hoàn thành tất cả test!');
    console.log('\n📱 Kiểm tra Telegram group để xem các thông báo:');
    console.log('- ✅ Thông báo thanh toán đơn hàng');
    console.log('- ✅ Thông báo rút tiền ATM');
    console.log('- ✅ Cảnh báo giao dịch bất thường');
    console.log('- ✅ Thông báo nhiều đơn hàng');
    console.log('- ✅ Báo cáo tổng hợp cuối ngày');
    
  } catch (error) {
    console.error('❌ Lỗi trong quá trình test:', error);
  }
}

// Chạy test
runDirectTelegramTests().catch(console.error);

export { DirectTelegramTest, runDirectTelegramTests };