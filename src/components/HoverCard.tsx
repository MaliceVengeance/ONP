"use client";

import { useState } from "react";

export default function HoverCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        ...style,
        borderColor: hovered ? "#C8102E" : "#1B4F8A",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </div>
  );
}