# 🚀 Setup Webhook Nhanh - 2 Phút

## Cách 1: Tự động (Khuyến nghị) ⚡

### Bước 1: Cài ngrok
```bash
# Tải từ: https://ngrok.com/download
# Hoặc cài qua npm:
npm install -g ngrok
```

### Bước 2: Chạy auto setup
```bash
# Cách 1: Chạy script
node auto-setup-webhook.cjs

# Cách 2: Double-click file
setup-webhook.bat
```

**Xong! 🎉** Script sẽ tự động:
- Khởi động webhook server
- Chạy ngrok
- Setup webhook URL với Telegram
- Hiển thị hướng dẫn test

---

## Cách 2: Thủ công (Nếu auto không work) 🔧

### Bước 1: Chạy webhook server
```bash
# Terminal 1
node auto-setup-webhook.cjs --manual
```

### Bước 2: Chạy ngrok
```bash
# Terminal 2
ngrok http 3001
```

### Bước 3: Copy URL và setup
- Copy URL từ ngrok (vd: `https://abc123.ngrok.io`)
- Tạo file `setup.js`:

```javascript
const BOT_TOKEN = '7227042614:AAGeG3EZqSFVysFA-UU8mCw6o76UJrbCtJE';
const WEBHOOK_URL = 'https://YOUR_NGROK_URL.ngrok.io/webhook/telegram';

fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: WEBHOOK_URL })
})
.then(res => res.json())
.then(data => console.log('Webhook setup:', data));
```

- Chạy: `node setup.js`

---

## Test Webhook 🧪

1. **Mở website**: http://localhost:5173
2. **Đặt hàng test**: Chọn món → Nhập SĐT → Gửi đơn
3. **Kiểm tra Telegram**: Xem tin nhắn trong nhóm
4. **Test nút**: Ấn "Xác nhận" hoặc "Từ chối"
5. **Kiểm tra website**: Trạng thái đơn hàng cập nhật

---

## Troubleshooting 🔧

### Lỗi "ngrok not found"
```bash
# Cài ngrok
npm install -g ngrok

# Hoặc tải từ: https://ngrok.com/download
```

### Lỗi "webhook failed"
- Kiểm tra Bot Token
- Kiểm tra Group ID: `-4852894219`
- Kiểm tra bot có admin trong nhóm

### Lỗi "port 3001 in use"
```bash
# Tìm process đang dùng port
netstat -ano | findstr :3001

# Kill process
taskkill /PID <PID_NUMBER> /F
```

---

## Hỗ trợ 💬

- **Chi tiết**: Xem `WEBHOOK_SETUP_GUIDE.md`
- **Lỗi**: Kiểm tra console log
- **Test**: Dùng Postman test endpoint

**Lưu ý**: Giữ terminal webhook chạy để nhận callback từ Telegram!