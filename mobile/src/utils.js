export const errMsg = (e) => e?.response?.data?.message || e?.message || "Something went wrong";

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
