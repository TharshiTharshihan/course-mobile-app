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

export const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
