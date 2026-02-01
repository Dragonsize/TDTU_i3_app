Frontend là một ứng dụng Next.js 14 hiện đại được xây dựng bằng TypeScript và Tailwind CSS. 

## Stack Công nghệ
- **Framework**: Next.js 14.2.23 (App Router)
- **Ngôn ngữ**: TypeScript
- **Styling**: Tailwind CSS 3.4.19
- **Biểu tượng UI**: Material Symbols Outlined (Google Fonts)
- **Font chữ**: Inter (trọng lượng: 300, 400, 700, 900)
- **Quản lý trạng thái**: React Hooks (localStorage để lưu trữ)
- **Định tuyến**: Next.js App Router

## Cấu trúc 
```
src/
├── app/
│   ├── page.tsx                 # Trang chủ với tùy chọn đăng nhập
│   ├── login/page.tsx           # Trang đăng nhập với xác thực biểu mẫu
│   ├── dashboard/page.tsx       # Bảng điều khiển chính (được bảo vệ)
│   ├── chatbot/page.tsx         # Placeholder Chatbot AI
│   ├── calendar/page.tsx        # Placeholder Smart Calendar
│   ├── marketplace/page.tsx     # Placeholder Student Marketplace
│   ├── listings/page.tsx        # Placeholder Danh sách Sản phẩm của Người dùng
│   ├── settings/page.tsx        # Trang Cài đặt Tài khoản
│   ├── layout.tsx               # Bố cục gốc với kiểu toàn cầu
│   └── globals.css              # Tailwind & CSS tùy chỉnh
├── lib/
│   ├── translations.ts          # i18n chuỗi dịch (EN/VI)
│   └── useTranslations.ts       # Hook tùy chỉnh cho dịch
└── components/                  # Các thành phần có thể tái sử dụng (tương lai)
```

## Các Tính năng Chính

### 1. Xác thực
- **Luồng Đăng nhập**: Xác thực username/password qua TDTU elearning
- **Quản lý Phiên**: JWT tokens được lưu trữ trong cookies HTTP-only
- **Scraping Hồ sơ**: Tự động tìm nạp dữ liệu người dùng (tên, email, địa điểm, múi giờ)
- **Lưu trữ Phiên**: Hồ sơ người dùng được lưu trong localStorage
- **Đăng nhập Nhanh**: Nút để nhanh chóng đăng nhập lại các tài khoản đã lưu bằng refresh tokens

### 2. Bảng điều khiển
- **Thông điệp Chào mừng**: Lời chào cá nhân hóa sử dụng trích xuất tên 
- **Hiển thị Hồ sơ**: Hiển thị tất cả chi tiết người dùng (tên, email, địa điểm, múi giờ)
- **Thẻ Thống kê**: Hiển thị cuộc trò chuyện AI, sự kiện sắp tới, danh sách hoạt động
- **Bố cục Phản hồi**: Hoạt động liền mạch trên thiết bị di động, máy tính bảng và máy tính để bàn
- **Điều hướng Thanh bên**: Menu điều hướng có thể thu gọn với chế độ tối
- **Tính nhất quán Chủ đề**: Chuyển đổi mượt mà giữa chế độ sáng/tối

### 3. Trang Cài đặt
- **Chuyển đổi Chủ đề**: Chuyển đổi giữa chế độ sáng và tối
- **Chọn Ngôn ngữ**: Chọn giữa tiếng Anh và tiếng Việt
- **Kiểm soát Quyền riêng tư**: Đặt mức độ hiển thị hồ sơ (Công khai/Riêng tư, mặc định: Công khai)
- **Nút Đăng xuất**: Đăng xuất an toàn và xóa phiên
- **Tùy chọn Lưu trữ**: Tất cả cài đặt được lưu vào localStorage

### 4. Hệ thống Điều hướng
- **Bảng điều khiển** - Trung tâm chính với hồ sơ và thống kê
- **Chatbot AI** - Placeholder sắp có
- **Lịch Thông minh** - Placeholder sắp có
- **Thị trường** - Placeholder sắp có  
- **Danh sách của tôi** - Placeholder sắp có
- **Cài đặt** - Tùy chọn và điều khiển tài khoản

