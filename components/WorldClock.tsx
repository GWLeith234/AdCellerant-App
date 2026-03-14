"use client";

import { useState, useEffect } from "react";

interface WorldClockProps {
  label: string;
  timezone: string;
}

export default function WorldClock({ label, timezone }: WorldClockProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    function updateTime() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-GB", {
          timeZone: timezone,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    }

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  return (
    <div className="text-center">
      <div className="text-white text-sm font-mono tabular-nums">{time}</div>
      <div className="text-muted text-xs">{label}</div>
    </div>
  );
}
