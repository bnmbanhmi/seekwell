# AI Analysis Page - New Structure

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│           📱 Kiểm tra nốt ruồi trên da bằng AI              │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              👇 Kéo xuống để kiểm tra                       │
│                  (bounce animation)                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

╔═════════════════════════════════════════════════════════════╗
║  📸 Làm thế nào để chụp ảnh cho đúng?                      ║
║                                                             ║
║  ┌─────────────────────────────────────────────────────┐   ║
║  │ Mẹo chụp ảnh rõ nét:                                │   ║
║  │                                                      │   ║
║  │ 💡 Để ảnh rõ nét, bạn có thể đưa điện thoại ra xa, │   ║
║  │    sau đó phóng to vào nơi cần chụp                 │   ║
║  │                                                      │   ║
║  │ ☀️ Chụp ở nơi có ánh sáng tốt                       │   ║
║  │    (ánh sáng tự nhiên là tốt nhất)                  │   ║
║  │                                                      │   ║
║  │ 📏 Giữ điện thoại song song với vùng da cần chụp   │   ║
║  │                                                      │   ║
║  │ 🎯 Tập trung vào nốt ruồi/vết thương,              │   ║
║  │    không chụp quá xa                                │   ║
║  └─────────────────────────────────────────────────────┘   ║
║                                                             ║
║  ┌──────────────────────┐  ┌──────────────────────┐        ║
║  │        ✅             │  │         ❌            │        ║
║  │   [Good Example]     │  │   [Bad Example]      │        ║
║  │   NÊN CHỤP:          │  │   KHÔNG NÊN:         │        ║
║  │   Ảnh rõ nét...      │  │   Ảnh bị mờ...       │        ║
║  └──────────────────────┘  └──────────────────────┘        ║
╚═════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────┐
│  📝 Thêm ghi chú (nếu cần, trước khi tải ảnh lên):        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Ví dụ: Nốt ruồi này có ngứa không?                  │   │
│  │ Có thay đổi kích thước gần đây không?               │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ☐ Cho phép thu thập ảnh này để cải thiện mô hình AI      │
│                                                             │
│  ℹ️ Ảnh của bạn sẽ được sử dụng để huấn luyện và cải      │
│     thiện độ chính xác của mô hình AI. Chúng tôi cam kết  │
│     bảo mật thông tin cá nhân của bạn.                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  📤 Tải ảnh lên                                            │
│                                                             │
│     ┌─────────────────────────────────────────┐            │
│     │  📷  Chụp ảnh mới                       │            │
│     └─────────────────────────────────────────┘            │
│                                                             │
│     ┌─────────────────────────────────────────┐            │
│     │  ☁️  Chọn từ máy                        │            │
│     └─────────────────────────────────────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow with ImgBB Integration

```
User uploads image with consent checked
           ↓
    analyzeImage() triggered
           ↓
    ┌─────────────────┐
    │ allowDataCollection? │
    └─────────────────┘
           ↓ YES
    uploadToImgBB(file)
           ↓
    POST to api.imgbb.com/1/upload
           ↓
    Response: { data: { url: "..." } }
           ↓
    Append URL to notes:
    "User notes\n[Image URL: https://...]"
           ↓
    Continue with AI analysis
           ↓
    Save to history with enhanced notes
```

## Key Improvements

### Before:
1. Title
2. Notes field
3. Upload buttons
4. How to take photos (at bottom)

### After:
1. Title
2. **Scroll hint** (NEW)
3. **How to take photos** (MOVED UP)
4. **Detailed tips** (NEW)
5. Good/bad examples
6. Notes field
7. **Data collection consent** (NEW)
8. Upload buttons

### Benefits:
- ✅ Users see guidance BEFORE uploading
- ✅ Clear scroll indication
- ✅ Detailed photography tips
- ✅ Optional data collection with consent
- ✅ Better UX flow
- ✅ Fully bilingual
