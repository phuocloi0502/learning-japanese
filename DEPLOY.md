# 🚀 Hướng dẫn Deploy lên Firebase Hosting

## 📋 Yêu cầu

- Firebase account (đã có: vophuocloi0502@gmail.com)
- Firebase project đã tạo

## 🔧 Các bước thực hiện

### 1. Tạo Firebase Project (nếu chưa có)

1. Truy cập [Firebase //console](https:////console.firebase.google.com/)
2. Click "Create a project"
3. Đặt tên project: `learning-japanese-app`
4. Enable Google Analytics (tùy chọn)
5. Click "Create project"

### 2. Cấu hình Firebase Hosting

1. Trong Firebase //console, chọn project
2. Click "Hosting" ở menu bên trái
3. Click "Get started"
4. Chọn "Web app" nếu được hỏi

### 3. Deploy ứng dụng

#### Cách 1: Sử dụng script có sẵn

```bash
npm run deploy
```

#### Cách 2: Deploy thủ công

```bash
# Build production
npm run build:prod

# Deploy lên Firebase
npx firebase deploy
```

### 4. Cập nhật Project ID

Nếu bạn đã tạo project với tên khác, cập nhật file `.firebaserc`:

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

## 📁 Cấu trúc files Firebase

- `firebase.json` - Cấu hình Firebase
- `.firebaserc` - Project ID
- `dist/learning-japanese/` - Build output

## 🌐 URL sau khi deploy

Sau khi deploy thành công, ứng dụng sẽ có URL:
`https://your-project-id.web.app`

## 🔄 Cập nhật ứng dụng

Để cập nhật ứng dụng:

1. Thay đổi code
2. Chạy `npm run deploy`
3. Firebase sẽ tự động cập nhật

## 🛠️ Troubleshooting

### Lỗi "Project not found"

- Kiểm tra project ID trong `.firebaserc`
- Đảm bảo project đã được tạo trong Firebase //console

### Lỗi "Permission denied"

- Chạy `npx firebase login` để đăng nhập lại
- Kiểm tra quyền truy cập project

### Build lỗi

- Chạy `npm run build:prod` để kiểm tra lỗi build
- Sửa lỗi trước khi deploy
