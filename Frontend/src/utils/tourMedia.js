export const MAX_TOUR_MEDIA_ITEMS = 5;

const videoExtensionPattern = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;
const videoPathPattern = /\/video\/upload\/|resource_type=video|type=video/i;

export function splitTourMedia(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeTourMedia(value) {
  return splitTourMedia(value).slice(0, MAX_TOUR_MEDIA_ITEMS);
}

export function formatTourMediaText(value) {
  return normalizeTourMedia(value).join("\n");
}

export function appendTourMedia(value, nextUrl) {
  const items = splitTourMedia(value);
  const normalizedNextUrl = String(nextUrl || "").trim();

  if (!normalizedNextUrl || items.includes(normalizedNextUrl) || items.length >= MAX_TOUR_MEDIA_ITEMS) {
    return items.slice(0, MAX_TOUR_MEDIA_ITEMS).join("\n");
  }

  return [...items, normalizedNextUrl].slice(0, MAX_TOUR_MEDIA_ITEMS).join("\n");
}

export function isTourMediaLimitExceeded(value) {
  return splitTourMedia(value).length > MAX_TOUR_MEDIA_ITEMS;
}

export function isVideoMedia(url = "") {
  return videoExtensionPattern.test(url) || videoPathPattern.test(url);
}
