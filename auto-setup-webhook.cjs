const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Import webhook handlers
const { TelegramWebhookHandler, OrderStatusAPI } = require('./webhook-handlers.cjs');

console.log('✅ Loaded TelegramWebhookHandler and OrderStatusAPI');

class WebhookAutoSetup {
  static async setupWithNgrok() {
    console.log('🚀 Bắt đầu auto setup webhook với ngrok...');
    console.log('📋 Checklist:');
    console.log('   ✓ Bot Token: 7227042614:AAGeG3EZqSFVysFA-UU8mCw6o76UJrbCtJE');
    console.log('   ✓ Group ID: -4852894219');
    console.log('');
    
    // Kiểm tra ngrok
    const hasNgrok = await this.checkNgrok();
    if (!hasNgrok) {
      console.log('❌ Ngrok chưa được cài đặt!');
      console.log('📥 Hướng dẫn cài đặt:');
      console.log('   1. Truy cập: https://ngrok.com/download');
      console.log('   2. Tải và cài đặt ngrok');
      console.log('   3. Hoặc chạy: npm install -g ngrok');
      console.log('   4. Chạy lại script này');
      return false;
    }
    
    // Bước 1: Khởi động webhook server
    console.log('📡 Khởi động webhook server...');
    const server = this.startWebhookServer();
    
    // Đợi server khởi động
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Bước 2: Khởi động ngrok
    console.log('🌐 Khởi động ngrok...');
    const ngrokUrl = await this.startNgrok();
    
    if (!ngrokUrl) {
      console.error('❌ Không thể khởi động ngrok');
      console.log('🔧 Thử các cách sau:');
      console.log('   1. Kiểm tra ngrok đã cài đặt chưa: ngrok version');
      console.log('   2. Đăng ký tài khoản ngrok miễn phí');
      console.log('   3. Chạy: ngrok config add-authtoken YOUR_TOKEN');
      return false;
    }
    
    // Bước 3: Setup webhook
    console.log('⚙️  Setup webhook URL...');
    const webhookUrl = `${ngrokUrl}/webhook/telegram`;
    const success = await TelegramWebhookHandler.setWebhook(webhookUrl);
    
    if (success) {
      console.log('');
      console.log('🎉 SETUP HOÀN TẤT!');
      console.log('📍 Webhook URL:', webhookUrl);
      console.log('🌐 Ngrok URL:', ngrokUrl);
      console.log('🔄 Server đang chạy...');
      console.log('');
      console.log('📋 Bước tiếp theo:');
      console.log('   1. Mở website: http://localhost:5173');
      console.log('   2. Đặt một đơn hàng test');
      console.log('   3. Kiểm tra tin nhắn trong nhóm Telegram');
      console.log('   4. Thử ấn nút Xác nhận/Từ chối');
      console.log('');
      console.log('⚠️  Lưu ý: Giữ terminal này mở để webhook hoạt động');
      console.log('🛑 Nhấn Ctrl+C để dừng');
      
      // Giữ process chạy
      process.on('SIGINT', () => {
        console.log('\n🛑 Đang dừng webhook server...');
        server.close(() => {
          console.log('✅ Webhook server đã dừng');
          process.exit(0);
        });
      });
      
      return true;
    } else {
      console.error('❌ Setup webhook thất bại');
      console.log('🔧 Kiểm tra:');
      console.log('   1. Bot Token có đúng không?');
      console.log('   2. Bot có quyền admin trong nhóm không?');
      console.log('   3. Kết nối internet có ổn định không?');
      return false;
    }
  }
  
  static async checkNgrok() {
    return new Promise((resolve) => {
      const ngrok = spawn('ngrok', ['version'], { stdio: 'pipe' });
      
      ngrok.on('close', (code) => {
        resolve(code === 0);
      });
      
      ngrok.on('error', () => {
        resolve(false);
      });
      
      // Timeout
      setTimeout(() => resolve(false), 5000);
    });
  }
  
  static startWebhookServer() {
    const app = express();
    app.use(cors());
    app.use(express.json());
    
    // Webhook endpoint
    app.post('/webhook/telegram', async (req, res) => {
      try {
        console.log('\n📨 Nhận webhook từ Telegram:');
        console.log('⏰ Thời gian:', new Date().toLocaleString('vi-VN'));
        
        const result = await TelegramWebhookHandler.handleWebhook(req.body);
        
        if (result.success) {
          console.log('✅ Xử lý thành công:', result.message);
          res.status(200).json({ message: result.message });
        } else {
          console.log('❌ Xử lý thất bại:', result.message);
          res.status(400).json({ error: result.message });
        }
      } catch (error) {
        console.error('💥 Lỗi webhook:', error.message);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
    
    // Health check
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'Webhook server is running' 
      });
    });
    
