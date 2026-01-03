"use client";

import { useState, useEffect } from "react";
import { testAPI } from "@/lib/api";

type Status = "checking" | "online" | "offline";

const statusConfig: Record<Status, { color: string; text: string; pulse?: boolean }> = {
  checking: {
    color: "bg-gray-400",
    text: "Checking...",
  },
  online: {
    color: "bg-green-500",
    text: "Backend Online",
    pulse: true,
  },
  offline: {
    color: "bg-red-500",
    text: "Backend Offline",
  },
};

export function StatusIndicator() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await testAPI();
        setStatus("online");
      } catch {
        setStatus("offline");
      }
    };

    checkHealth(); // Initial check
    const interval = setInterval(checkHealth, 15000); // Poll every 15s

    return () => clearInterval(interval);
  }, []);

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur-sm rounded-full border border-border shadow-sm">
      <span
        className={`h-2 w-2 rounded-full ${config.color} ${
          config.pulse ? "animate-pulse" : ""
        }`}
      />
      <span className="text-xs font-medium text-muted-foreground">{config.text}</span>
    </div>
  );
}
