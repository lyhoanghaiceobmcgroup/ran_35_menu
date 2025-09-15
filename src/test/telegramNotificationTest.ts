import { TelegramNotificationService } from '../utils/telegramNotificationService';
import { BankWebhookService } from '../utils/bankWebhookService';
import type { BankTransactionData, BankWebhookData } from '../utils/bankWebhookService';

/**
 * Test file để kiểm tra tính năng thông báo Telegram
 * Chạy file này để test các loại thông báo khác nhau
 */

// Dữ liệu test cho giao dịch tiền vào
const testMoneyInTransaction: BankTransactionData = {
  transactionId: 'TEST_IN_001',
  amount: 150000,
  content: 'NGUYEN VAN A chuyen tien DH001 thanh toan don hang',
  transactionDate: new Date().toISOString(),
  bankName: 'Vietcombank',
  accountNumber: '1234567890',
  type: 'money_in'
};

// Dữ liệu test cho giao dịch tiền ra
const testMoneyOutTransaction: BankTransactionData = {
  transactionId: 'TEST_OUT_001',
  amount: 50000,
  content: 'Rut tien ATM tai CN QUAN 1',
  transactionDate: new Date().toISOString(),
  bankName: 'Vietcombank',
  accountNumber: '1234567890',
  type: 'money_out'
};

// Dữ liệu test cho giao dịch bất thường
const testSuspiciousTransaction: BankTransactionData = {
  transactionId: 'TEST_SUS_001',
  amount: 5000000,
  content: 'Chuyen tien khong ro nguon goc',
  transactionDate: new Date().toISOString(),
  bankName: 'Vietcombank',
  accountNumber: '1234567890',
  type: 'money_in'
};

// Dữ liệu test cho báo cáo cuối ngày
const testDailySummary = {
  totalIncome: 2500000,
  totalExpense: 800000,
  transactionCount: 15,
  date: new Date().toLocaleDateString('vi-VN')
};

// Dữ liệu test cho webhook
const testWebhookData: BankWebhookData = {
  transactionId: 'WEBHOOK_TEST_001',
  amount: 200000,
  content: 'TRAN THI B chuyen tien DH002 thanh toan mon an',
  transactionDate: new Date().toISOString(),
  bankName: 'Techcombank',
  accountNumber: '9876543210',
  type: 'money_in',
  webhookSource: 'sepay'
};

/**
 * Test các loại thông báo Telegram
 */
async function testTelegramNotifications() {
  console.log('🧪 Bắt đầu test thông báo Telegram...');
  
  try {
    // Test 1: Thông báo tiền vào
    console.log('\n📥 Test 1: Thông báo tiền vào');
    await TelegramNotificationService.sendBalanceNotification(testMoneyInTransaction);
    await delay(2000);
    
    // Test 2: Thông báo tiền ra
    console.log('\n📤 Test 2: Thông báo tiền ra');
    await TelegramNotificationService.sendBalanceNotification(testMoneyOutTransaction);
    await delay(2000);
    
    // Test 3: Thông báo giao dịch bất thường
    console.log('\n🚨 Test 3: Thông báo giao dịch bất thường');
    await TelegramNotificationService.sendSuspiciousTransactionAlert(testSuspiciousTransaction);
    await delay(2000);
    
    // Test 4: Báo cáo cuối ngày
    console.log('\n📊 Test 4: Báo cáo cuối ngày');
    await TelegramNotificationService.sendDailySummary(testDailySummary);
    await delay(2000);
    
    console.log('\n✅ Hoàn thành test thông báo Telegram!');
  } catch (error) {
    console.error('❌ Lỗi trong quá trình test:', error);
  }
}

/**
 * Test webhook service
 */
async function testBankWebhookService() {
  console.log('\n🔗 Test Bank Webhook Service...');
  
  try {
    const webhookService = new BankWebhookService();
    
    // Test xử lý webhook
    console.log('\n📨 Test xử lý webhook');
    await webhookService.processWebhook(testWebhookData);
    
    console.log('\n✅ Hoàn thành test webhook service!');
  } catch (error) {
    console.error('❌ Lỗi trong quá trình test webhook:', error);
  }
}

/**
 * Test trích xuất Order ID từ nội dung giao dịch
 */
function testOrderIdExtraction() {
  console.log('\n🔍 Test trích xuất Order ID...');
  
  const testContents = [
    'NGUYEN VAN A chuyen tien DH001 thanh toan don hang',
    'Thanh toan don hang DH123 qua chuyen khoan',
    'ORDER456 payment from customer',
    'Chuyen tien khong co ma don hang',
    'DH789 - Thanh toan mon an'
  ];
  
  testContents.forEach(content => {
    const orderId = TelegramNotificationService.extractOrderId(content);
    console.log(`📝 "${content}" => Order ID: ${orderId || 'Không tìm thấy'}`);
  });
  
  console.log('\n✅ Hoàn thành test trích xuất Order ID!');
}

/**
 * Hàm delay để tránh spam
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Chạy tất cả các test
 */
async function runAllTests() {
  console.log('🚀 Bắt đầu chạy tất cả các test...');
  console.log('=' .repeat(50));
  
  // Test trích xuất Order ID (không cần kết nối mạng)
  testOrderIdExtraction();
  
  // Test thông báo Telegram (cần kết nối mạng và cấu hình bot)
  await testTelegramNotifications();
  
  // Test webhook service
  await testBankWebhookService();
  
  console.log('\n' + '=' .repeat(50));
  console.log('🎉 Hoàn thành tất cả các test!');
  console.log('\n💡 Lưu ý:');
  console.log('- Kiểm tra Telegram để xem các thông báo đã được gửi');
  console.log('- Đảm bảo đã cấu hình đúng TELEGRAM_BOT_TOKEN và CHAT_ID');
  console.log('- Kiểm tra console để xem log chi tiết');
}

// Chạy test nếu file được gọi trực tiếp
if (require.main === module) {
  runAllTests().catch(console.error);
}

export {
  testTelegramNotifications,
  testBankWebhookService,
  testOrderIdExtraction,
  runAllTests
};