// Single source of truth for the booking system.
// Imported by BOTH the frontend (src/components/BookingForm.astro) and the
// Cloudflare Functions (functions/api/availability.js + appointment.js), so the
// service list, durations and availability rules never drift between them.
//
// DURATIONS (minutes) are taken from the time stated on each service page,
// using the UPPER bound of the stated range so we never under-book Gustavo.
// Source quotes (EN service pages):
//   Quick Wash ...... "20 to 30 minutes"            -> 30
//   Fresh Start ..... "45 minutes to 1 hour"        -> 60
//   Complete Clean .. "1.5 to 2 hours"              -> 120
//   Premium Refresh . "2.5 to 3.5 hours"            -> 210
//   Pet Hair ........ "30 to 45 minutes"            -> 45
//   Bug & Tar ....... "30 to 45 minutes"            -> 45
//   Trim ............ "30 to 90 minutes"            -> 60  (typical; range is wide)
//   Odor ............ "1 to 2 hours" (general)      -> 120 (heavy smoke 3-4h: confirm manually)
//   Steam ........... "about 45 minutes"            -> 45
//   Car Waxing ...... "1 to 2 hours"                -> 90  (as add-on, prep often already done)
//   Carpet Shampoo .. "30 to 45 minutes"            -> 45
//   Leather ......... "approximately 30 minutes"    -> 30
//   Clay Bar ........ "1 to 2 hours"                -> 120
//   Seat Shampoo .... "about 45 minutes"            -> 45
//   Engine Bay ...... "about 45 minutes"            -> 45
//   Door Jambs / Vacuum Trunk / Floor Mats: no page time -> small estimates.
//
// >>> Gustavo can adjust ANY number below; nothing else needs to change. <<<

// minutes confirmed by Gustavo on 2026-06-19.
export const SERVICES = [
  { key: "quick",    minutes: 60,  en: "Quick Wash — exterior refresh ($40–$60)",        es: "Quick Wash — lavado exterior ($40–$60)" },
  { key: "fresh",    minutes: 90,  en: "Fresh Start — interior + exterior ($80–$110)",   es: "Fresh Start — interior + exterior ($80–$110)" },
  { key: "complete", minutes: 120, en: "Complete Clean — full detail ($140–$170)",       es: "Complete Clean — detallado completo ($140–$170)" },
  { key: "premium",  minutes: 240, en: "Premium Refresh — deep detail ($400–$460)",      es: "Premium Refresh — detallado profundo ($400–$460)" },
  { key: "unsure",   minutes: 90,  en: "Not sure — recommend for me",                    es: "No estoy seguro — recomiéndame" }, // estimate
];

