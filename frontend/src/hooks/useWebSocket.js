import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useWebSocket() {
  const queryClient = useQueryClient();
  // Garde la trace du dernier signal connu par position pour détecter les changements
  const prevSignals = useRef({});

  useEffect(() => {
    // Demander la permission notifications navigateur au montage
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    let ws;

    const connect = () => {
      ws = new WebSocket("ws://localhost:8001/ws/prices");

      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === "prices_update") {
          // Notifier si signal changé
          if (Notification.permission === "granted") {
            msg.data.forEach((update) => {
              const prev = prevSignals.current[update.id];
              if (prev && prev !== update.signal) {
                new Notification(update.ticker ?? update.id, {
                  body: update.reason ?? `Signal : ${update.signal}`,
                });
              }
              prevSignals.current[update.id] = update.signal;
            });
          } else {
            // Initialiser sans notifier au premier passage
            msg.data.forEach((update) => {
              if (!prevSignals.current[update.id]) {
                prevSignals.current[update.id] = update.signal;
              }
            });
          }

          queryClient.setQueryData(["positions"], (old) =>
            old?.map((pos) => {
              const update = msg.data.find((u) => u.id === pos.id);
              return update ? { ...pos, live: update } : pos;
            })
          );
        }
      };

      ws.onclose = () => setTimeout(connect, 3000);
    };

    connect();
    return () => ws?.close();
  }, [queryClient]);
}
