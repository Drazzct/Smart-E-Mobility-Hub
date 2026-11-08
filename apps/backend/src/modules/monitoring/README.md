# Module 3 – Network Monitoring (UC-OP-01)

Module 3 **chỉ đọc** dữ liệu của các module khác thông qua các **adapter do Module 3 tự viết**
(Adapter pattern). Module 1/2/4 **không phải** implement interface, export provider hay sửa bất kỳ dòng code nào.

## API

| Endpoint | Chức năng |
|---|---|
| `GET /api/monitoring/overview` | KPI toàn mạng, số liệu từng Hub (xe, cổng sạc, chỗ đỗ), hàng đợi sạc, `dataSources` |
| `GET /api/monitoring/hubs/:hubId` | Chi tiết một Hub (404 nếu không tồn tại) |
| `GET /api/monitoring/alerts` | Cảnh báo: Hub thiếu xe, Hub hết chỗ đỗ, cổng sạc hỏng, xe bảo trì, xe pin thấp |
| `GET /api/monitoring/charging-queue` | Hàng đợi sạc (chỉ đọc) |

## Nguồn dữ liệu

```
Module 1  SharedEvService.findAll() ──► Module1EvAdapter ─────┐
Module 2  (service chỗ đỗ)       ──► Module2ParkingAdapter ──┼──► MonitoringDataSources ──► MonitoringService
Module 4  (service cổng sạc)     ──► Module4ChargerAdapter ──┘        (chưa có → dữ liệu tạm)
```

| Adapter | Tìm service nguồn bằng | Dự đoán dựa trên |
|---|---|---|
| `Module1EvAdapter` | `ModuleRef.get(SharedEvService, { strict: false })` | Backend Module 1 đã có |
| `Module2ParkingAdapter` | Tên class + tên hàm trong `adapter-sources.config.ts` | Frontend `module2-parking/ModuleView.tsx` |
| `Module4ChargerAdapter` | Tên class + tên hàm trong `adapter-sources.config.ts` | Frontend `module4-redist/ModuleView.tsx` |

Adapter tự chuyển đổi các khác biệt đã biết:
- ID Hub: `HUB-METRO` → `hub-metro`, `HUB-DORM` → `hub-ktxb` (xem `hub-id.normalizer.ts`)
- Cổng sạc không có `hubId`: suy ra từ ID `PORT-METRO-01` → `hub-metro`
- Công suất: `"50kW"` → `50`
- Trạng thái: `Available`/`AVAILABLE`/`FREE`, `IN_USE`/`Charging`, `DISABLED`/`Out of Service`… → enum của Module 3
- Dữ liệu trả về dạng mảng hoặc bọc `{ data: [...] }`

Bản ghi không nhận dạng được (Hub lạ, trạng thái lạ, thiếu id) bị **bỏ qua và ghi cảnh báo**,
không hiển thị sai. `GET /overview` → `dataSources` cho biết đang dùng adapter hay dữ liệu tạm và số bản ghi bị bỏ qua.

## Khi Module 2 / Module 4 viết xong backend

1. Chạy backend, mở `GET /api/monitoring/overview`, xem `dataSources`.
2. Nếu vẫn là `"Dữ liệu tạm của Module 3"`: tên service/hàm khác dự đoán → **Module 3** sửa
   `adapters/adapter-sources.config.ts` (thêm đúng tên class và tên hàm chỉ-đọc của họ).
3. Nếu có `"bỏ qua N bản ghi lạ"`: xem log `MonitoringAdapter`, bổ sung trạng thái / tên trường
   vào `STATUS_MAP` hoặc `pick(...)` trong adapter tương ứng.
4. Thêm dữ liệu mẫu của họ vào `adapters.spec.ts` để kiểm tra.

Mọi thay đổi đều nằm trong thư mục Module 3.
