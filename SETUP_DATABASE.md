# Hướng dẫn thiết lập Database

## Lỗi hiện tại
Bạn đang gặp lỗi:
```
GET https://tiaosohnkcpzxszphpqs.supabase.co/rest/v1/customers?select=count&limit=1 406 (Not Acceptable)
net::ERR_ABORTED https://tiaosohnkcpzxszphpqs.supabase.co/rest/v1/customers?select=count&limit=1
```

## Nguyên nhân
Bảng `customers` chưa được tạo trong database Supabase.

## Cách khắc phục

### Bước 1: Truy cập Supabase Dashboard
1. Mở trình duyệt và truy cập: https://supabase.com/dashboard
2. Đăng nhập vào tài khoản của bạn
3. Chọn project: `tiaosohnkcpzxszphpqs`

### Bước 2: Mở SQL Editor
1. Trong dashboard, click vào **SQL Editor** ở sidebar bên trái
2. Click **New Query** để tạo query mới

### Bước 3: Chạy script tạo bảng
1. Copy toàn bộ nội dung từ file `create_customers_table.sql`
2. Paste vào SQL Editor
3. Click **Run** để thực thi script

### Bước 4: Kiểm tra kết quả
Sau khi chạy script thành công, bạn sẽ thấy:
- Bảng `customers` được tạo trong **Table Editor**
- Thông báo "Customers table setup completed successfully!"

### Bước 5: Test ứng dụng
1. Quay lại website: http://localhost:8080/
2. Nhập số điện thoại và click "Vào Menu"
3. Kiểm tra trong **Table Editor** > **customers** để xem dữ liệu đã được lưu

## Cấu trúc bảng customers

| Cột | Kiểu dữ liệu | Mô tả |
|-----|-------------|-------|
| id | UUID | Primary key, tự động tạo |
| phone | VARCHAR(15) | Số điện thoại khách hàng (unique) |
| table_code | VARCHAR(10) | Mã bàn |
| first_visit_at | TIMESTAMP | Thời gian truy cập đầu tiên |
| last_visit_at | TIMESTAMP | Thời gian truy cập gần nhất |
| visit_count | INTEGER | Số lần truy cập |
| created_at | TIMESTAMP | Thời gian tạo record |
| updated_at | TIMESTAMP | Thời gian cập nhật gần nhất |

## Tính năng

- **Khách hàng mới**: Tạo record mới với visit_count = 1
- **Khách hàng cũ**: Cập nhật last_visit_at và tăng visit_count
- **Row Level Security**: Đã được bật với policies cho phép public access
- **Indexes**: Tối ưu hóa truy vấn theo phone và table_code

## Troubleshooting

Nếu vẫn gặp lỗi sau khi tạo bảng:

1. **Kiểm tra API Key**: Đảm bảo `VITE_SUPABASE_PUBLISHABLE_KEY` trong file `.env` đúng
2. **Kiểm tra URL**: Đảm bảo `VITE_SUPABASE_URL` trong file `.env` đúng
3. **Restart server**: Chạy lại `npm run dev`
4. **Clear cache**: Xóa cache trình duyệt và reload trang

Nếu vẫn không được, ứng dụng sẽ tiếp tục hoạt động bình thường nhưng không lưu thông tin khách hàng vào database.