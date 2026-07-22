const PENDING_BOOKING_PATH_KEY = "travellex_pending_booking_path";

export function getPathFromLocationState(from) {
  if (!from) {
    return "";
  }

  if (typeof from === "string") {
    return from;
  }

  return `${from.pathname || ""}${from.search || ""}${from.hash || ""}` || "";
}

export function setPendingBookingPath(path) {
  try {
    if (path) {
      localStorage.setItem(PENDING_BOOKING_PATH_KEY, path);
    }
  } catch {
    // Booking can still continue through router state when storage is unavailable.
  }
}

export function getPendingBookingPath() {
  try {
    return localStorage.getItem(PENDING_BOOKING_PATH_KEY) || "";
  } catch {
    return "";
  }
}

export function clearPendingBookingPath() {
  try {
    localStorage.removeItem(PENDING_BOOKING_PATH_KEY);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}
