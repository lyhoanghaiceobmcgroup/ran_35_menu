# 🤖 Hướng Dẫn Setup Telegram Webhook

## 📋 Tổng Quan

Để hệ thống đặt hàng hoạt động hoàn chỉnh, bạn cần setup webhook để nhận callback từ Telegram khi admin ấn nút "Xác nhận" hoặc "Từ chối".

## 🚀 Cách Setup Nhanh Nhất

### Bước 1: Chuẩn bị
```bash
# Đảm bảo website đang chạy
npm run dev

# Dependencies đã được cài sẵn:
# - express, cors, node-fetch
```

### Bước 2: Tải ngrok
- Truy cập: https://ngrok.com/download
- Tải file cho Windows
- Giải nén và copy `ngrok.exe` vào thư mục dự án

### Bước 3: Chạy Webhook Server
```bash
# Terminal 1: Chạy webhook server
node auto-setup-webhook.cjs --manual
```

### Bước 4: Chạy ngrok
```bash
# Terminal 2: Expose server
.\ngrok.exe http 3001
# Hoặc nếu cài global: ngrok http 3001
```

### Bước 5: Setup Webhook URL
1. Copy URL từ ngrok (vd: `https://abc123.ngrok.io`)
2. Sửa file `setup-webhook-manual.js`:
   ```javascript
   const WEBHOOK_URL = 'https://abc123.ngrok.io/webhook/telegram';
   ```
3. Chạy setup:
   ```bash
   node setup-webhook-manual.js
   ```

## ✅ Test Hoạt Động

1. **Mở website**: http://localhost:5173
2. **Đặt hàng test**:
   - Chọn vài món ăn
   - Nhập số điện thoại
   - Ấn "gửi yêu cầu gọi món"
3. **Kiểm tra Telegram**:
   - Xem tin nhắn trong nhóm "Order Menu"
   - Thử ấn nút "✅ Xác nhận" hoặc "❌ Từ chối"
4. **Kiểm tra website**:
   - Trạng thái đơn hàng có cập nhật không?
   - Modal có chuyển sang bước tiếp theo không?

## 📁 Files Đã Tạo

- `auto-setup-webhook.cjs` - Script tự động setup (cần ngrok)
- `setup-webhook-manual.js` - Script setup thủ công
- `setup-webhook.bat` - File batch để chạy nhanh
- `WEBHOOK_SETUP_GUIDE.md` - Hướng dẫn chi tiết
- `SETUP_SIMPLE.md` - Hướng dẫn đơn giản
- `SETUP_WEBHOOK_QUICK.md` - Hướng dẫn nhanh

## 🔧 Troubleshooting

### Lỗi "ngrok not found"
```bash
# Cách 1: Tải từ website
https://ngrok.com/download

# Cách 2: Cài qua npm (có thể không work)
npm install -g ngrok
```

### Lỗi "webhook failed"
- Kiểm tra Bot Token: `7227042614:AAGeG3EZqSFVysFA-UU8mCw6o76UJrbCtJE`
- Kiểm tra Group ID: `-4852894219`
- Đảm bảo bot có quyền admin trong nhóm
- Thử URL ngrok mới

### Lỗi "port 3001 in use"
```bash
# Tìm process đang dùng port
netstat -ano | findstr :3001

# Kill process
taskkill /PID <PID_NUMBER> /F
```

### Lỗi "fetch is not defined"
```bash
# Cài node-fetch
npm install node-fetch@2
```

## 🌐 Deploy Production

Để deploy thực tế, bạn có thể sử dụng:

### Vercel (Miễn phí)
1. Tạo file `api/webhook.js`
2. Deploy lên Vercel
3. Setup webhook với URL: `https://yourapp.vercel.app/api/webhook`

### Railway (Miễn phí)
1. Push code lên GitHub
2. Connect với Railway
3. Deploy tự động

### VPS/Server
1. Deploy webhook server lên VPS
2. Sử dụng domain/IP thực
3. Setup SSL certificate

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra console log của webhook server
2. Kiểm tra network tab trong browser
3. Test webhook bằng Postman
4. Xem file log chi tiết trong các file hướng dẫn

---

## 🎯 Workflow Hoàn Chỉnh

```
1. User đặt hàng trên website
   ↓
2. Đơn hàng lưu vào Supabase
   ↓
3. Tin nhắn gửi đến nhóm Telegram
   ↓
4. Admin ấn nút Xác nhận/Từ chối
   ↓
5. Telegram gửi callback đến webhook
   ↓
6. Webhook cập nhật database
   ↓
7. Website nhận thông báo và cập nhật UI
```

**Lưu ý**: Giữ webhook server và ngrok chạy liên tục để hệ thống hoạt động!