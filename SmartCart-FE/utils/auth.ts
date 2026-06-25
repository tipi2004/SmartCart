export function getRoleFromToken(token: string | null) {
  if (!token || typeof window === "undefined") return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(window.atob(normalized));
    return typeof decoded.role === "string" ? decoded.role.toLowerCase() : null;
  } catch {
    return null;
  }
}
