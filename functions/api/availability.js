// Cloudflare Pages Function — GET /api/availability?date=YYYY-MM-DD&service=KEY&addons=k1,k2
//
// Phase 2 of the booking system. Returns the list of bookable start times for a
// given day, computed from:
//   • the estimated job duration (service + add-ons, from booking.mjs),
//   • Gustavo's working hours + travel buffer (booking.mjs AVAILABILITY),
//   • his real calendar busy blocks (Google Calendar FreeBusy API).
//
// Response: { ok, minutes, slots: ["09:00","09:30",...] }  (slots in local time)
// On any backend failure it returns { ok:false } and the frontend falls back to
// the Phase 1 "request a time window" flow — so the form always works.

import { AVAILABILITY, serviceMinutes } from "../../src/config/booking.mjs";
import { getAccessToken } from "./_google.js";
import { tzOffsetMinutes, localToUtcMs, msToLocalHHMM } from "./_time.js";

const TZ = AVAILABILITY.timeZone;

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const date = url.searchParams.get("date"); // YYYY-MM-DD (local)
  const service = url.searchParams.get("service") || "";
  const addons = (url.searchParams.get("addons") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
    return json({ ok: false, message: "Bad date" }, 400);
  }

  // Job length includes a travel buffer kept free after the job.
  const minutes = serviceMinutes(service, addons);
  const buffer = AVAILABILITY.travelBufferMin;
  const block = minutes + buffer;

  // Working window for this weekday.
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  const hours = AVAILABILITY.hours[weekday];
  if (!hours) return json({ ok: true, minutes, slots: [] }); // closed that day

  const offset = tzOffsetMinutes(TZ, date); // NY offset for that date (handles DST)
  const openMs = localToUtcMs(date, hours.open, offset);
  const closeMs = localToUtcMs(date, hours.close, offset);

  // Earliest allowed start (lead time) and advance-booking ceiling.
  const now = Date.now();
  const earliest = now + AVAILABILITY.minLeadMin * 60000;
  const latestDay = now + AVAILABILITY.maxAdvanceDays * 86400000;
  if (openMs > latestDay) return json({ ok: true, minutes, slots: [] });

  // Busy blocks from Gustavo's calendar (best effort; no creds → no busy data).
  let busy = [];
  try {
    busy = await freeBusy(env, openMs, closeMs);
  } catch {
    return json({ ok: false, message: "calendar unavailable" }, 502);
  }
  // Expand each busy block by the buffer so jobs aren't scheduled back-to-back.
  const blocked = busy.map((b) => [b[0] - buffer * 60000, b[1] + buffer * 60000]);

  const step = AVAILABILITY.slotStepMin * 60000;
  const jobMs = minutes * 60000;
  const slots = [];
  for (let start = openMs; start + jobMs <= closeMs; start += step) {
    const end = start + jobMs;
    if (start < earliest) continue; // too soon
    const clashes = blocked.some((b) => start < b[1] && end > b[0]);
    if (!clashes) slots.push(msToLocalHHMM(start, offset));
  }

  return json({ ok: true, minutes, slots });
}

// freeBusy + json helpers below; timezone helpers live in ./_time.js.

// ── Google Calendar FreeBusy ──
async function freeBusy(env, fromMs, toMs) {
  const calId = env.GOOGLE_CALENDAR_ID;
  const token = await getAccessToken(env);
  if (!calId || !token) return [];
  const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      timeMin: new Date(fromMs).toISOString(),
      timeMax: new Date(toMs).toISOString(),
      items: [{ id: calId }],
    }),
  });
  if (!res.ok) throw new Error("freebusy failed");
  const j = await res.json();
  const cal = j.calendars && j.calendars[calId];
  const periods = (cal && cal.busy) || [];
  return periods.map((p) => [Date.parse(p.start), Date.parse(p.end)]);
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "content-type": "application/json" },
  });
}
