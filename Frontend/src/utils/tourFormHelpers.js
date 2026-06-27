export function numberOrUndefined(value) {
  if (value === "" || value === undefined || value === null) {
    return undefined;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export function splitLines(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatListText(items = []) {
  return splitLines(items).join("\n");
}

export function parseItineraryText(value) {
  if (Array.isArray(value)) {
    return value
      .map((item, index) => ({
        day: Number(item.day) || index + 1,
        title: String(item.title || `Day ${Number(item.day) || index + 1}`).trim(),
        description: String(item.description || "").trim()
      }))
      .filter((item) => item.title);
  }

  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const parts = line.split("|").map((part) => part.trim());
      const fallbackDay = index + 1;

      if (parts.length >= 3) {
        const day = Number(parts[0].match(/\d+/)?.[0]) || fallbackDay;
        return {
          day,
          title: parts[1] || `Day ${day}`,
          description: parts.slice(2).join(" | ")
        };
      }

      const labelledDay = line.match(/^day\s*(\d+)\s*[:\-]\s*(.+)$/i);

      if (labelledDay) {
        return {
          day: Number(labelledDay[1]) || fallbackDay,
          title: labelledDay[2].trim(),
          description: ""
        };
      }

      return {
        day: fallbackDay,
        title: line,
        description: ""
      };
    })
    .filter((item) => item.title);
}

export function formatItineraryText(items = []) {
  return (items || [])
    .map((item, index) => {
      const day = Number(item.day) || index + 1;
      return `Day ${day} | ${item.title || ""} | ${item.description || ""}`.trim();
    })
    .filter(Boolean)
    .join("\n");
}
