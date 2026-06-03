import { useEffect, useRef, useState, useCallback } from "react";
import { getAuthToken } from "../services/api";

export interface NotificationMessage {
  id: number;
  type: string;
  title: string;
  message: string;
  payload: string | null; // JSON string from backend
  created_at: string;
}

// Gateway WS path (gateway proxies to the notification service)
const WS_URL = "ws://localhost:8000/notification/ws/notifications";

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedByUs = useRef(false);

  const connect = useCallback(() => {
    const token = getAuthToken();
    if (!token) return;

    const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      // keepalive ping every 25s (server replies "pong")
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send("ping");
      }, 25_000);
    };

    ws.onmessage = (event) => {
      // Ignore the "pong" keepalive replies
      if (event.data === "pong") return;
      try {
        const msg: NotificationMessage = JSON.parse(event.data);
        setNotifications((prev) => {
          // de-dupe by id (the pending-replay on reconnect can resend)
          if (prev.some((n) => n.id === msg.id)) return prev;
          return [msg, ...prev];
        });
      } catch {
        // non-JSON frame, ignore
      }
    };

    ws.onclose = () => {
      setConnected(false);
      if (pingRef.current) clearInterval(pingRef.current);
      // auto-reconnect unless we closed deliberately (logout/unmount)
      if (!closedByUs.current) {
        reconnectRef.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    closedByUs.current = false;
    connect();
    return () => {
      closedByUs.current = true;
      if (pingRef.current) clearInterval(pingRef.current);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const clear = useCallback(() => setNotifications([]), []);

  return { notifications, connected, clear };
}
