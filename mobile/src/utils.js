import { Alert } from "react-native";

export const errMsg = (e) => e?.response?.data?.message || e?.message || "Something went wrong";

/** Error popup for failed requests; stays silent when the session just expired (the app signs out instead). */
export const alertError = (e, title = "Error") => {
  if (e?.sessionExpired) return;
  Alert.alert(title, errMsg(e));
};

export const formatSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";

const PALETTE = ["#FFE08A", "#BFE3FF", "#C9F2D0", "#FFD0D0", "#E2D4FF", "#FFD9B0"];
export const colorFor = (text = "") => {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
};

/** Time-of-day greeting, e.g. { text: "Good morning", icon: "sunny" } */
export const greeting = (date = new Date()) => {
  const h = date.getHours();
  if (h < 12) return { text: "Good morning", icon: "sunny-outline" };
  if (h < 17) return { text: "Good afternoon", icon: "partly-sunny-outline" };
  return { text: "Good evening", icon: "moon-outline" };
};

export const firstName = (name = "") => name.trim().split(" ")[0] || "";

export const todayLabel = (date = new Date()) =>
  date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

export const initials =(name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

/** YYYY-MM-DD for the phone's local day (Sri Lanka for this app) */
export const dayKey = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const shiftDay = (key, days) => {
  const [y, m, d] = key.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d + days));
};

/** "Today", "Yesterday" or e.g. "Mon, 27 Oct" */
export const dayLabel = (key) => {
  if (key === dayKey()) return "Today";
  if (key === shiftDay(dayKey(), -1)) return "Yesterday";
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
};

export const formatTime = (d) =>
  d ? new Date(d).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "";

export const timeAgo = (d) => {
  const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`;
  return formatDate(d);
};

/** Look of each notice type */
export const NOTICE_TYPES = {
  announcement: { label: "Announcement", icon: "megaphone", color: "#1D4ED8", bg: "#DBEAFE" },
  reminder: { label: "Class reminder", icon: "alarm", color: "#92400E", bg: "#FEF3C7" },
  bring: { label: "Bring to class", icon: "bag-handle", color: "#065F46", bg: "#D1FAE5" },
};