### 5. Quốc tế hóa (i18n)
- **Ngôn ngữ Được hỗ trợ**: Tiếng Anh, Tiếng Việt
- **Hệ thống Dịch**: Đối tượng dịch dựa trên JSON đơn giản
- **Hook Tùy chỉnh**: `useTranslations()` trả về hàm `t()` và `language` hiện tại
- **Ngôn ngữ Lưu trữ**: Lựa chọn ngôn ngữ của người dùng được lưu trong localStorage
- **Dịch Động**: Tất cả các trang cập nhật ngay lập tức khi thay đổi ngôn ngữ

### 6. Chế độ Tối
- **Chuyển đổi Dựa trên Lớp**: Sử dụng các lớp `dark:` của Tailwind
- **Toàn hệ thống**: Trạng thái chế độ tối được quản lý toàn cầu thông qua localStorage
- **Chuyển đổi Mượt mà**: Chuyển đổi CSS ngăn chặn những thay đổi gây sốc
- **Kiểu dáng Nhất quán**: Tất cả các thành phần tôn trọng tùy chọn chủ đề

### 7. Lưu trữ & Lưu trữ Dữ liệu
- **Dữ liệu Hồ sơ**: `localStorage.userProfile` - Thông tin đăng nhập của người dùng
- **Tùy chọn Chủ đề**: `localStorage.darkMode` - Lựa chọn chế độ sáng/tối
- **Cài đặt Ngôn ngữ**: `localStorage.language` - Lựa chọn ngôn ngữ của người dùng
- **Cài đặt Quyền riêng tư**: `localStorage.profileVisibility` - Trạng thái Công khai/Riêng tư
- **JWT Tokens**: Được lưu trữ trong cookies HTTP-only (an toàn, được quản lý máy chủ)

## Luồng Xác thực

1. **Trang Chủ** → Người dùng nhấp "Đăng nhập"
2. **Trang Đăng nhập** → Người dùng nhập thông tin xác thực TDTU
3. **Scraping Backend** → FastAPI scrape dữ liệu hồ sơ
4. **Xác thực** → Kiểm tra xem dữ liệu hồ sơ có hợp lệ không
5. **Lưu trữ Cơ sở dữ liệu** → Lưu hồ sơ người dùng vào Supabase
6. **Tạo JWT** → Tạo access/refresh tokens
7. **Lưu trữ Cookie** → Đặt cookies HTTP-only
8. **Lưu trữ Hồ sơ** → Lưu hồ sơ vào localStorage
9. **Chuyển hướng** → Người dùng được chuyển hướng đến bảng điều khiển
10. **Bảng điều khiển** → Tải hồ sơ từ localStorage, hiển thị dữ liệu

## Ví dụ Dịch

```typescript
// Trong bất kỳ thành phần nào
import { useTranslations } from '../../lib/useTranslations';

export function MyComponent() {
  const { t, language } = useTranslations();
  
  return (
    <div>
      <h1>{t('welcomeBack')}</h1>
      <p>{t('personalizedHub')}</p>
      <button>{t('logout')}</button>
    </div>
  );
}
```

## Phương pháp Tạo kiểu

### Cấu hình Tailwind
- **Màu Chính**: #7f13ec (Tím)
- **Màu Phụ**: #3b82f6 (Xanh)
- **Nền (Sáng)**: #f7f6f8 (Trắng lạnh)
- **Nền (Tối)**: #050505 (Gần như đen)
- **Chế độ Tối**: Dựa trên lớp (tiền tố `dark:`)

### Các lớp CSS tùy chỉnh
- `.grid-bg` - Mẫu lưới nền
- `.text-gradient` - Hiệu ứng văn bản gradient
- `.glass-effect` - Hiệu ứng backdrop kính mờ
- `.animate-fade-in` - Hoạt ảnh fade-in trên các phần tử
- `.font-display` - Font Inter

### Các điểm ngắt Phản hồi
- Điện thoại di động: Mặc định (không có tiền tố)
- Máy tính bảng: `md:` (768px+)
- Máy tính để bàn: `lg:` (1024px+)

