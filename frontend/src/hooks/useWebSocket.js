import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useWebSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let ws;

    const connect = () => {
      ws = new WebSocket("ws://localhost:8001/ws/prices");

      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === "prices_update") {
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