export const ADDONS = [
  { key: "door-jambs",     minutes: 15,  en: "Door Jambs ($20)",                            es: "Marcos de Puertas ($20)" },
  { key: "vacuum-trunk",   minutes: 10,  en: "Vacuum Trunk ($20)",                          es: "Aspirado de Cajuela ($20)" },
  { key: "pet-hair",       minutes: 40,  en: "Pet Hair Removal ($25)",                      es: "Eliminación de Pelo de Mascota ($25)" }, // Gustavo: 20–40
  { key: "floor-mats",     minutes: 20,  en: "Floor Mat Cleaning ($25)",                    es: "Limpieza de Tapetes ($25)" }, // Gustavo: 20
  { key: "bug-tar",        minutes: 10,  en: "Bug & Tar Removal ($30)",                     es: "Eliminación de Insectos y Brea ($30)" }, // Gustavo: 10 (application only)
  { key: "trim",           minutes: 20,  en: "Trim Restoration ($30)",                      es: "Restauración de Molduras ($30)" }, // Gustavo: 20
  // Odor removal is NOT standalone: Gustavo only does it with a full detail.
  // `requires` gates the add-on in the form to those service keys (Premium only).
  { key: "odor",           minutes: 120, requires: ["premium"], en: "Odor Removal ($40)",   es: "Eliminación de Olores ($40)" }, // Gustavo: Premium only (full detailing)
  { key: "steam",          minutes: 45,  en: "Steam Cleaning ($50)",                        es: "Limpieza a Vapor ($50)" }, // Gustavo: 45 (full interior steam)
  // Waxing offered two ways — different price AND duration. Customer picks one.
  { key: "wax-hand",       minutes: 60,  en: "Car Waxing — by hand (from $60)",             es: "Encerado a Mano (desde $60)" }, // Gustavo: hand $60; duration estimate — confirm
  { key: "wax-machine",    minutes: 90,  en: "Car Waxing — machine polish (from $90)",      es: "Encerado a Máquina (desde $90)" }, // Gustavo: machine $90; duration estimate — confirm
  { key: "carpet-shampoo", minutes: 45,  en: "Carpet Shampooing (from $60)",                es: "Lavado de Alfombras (desde $60)" }, // Gustavo: 45
  { key: "leather",        minutes: 60,  en: "Leather Cleaning & Conditioning (from $75)",  es: "Limpieza y Acondicionamiento de Cuero (desde $75)" }, // Gustavo: 1h
  { key: "clay-bar",       minutes: 30,  en: "Clay Bar Treatment (from $75)",               es: "Tratamiento con Barra de Arcilla (desde $75)" }, // Gustavo: "desde 30min" (service page says 1–2h — confirm typical vs. min)
  { key: "seat-shampoo",   minutes: 60,  en: "Seat Shampooing (from $75)",                  es: "Lavado de Asientos (desde $75)" }, // Gustavo: 1h+, from $75
  { key: "wheel-cleaning", minutes: 60,  en: "Wheel & Rim Cleaning ($80 / 4 wheels)",       es: "Limpieza de Aros ($80 / 4 ruedas)" }, // Gustavo: 1h, $20/wheel
  { key: "engine-bay",     minutes: 45,  en: "Engine Bay Cleaning ($50–$80)",               es: "Limpieza de Motor ($50–$80)" }, // Gustavo: 45; hand $50 / steam $80
];

export const VEHICLES = [
  { key: "sedan", en: "Sedan",            es: "Sedán" },
  { key: "suv",   en: "SUV / Crossover",  es: "SUV / Crossover" },
  { key: "truck", en: "Truck / Van",      es: "Camioneta / Van" },
  { key: "other", en: "Other",            es: "Otro" },
];

// Availability rules. >>> PLACEHOLDERS — Gustavo to confirm. <<<
export const AVAILABILITY = {
  timeZone: "America/New_York",
  // Weekday 0=Sun … 6=Sat. Local working window per day, or null = closed.
  // All hours confirmed by Gustavo on 2026-06-19.
  hours: {
    0: { open: "09:00", close: "12:00" }, // Sunday 9am–12pm
    1: { open: "09:00", close: "18:00" }, // Mon–Fri 9am–6pm
    2: { open: "09:00", close: "18:00" },
    3: { open: "09:00", close: "18:00" },
    4: { open: "09:00", close: "18:00" },
    5: { open: "09:00", close: "18:00" },
    6: { open: "09:00", close: "18:00" }, // Saturday 9am–6pm
  },
  travelBufferMin: 30, // confirmed: 30 min between vehicles (travel + setup)
  slotStepMin: 30,     // offer start times every 30 minutes
  minLeadMin: 120,     // confirmed: no booking within 2h (Gustavo recommends a day ahead)
  maxAdvanceDays: 30,  // confirmed: up to 30 days ahead
};

// Drop add-ons that aren't offered with the chosen service (e.g. odor needs
// Premium). Also drops unknown keys. Use this server-side before trusting input.
export function validAddons(serviceKey, addonKeys = []) {
  return addonKeys.filter((k) => {
    const a = ADDONS.find((x) => x.key === k);
    if (!a) return false;
    return !a.requires || a.requires.includes(serviceKey);
  });
}

// Total estimated job length: base service + selected add-ons (minutes).
export function serviceMinutes(serviceKey, addonKeys = []) {
  const svc = SERVICES.find((s) => s.key === serviceKey);
  let total = svc ? svc.minutes : 0;
  for (const k of addonKeys) {
    const a = ADDONS.find((x) => x.key === k);
    if (a) total += a.minutes;
  }
  return total;
}

// Localized label for a single key in one of the lists above.
export function labelOf(list, key, lang = "en") {
  const item = list.find((i) => i.key === key);
  return item ? item[lang] || item.en : "";
}
