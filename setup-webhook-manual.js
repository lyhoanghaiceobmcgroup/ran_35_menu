const BOT_TOKEN = '7227042614:AAGeG3EZqSFVysFA-UU8mCw6o76UJrbCtJE';

// Thay YOUR_NGROK_URL bằng URL từ ngrok (ví dụ: https://abc123.ngrok.io)
const WEBHOOK_URL = 'https://YOUR_NGROK_URL.ngrok.io/webhook/telegram';

async function setupWebhook() {
  console.log('🔗 Đang setup webhook...');
  console.log('📍 URL:', WEBHOOK_URL);
  console.log('');
  
  // Kiểm tra URL có được thay đổi chưa
  if (WEBHOOK_URL.includes('YOUR_NGROK_URL')) {
    console.log('❌ Lỗi: Bạn chưa thay đổi YOUR_NGROK_URL!');
    console.log('📝 Hướng dẫn:');
    console.log('   1. Chạy ngrok: ngrok http 3001');
    console.log('   2. Copy URL từ ngrok (vd: https://abc123.ngrok.io)');
    console.log('   3. Thay YOUR_NGROK_URL trong file này bằng URL đó');
    console.log('   4. Chạy lại: node setup-webhook-manual.js');
    return;
  }
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: WEBHOOK_URL })
    });
    
    const result = await response.json();
    
    console.log('📡 Telegram API Response:');
    console.log(JSON.stringify(result, null, 2));
    console.log('');
    
    if (result.ok) {
      console.log('🎉 WEBHOOK SETUP THÀNH CÔNG!');
      console.log('📍 Webhook URL:', WEBHOOK_URL);
      console.log('');
      console.log('📋 Bước tiếp theo:');
      console.log('   1. Đảm bảo webhook server đang chạy (node auto-setup-webhook.cjs --manual)');
      console.log('   2. Đảm bảo ngrok đang chạy (ngrok http 3001)');
      console.log('   3. Test bằng cách đặt hàng trên website');
      console.log('   4. Kiểm tra tin nhắn trong nhóm Telegram');
    } else {
      console.log('❌ SETUP THẤT BẠI!');
      console.log('🔧 Lỗi:', result.description);
      console.log('');
      console.log('💡 Các nguyên nhân có thể:');
      console.log('   - URL ngrok không đúng hoặc đã hết hạn');
      console.log('   - Bot Token không đúng');
      console.log('   - Kết nối internet không ổn định');
      console.log('   - Webhook server chưa chạy');
    }
  } catch (error) {
    console.error('💥 Lỗi kết nối:', error.message);
    console.log('');
    console.log('🔧 Kiểm tra:');
    console.log('   - Kết nối internet');
    console.log('   - URL ngrok có đúng format không');
    console.log('   - Có cài node-fetch không: npm install node-fetch@2');
  }
}

// Kiểm tra và cài node-fetch nếu cần
try {
  // Thử import fetch
  if (typeof fetch === 'undefined') {
    console.log('⚠️  Đang cài node-fetch...');
    const { spawn } = require('child_process');
    const install = spawn('npm', ['install', 'node-fetch@2'], { stdio: 'inherit' });
    
    install.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Đã cài node-fetch');
        // Import sau khi cài
        global.fetch = require('node-fetch');
        setupWebhook();
      } else {
        console.log('❌ Không thể cài node-fetch');
        console.log('🔧 Chạy thủ công: npm install node-fetch@2');
      }
    });
  } else {
    setupWebhook();
  }
} catch (error) {
  // Fallback: thử require node-fetch
  try {
    global.fetch = require('node-fetch');
    setupWebhook();
  } catch (fetchError) {
    console.log('❌ Cần cài node-fetch:');
    console.log('npm install node-fetch@2');
    console.log('');
    console.log('Sau đó chạy lại: node setup-webhook-manual.js');
  }
}