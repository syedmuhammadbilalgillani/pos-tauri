/** True when running inside the Tauri webview (not a normal browser tab). */
export function isTauri(): boolean {
    if (typeof window === "undefined") return false;
    return "__TAURI_INTERNALS__" in window || "__TAURI__" in window;
  }