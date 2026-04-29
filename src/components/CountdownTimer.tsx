"use client";

import { useEffect, useState } from "react";

function getTimeLeft(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

export default function CountdownTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(deadline));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(deadline));
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!timeLeft) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
        ⏰ Bidding deadline has passed.
      </div>
    );
  }

  const { days, hours, minutes, seconds } = timeLeft;

  const isUrgent = days === 0 && hours < 24;

  return (
    <div className={`rounded-lg border p-4 ${isUrgent ? "border-red-300 bg-red-50" : "border-blue-200 bg-blue-50"}`}>
      <div className={`text-sm font-medium mb-3 ${isUrgent ? "text-red-700" : "text-blue-700"}`}>
        {isUrgent ? "⚠️ Bidding closes soon" : "⏳ Bidding closes in"}
      </div>
      <div className="flex gap-4">
        {[
          { value: days, label: "Days" },
          { value: hours, label: "Hours" },
          { value: minutes, label: "Min" },
          { value: seconds, label: "Sec" },
        ].map(({ value, label }) => (
          <div key={label} className="text-center">
            <div className={`text-2xl font-bold tabular-nums ${isUrgent ? "text-red-700" : "text-blue-700"}`}>
              {String(value).padStart(2, "0")}
            </div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}