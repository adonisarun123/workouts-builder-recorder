/** Base URL for the Express API (no trailing slash). */
export function getApiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (base) return base;
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") return `${protocol}//${hostname}:3000`;
  }
  return "";
}
