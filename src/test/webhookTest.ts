/**
 * Test Webhook Endpoint
 * Kiểm tra webhook nhận và xử lý dữ liệu từ ngân hàng
 */

import fetch from 'node-fetch';

// Mock global fetch cho Node.js
if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = fetch as any;
}

/**
 * Webhook Test Service
 */
class WebhookTestService {
  private static readonly WEBHOOK_URL = 'http://localhost:5173/api/webhook/bank';
  private static readonly HEALTH_URL = 'http://localhost:5173/api/webhook/health';

  /**
   * Test webhook với dữ liệu giao dịch hợp lệ
   */
  static async testValidTransaction(): Promise<void> {
    console.log('\n💰 Testing valid money in transaction...');
    
    const transactionData = {
      transactionId: 'WEBHOOK_TEST_' + Date.now(),
      amount: 285000,
      content: 'NGUYEN VAN MINH chuyen tien DH001 thanh toan pho bo tai chin',
      transactionDate: new Date().toISOString(),
      bankName: 'Vietcombank',
      accountNumber: '9090190899999',
      type: 'money_in',
      balance: 5285000
    };

    try {
      console.log('📤 Sending webhook request...');
      console.log('🎯 URL:', this.WEBHOOK_URL);
      console.log('📦 Data:', JSON.stringify(transactionData, null, 2));
      
      const response = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Bank-Webhook-Test/1.0'
        },
        body: JSON.stringify(transactionData)
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Webhook processed successfully!');
        console.log('📊 Response:', JSON.stringify(result, null, 2));
        console.log('📱 Check Telegram group for notification');
      } else {
        console.error('❌ Webhook failed:', response.status);
        console.error('📄 Error:', JSON.stringify(result, null, 2));
      }
    } catch (error) {
      console.error('❌ Request failed:', error);
    }
  }

  /**
   * Test webhook với dữ liệu giao dịch tiền ra
   */
  static async testMoneyOutTransaction(): Promise<void> {
    console.log('\n💸 Testing money out transaction...');
    
    const transactionData = {
      transactionId: 'WEBHOOK_OUT_' + Date.now(),
      amount: 500000,
      content: 'Rut tien ATM tai CN QUAN 1 - SO 123 NGUYEN HUE',
      transactionDate: new Date().toISOString(),
      bankName: 'Vietcombank',
      accountNumber: '9090190899999',
      type: 'money_out',
      balance: 4785000
    };

    try {
      const response = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transactionData)
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Money out webhook processed!');
        console.log('📊 Response:', JSON.stringify(result, null, 2));
      } else {
        console.error('❌ Webhook failed:', response.status, result);
      }
    } catch (error) {
      console.error('❌ Request failed:', error);
    }
  }

  /**
   * Test webhook với giao dịch bất thường
   */
  static async testSuspiciousTransaction(): Promise<void> {
    console.log('\n🚨 Testing suspicious transaction...');
    
    const transactionData = {
      transactionId: 'WEBHOOK_SUS_' + Date.now(),
      amount: 10000000, // 10 triệu - số tiền lớn
      content: 'TRAN THI HONG chuyen tien dau tu kinh doanh',
      transactionDate: new Date().toISOString(),
      bankName: 'Vietcombank',
      accountNumber: '9090190899999',
      type: 'money_in',
      balance: 15000000
    };

    try {
      const response = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transactionData)
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Suspicious transaction webhook processed!');
        console.log('📊 Response:', JSON.stringify(result, null, 2));
        console.log('🚨 Check Telegram for suspicious alert');
      } else {
        console.error('❌ Webhook failed:', response.status, result);
      }
    } catch (error) {
      console.error('❌ Request failed:', error);
    }
  }

  /**
   * Test webhook với dữ liệu không hợp lệ
   */
  static async testInvalidData(): Promise<void> {
    console.log('\n❌ Testing invalid webhook data...');
    
    const invalidData = {
      // Thiếu transactionId
      amount: 'invalid-amount', // Sai kiểu dữ liệu
      content: 'Test invalid data',
      // Thiếu transactionDate
      type: 'invalid_type' // Sai giá trị
    };

    try {
      const response = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidData)
      });

      const result = await response.json();
      
      if (response.status === 400) {
        console.log('✅ Invalid data correctly rejected!');
        console.log('📊 Error response:', JSON.stringify(result, null, 2));
      } else {
        console.error('❌ Expected 400 error, got:', response.status);
      }
    } catch (error) {
      console.error('❌ Request failed:', error);
    }
  }

  /**
   * Test method không được phép
   */
  static async testInvalidMethod(): Promise<void> {
    console.log('\n🚫 Testing invalid HTTP method...');
    
    try {
      const response = await fetch(this.WEBHOOK_URL, {
        method: 'GET' // Webhook chỉ chấp nhận POST
      });

      const result = await response.json();
      
      if (response.status === 405) {
        console.log('✅ Invalid method correctly rejected!');
        console.log('📊 Error response:', JSON.stringify(result, null, 2));
      } else {
        console.error('❌ Expected 405 error, got:', response.status);
      }
    } catch (error) {
      console.error('❌ Request failed:', error);
    }
  }

  /**
   * Test health check endpoint
   */
  static async testHealthCheck(): Promise<void> {
    console.log('\n🏥 Testing health check...');
    
    try {
      const response = await fetch(this.HEALTH_URL, {
        method: 'GET'
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Health check passed!');
        console.log('📊 Health status:', JSON.stringify(result, null, 2));
      } else {
        console.error('❌ Health check failed:', response.status, result);
      }
    } catch (error) {
      console.error('❌ Health check request failed:', error);
      console.log('💡 Make sure the server is running on http://localhost:5173');
    }
  }

  /**
   * Test nhiều giao dịch liên tiếp
   */
  static async testMultipleTransactions(): Promise<void> {
    console.log('\n🔄 Testing multiple transactions...');
    
    const transactions = [
      {
        transactionId: 'MULTI_001_' + Date.now(),
        amount: 150000,
        content: 'LE VAN HUNG chuyen tien DH002 thanh toan bun bo hue',
        type: 'money_in'
      },
      {
        transactionId: 'MULTI_002_' + Date.now(),
        amount: 320000,
        content: 'PHAM THI LAN chuyen tien DH003 thanh toan com tam suon nuong',
        type: 'money_in'
      },
      {
        transactionId: 'MULTI_003_' + Date.now(),
        amount: 95000,
        content: 'HOANG VAN NAM chuyen tien DH004 thanh toan banh mi thit nuong',
        type: 'money_in'
      }
    ];

    for (let i = 0; i < transactions.length; i++) {
      const transaction = {
        ...transactions[i],
        transactionDate: new Date().toISOString(),
        bankName: 'Vietcombank',
        accountNumber: '9090190899999',
        balance: 5000000 + (i + 1) * 100000
      };

      try {
        console.log(`📤 Sending transaction ${i + 1}/${transactions.length}...`);
        
        const response = await fetch(this.WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(transaction)
        });

        const result = await response.json();
        
        if (response.ok) {
          console.log(`✅ Transaction ${i + 1} processed: ${transaction.transactionId}`);
        } else {
          console.error(`❌ Transaction ${i + 1} failed:`, response.status);
        }
        
        // Delay để tránh spam
        await this.delay(1000);
        
      } catch (error) {
        console.error(`❌ Transaction ${i + 1} request failed:`, error);
      }
    }
  }

  /**
   * Delay function
   */
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test server connection
   */
  static async testServerConnection(): Promise<boolean> {
    try {
      console.log('🔌 Testing server connection...');
      const response = await fetch('http://localhost:5173', {
        method: 'GET',
        timeout: 5000
      } as any);
      
      if (response.ok || response.status === 404) {
        console.log('✅ Server is running on http://localhost:5173');
        return true;
      } else {
        console.log('⚠️ Server responded with status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Cannot connect to server:');
      console.error('💡 Please run: npm run dev');
      return false;
    }
  }
}

