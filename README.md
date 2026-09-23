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

Database SQLite nằm ở `data/maus.db` và không được commit. Lần đầu vào Kho, bấm **Đồng bộ catalog** để tải tên và ảnh các set Mega Evolution. Ảnh tiếng Nhật lấy từ Limitless khi TCGdex chưa có scan. Nếu Cardrush chặn máy chủ, nhập giá yên bằng tay.
