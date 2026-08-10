// Cloudflare Pages Function — POST /api/appointment
//
// Handles a booking request from BookingForm.astro. Two jobs per request:
//   1. EMAIL (must-succeed): forwards to Web3Forms so Gustavo always gets the
//      notification at contact@route95mobilecardetailing.com — same as before.
//   2. CALENDAR (best-effort): creates a TENTATIVE event in Gustavo's Google
//      Calendar (route95.cw@gmail.com) via the Google Calendar API, so every
//      request also shows up on his phone. If the calendar step fails or the
//      Google credentials aren't set yet, the email still goes out — no request
//      is ever lost.
//
// Phase 1 (this file): customer picks a coarse time window (morning / afternoon
// / late afternoon / flexible) → we drop a tentative block on that window.
// Phase 2 (later): real slot picker driven by service duration + FreeBusy. The
// helpers below (getAccessToken / createEvent) are reused as-is for that.
//
// ── Required Cloudflare env vars (Settings → Environment variables) ──
//   GOOGLE_SA_EMAIL        service-account email (…@….iam.gserviceaccount.com)
//   GOOGLE_SA_PRIVATE_KEY  service-account private key (PEM; \n or real newlines)
//   GOOGLE_CALENDAR_ID     route95.cw@gmail.com  (calendar shared w/ the SA,
//                          permission "Make changes to events")
//   WEB3FORMS_ACCESS_KEY   Web3Forms access key (optional; falls back to the
//                          existing public key so email keeps working pre-setup)

const TZ = "America/New_York";

// Coarse time windows → [start, end] local clock times.
const WINDOWS = {
  morning: ["09:00:00", "12:00:00"],
  afternoon: ["12:00:00", "15:00:00"],
  late: ["15:00:00", "18:00:00"],
  // "flexible" (and anything unknown) → all-day event, handled below.
};

export async function onRequestPost(context) {
  const { request, env } = context;

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ success: false, message: "Bad request" }, 400);
  }

  // Honeypot: a real user never checks this. Pretend success, do nothing.
  if (data.botcheck) return json({ success: true });

  if (!data.name || !data.phone || !data.address || !data.date) {
    return json({ success: false, message: "Missing required fields" }, 422);
  }

  // 1) Email — the reliable path. Awaited; its result decides overall success.
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

  const payload = {
    access_key: key,
    subject,
    from_name: "Route95 Website",
    Name: data.name,
    Phone: data.phone,
    Address: data.address,
    Service: data.serviceLabel || "—",
    Vehicle: data.vehicleLabel || "—",
    "Preferred date": data.date,
    "Preferred time": data.timeLabel || "—",
    "Add-ons":
      Array.isArray(data.addons) && data.addons.length
        ? data.addons.join(", ")
        : "—",
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
    `Service: ${data.serviceLabel || "—"}`,
    data.vehicleLabel ? `Vehicle: ${data.vehicleLabel}` : null,
    Array.isArray(data.addons) && data.addons.length
      ? `Add-ons: ${data.addons.join(", ")}`
      : null,
    `Preferred time: ${data.timeLabel || "—"}`,
    data.notes ? `Notes: ${data.notes}` : null,
  ].filter(Boolean);

  const event = {
    summary: `📋 REQUEST: ${data.serviceLabel || "Detail"} — ${data.name}`,
    location: data.address,
    description: descLines.join("\n"),
    status: "tentative",
  };

  const win = WINDOWS[data.timeKey];
  if (win) {
    event.start = { dateTime: `${data.date}T${win[0]}`, timeZone: TZ };
    event.end = { dateTime: `${data.date}T${win[1]}`, timeZone: TZ };
  } else {
    // Flexible / unknown → all-day. All-day end date is exclusive.
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

// ── Service-account OAuth2 (JWT bearer) → access token ──
async function getAccessToken(env) {
  const email = env.GOOGLE_SA_EMAIL;
  const rawKey = env.GOOGLE_SA_PRIVATE_KEY;
  if (!email || !rawKey) return null;
  const pem = rawKey.replace(/\\n/g, "\n");

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: email,
    scope: "https://www.googleapis.com/auth/calendar.events",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const unsigned =
    b64urlStr(JSON.stringify(header)) + "." + b64urlStr(JSON.stringify(claim));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToBuffer(pem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsigned)
  );
  const jwt = unsigned + "." + b64urlBytes(sig);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body:
      "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=" +
      encodeURIComponent(jwt),
  });
  if (!res.ok) return null;
  const j = await res.json().catch(() => ({}));
  return j.access_token || null;
}

// ── helpers ──
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

function b64urlStr(s) {
  return btoa(unescape(encodeURIComponent(s)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlBytes(buf) {
  const arr = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToBuffer(pem) {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/, "")
    .replace(/-----END [^-]+-----/, "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}
