import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";
  return `${backendUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}