## Mẫu Thành phần

### NavItem (Điều hướng Thanh bên)
- Thành phần liên kết điều hướng có thể tái sử dụng
- Hiển thị trạng thái hoạt động nổi bật
- Hiển thị Biểu tượng + nhãn (nhãn ẩn khi thu gọn)
- Tooltip khi di chuột khi thu gọn

### StatCard (Thống kê Bảng điều khiển)
- Hiển thị biểu tượng, nhãn và giá trị
- Có mã màu (chính/phụ)
- Được sử dụng để hiển thị số liệu

### ProfileField (Thông tin Hồ sơ)
- Hiển thị cặp nhãn-giá trị
- Tạo kiểu nhất quán trên bảng điều khiển

## Tích hợp API

### Điểm cuối Được sử dụng
- `POST /api/login` - Xác thực và lấy hồ sơ người dùng
- `POST /api/logout` - Xóa phiên và cookies
- `GET /api/verify-session` - Kiểm tra xem phiên có hợp lệ không
- `POST /api/refresh-token` - Làm mới access token

### Quản lý Cookie
- **Access Token**: JWT token cho các yêu cầu được xác thực
- **Cờ An toàn**: Chỉ HTTPS (sản xuất)
- **SameSite**: Lax (ngăn chặn tấn công CSRF)
- **HttpOnly**: Không thể truy cập qua JavaScript
- **Hết hạn**: 24 giờ (truy cập), 7 ngày (làm mới)

## Hỗ trợ Trình duyệt
- Các trình duyệt hiện đại (Chrome, Firefox, Safari, Edge)
- Yêu cầu JavaScript được bật
- localStorage phải có sẵn
- Cookies phải được bật

## Xây dựng & Triển khai

### Phát triển Cục bộ
```bash
npm install
npm run dev
# Ứng dụng chạy trên http://localhost:3000
```

### Xây dựng Sản xuất
```bash
npm run build
npm start
```

### Biến Môi trường Bắt buộc
- `NEXT_PUBLIC_API_URL` - URL API Backend (nếu khác với /api)

## Tối ưu hóa Hiệu suất
- **Tối ưu hóa Hình ảnh**: Sử dụng thành phần Next.js Image (tương lai)
- **Tách Mã**: Tách tự động theo tuyến
- **CSS-in-JS**: Tailwind chỉ tạo các lớp được sử dụng
- **Chế độ Tối**: Duyệt qua DOM một lần duy nhất để thay đổi chủ đề
- **localStorage**: Tải chủ đề ngay lập tức không có flash

## Tính năng Khả năng truy cập
- Các phần tử HTML Ngữ nghĩa
- Phân cấp Tiêu đề thích hợp
- Văn bản Alt cho hình ảnh
- Trạng thái Tiêu điểm cho điều hướng bàn phím
- Nhãn ARIA khi cần thiết

## Cải tiến Tương lai
- [ ] Triển khai Chatbot AI thực tế
- [ ] Lịch với quản lý lịch biểu
- [ ] Danh sách sản phẩm Thị trường
- [ ] Tùy chỉnh hồ sơ người dùng
- [ ] Hệ thống Thông báo
- [ ] Chức năng Tìm kiếm
- [ ] Tùy chọn Lọc nâng cao
- [ ] Cập nhật Thời gian thực (WebSockets)

## Đóng góp
Khi thêm các tính năng mới:
1. Thêm khóa dịch vào [src/lib/translations.ts](src/lib/translations.ts)
2. Nhập và sử dụng hook `useTranslations()`
3. Kiểm tra ở cả chế độ sáng và tối
4. Kiểm tra với cả ngôn ngữ tiếng Anh và tiếng Việt
5. Đảm bảo lưu trữ localStorage cho bất kỳ tùy chọn người dùng nào

## Kích thước Tệp (Được tối ưu hóa)
- Gói chính: ~120KB (gzip)
- CSS: ~30KB (sản xuất)
- Bản dịch: ~8KB

---

**Cập nhật Lần cuối**: 1 Tháng 2 năm 2026
**Phiên bản**: 1.0.0
