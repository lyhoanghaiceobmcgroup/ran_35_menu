# Hướng dẫn Setup Webhook URL cho Telegram Bot

## Phương án 1: Sử dụng ngrok (Dễ nhất - Cho testing)

### Bước 1: Cài đặt ngrok
```bash
# Tải ngrok từ https://ngrok.com/download
# Hoặc cài qua npm
npm install -g ngrok
```

### Bước 2: Tạo server webhook đơn giản
Tạo file `webhook-server.js` trong thư mục gốc:

```javascript
const express = require('express');
const cors = require('cors');
const { TelegramWebhookHandler } = require('./src/utils/telegramWebhook');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Endpoint webhook cho Telegram
app.post('/webhook/telegram', async (req, res) => {
  try {
    console.log('Received webhook:', JSON.stringify(req.body, null, 2));
    
    const result = await TelegramWebhookHandler.handleWebhook(req.body);
    
    if (result.success) {
      console.log('Webhook processed successfully:', result.message);
      res.status(200).json({ message: result.message });
    } else {
      console.error('Webhook processing failed:', result.message);
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhook/telegram`);
});
```

### Bước 3: Chạy server và ngrok
```bash
# Terminal 1: Chạy webhook server
node webhook-server.js

# Terminal 2: Expose server qua ngrok
ngrok http 3001
```

### Bước 4: Setup webhook URL
Sau khi chạy ngrok, bạn sẽ có URL như: `https://abc123.ngrok.io`

Tạo file `setup-webhook.js`:

```javascript
const { TelegramWebhookHandler } = require('./src/utils/telegramWebhook');

async function setupWebhook() {
  // Thay YOUR_NGROK_URL bằng URL từ ngrok
  const webhookUrl = 'https://YOUR_NGROK_URL.ngrok.io/webhook/telegram';
  
  try {
    const success = await TelegramWebhookHandler.setWebhook(webhookUrl);
    
    if (success) {
      console.log('✅ Webhook setup thành công!');
      console.log('URL:', webhookUrl);
    } else {
      console.log('❌ Webhook setup thất bại!');
    }
  } catch (error) {
    console.error('Lỗi setup webhook:', error);
  }
}

setupWebhook();
```

Chạy: `node setup-webhook.js`

## Phương án 2: Deploy lên Vercel (Miễn phí)

### Bước 1: Tạo API route cho Vercel
Tạo thư mục `api` và file `api/webhook.js`:

```javascript
import { TelegramWebhookHandler } from '../src/utils/telegramWebhook';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await TelegramWebhookHandler.handleWebhook(req.body);
    
    if (result.success) {
      res.status(200).json({ message: result.message });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### Bước 2: Tạo vercel.json
```json
{
  "functions": {
    "api/webhook.js": {
      "runtime": "nodejs18.x"
    }
  },
  "rewrites": [
    {
      "source": "/webhook/telegram",
      "destination": "/api/webhook"
    }
  ]
}
```

### Bước 3: Deploy lên Vercel
```bash
# Cài Vercel CLI
npm i -g vercel

# Deploy
vercel

# Sau khi deploy, bạn sẽ có URL như: https://your-project.vercel.app
```

### Bước 4: Setup webhook
Sử dụng URL: `https://your-project.vercel.app/webhook/telegram`

## Phương án 3: Deploy lên Railway (Miễn phí)

### Bước 1: Tạo package.json cho webhook server
```json
{
  "name": "telegram-webhook",
  "version": "1.0.0",
  "scripts": {
    "start": "node webhook-server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
```

### Bước 2: Deploy lên Railway
1. Đăng ký tài khoản tại https://railway.app
2. Connect GitHub repository
3. Deploy project
4. Railway sẽ cung cấp URL như: `https://your-app.railway.app`

## Script tự động setup

Tạo file `auto-setup-webhook.js`:

