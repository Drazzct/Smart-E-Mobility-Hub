import { useCallback, useEffect, useRef, useState } from "react";
import { monitoringApi } from "../../api/monitoring.api";
import {
  createMonitoringPoller,
  INITIAL_MONITORING_STATE,
  type MonitoringPoller,
  type MonitoringState,
} from "./monitoringPoller";

export const MONITORING_POLL_INTERVAL_MS = 5000;

async function fetchAll() {
  const [overview, alerts] = await Promise.all([
    monitoringApi.getOverview(),
    monitoringApi.getAlerts(),
  ]);
  return { overview, alerts };
}

export function useMonitoringData(intervalMs = MONITORING_POLL_INTERVAL_MS) {
  const [state, setState] = useState<MonitoringState>(INITIAL_MONITORING_STATE);
  const pollerRef = useRef<MonitoringPoller | null>(null);

  useEffect(() => {
    const poller = createMonitoringPoller({ fetchAll, onChange: setState, intervalMs });
    pollerRef.current = poller;
    poller.start();
    return () => poller.stop();
  }, [intervalMs]);

  const refresh = useCallback(() => {
    void pollerRef.current?.refresh();
  }, []);

  return { ...state, refresh };
}
