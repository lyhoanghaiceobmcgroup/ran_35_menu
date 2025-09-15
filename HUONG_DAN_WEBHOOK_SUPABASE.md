# Hướng dẫn tạo Supabase Edge Function cho Webhook Sepay

## 📋 Tổng quan

Hướng dẫn này sẽ giúp bạn tạo và deploy Supabase Edge Function để nhận webhook từ Sepay khi khách hàng thực hiện thanh toán chuyển khoản.

## 🛠️ Yêu cầu trước khi bắt đầu

1. **Tài khoản Supabase**: Đã tạo project trên [supabase.com](https://supabase.com)
2. **Tài khoản Sepay**: Đã đăng ký và có API key
3. **Node.js**: Phiên bản 16 trở lên
4. **Supabase CLI**: Cài đặt global

## 📦 Bước 1: Cài đặt Supabase CLI

```bash
# Cài đặt Supabase CLI
npm install -g supabase

# Kiểm tra phiên bản
supabase --version
```

## 🔐 Bước 2: Đăng nhập và liên kết project

```bash
# Đăng nhập Supabase
supabase login

# Liên kết với project (thay your-project-id bằng ID thực tế)
supabase link --project-ref your-project-id
```

## 📁 Bước 3: Cấu trúc Edge Function

Edge Function đã được tạo sẵn trong project:

```
supabase/
├── functions/
│   ├── sepay-webhook/
│   │   └── index.ts          # Edge Function chính
│   ├── .env.example          # Template biến môi trường
│   └── README.md             # Hướng dẫn chi tiết
└── config.toml               # Cấu hình Supabase
```

## 🚀 Bước 4: Deploy Edge Function

### Cách 1: Sử dụng script tự động

```bash
# Chạy script deploy tự động
npm run deploy:webhook
```

### Cách 2: Deploy thủ công

```bash
# Deploy function
supabase functions deploy sepay-webhook

# Xem logs (nếu cần)
supabase functions logs sepay-webhook
```

## ⚙️ Bước 5: Cấu hình biến môi trường

1. **Truy cập Supabase Dashboard**:
   - Vào [app.supabase.com](https://app.supabase.com)
   - Chọn project của bạn
   - Vào **Settings** > **Edge Functions**

2. **Thêm các biến môi trường**:

   | Tên biến | Giá trị | Mô tả |
   |----------|---------|-------|
   | `SUPABASE_URL` | `https://your-project-id.supabase.co` | URL project Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Service role key từ Settings > API |
   | `TELEGRAM_BOT_TOKEN` | `123456:ABC...` | Token bot Telegram (tùy chọn) |
   | `TELEGRAM_CHAT_ID` | `-100123456789` | Chat ID Telegram (tùy chọn) |

3. **Lấy Service Role Key**:
   - Vào **Settings** > **API**
   - Copy **service_role** key (không phải anon key)

## 🔗 Bước 6: Cấu hình Webhook URL

1. **URL Webhook của bạn**:
   ```
   https://your-project-id.supabase.co/functions/v1/sepay-webhook
   ```

2. **Cập nhật file .env**:
   ```env
   VITE_SEPAY_WEBHOOK_URL=https://your-project-id.supabase.co/functions/v1/sepay-webhook
   ```

3. **Cấu hình trong Sepay Dashboard**:
   - Đăng nhập vào tài khoản Sepay
   - Vào phần **Webhook Settings**
   - Thêm URL webhook và chọn method **POST**

## 🧪 Bước 7: Test Webhook

### Test local (tùy chọn)

```bash
# Chạy function local
supabase functions serve sepay-webhook

# Function sẽ chạy tại:
# http://localhost:54321/functions/v1/sepay-webhook
```

### Test với dữ liệu thật

1. **Tạo đơn hàng test** trong ứng dụng
2. **Thực hiện chuyển khoản** với nội dung chứa mã đơn hàng
3. **Kiểm tra logs**:
   ```bash
   supabase functions logs sepay-webhook
   ```

## 📝 Format nội dung chuyển khoản

Webhook sẽ tự động trích xuất mã đơn hàng từ nội dung chuyển khoản theo các format:

- `RAN{orderCode}{timestamp}` - Ví dụ: `RANABC123456789`
- UUID đầy đủ - Ví dụ: `550e8400-e29b-41d4-a716-446655440000`

## 🔍 Monitoring và Debug

### Xem logs real-time

```bash
# Xem logs function
supabase functions logs sepay-webhook --follow

# Xem logs với filter
supabase functions logs sepay-webhook --level error
```

### Kiểm tra trạng thái function

```bash
# List tất cả functions
supabase functions list

# Xem chi tiết function
supabase functions inspect sepay-webhook
```

## 🛡️ Bảo mật

1. **Service Role Key**: Chỉ sử dụng trong Edge Function, không expose ra client
2. **Webhook Validation**: Function tự động validate dữ liệu từ Sepay
3. **Error Handling**: Xử lý lỗi an toàn, không leak thông tin nhạy cảm

## 🔄 Luồng xử lý Webhook

1. **Sepay gửi webhook** khi có giao dịch chuyển khoản
2. **Edge Function nhận** và validate dữ liệu
3. **Trích xuất mã đơn hàng** từ nội dung chuyển khoản
4. **Tìm đơn hàng** trong database Supabase
5. **Kiểm tra số tiền** khớp với đơn hàng
6. **Cập nhật trạng thái** đơn hàng thành 'confirmed'
7. **Gửi thông báo Telegram** (nếu được cấu hình)
8. **Trả về response** cho Sepay

## 📱 Tích hợp Telegram (Tùy chọn)

### Tạo Telegram Bot

1. **Tìm @BotFather** trên Telegram
2. **Gửi** `/newbot` và làm theo hướng dẫn
3. **Lưu Bot Token** để cấu hình

### Lấy Chat ID

1. **Thêm bot** vào group/channel
2. **Gửi tin nhắn** bất kỳ
3. **Truy cập**: `https://api.telegram.org/bot{BOT_TOKEN}/getUpdates`
4. **Tìm chat.id** trong response

## ❗ Troubleshooting

### Lỗi thường gặp

1. **"Function not found"**:
   - Kiểm tra tên function: `sepay-webhook`
   - Đảm bảo đã deploy thành công

2. **"Environment variable not set"**:
   - Kiểm tra biến môi trường trong Supabase Dashboard
   - Đảm bảo tên biến chính xác

3. **"Order not found"**:
   - Kiểm tra format nội dung chuyển khoản
   - Đảm bảo mã đơn hàng tồn tại trong database

4. **"Amount mismatch"**:
   - Kiểm tra số tiền chuyển khoản khớp với đơn hàng
   - Cho phép sai lệch 1 VND do làm tròn

### Debug tips

```bash
# Xem logs chi tiết
supabase functions logs sepay-webhook --level debug

# Test function local
curl -X POST http://localhost:54321/functions/v1/sepay-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## 🎯 Kết luận

Sau khi hoàn thành các bước trên, bạn sẽ có:

✅ **Supabase Edge Function** xử lý webhook Sepay tự động  
✅ **Cập nhật trạng thái đơn hàng** real-time  
✅ **Thông báo Telegram** khi có thanh toán  
✅ **Monitoring và logging** đầy đủ  
✅ **Bảo mật cao** với Service Role Key  

Hệ thống webhook giờ đây sẽ tự động xử lý thanh toán mà không cần can thiệp thủ công!

---

**📞 Hỗ trợ**: Nếu gặp vấn đề, hãy kiểm tra logs và tham khảo [Supabase Documentation](https://supabase.com/docs/guides/functions)