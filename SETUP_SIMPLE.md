# 🚀 Setup Webhook Đơn Giản - 3 Bước

## Bước 1: Tải ngrok 📥

1. Truy cập: https://ngrok.com/download
2. Tải file ngrok cho Windows
3. Giải nén và copy `ngrok.exe` vào thư mục dự án này
4. Hoặc copy vào `C:\Windows\System32` để dùng global

## Bước 2: Chạy Webhook Server 🖥️

Mở **Command Prompt** hoặc **PowerShell** trong thư mục dự án:

```bash
# Chạy webhook server
node auto-setup-webhook.cjs --manual
```

Server sẽ chạy trên port 3001.

## Bước 3: Chạy ngrok 🌐

Mở **Command Prompt/PowerShell thứ 2**:

```bash
# Nếu ngrok trong thư mục dự án
.\ngrok.exe http 3001

# Nếu ngrok đã cài global
ngrok http 3001
```

Ngrok sẽ hiển thị URL như: `https://abc123.ngrok.io`

## Bước 4: Setup Webhook URL 🔗

Tạo file `setup-webhook-manual.js`:

```javascript
const BOT_TOKEN = '7227042614:AAGeG3EZqSFVysFA-UU8mCw6o76UJrbCtJE';

// Thay YOUR_NGROK_URL bằng URL từ ngrok
const WEBHOOK_URL = 'https://YOUR_NGROK_URL.ngrok.io/webhook/telegram';

async function setupWebhook() {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: WEBHOOK_URL })
    });
    
    const result = await response.json();
    
    if (result.ok) {
      console.log('✅ Webhook setup thành công!');
      console.log('📍 URL:', WEBHOOK_URL);
    } else {
      console.log('❌ Lỗi:', result.description);
    }
  } catch (error) {
    console.error('💥 Lỗi:', error.message);
  }
}

setupWebhook();
```

Chạy: `node setup-webhook-manual.js`

---

## Test Hoạt Động 🧪

1. **Mở website**: http://localhost:5173
2. **Đặt hàng**: Chọn món → Nhập SĐT → Gửi đơn
3. **Kiểm tra**: 
   - Console webhook server có log không?
   - Telegram nhóm có tin nhắn không?
   - Ấn nút "Xác nhận" có cập nhật website không?

---

## Nếu Gặp Lỗi 🔧

### Lỗi "fetch is not defined"
Thêm vào đầu file `setup-webhook-manual.js`:
```javascript
const fetch = require('node-fetch');
```

Và cài: `npm install node-fetch@2`

### Lỗi "ngrok not found"
- Đảm bảo `ngrok.exe` trong thư mục dự án
- Hoặc cài ngrok global

### Lỗi "webhook failed"
- Kiểm tra URL ngrok có đúng không
- Kiểm tra bot có admin trong nhóm không
- Thử lại với URL mới từ ngrok

---

## Tóm Tắt Commands 📝

```bash
# Terminal 1: Webhook server
node auto-setup-webhook.cjs --manual

# Terminal 2: Ngrok
ngrok http 3001

# Terminal 3: Setup webhook
node setup-webhook-manual.js
```

**Lưu ý**: Giữ cả 2 terminal đầu chạy để webhook hoạt động!