/**
 * Chạy tất cả test
 */
async function runWebhookTests() {
  console.log('🧪 Bắt đầu test Webhook Endpoint...');
  console.log('=' .repeat(60));
  console.log('🎯 Target URL: http://localhost:5173/api/webhook/bank');
  console.log('');
  
  try {
    // Kiểm tra server trước
    const serverRunning = await WebhookTestService.testServerConnection();
    if (!serverRunning) {
      console.log('\n❌ Server không chạy. Vui lòng chạy: npm run dev');
      return;
    }

    // Test health check
    await WebhookTestService.testHealthCheck();
    await WebhookTestService.delay(1000);
    
    // Test các trường hợp hợp lệ
    await WebhookTestService.testValidTransaction();
    await WebhookTestService.delay(2000);
    
    await WebhookTestService.testMoneyOutTransaction();
    await WebhookTestService.delay(2000);
    
    await WebhookTestService.testSuspiciousTransaction();
    await WebhookTestService.delay(2000);
    
    // Test nhiều giao dịch
    await WebhookTestService.testMultipleTransactions();
    await WebhookTestService.delay(2000);
    
    // Test các trường hợp lỗi
    await WebhookTestService.testInvalidData();
    await WebhookTestService.delay(1000);
    
    await WebhookTestService.testInvalidMethod();
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 Hoàn thành tất cả test!');
    console.log('\n📱 Kiểm tra Telegram group để xem thông báo:');
    console.log('- ✅ Thông báo giao dịch hợp lệ');
    console.log('- ✅ Thông báo rút tiền');
    console.log('- ✅ Cảnh báo giao dịch bất thường');
    console.log('- ✅ Thông báo nhiều đơn hàng');
    console.log('\n🔧 Webhook endpoint đã sẵn sàng nhận dữ liệu từ ngân hàng!');
    
  } catch (error) {
    console.error('❌ Lỗi trong quá trình test:', error);
  }
}

// Chạy test
runWebhookTests().catch(console.error);

export { WebhookTestService, runWebhookTests };