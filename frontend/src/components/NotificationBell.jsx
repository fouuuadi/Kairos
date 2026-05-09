import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { notificationsApi } from "../api/client.js";
import { cn } from "../lib/utils.js";

const TYPE_COLOR = {
  SIGNAL_CHANGE: "text-blue-400",
  STOP_LOSS: "text-sell",
  TAKE_PROFIT: "text-buy",
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data: notifs = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.list,
    refetchInterval: 30_000,
  });

  const markAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-gray-800 transition-colors"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-sell text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <span className="font-medium text-sm">Notifications</span>
            {unread > 0 && (
              <button
                onClick={() => markAll.mutate()}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <p className="text-center text-gray-500 py-8 text-sm">Aucune notification</p>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "px-4 py-3 border-b border-gray-800 last:border-0",
                    !n.read && "bg-gray-800/50"
                  )}
                >
                  <p className={cn("text-sm font-medium", TYPE_COLOR[n.type] || "text-gray-300")}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(n.created_at).toLocaleString("fr-FR")}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
