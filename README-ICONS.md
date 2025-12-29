# Hướng dẫn tạo Icons cho PWA

Để PWA có thể cài đặt, bạn cần có 2 file icon PNG:
- `public/icon-192.png` (192x192 pixels)  
- `public/icon-512.png` (512x512 pixels)

## ⚡ Cách nhanh nhất: Sử dụng Favicon.io (Khuyến nghị)

1. Truy cập: **https://favicon.io/favicon-generator/**
2. Chọn tab "Text" 
3. Nhập text: **H** (hoặc bất kỳ ký tự nào)
4. Chọn font: **Roboto** hoặc **Open Sans**
5. Background: Chọn màu xanh (#2563eb)
6. Text color: Màu trắng
7. Click "Download" 
8. Giải nén file ZIP
9. Rename và copy vào thư mục `public/`:
   - `android-chrome-192x192.png` → `icon-192.png`
   - `android-chrome-512x512.png` → `icon-512.png`

## Cách 2: Sử dụng file generate-icons.html

1. Mở file `generate-icons.html` trong trình duyệt
2. Right-click vào mỗi canvas và chọn "Save image as..."
3. Lưu với tên:
   - `icon-192.png` cho canvas 192x192
   - `icon-512.png` cho canvas 512x512
4. Đặt 2 file vào thư mục `public/`

## Cách 3: Sử dụng RealFaviconGenerator

1. Truy cập: https://realfavicongenerator.net/
2. Upload một icon graduation cap (PNG/JPG/SVG)
3. Download package
4. Lấy file `android-chrome-192x192.png` và `android-chrome-512x512.png`
5. Rename và đặt vào thư mục `public/`

---

**Sau khi có icons, build lại:**
```bash
npm run build
```

**Kiểm tra:**
- Mở DevTools → Application → Manifest
- Kiểm tra icons có hiển thị đúng không