    // API endpoint để client truy vấn trạng thái đơn hàng
    app.get('/api/order-status/:orderId', async (req, res) => {
      try {
        const { orderId } = req.params;
        console.log(`🔍 Client requesting status for order: ${orderId}`);
        
        const statusResult = await OrderStatusAPI.getOrderStatus(orderId);
        
        res.json({
          success: true,
          orderId,
          ...statusResult,
          timestamp: new Date().toISOString()
        });
        
        console.log(`📤 Sent status for order ${orderId}: ${statusResult.status}${statusResult.fromCache ? ' (cached)' : ' (database)'}`);
      } catch (error) {
        console.error('❌ Error getting order status:', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // API endpoint để lấy tất cả cập nhật gần đây (cho debugging)
    app.get('/api/recent-updates', (req, res) => {
      try {
        const updates = OrderStatusAPI.getRecentUpdates();
        res.json({
          success: true,
          updates,
          count: updates.length,
          timestamp: new Date().toISOString()
        });
        console.log(`📋 Sent ${updates.length} recent updates`);
      } catch (error) {
        console.error('❌ Error getting recent updates:', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
      }
    });
    
    // Test endpoint
    app.get('/', (req, res) => {
      res.json({
        message: 'Telegram Webhook Server',
        endpoints: {
          webhook: '/webhook/telegram',
          health: '/health',
          orderStatus: '/api/order-status/:orderId',
          recentUpdates: '/api/recent-updates'
        },
        timestamp: new Date().toISOString()
      });
    });
    
    const server = app.listen(3001, () => {
      console.log('✅ Webhook server started on port 3001');
      console.log('🔗 Health check: http://localhost:3001/health');
    });
    
    return server;
  }
  
  static async startNgrok() {
    return new Promise((resolve) => {
      console.log('⏳ Đang khởi động ngrok (có thể mất 10-15 giây)...');
      
      const ngrok = spawn('ngrok', ['http', '3001', '--log=stdout'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let resolved = false;
      
      ngrok.stdout.on('data', (data) => {
        const output = data.toString();
        
        // Tìm URL trong output
        const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.ngrok\.io/);
        
        if (urlMatch && !resolved) {
          resolved = true;
          console.log('✅ Ngrok started successfully');
          resolve(urlMatch[0]);
        }
        
        // Log ngrok output (optional)
        if (output.includes('started tunnel') || output.includes('url=')) {
          console.log('📡 Ngrok:', output.trim());
        }
      });
      
      ngrok.stderr.on('data', (data) => {
        const error = data.toString();
        console.error('⚠️  Ngrok warning:', error.trim());
        
        // Một số warning không phải lỗi nghiêm trọng
        if (error.includes('command failed') && !resolved) {
          resolved = true;
          resolve(null);
        }
      });
      
      ngrok.on('close', (code) => {
        if (!resolved) {
          console.log('❌ Ngrok closed with code:', code);
          resolved = true;
          resolve(null);
        }
      });
      
      // Timeout sau 20 giây
      setTimeout(() => {
        if (!resolved) {
          console.log('⏰ Ngrok timeout');
          resolved = true;
          resolve(null);
        }
      }, 20000);
    });
  }
  
  // Phương án backup: Manual setup
  static async manualSetup() {
    console.log('📋 HƯỚNG DẪN SETUP THỦ CÔNG');
    console.log('=' .repeat(50));
    console.log('');
    
    console.log('🔧 Bước 1: Cài đặt dependencies');
    console.log('npm install express cors');
    console.log('');
    
    console.log('🔧 Bước 2: Tạo webhook server');
    console.log('Tạo file webhook-server.js với nội dung:');
    
    const serverCode = `
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/webhook/telegram', async (req, res) => {
  console.log('Received webhook:', req.body);
  // Xử lý webhook ở đây
  res.json({ success: true });
});

app.listen(3001, () => {
  console.log('Webhook server running on port 3001');
});
`;
    
    console.log(serverCode);
    console.log('');
    
    console.log('🔧 Bước 3: Chạy server');
    console.log('node webhook-server.js');
    console.log('');
    
    console.log('🔧 Bước 4: Expose với ngrok');
    console.log('ngrok http 3001');
    console.log('');
    
    console.log('🔧 Bước 5: Setup webhook URL');
    console.log('Sử dụng URL từ ngrok để setup webhook');
    console.log('');
    
    console.log('📖 Chi tiết xem file: WEBHOOK_SETUP_GUIDE.md');
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--manual') || args.includes('-m')) {
    WebhookAutoSetup.manualSetup();
  } else {
    console.log('🤖 TELEGRAM WEBHOOK AUTO SETUP');
    console.log('=' .repeat(40));
    console.log('');
    
    WebhookAutoSetup.setupWithNgrok().catch((error) => {
      console.error('💥 Lỗi setup:', error.message);
      console.log('');
      console.log('🔄 Thử setup thủ công:');
      console.log('node auto-setup-webhook.js --manual');
    });
  }
}

module.exports = WebhookAutoSetup;