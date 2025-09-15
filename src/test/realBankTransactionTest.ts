/**
 * Test thực tế với dữ liệu giao dịch ngân hàng
 * Mô phỏng webhook từ ngân hàng gửi về
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
  global.fetch = require('node-fetch');
}

import { TelegramNotificationService } from '../utils/telegramNotificationService';
import { BankWebhookService } from '../utils/bankWebhookService';
import type { BankTransactionData, BankWebhookData } from '../utils/bankWebhookService';

/**
 * Test với dữ liệu giao dịch thực tế
 */
class RealBankTransactionTest {
  /**
   * Test giao dịch thanh toán đơn hàng
   */
  static async testOrderPayment(): Promise<void> {
    console.log('\n🍜 Testing order payment transaction...');
    
    const transactionData: BankTransactionData = {
      transactionId: 'VCB_' + Date.now(),
      amount: 285000,
      content: 'NGUYEN VAN MINH chuyen tien DH001 thanh toan pho bo tai chin',
      transactionDate: new Date().toISOString(),
      bankName: 'Vietcombank',
      accountNumber: '9090190899999',
      type: 'money_in'
    };

    await TelegramNotificationService.sendBalanceNotification(transactionData);
    console.log('✅ Order payment notification sent!');
  }

  /**
   * Test giao dịch rút tiền ATM
   */
  static async testATMWithdrawal(): Promise<void> {
    console.log('\n🏧 Testing ATM withdrawal...');
    
    const transactionData: BankTransactionData = {
      transactionId: 'ATM_' + Date.now(),
      amount: 500000,
      content: 'Rut tien ATM tai CN QUAN 1 - SO 123 NGUYEN HUE',
      transactionDate: new Date().toISOString(),
      bankName: 'Vietcombank',
      accountNumber: '9090190899999',
      type: 'money_out'
    };

    await TelegramNotificationService.sendBalanceNotification(transactionData);
    console.log('✅ ATM withdrawal notification sent!');
  }

  /**
   * Test giao dịch chuyển khoản lớn (bất thường)
   */
  static async testLargeTransfer(): Promise<void> {
    console.log('\n💰 Testing large transfer (suspicious)...');
    
    const transactionData: BankTransactionData = {
      transactionId: 'LARGE_' + Date.now(),
      amount: 10000000,
      content: 'TRAN THI HONG chuyen tien dau tu kinh doanh',
      transactionDate: new Date().toISOString(),
      bankName: 'Vietcombank',
      accountNumber: '9090190899999',
      type: 'money_in'
    };

    await TelegramNotificationService.sendSuspiciousTransactionAlert(transactionData);
    console.log('✅ Large transfer alert sent!');
  }

  /**
   * Test nhiều đơn hàng trong ngày
   */
  static async testMultipleOrders(): Promise<void> {
    console.log('\n🍽️ Testing multiple orders...');
    
    const orders = [
      {
        orderId: 'DH002',
        amount: 150000,
        customer: 'LE VAN HUNG',
        dish: 'bun bo hue'
      },
      {
        orderId: 'DH003', 
        amount: 320000,
        customer: 'PHAM THI LAN',
        dish: 'com tam suon nuong'
      },
      {
        orderId: 'DH004',
        amount: 95000,
        customer: 'HOANG VAN NAM',
        dish: 'banh mi thit nuong'
      }
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

      await TelegramNotificationService.sendBalanceNotification(transactionData);
      console.log(`✅ Order ${order.orderId} notification sent!`);
      
      // Delay để tránh spam
      await this.delay(1500);
    }
  }

  /**
   * Test webhook service với dữ liệu thực tế
   */
  static async testWebhookService(): Promise<void> {
    console.log('\n🔗 Testing webhook service with real data...');
    
    const webhookData: BankWebhookData = {
      transactionId: 'WEBHOOK_' + Date.now(),
      amount: 275000,
      content: 'DOAN VAN QUANG chuyen tien DH005 thanh toan lau thai',
      transactionDate: new Date().toISOString(),
      bankName: 'Techcombank',
      accountNumber: '9090190899999',
      type: 'money_in',
      webhookSource: 'bank_api'
    };

    const webhookService = new BankWebhookService();
    await webhookService.processWebhook(webhookData);
    console.log('✅ Webhook processing completed!');
  }

  /**
   * Test báo cáo cuối ngày với dữ liệu thực tế
   */
  static async testRealDailySummary(): Promise<void> {
    console.log('\n📊 Testing real daily summary...');
    
    // Tính toán dựa trên các giao dịch đã test
    const summaryData = {
      totalIncome: 1125000, // Tổng các đơn hàng
      totalExpense: 500000,  // Rút ATM
      transactionCount: 6,   // Tổng số giao dịch
      date: new Date().toLocaleDateString('vi-VN')
    };

    await TelegramNotificationService.sendDailySummary(summaryData);
    console.log('✅ Daily summary sent!');
  }

  /**
   * Delay function
   */
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Chạy tất cả test thực tế
 */
async function runRealBankTests() {
  console.log('🏦 Bắt đầu test giao dịch ngân hàng thực tế...');
  console.log('=' .repeat(60));
  
  try {
    // Test từng loại giao dịch
    await RealBankTransactionTest.testOrderPayment();
    await RealBankTransactionTest.delay(2000);
    
    await RealBankTransactionTest.testATMWithdrawal();
    await RealBankTransactionTest.delay(2000);
    
    await RealBankTransactionTest.testLargeTransfer();
    await RealBankTransactionTest.delay(2000);
    
    // Test nhiều đơn hàng
    await RealBankTransactionTest.testMultipleOrders();
    await RealBankTransactionTest.delay(2000);
    
    // Test webhook service
    await RealBankTransactionTest.testWebhookService();
    await RealBankTransactionTest.delay(2000);
    
    // Test báo cáo cuối ngày
    await RealBankTransactionTest.testRealDailySummary();
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 Hoàn thành tất cả test giao dịch thực tế!');
    console.log('\n📱 Kiểm tra Telegram group để xem các thông báo:');
    console.log('- Thông báo thanh toán đơn hàng');
    console.log('- Thông báo rút tiền ATM');
    console.log('- Cảnh báo giao dịch lớn');
    console.log('- Báo cáo tổng hợp cuối ngày');
    
  } catch (error) {
    console.error('❌ Lỗi trong quá trình test:', error);
  }
}

// Chạy test
runRealBankTests().catch(console.error);

export { RealBankTransactionTest, runRealBankTests };