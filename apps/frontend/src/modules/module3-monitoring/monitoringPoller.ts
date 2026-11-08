import type { MonitoringAlert, NetworkOverview } from "../../api/monitoring.api";

export type ConnectionStatus = "loading" | "live" | "stale" | "error";

export interface MonitoringData {
  overview: NetworkOverview;
  alerts: MonitoringAlert[];
}

export interface MonitoringState {
  overview: NetworkOverview | null;
  alerts: MonitoringAlert[];
  status: ConnectionStatus;
  lastSuccessAt: Date | null;
  error: string | null;
}

export const INITIAL_MONITORING_STATE: MonitoringState = {
  overview: null,
  alerts: [],
  status: "loading",
  lastSuccessAt: null,
  error: null,
};

export interface MonitoringPoller {
  start(): void;
  stop(): void;
  refresh(): Promise<void>;
}

export function createMonitoringPoller(options: {
  fetchAll: () => Promise<MonitoringData>;
  onChange: (state: MonitoringState) => void;
  intervalMs: number;
  now?: () => Date;
}): MonitoringPoller {
  const now = options.now ?? (() => new Date());
  let state = INITIAL_MONITORING_STATE;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight = false;
  let running = false;

  const emit = (next: MonitoringState) => {
    state = next;
    options.onChange(state);
  };

  const clearTimer = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };

  const scheduleNext = () => {
    clearTimer();
    if (running) timer = setTimeout(() => void refresh(), options.intervalMs);
  };

  const refresh = async () => {
    if (inFlight || !running) return;
    inFlight = true;
    clearTimer();
    try {
      const data = await options.fetchAll();
      if (!running) return;
      emit({
        overview: data.overview,
        alerts: data.alerts,
        status: "live",
        lastSuccessAt: now(),
        error: null,
      });
    } catch (err) {
      if (!running) return;
      emit({
        ...state,
        status: state.overview ? "stale" : "error",
        error: describeError(err),
      });
    } finally {
      inFlight = false;
      scheduleNext();
    }
  };

  return {
    start() {
      if (running) return;
      running = true;
      void refresh();
    },
    stop() {
      running = false;
      clearTimer();
    },
    refresh,
  };
}

export function describeError(err: unknown): string {
  const e = err as { code?: string; message?: string; response?: { status?: number } };
  if (e?.response?.status) return `Backend trả lỗi ${e.response.status}`;
  if (e?.code === "ECONNABORTED") return "Backend phản hồi quá chậm (timeout)";
  if (e?.message === "Network Error") return "Không kết nối được backend";
  return e?.message ? String(e.message) : "Lỗi không xác định";
}
