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
      <div style={{
        background: "#3D0A0A",
        border: "1px solid #991B1B",
        color: "#F87171",
        padding: "12px 16px",
        borderRadius: "8px",
        fontSize: "13px",
        fontFamily: "'Barlow', sans-serif",
      }}>
        ⏰ Bidding deadline has passed.
      </div>
    );
  }

  const { days, hours, minutes, seconds } = timeLeft;
  const isUrgent = days === 0;

  return (
    <div style={{
      background: "#0F2040",
      border: `1px solid ${isUrgent ? "#991B1B" : "#1B4F8A"}`,
      borderRadius: "10px",
      padding: "16px 20px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      flexWrap: "nowrap",
    }}>
      <div style={{
        fontSize: "13px",
        color: isUrgent ? "#F87171" : "#7A9CC4",
        fontFamily: "'Barlow', sans-serif",
        fontWeight: 500,
        marginRight: "8px",
        flexShrink: 0,
      }}>
        {isUrgent ? "⚠ Closes soon" : "⏳ Bidding closes in"}
      </div>

      {[
        { value: days, label: "Days" },
        { value: hours, label: "Hours" },
        { value: minutes, label: "Min" },
        { value: seconds, label: "Sec" },
      ].map(({ value, label }, i) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {i > 0 && (
            <span style={{
              color: isUrgent ? "#F87171" : "#1B4F8A",
              fontSize: "20px",
              fontWeight: 700,
              lineHeight: 1,
            }}>:</span>
          )}
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "28px",
              color: isUrgent ? "#F87171" : "#fff",
              lineHeight: 1,
              minWidth: "36px",
            }}>
              {String(value).padStart(2, "0")}
            </div>
            <div style={{
              fontSize: "10px",
              color: "#7A9CC4",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginTop: "2px",
            }}>
              {label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}