```javascript
const { TelegramWebhookHandler } = require('./src/utils/telegramWebhook');
const express = require('express');
const { spawn } = require('child_process');

class WebhookAutoSetup {
  static async setupWithNgrok() {
    console.log('🚀 Bắt đầu auto setup webhook với ngrok...');
    
    // Bước 1: Khởi động webhook server
    console.log('📡 Khởi động webhook server...');
    const server = this.startWebhookServer();
    
    // Đợi server khởi động
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Bước 2: Khởi động ngrok
    console.log('🌐 Khởi động ngrok...');
    const ngrokUrl = await this.startNgrok();
    
    if (!ngrokUrl) {
      console.error('❌ Không thể khởi động ngrok');
      return false;
    }
    
    // Bước 3: Setup webhook
    console.log('⚙️ Setup webhook URL...');
    const webhookUrl = `${ngrokUrl}/webhook/telegram`;
    const success = await TelegramWebhookHandler.setWebhook(webhookUrl);
    
    if (success) {
      console.log('✅ Setup hoàn tất!');
      console.log('📍 Webhook URL:', webhookUrl);
      console.log('🔄 Server đang chạy, nhấn Ctrl+C để dừng');
      return true;
    } else {
      console.error('❌ Setup webhook thất bại');
      return false;
    }
  }
  
  static startWebhookServer() {
    const app = express();
    app.use(express.json());
    
    app.post('/webhook/telegram', async (req, res) => {
      try {
        const result = await TelegramWebhookHandler.handleWebhook(req.body);
        res.status(result.success ? 200 : 400).json(result);
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });
    
    const server = app.listen(3001, () => {
      console.log('✅ Webhook server started on port 3001');
    });
    
    return server;
  }
  
  static async startNgrok() {
    return new Promise((resolve) => {
      const ngrok = spawn('ngrok', ['http', '3001', '--log=stdout']);
      
      ngrok.stdout.on('data', (data) => {
        const output = data.toString();
        const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.ngrok\.io/);
        
        if (urlMatch) {
          resolve(urlMatch[0]);
        }
      });
      
      ngrok.stderr.on('data', (data) => {
        console.error('Ngrok error:', data.toString());
      });
      
      // Timeout sau 10 giây
      setTimeout(() => {
        resolve(null);
      }, 10000);
    });
  }
}

// Chạy auto setup
if (require.main === module) {
  WebhookAutoSetup.setupWithNgrok().catch(console.error);
}

module.exports = WebhookAutoSetup;
```

## Cách sử dụng

### Tự động (Khuyến nghị):
```bash
# Cài dependencies
npm install express cors

# Chạy auto setup
node auto-setup-webhook.js
```

### Thủ công:
1. Chọn một trong 3 phương án trên
2. Làm theo từng bước
3. Test webhook bằng cách đặt hàng trên website

## Kiểm tra webhook hoạt động

1. Mở website: http://localhost:5173
2. Đặt một đơn hàng test
3. Kiểm tra console của webhook server
4. Kiểm tra tin nhắn trong nhóm Telegram
5. Thử ấn nút Xác nhận/Từ chối

## Troubleshooting

### Lỗi thường gặp:

1. **Ngrok không hoạt động**: Cài đặt ngrok và đăng ký tài khoản
2. **Webhook không nhận được data**: Kiểm tra URL và port
3. **Telegram không gửi callback**: Kiểm tra Bot Token và Group ID
4. **CORS error**: Thêm cors middleware vào server

### Debug:
```javascript
// Thêm vào webhook handler để debug
console.log('Received webhook data:', JSON.stringify(req.body, null, 2));
```

## Lưu ý bảo mật

1. Không commit Bot Token vào Git
2. Sử dụng HTTPS cho production
3. Validate webhook data từ Telegram
4. Rate limiting cho webhook endpoint

---

**Khuyến nghị**: Bắt đầu với Phương án 1 (ngrok) để test, sau đó chuyển sang Phương án 2 (Vercel) cho production.