import { useMemo, useState } from "react";
import "./Module3.css";
import type {
  AlertSeverity,
  ChargingQueueItem,
  MonitoringAlert,
} from "../../api/monitoring.api";
import { useMonitoringData, MONITORING_POLL_INTERVAL_MS } from "./useMonitoringData";
import type { ConnectionStatus } from "./monitoringPoller";

const CRITICAL_BATTERY_THRESHOLD = 20;

const formatTime = (d: Date | null) =>
  d ? d.toLocaleTimeString("vi-VN", { hour12: false }) : "--:--:--";
const pad2 = (n: number) => n.toString().padStart(2, "0");

function QueueStatusPill({ state }: { state: ChargingQueueItem["state"] }) {
  return state === "charging" ? (
    <span className="m2-status-pill charging">Charging</span>
  ) : (
    <span className="m2-status-pill waiting">Waiting</span>
  );
}

function BatteryBar({ value }: { value: number }) {
  const cls = value < 20 ? "low" : value < 50 ? "medium" : "high";
  return (
    <div className="m2-battery-wrap" aria-label={`Pin ${value}%`}>
      <div className="m2-battery-track">
        <div className={`m2-battery-fill ${cls}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`m2-battery-value ${cls}`}>{value}%</span>
    </div>
  );
}

const CONNECTION_LABEL: Record<ConnectionStatus, string> = {
  loading: "Đang kết nối…",
  live: "LIVE",
  stale: "Mất kết nối",
  error: "Không có dữ liệu",
};

function ConnectionBadge({
  status,
  lastSuccessAt,
  onRefresh,
}: {
  status: ConnectionStatus;
  lastSuccessAt: Date | null;
  onRefresh: () => void;
}) {
  return (
    <div className="m3-conn-group">
      <span className={`m3-conn ${status}`}>
        <span className="m3-conn-dot" />
        {CONNECTION_LABEL[status]}
      </span>
      <span className="m3-conn-time">Cập nhật lúc {formatTime(lastSuccessAt)}</span>
      <button className="m3-refresh-btn" onClick={onRefresh} title="Tải lại ngay">
        ⟳ Làm mới
      </button>
    </div>
  );
}

const SEVERITY_META: Record<AlertSeverity, { icon: string; label: string }> = {
  CRITICAL: { icon: "⛔", label: "Nghiêm trọng" },
  WARNING: { icon: "⚠", label: "Cảnh báo" },
  INFO: { icon: "ℹ", label: "Thông tin" },
};

type QueueFilter = "all" | "charging" | "waiting";

export function Module3Monitoring() {
  const { overview, alerts, status, lastSuccessAt, error, refresh } = useMonitoringData();
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("all");

  const hubName = useMemo(() => {
    const names = new Map(overview?.hubs.map((m) => [m.hub.id, m.hub.name]) ?? []);
    return (id: string) => names.get(id) ?? id;
  }, [overview]);

  const queue = overview?.chargingQueue ?? [];
  const visibleQueue = queueFilter === "all" ? queue : queue.filter((q) => q.state === queueFilter);
  const alertCount = (s: AlertSeverity) => alerts.filter((a) => a.severity === s).length;

  return (
    <div className="module4-container">
      <div className="module4-tabs">
        <button className="tab-button active">Network Monitoring Dashboard</button>
      </div>
      <div className="module4-content">
        <div className="m2-page">
          <div className="m2-page-heading m3-heading">
            <div>
              <div className="m2-eyebrow">NETWORK MONITORING · UC-OP-01</div>
              <h1>Network Monitoring Dashboard</h1>
              <p className="m2-subtitle">
                Tổng quan trạng thái xe, chỗ đỗ, cổng sạc và mức sử dụng của toàn bộ mạng lưới Mobility Hub.
                Tự động cập nhật mỗi {MONITORING_POLL_INTERVAL_MS / 1000} giây.
              </p>
            </div>
            <ConnectionBadge status={status} lastSuccessAt={lastSuccessAt} onRefresh={refresh} />
          </div>

          {status === "stale" && (
            <div className="m2-notice error" role="status">
              <span className="m2-notice-symbol">!</span>
              <span>
                {error}. Đang hiển thị dữ liệu hợp lệ gần nhất lúc <strong>{formatTime(lastSuccessAt)}</strong> –
                hệ thống sẽ tự thử lại.
              </span>
            </div>
          )}

          {!overview ? (
            <section className="m2-panel">
              <div className="m2-empty">
                <div className="m2-empty-icon">{status === "error" ? "!" : "⟳"}</div>
                <h3>{status === "error" ? "Không lấy được dữ liệu mạng lưới" : "Đang tải dữ liệu mạng lưới…"}</h3>
                {status === "error" && (
                  <>
                    <p>{error}. Kiểm tra backend đã chạy chưa (pnpm dev:backend).</p>
                    <button className="m2-primary-btn" onClick={refresh}>Thử lại</button>
                  </>
                )}
              </div>
            </section>
          ) : (
            <>
              <section className="m2-stats m3-stats">
                <div className="m2-stat-card">
                  <div className="m2-stat-top"><span>Available EVs</span><span className="m2-stat-icon ok">✓</span></div>
                  <strong>{pad2(overview.totals.available)}</strong>
                  <small>trong {overview.totals.totalEvs} xe</small>
                </div>
                <div className="m2-stat-card">
                  <div className="m2-stat-top"><span>In Use / Reserved</span><span className="m2-stat-icon purple">↗</span></div>
                  <strong>{pad2(overview.totals.inUse)}</strong>
                  <small>đang dùng / đã đặt</small>
                </div>
                <div className="m2-stat-card">
                  <div className="m2-stat-top"><span>Charging / Waiting</span><span className="m2-stat-icon amber">⚡</span></div>
                  <strong>{pad2(overview.totals.charging + overview.totals.waitingForCharging)}</strong>
                  <small>{overview.totals.waitingForCharging} đang chờ</small>
                </div>
                <div className="m2-stat-card">
                  <div className="m2-stat-top"><span>Free Chargers</span><span className="m2-stat-icon info">⌁</span></div>
                  <strong>{pad2(overview.totals.freeChargers)}</strong>
                  <small>trong {overview.totals.totalChargers} cổng · {overview.totals.unavailableChargers} lỗi</small>
                </div>
                <div className="m2-stat-card">
                  <div className="m2-stat-top"><span>Free Parking</span><span className="m2-stat-icon info">🅿</span></div>
                  <strong>{pad2(overview.totals.availableParkingSlots)}</strong>
                  <small>trong {overview.totals.totalParkingSlots} chỗ đỗ</small>
                </div>
                <div className="m2-stat-card">
                  <div className="m2-stat-top"><span>Hubs Needing Attention</span><span className="m2-stat-icon critical">⚠</span></div>
                  <strong>{pad2(overview.totals.hubsNeedingAttention)}</strong>
                  <small>thiếu xe / hết chỗ đỗ</small>
                </div>
              </section>

              <div className="m2-grid">
                <section className="m2-panel m2-hub-map">
                  <div className="m2-panel-header">
                    <div>
                      <h2><span className="m2-panel-icon">🗺</span> Live Network Map</h2>
                      <p>Tình trạng từng Hub — thanh progress thể hiện tỷ lệ chỗ không còn xe rảnh.</p>
                    </div>
                    <span className="m2-legend-inline">
                      <span className="m2-legend-dot normal" /> Normal
                      <span className="m2-legend-dot warning" /> Warning
                      <span className="m2-legend-dot critical" /> Overload
                    </span>
                  </div>

                  <div className="m2-hub-grid">
                    {overview.hubs.map((m) => (
                      <article className={`m2-hub-card ${m.imbalance}`} key={m.hub.id}>
                        <div className="m2-hub-head">
                          <div>
                            <h3>{m.hub.name}</h3>
                            <span className="m2-hub-area">{m.hub.area}</span>
                          </div>
                          {m.imbalance !== "normal" && (
                            <span className={`m2-imbalance-badge ${m.imbalance}`}>
                              {m.imbalance === "critical" ? "Overload" : "Warning"}
                            </span>
                          )}
                        </div>

                        <div className="m2-capacity-row">
                          <span className="m2-capacity-label">Tỷ lệ lấp đầy</span>
                          <strong className="m2-capacity-value">{m.fillPct}%</strong>
                        </div>
                        <div className="m2-progress-track">
                          <div className={`m2-progress-fill ${m.imbalance}`} style={{ width: `${m.fillPct}%` }} />
                        </div>

                        <div className="m2-hub-metrics">
                          <div className="m2-metric">
                            <span className="m2-metric-label">Available EVs</span>
                            <span className="m2-metric-value ok">{m.available}</span>
                            <span className="m2-metric-total">/ {m.hub.evCapacity}</span>
                          </div>
                          <div className="m2-metric">
                            <span className="m2-metric-label">Đang dùng</span>
                            <span className="m2-metric-value purple">{m.inUse}</span>
                          </div>
                          <div className="m2-metric">
                            <span className="m2-metric-label">Charging</span>
                            <span className="m2-metric-value amber">{m.charging}</span>
                          </div>
                          <div className="m2-metric">
                            <span className="m2-metric-label">Cổng trống</span>
                            <span className="m2-metric-value info">{m.freeChargers}</span>
                            <span className="m2-metric-total">/ {m.totalChargers}</span>
                          </div>
                        </div>

                        <div className="m3-parking-row">
                          <span>🅿 Chỗ đỗ trống</span>
                          <strong className={m.parkingFull ? "full" : ""}>
                            {m.availableParkingSlots} / {m.totalParkingSlots}
                          </strong>
                        </div>

                        {m.parkingFull && <div className="m2-fault-note">⛔ Hub đã hết chỗ đỗ</div>}
                        {m.faultyChargers > 0 && (
                          <div className="m2-fault-note">⚠ {m.faultyChargers} cổng sạc đang lỗi/bảo trì</div>
                        )}
                      </article>
                    ))}
                  </div>
                </section>

                <section className="m2-panel m2-charging-panel">
                  <div className="m2-panel-header">
                    <div>
                      <h2><span className="m2-panel-icon">⚡</span> Charging Queue</h2>
                      <p>Xe dưới {CRITICAL_BATTERY_THRESHOLD}% được gắn "High Priority" (FR-AUTO-02). Chỉ theo dõi – lập lịch ở Module 4.</p>
                    </div>
                    <span className="m2-result-count">{queue.length} xe</span>
                  </div>

                  <div className="m2-queue-tabs">
                    {(["all", "charging", "waiting"] as const).map((f) => (
                      <button
                        key={f}
                        className={`m2-tab ${queueFilter === f ? "active" : ""}`}
                        onClick={() => setQueueFilter(f)}
                      >
                        {f === "all" ? "All" : f === "charging" ? "Charging" : "Waiting"} (
                        {f === "all" ? queue.length : queue.filter((q) => q.state === f).length})
                      </button>
                    ))}
                  </div>

                  <div className="m2-queue-list">
                    {visibleQueue.length === 0 && (
                      <div className="m2-empty">
                        <div className="m2-empty-icon">⚡</div>
                        <h3>Không có xe trong hàng đợi</h3>
                        <p>Hiện không có xe nào đang sạc hoặc chờ sạc.</p>
                      </div>
                    )}
                    {visibleQueue.map((item) => (
                      <div className={`m2-queue-item ${item.state}`} key={item.evId}>
                        <div className="m2-queue-icon">{item.state === "charging" ? "🔌" : "⏳"}</div>
                        <div className="m2-queue-body">
                          <div className="m2-queue-top">
                            <strong>{item.evCode}</strong>
                            <span className="m2-queue-hub">⌖ {hubName(item.hubId)}</span>
                            {item.priority === "high" && <span className="m2-priority-badge">High Priority</span>}
                          </div>
                          <BatteryBar value={item.batteryLevel} />
                          <div className="m2-queue-bottom">
                            <QueueStatusPill state={item.state} />
                            {item.chargerCode && <span className="m2-eta">Cổng {item.chargerCode}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <section className="m2-panel m3-alerts">
                <div className="m2-panel-header">
                  <div>
                    <h2><span className="m2-panel-icon">🚨</span> Cảnh báo vận hành</h2>
                    <p>Hub thiếu xe / hết chỗ đỗ, thiết bị hỏng và xe cần chú ý – sắp xếp theo mức độ nghiêm trọng.</p>
                  </div>
                  <span className="m3-alert-summary">
                    <span className="m3-sev critical">{alertCount("CRITICAL")} nghiêm trọng</span>
                    <span className="m3-sev warning">{alertCount("WARNING")} cảnh báo</span>
                    <span className="m3-sev info">{alertCount("INFO")} thông tin</span>
                  </span>
                </div>

                {alerts.length === 0 ? (
                  <div className="m2-empty">
                    <div className="m2-empty-icon">✓</div>
                    <h3>Không có cảnh báo</h3>
                    <p>Mạng lưới đang hoạt động bình thường.</p>
                  </div>
                ) : (
                  <ul className="m3-alert-list">
                    {alerts.map((a: MonitoringAlert) => (
                      <li className={`m3-alert-item ${a.severity.toLowerCase()}`} key={a.id}>
                        <span className="m3-alert-icon" title={SEVERITY_META[a.severity].label}>
                          {SEVERITY_META[a.severity].icon}
                        </span>
                        <span className="m3-alert-message">{a.message}</span>
                        <span className="m3-alert-hub">⌖ {hubName(a.hubId)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}

          <footer className="m2-footer">
            <span>Smart Hub · Module 3: Network Monitoring Dashboard</span>
            {overview ? (
              <span>
                Nguồn dữ liệu – Xe: {overview.dataSources.evs} · Cổng sạc: {overview.dataSources.chargers} · Chỗ đỗ:{" "}
                {overview.dataSources.parking}
              </span>
            ) : (
              <span>Backend: http://localhost:3000/api/monitoring</span>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
}

export default Module3Monitoring;
