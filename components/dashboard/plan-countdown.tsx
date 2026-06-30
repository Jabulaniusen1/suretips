"use client";

import { useEffect, useState } from "react";

function format(expiryDate: string): string {
  const diff = new Date(expiryDate).getTime() - Date.now();
  if (diff <= 0) return "Expired";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  return `${days}d : ${hours}h : ${minutes}m remaining`;
}

export function PlanCountdown({ expiryDate }: { expiryDate: string }) {
  const [label, setLabel] = useState(() => format(expiryDate));

  useEffect(() => {
    const interval = setInterval(() => setLabel(format(expiryDate)), 60_000);
    return () => clearInterval(interval);
  }, [expiryDate]);

  return <p className="text-sm font-medium text-brand">{label}</p>;
}
