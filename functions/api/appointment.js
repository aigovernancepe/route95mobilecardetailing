// Cloudflare Pages Function — POST /api/appointment
//
// Handles a booking from BookingForm.astro. Two jobs per request:
//   1. EMAIL (must-succeed): forwards to Web3Forms so Gustavo always gets the
//      notification at contact@route95mobilecardetailing.com.
//   2. CALENDAR (best-effort): creates a TENTATIVE event in Gustavo's Google
//      Calendar via the Calendar API. If it fails or the Google creds aren't
//      set, the email still goes out — no request is ever lost.
//
// Time handling:
//   • Phase 2 — customer picked an exact slot (data.startTime "HH:MM"): event
//     spans [startTime, startTime + estimated duration].
//   • Fallback — no slot (closed day / fully booked / availability API down):
//     all-day tentative event flagged as "no time chosen".
//
// Labels (service / add-ons / vehicle) are resolved server-side from stable
// keys via src/config/booking.mjs, so they stay correct in EN and ES.
//
// ── Required Cloudflare env vars ──
//   GOOGLE_SA_EMAIL, GOOGLE_SA_PRIVATE_KEY, GOOGLE_CALENDAR_ID,
//   WEB3FORMS_ACCESS_KEY (optional; falls back to the existing public key).

import {
  SERVICES,
  ADDONS,
  VEHICLES,
  serviceMinutes,
  labelOf,
  validAddons,
  AVAILABILITY,
} from "../../src/config/booking.mjs";
import { getAccessToken } from "./_google.js";
import { addMinutes } from "./_time.js";

const TZ = AVAILABILITY.timeZone;

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, message: "Bad request" }, 400);
  }

  // Honeypot: a real user never checks this. Pretend success, do nothing.
  if (body.botcheck) return json({ success: true });

  if (!body.name || !body.phone || !body.address || !body.date) {
    return json({ success: false, message: "Missing required fields" }, 422);
  }

  const lang = body.lang === "es" ? "es" : "en";
  // Trust the server config, not the client: drop add-ons not offered with this service.
  const addonKeys = validAddons(
    body.serviceKey || "",
    Array.isArray(body.addonKeys) ? body.addonKeys : []
  );
  const data = {
    lang,
    name: body.name,
    phone: body.phone,
    address: body.address,
    date: body.date,
    startTime: /^\d{2}:\d{2}$/.test(body.startTime || "") ? body.startTime : "",
    notes: body.notes || "",
    serviceKey: body.serviceKey || "",
    serviceLabel: labelOf(SERVICES, body.serviceKey, lang) || "—",
    vehicleLabel: labelOf(VEHICLES, body.vehicleKey, lang),
    addonLabels: addonKeys.map((k) => labelOf(ADDONS, k, lang)).filter(Boolean),
    minutes: serviceMinutes(body.serviceKey, addonKeys),
  };

  // 1) Email — reliable path. Awaited; its result decides overall success.
  let emailed = false;
  try {
    emailed = await sendEmail(env, data);
  } catch {
    emailed = false;
  }

  // 2) Calendar — best effort. Never blocks the email outcome.
  let calendared = false;
  try {
    const token = await getAccessToken(env);
    if (token) calendared = await createEvent(env, token, data);
  } catch {
    calendared = false;
  }

  if (!emailed && !calendared) {
    return json({ success: false, message: "Delivery failed" }, 502);
  }
  return json({ success: true, emailed, calendared });
}

// ── Email via Web3Forms (server-side JSON submission) ──
async function sendEmail(env, data) {
  const key =
    env.WEB3FORMS_ACCESS_KEY || "94ef4058-301f-40de-8ecb-19e55ac48394";
  const subject =
    data.lang === "es"
      ? "Nueva solicitud de cita — Route95"
      : "New appointment request — Route95";

  const when = data.startTime
    ? `${data.date} ${data.startTime}–${addMinutes(data.startTime, data.minutes)} (~${data.minutes} min)`
    : `${data.date} (no specific time chosen)`;

  const payload = {
    access_key: key,
    subject,
    from_name: "Route95 Website",
    Name: data.name,
    Phone: data.phone,
    Address: data.address,
    Service: data.serviceLabel,
    Vehicle: data.vehicleLabel || "—",
    When: when,
    "Add-ons": data.addonLabels.length ? data.addonLabels.join(", ") : "—",
    Notes: data.notes || "—",
  };

  const res = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(payload),
  });
  const j = await res.json().catch(() => ({}));
  return !!j.success;
}

// ── Google Calendar event (tentative) ──
async function createEvent(env, token, data) {
  const calId = env.GOOGLE_CALENDAR_ID;
  if (!calId) return false;

  const descLines = [
    "⚠️ Unconfirmed request from website — confirm with the customer.",
    "",
    `Name: ${data.name}`,
    `Phone: ${data.phone}`,
    `Address: ${data.address}`,
    `Service: ${data.serviceLabel}`,
    data.vehicleLabel ? `Vehicle: ${data.vehicleLabel}` : null,
    data.addonLabels.length ? `Add-ons: ${data.addonLabels.join(", ")}` : null,
    `Estimated duration: ~${data.minutes} min`,
    data.notes ? `Notes: ${data.notes}` : null,
  ].filter(Boolean);

  const event = {
    summary: `📋 REQUEST: ${data.serviceLabel} — ${data.name}`,
    location: data.address,
    description: descLines.join("\n"),
    status: "tentative",
  };

  if (data.startTime) {
    const end = addMinutes(data.startTime, data.minutes);
    // dateTime without offset + explicit timeZone → Google resolves DST itself.
    event.start = { dateTime: `${data.date}T${data.startTime}:00`, timeZone: TZ };
    event.end = { dateTime: `${data.date}T${end}:00`, timeZone: TZ };
  } else {
    // No slot chosen → all-day request. All-day end date is exclusive.
    event.start = { date: data.date };
    event.end = { date: nextDay(data.date) };
  }

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calId
    )}/events`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );
  return res.ok;
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "content-type": "application/json" },
  });
}

function nextDay(d) {
  const dt = new Date(`${d}T00:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString().slice(0, 10);
}
