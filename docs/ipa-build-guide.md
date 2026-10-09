# Dạ Vô Cực — Mobile MOBA Prototype

Mục tiêu của dự án này là tạo một bản chơi thử nghiệm thân thiện với web và thiết bị di động, tập trung vào gameplay cơ bản của MOBA 3D/2.5D nhưng vẫn có thể chạy ngay trong trình duyệt mà không cần cấu hình phức tạp. Dự án là một prototype nhỏ nhưng có thể chơi được, không phải mockup tĩnh.

## Tình trạng hiện tại

- Hoàn thành: gameplay cơ bản, camera top-down, joystick cảm ứng, kỹ năng theo ba dạng nhân vật, AI đơn giản, điều kiện thắng/thua, giao diện mobile-friendly.
- Chưa có tệp IPA thực tế: cần macOS + Xcode + Apple Developer account và signing. Môi trường hiện tại không có khả năng ký ứng dụng Apple nên không giả định đã build IPA thành công.
- Mô hình đồ họa: prototype này là 2.5D/top-down canvas-based, không dùng ảnh tĩnh để giả làm 3D thực, phù hợp với giới hạn của môi trường web và lưu trữ mã nguồn.

## Cấu trúc thư mục

```text
.
├── index.html
├── styles.css
├── src/
│   └── game.js
├── docs/
│   └── ipa-build-guide.md
├── README.md
└── .gitignore
```

## Chạy thử trên trình duyệt

### Cách 1: Mở trực tiếp tập tin

- Mở `index.html` trong trình duyệt hiện đại.
- Hệ thống dùng canvas và không yêu cầu build phức tạp.

### Cách 2: Sử dụng máy chủ HTTP tĩnh

Nếu muốn trải nghiệm giống web app hơn:

```bash
cd /đường/dẫn/đến/proj
python3 -m http.server 8000
```

Sau đó mở trình duyệt:

```text
http://localhost:8000
```

Trên điện thoại cùng mạng Wi‑Fi, hãy thay `localhost` bằng địa chỉ IP của máy tính đang chạy server, ví dụ:

```text
http://192.168.1.10:8000
```

## Điều khiển

- Joystick trái: di chuyển.
- Nút `Tấn công`: đánh gần bằng kiếm.
- Nút `Kỹ năng 1/2`: mỗi dạng nhân vật có hiệu ứng riêng.
- Nút `Ultimate`: kỹ năng mạnh, có hồi chiêu dài.
- Nút đổi dạng ở góc phải: Thần, Ma, Song Mệnh.
- Desktop: WASD hoặc mũi tên để di chuyển, Space để tấn công, 1/2/3 để dùng kỹ năng.

## Bản chất gameplay

### Dạng Thần — Thiên Kiếm Vô Khuyết

- Tốc độ vừa phải, sát thương định hướng cao.
- Kỹ năng tập trung vào chém xuyên hoặc tấn công khu vực.

### Dạng Ma — Huyết Kiếm Cuồng Tận

- Tốc độ cao và sát thương mạnh trong phạm vi gần.
- Kỹ năng đẩy lùi hoặc đánh lan, phù hợp với chiến đấu cuồng loạn.

### Dạng Song Mệnh — Quy Nhất

- Kết hợp tốc độ và độ linh hoạt cao.
- Có hiệu ứng biến hình ngắn và sát thương mạnh khi dùng combo đúng thời điểm.

## Xây dựng IPA bằng dịch vụ build thực tế

Lưu ý quan trọng: không có tệp IPA được tạo trong môi trường này. Dưới đây là quy trình thực tế, cần môi trường Apple có quyền ký ứng dụng.

### 1. Yêu cầu tài khoản và môi trường

- Apple Developer Program ($99/năm): cần cho bản build thật và triển khai lên thiết bị.
- macOS + Xcode: bắt buộc để đóng gói iOS app.
- Provisioning Profile cho device UDID.
- Apple Distribution Certificate.
- App ID / Bundle Identifier duy nhất.

### 2. Bao bọc web app thành iOS app

Phương án thực tế phù hợp với trò chơi web này là dùng Capacitor:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init "DaVoCuc" "com.daovocuc.prototype"
npx cap add ios
```

Sau khi đã phát triển web app trong `www`/hoặc `dist`:

```bash
npx cap copy ios
```

Mở Xcode:

```bash
open ios/App.xcworkspace
```

Trong Xcode:

- Chọn target `App`
- Cài đặt Signing & Capabilities
- Chọn Team
- Tạo Provisioning Profile tương ứng
- Chọn Generic iOS Device
- Product > Archive
- Export App -> Ad Hoc / App Store

### 3. Dịch vụ build trên đám mây

Nếu không có máy Mac cục bộ, một số dịch vụ hỗ trợ build iOS là:

- Codemagic
- Appcircle
- Bitrise
- Xcode Cloud (cần môi trường Apple)

Các dịch vụ này thường yêu cầu:

- repository GitHub
- Apple Developer account
- certificate và provisioning profile được liên kết đúng
- build settings cho bundle identifier và signing

### 4. Cài IPA lên thiết bị thực

- Kết nối iPhone qua USB hoặc qua dịch vụ quản lý thiết bị.
- Cài `ios-deploy` hoặc sử dụng Xcode / Apple Configurator / TestFlight.
- Với build Ad Hoc, cần đăng ký UDID của thiết bị trong Apple Developer portal.
- Với TestFlight, cần bổ sung thiết bị vào External Testing, sau đó tải ứng dụng từ App Store Connect.

## Yêu cầu tài khoản và ký ứng dụng

- Apple ID có quyền Developer Program.
- Tạo và quản lý: Certificate, Provisioning Profile, App ID.
- Nếu chỉ test trên thiết bị cá nhân: cần thêm UDID vào portal và build lại với profile tương ứng.
- Nếu muốn phát hành rộng: cần tài liệu App Store Connect, privacy policy, metadata ứng dụng.

## Lưu ý kỹ thuật quan trọng

- Prototype này là 2.5D/top-down 2D canvas vì mục tiêu là chạy nhanh trên trình duyệt và mobile mà không yêu cầu asset 3D nặng.
- Không dùng hình ảnh tĩnh để giả là model 3D tương tác.
- Mã được tách rời: giao diện (`index.html`, `styles.css`), gameplay (`src/game.js`).
- Tài nguyên âm thanh / sprite / VFX hiện chưa tích hợp đầy đủ; có thể bổ sung sau khi nền tảng đánh giá ổn định.

## Tài liệu tham khảo phát triển tiếp theo

- Thêm minimap, lane, tower, jungle, quá trình farm và gank.
- Tách gameplay thành module: hero, enemy AI, combat, skill system.
- Bổ sung phần âm thanh, hit FX, skill VFX, tầm đánh và cooldown UI.
- Tạo bản đồ nhỏ 3 lane + jungle như MOBA nguyên mẫu.

## Kết luận

Bản prototype web đã sẵn sàng chạy trên trình duyệt, có điều khiển cảm ứng cho thiết bị mobile, ba dạng nhân vật và AI đơn giản. Tuy nhiên, IPA thực sự không được tạo trong môi trường hiện tại vì thiếu macOS, Xcode và chứng chỉ Apple. Quy trình build IPA đã được mô tả thực tế để người dùng triển khai khi có môi trường ký ứng dụng phù hợp.

