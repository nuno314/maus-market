# Maus Collect

Shop thẻ Pokémon era Mega Evolution. Admin đăng những lá đang có, khách lọc theo mùa, tìm tên, thêm giỏ và gửi đơn qua Zalo.

- Thẻ tiếng Anh lấy giá market Near Mint từ TCGPlayer (qua Pokémon TCG API).
- Thẻ tiếng Nhật lấy giá từ trang công khai của Cardrush. Nếu Cardrush chặn truy cập tự động, admin nhập giá yên tay.
- Giá hiển thị bằng VND, theo tỷ giá và hệ số condition trong trang cài đặt.
- Condition A, A- và B là từng listing riêng.

## Chạy local

```bash
npm install
npm run dev
```

Mở http://127.0.0.1:4317

Tài khoản admin mặc định: `admin` / `maus-admin`. Đổi trong file `.env` (xem `.env.example`) rồi khởi động lại server.

Chưa có `TURSO_DATABASE_URL` thì database là file SQLite `data/maus.db` (không commit). Có URL Turso thì app dùng database đó. Ảnh upload lưu ở `public/uploads` khi chưa có `BLOB_READ_WRITE_TOKEN`. Lần đầu vào Kho, bấm **Đồng bộ catalog** để tải tên và ảnh các set Mega Evolution. Ảnh tiếng Nhật lấy từ Limitless khi TCGdex chưa có scan. Nếu Cardrush chặn máy chủ, nhập giá yên bằng tay.

## Deploy Vercel

Tạo database trên [Turso](https://turso.tech) và một Blob store trong project Vercel, rồi đặt các biến trong `.env.example`:

- `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
- `BLOB_READ_WRITE_TOKEN` (Vercel điền khi gắn Blob store)
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_SECRET`
