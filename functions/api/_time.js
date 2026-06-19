// Shared timezone helpers for the booking Functions.
// Underscore-prefixed → not a route, only importable.
// All math is done against a named IANA zone so DST (EDT/EST) is handled
// correctly without hardcoding offsets.

// Offset in minutes of `timeZone` on the given local date (e.g. -240 EDT, -300 EST).
export function tzOffsetMinutes(timeZone, dateStr) {
  const noon = new Date(`${dateStr}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  }).formatToParts(noon);
  const tzName = parts.find((p) => p.type === "timeZoneName")?.value || "GMT+0";
  const m = tzName.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  if (!m) return 0;
  const sign = m[1] === "-" ? -1 : 1;
  const h = parseInt(m[2], 10);
  const min = parseInt(m[3] || "0", 10);
  return sign * (h * 60 + min);
}

// Local "YYYY-MM-DD" + "HH:MM" → UTC epoch ms, given that day's offset.
export function localToUtcMs(dateStr, hhmm, offsetMin) {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  return Date.UTC(y, mo - 1, d, h, mi) - offsetMin * 60000;
}

// UTC epoch ms → local "HH:MM", given that day's offset.
export function msToLocalHHMM(ms, offsetMin) {
  const local = new Date(ms + offsetMin * 60000);
  const h = String(local.getUTCHours()).padStart(2, "0");
  const m = String(local.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

// "HH:MM" + minutes → "HH:MM" (same day; jobs never cross midnight here).
export function addMinutes(hhmm, mins) {
  const [h, mi] = hhmm.split(":").map(Number);
  const total = h * 60 + mi + mins;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}
