"use strict";
/* Rutiner – delad rutinapp för Adrian & Kemal
   Data i Firebase Firestore under hem/<nyckel>/:
     users/{A|K}      { pin }                     (hashad PIN)
     routines/{id}    { owner, category, name, image, schedule, order, created }
     tasks/{id}       { routineId, owner, name, desc, image, sets, reps, time, schedule|null, order, created }
     checks/{date__itemId} { owner, itemId, routineId, date, at }
   Ett "item" är en uppgift – eller rutinen själv om den saknar uppgifter. */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB6FggQlal-_doWZ1cHGp2gJD4--DjKQK0",
  authDomain: "hemma-1c9bc.firebaseapp.com",
  projectId: "hemma-1c9bc",
  storageBucket: "hemma-1c9bc.firebasestorage.app",
  messagingSenderId: "13515466689",
  appId: "1:13515466689:web:f32c7229e87db0fab6f140"
};

const NAME = { A: "Adrian", K: "Kemal" }, OTHER = { A: "K", K: "A" };
const GEN = { A: "Adrians", K: "Kemals" };
const WD = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];
const WD_L = ["måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag", "söndag"];
const WD_1 = ["M", "T", "O", "T", "F", "L", "S"];
const MON = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
const CAT_ORDER = ["Träning", "Hudvård", "Övrigt"];
const CHECK_DAYS = 120;

const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ls = {
  get(k, d) { try { return localStorage.getItem(k) ?? d } catch (e) { return d } },
  set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch (e) { } }
};
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const buzz = (n = 8) => { try { navigator.vibrate && navigator.vibrate(n) } catch (e) { } };
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

const IC = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 11v6M12 7.5h.01"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c.6 3.2-1.2 5.1-2.8 6.9C7.6 10.7 6 12.6 6 15.2 6 18.9 8.7 22 12 22s6-3 6-6.6c0-2.9-1.4-4.7-2.6-6.2-.3 1.5-1 2.6-2.1 3.1.3-3.8-.4-7.5-1.3-10.3z"/></svg>',
  chevR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
  chevL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6H9l-6 6 6 6h11a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1z"/><path d="M15 10l-4 4M11 10l4 4"/></svg>',
  today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.8"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4" width="17" height="16" rx="4"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>',
  stats: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 20V11M12 20V4M19 20v-6"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M2.5 12h2M19.5 12h2M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/></svg>',
  logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l4.5 4.5L20 5.5"/><path d="M4 7h6M4 3.5h9" opacity=".55"/></svg>'
};

/* ---------------- state ---------------- */
let fs = null, base = null, KEY = "";
let users = {}, routines = [], tasks = [], checks = {};
let loaded = { users: false, routines: false, tasks: false, checks: false };
let me = null, tab = ls.get("rut.tab", "idag"), viewOwner = null, listOwner = null;
let calMonth = 0; // 0 = denna månad
const pops = new Map(); // itemId -> starttid för avbockningsanimation
let today = isoDate(new Date());

/* ---------------- datum ---------------- */
function isoDate(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` }
function parseISO(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d) }
function addDays(s, n) { const d = parseISO(s); d.setDate(d.getDate() + n); return isoDate(d) }
const dow = s => (parseISO(s).getDay() + 6) % 7; // mån = 0
const weekStart = s => addDays(s, -dow(s));
const hhmm = ms => { const d = new Date(ms); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` };
const createdISO = x => x.created ? isoDate(new Date(x.created)) : "2000-01-01";

/* ---------------- schema & items ---------------- */
function scheduleText(s) {
  if (!s || s.type === "daily") return "Varje dag";
  if (s.type === "days") {
    const d = [...(s.days || [])].sort();
    if (d.length === 7) return "Varje dag";
    if (d.join() === "0,1,2,3,4") return "Vardagar";
    if (d.join() === "5,6") return "Helger";
    return d.map(i => WD[i]).join(", ");
  }
  return `${s.times} ggr/vecka`;
}
const sortRoutines = list => [...list].sort((a, b) => {
  const ca = CAT_ORDER.indexOf(a.category), cb = CAT_ORDER.indexOf(b.category);
  const oa = ca < 0 ? 99 : ca, ob = cb < 0 ? 99 : cb;
  return oa - ob || (a.category || "").localeCompare(b.category || "", "sv") || (a.order || 0) - (b.order || 0);
});
const routinesOf = o => sortRoutines(routines.filter(r => r.owner === o));
const tasksOf = rid => tasks.filter(t => t.routineId === rid).sort((a, b) => (a.order || 0) - (b.order || 0));
function itemsOf(r) {
  const ts = tasksOf(r.id);
  if (!ts.length) return [{ id: r.id, isRoutine: true, routine: r, name: r.name, desc: "", image: r.image, schedule: r.schedule, owner: r.owner, created: r.created }];
  return ts.map(t => ({ ...t, routine: r, schedule: t.schedule || r.schedule }));
}
const isChecked = (date, id) => !!checks[`${date}__${id}`];
function weekCount(item, date, excludeDate) {
  const ws = weekStart(date); let n = 0;
  for (let i = 0; i < 7; i++) { const d = addDays(ws, i); if (d !== excludeDate && isChecked(d, item.id)) n++ }
  return n;
}
// fasta schema: dagar. veckomål: hanteras separat
const isWeekly = it => it.schedule && it.schedule.type === "times";
function fixedDue(item, date) {
  if (date < createdISO(item)) return false;
  const s = item.schedule;
  if (!s || s.type === "daily") return true;
  if (s.type === "days") return (s.days || []).includes(dow(date));
  return false;
}
// visas idag?
function dueToday(item, date) {
  if (isWeekly(item)) return date >= createdISO(item) && (isChecked(date, item.id) || weekCount(item, date, date) < item.schedule.times);
  return fixedDue(item, date);
}
function allItems(o) { return routinesOf(o).flatMap(r => itemsOf(r)) }
// dagstatus för fasta uppgifter: true = allt klart, false = något saknas, null = inget planerat
function dayStatus(o, date, items = allItems(o)) {
  const due = items.filter(it => !isWeekly(it) && fixedDue(it, date));
  if (!due.length) return null;
  return due.every(it => isChecked(date, it.id));
}
function personStreak(o) {
  const items = allItems(o); if (!items.length) return { cur: 0, best: 0 };
  const start = items.map(createdISO).sort()[0];
  let cur = 0, d = today, counting = true;
  if (dayStatus(o, today, items) !== true) d = addDays(today, -1); // idag pågår fortfarande
  while (d >= start && counting) {
    const s = dayStatus(o, d, items);
    if (s === true) cur++; else if (s === false) counting = false;
    d = addDays(d, -1);
  }
  let best = 0, run = 0;
  for (let x = start; x <= today; x = addDays(x, 1)) {
    const s = dayStatus(o, x, items);
    if (s === true) { run++; best = Math.max(best, run) } else if (s === false && x !== today) run = 0;
  }
  return { cur, best: Math.max(best, cur) };
}
function routineStreak(r) {
  const items = itemsOf(r); const start = createdISO(r);
  if (r.schedule && r.schedule.type === "times") {
    const ok = ws => items.every(it => !isWeekly(it) || weekCount(it, ws) >= it.schedule.times);
    let ws = weekStart(today), n = 0;
    if (!ok(ws)) ws = addDays(ws, -7);
    while (ws >= weekStart(start) && ok(ws)) { n++; ws = addDays(ws, -7) }
    return { n, unit: n === 1 ? "vecka" : "veckor" };
  }
  const st = date => { const due = items.filter(it => !isWeekly(it) && fixedDue(it, date)); return due.length ? due.every(it => isChecked(date, it.id)) : null };
  let d = today, n = 0;
  if (st(today) !== true) d = addDays(today, -1);
  while (d >= start) { const s = st(d); if (s === true) n++; else if (s === false) break; d = addDays(d, -1) }
  return { n, unit: n === 1 ? "gång" : "gånger i rad", daily: !r.schedule || r.schedule.type === "daily" };
}
function weekPct(o) {
  const items = allItems(o), ws = weekStart(today); let done = 0, total = 0;
  items.forEach(it => {
    if (isWeekly(it)) { if (ws >= weekStart(createdISO(it))) { total += it.schedule.times; done += Math.min(it.schedule.times, weekCount(it, today)) } return }
    for (let i = 0; i <= dow(today); i++) { const d = addDays(ws, i); if (fixedDue(it, d)) { total++; if (isChecked(d, it.id)) done++ } }
  });
  return { done, total, pct: total ? Math.round(done / total * 100) : 0 };
}
function todayProgress(o) {
  const items = allItems(o).filter(it => dueToday(it, today));
  return { done: items.filter(it => isChecked(today, it.id)).length, total: items.length };
}

/* ---------------- databas ---------------- */
const col = c => base.collection(c);
const fail = e => { console.error(e); toast("Kunde inte spara. Kolla uppkopplingen.") };

async function sha(s) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
}
const pinHash = (who, pin) => sha(`rutiner:${KEY}:${who}:${pin}`);

// Nyckeln ligger kvar i adressen (#…) så att "Lägg till på hemskärmen" tar med den.
// På iPhone har hemskärmsappen eget minne, därför går det också att klistra in länken.
function parseKey(text) {
  const t = String(text || "").trim(); if (!t) return "";
  const k = t.includes("#") ? t.split("#").pop() : t;
  return decodeURIComponent(k).trim().replace(/[^A-Za-z0-9_-]/g, "");
}
function getKey() {
  const h = parseKey(location.hash.slice(1));
  if (h) { ls.set("rut.key", h); return h }
  const saved = ls.get("rut.key", ls.get("hemma.key", ""));
  if (saved) { try { history.replaceState(null, "", location.pathname + location.search + "#" + saved) } catch (e) { } }
  return saved;
}
function drawKeyEntry(err) {
  $("#app").innerHTML = `<div class="login fade"><div class="logo">${IC.logo}</div><h1>Öppna appen</h1>
    <p>Klistra in länken du fick av Adrian. Det behövs bara en gång.</p>
    <input class="in" id="keyIn" placeholder="Klistra in länken här" autocomplete="off" autocapitalize="off" spellcheck="false" style="text-align:center">
    ${err ? `<p class="err">${esc(err)}</p>` : ""}
    <button class="btn pri full tap" id="keyGo">Fortsätt</button></div>`;
  const go = () => {
    const k = parseKey($("#keyIn").value);
    if (k.length < 12) return drawKeyEntry("Det där ser inte ut som hela länken. Kopiera hela länken och försök igen.");
    ls.set("rut.key", k); location.hash = k; location.reload();
  };
  $("#keyGo").onclick = go; $("#keyIn").onkeydown = e => { if (e.key === "Enter") go() };
}

async function boot() {
  KEY = getKey();
  if (!KEY) return drawKeyEntry();
  if (!window.firebase) return renderMessage("Ingen anslutning", "Kunde inte ladda appen. Kolla uppkopplingen och ladda om sidan.");
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    fs = firebase.firestore();
    fs.settings({ experimentalForceLongPolling: true }); // stabilare realtid på mobilnät och bakom proxyer
    try { await fs.enablePersistence({ synchronizeTabs: true }) } catch (e) { }
    base = fs.collection("hem").doc(KEY);
  } catch (e) { console.error(e); return renderMessage("Något gick fel", "Kunde inte starta databasen.") }

  const onErr = e => { console.error(e); if (e.code === "permission-denied") { ls.set("rut.key", null); return drawKeyEntry("Länken stämmer inte. Klistra in hela länken du fick av Adrian.") } renderMessage("Kunde inte hämta data", "Kolla uppkopplingen och ladda om sidan.") };
  const since = addDays(today, -CHECK_DAYS);
  col("users").onSnapshot(s => { users = {}; s.docs.forEach(d => users[d.id] = d.data()); loaded.users = true; render() }, onErr);
  col("routines").onSnapshot(s => { routines = s.docs.map(d => ({ id: d.id, ...d.data() })); loaded.routines = true; maybeSeed(); render() }, onErr);
  col("tasks").onSnapshot(s => { tasks = s.docs.map(d => ({ id: d.id, ...d.data() })); loaded.tasks = true; render() }, onErr);
  col("checks").where("date", ">=", since).onSnapshot(s => {
    s.docChanges().forEach(ch => {
      const d = ch.doc.data();
      if (ch.type === "added" && !ch.doc.metadata.hasPendingWrites && loaded.checks && d.owner !== me && Date.now() - (d.at || 0) < 15000) {
        pops.set(d.itemId, performance.now());
        const it = findItem(d.itemId); if (it && me) toast(`${NAME[d.owner]} bockade av ${it.name}`);
      }
    });
    checks = {}; s.docs.forEach(d => checks[d.id] = d.data()); loaded.checks = true; render();
  }, onErr);

  me = ls.get("rut.me", null); if (me !== "A" && me !== "K") me = null;
  render();
  setInterval(() => { const t = isoDate(new Date()); if (t !== today) { today = t; render() } }, 30000);
  document.addEventListener("visibilitychange", () => { const t = isoDate(new Date()); if (t !== today) { today = t; render() } });
}
function findItem(id) {
  for (const r of routines) for (const it of itemsOf(r)) if (it.id === id) return it;
  return null;
}

/* förifyllda rutiner för Adrian – körs en gång */
let seeding = false;
async function maybeSeed() {
  if (seeding || !loaded.routines || routines.length) return;
  seeding = true;
  try {
    const flag = col("meta").doc("seed"); const f = await flag.get();
    if (f.exists) return;
    await flag.set({ at: Date.now() });
    const now = Date.now(), b = fs.batch();
    const neck = { owner: "A", category: "Träning", name: "Hals", image: "lib:neckCurl", schedule: { type: "days", days: [0, 2, 4] }, order: 0, created: now };
    const nid = newId(); b.set(col("routines").doc(nid), neck);
    [
      { name: "Neck curls", sets: 3, reps: "15–20", image: "lib:neckCurl", desc: "Ligg på rygg med huvudet utanför bänkkanten. För hakan mot bröstet och sänk långsamt tillbaka. Lugna, kontrollerade rörelser." },
      { name: "Neck extensions", sets: 3, reps: "15–20", image: "lib:neckExt", desc: "Ligg på mage med huvudet utanför bänkkanten. Lyft huvudet bakåt och sänk långsamt. Inga ryck." },
      { name: "Sidoböjningar hals", sets: 2, reps: "15 per sida", image: "lib:neckSide", desc: "För örat mot axeln, långsamt fram och tillbaka. Gör alla reps på ena sidan, sedan den andra." },
      { name: "Shrugs", sets: 4, reps: "10–15", image: "lib:shrug", desc: "Håll vikter i händerna, armarna raka. Dra axlarna rakt upp mot öronen, håll en sekund och sänk." }
    ].forEach((t, i) => b.set(col("tasks").doc(newId() + i), { ...t, routineId: nid, owner: "A", time: "", schedule: null, order: i, created: now }));
    b.set(col("routines").doc(newId() + "m"), { owner: "A", category: "Hudvård", name: "Morgon", image: "lib:sun", schedule: { type: "daily" }, order: 0, created: now });
    b.set(col("routines").doc(newId() + "k"), { owner: "A", category: "Hudvård", name: "Kväll", image: "lib:moon", schedule: { type: "daily" }, order: 1, created: now });
    await b.commit();
  } catch (e) { console.error(e) } finally { seeding = false }
}

/* ---------------- avbockning ---------------- */
function toggleCheck(item) {
  if (item.owner !== me) { toast(`Det här är ${GEN[item.owner]} rutin`); return }
  const id = `${today}__${item.id}`, ref = col("checks").doc(id);
  if (checks[id]) {
    delete checks[id]; render();
    ref.delete().catch(fail);
    buzz(5);
    return;
  }
  const doc = { owner: me, itemId: item.id, routineId: item.routine.id, date: today, at: Date.now() };
  checks[id] = doc; pops.set(item.id, performance.now()); buzz(12);
  // hela rutinen klar?
  const rItems = itemsOf(item.routine).filter(it => dueToday(it, today));
  const rDone = rItems.every(it => isChecked(today, it.id));
  const p = todayProgress(me);
  render();
  ref.set(doc).catch(fail);
  if (p.total && p.done === p.total) { setTimeout(() => { confetti(null, 140); const s = personStreak(me); toast(`Allt klart idag!${s.cur > 1 ? ` ${s.cur} dagar i rad` : ""}`, "flame") }, 250) }
  else if (rDone && rItems.length > 1) {
    const el = document.querySelector(`[data-sec="${item.routine.id}"]`);
    setTimeout(() => { confetti(el, 60); const s = routineStreak(item.routine); toast(`${item.routine.name} klar!${s.n > 1 ? ` ${s.n} ${s.unit}` : ""}`, "flame") }, 250);
  }
}

/* ---------------- confetti ---------------- */
function confetti(el, n = 80) {
  if (reduced()) return;
  const cv = $("#fx"), ctx = cv.getContext("2d"), dpr = devicePixelRatio || 1;
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.scale(dpr, dpr);
  const r = el ? el.getBoundingClientRect() : { left: innerWidth / 2 - 1, top: innerHeight * .35, width: 2, height: 2 };
  const ox = r.left + r.width / 2, oy = r.top + Math.min(r.height / 2, 120);
  const cols = ["#9b8cff", "#3ee09b", "#ffa25c", "#6ea8ff", "#ff7eb3", "#ffd166"];
  const ps = Array.from({ length: n }, () => ({ x: ox, y: oy, vx: (Math.random() - .5) * 11, vy: -Math.random() * 11 - 3, s: 4 + Math.random() * 5, c: cols[Math.random() * cols.length | 0], r: Math.random() * 6, vr: (Math.random() - .5) * .4, life: 0 }));
  let t0 = performance.now();
  const step = t => {
    const dt = Math.min(32, t - t0) / 16; t0 = t;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    let alive = 0;
    ps.forEach(p => {
      p.life += dt; p.vy += .35 * dt; p.vx *= .99; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
      const a = Math.max(0, 1 - p.life / 90); if (a <= 0 || p.y > innerHeight + 20) return; alive++;
      ctx.save(); ctx.globalAlpha = a; ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
    });
    if (alive) requestAnimationFrame(step); else ctx.clearRect(0, 0, innerWidth, innerHeight);
  };
  requestAnimationFrame(step);
}

/* ---------------- render: hjälpare ---------------- */
function media(img, small) {
  if (img && img.startsWith("data:")) return `<img src="${img}" alt="" loading="lazy">`;
  return libSVG((img || "lib:check").replace(/^lib:/, ""), { small });
}
function ring(done, total, color) {
  const R = 20, C = 2 * Math.PI * R, p = total ? done / total : 0;
  return `<div class="ring ${total && done === total ? "full" : ""}"><svg viewBox="0 0 48 48"><circle class="trk" cx="24" cy="24" r="${R}" fill="none" stroke-width="5"/><circle class="bar" cx="24" cy="24" r="${R}" fill="none" stroke="${total && done === total ? "var(--done)" : color}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - p)}"/></svg><span>${total ? Math.round(p * 100) : "–"}</span></div>`;
}
const amountChips = it => {
  const c = [];
  if (it.sets && it.reps) c.push(`${it.sets} × ${esc(it.reps)}`); else if (it.reps) c.push(esc(it.reps)); else if (it.sets) c.push(`${it.sets} set`);
  if (it.time) c.push(esc(it.time));
  return c;
};
const loadedAll = () => loaded.users && loaded.routines && loaded.tasks && loaded.checks;

function renderMessage(title, text) {
  $("#app").innerHTML = `<div class="login"><div class="logo">${IC.logo}</div><h1>${esc(title)}</h1><p>${esc(text)}</p></div>`;
}

let renderQueued = false;
function render() { if (renderQueued) return; renderQueued = true; requestAnimationFrame(() => { renderQueued = false; draw() }) }
function draw() {
  if (!base) return;
  if (!loaded.users) { $("#app").innerHTML = `<div class="login"><div class="logo">${IC.logo}</div><h1>Rutiner</h1><p>Laddar…</p></div>`; return }
  if (!me) return drawLogin();
  if (!viewOwner) viewOwner = me; if (!listOwner) listOwner = me;
  const now = new Date();
  const greet = now.getHours() < 5 ? "God natt" : now.getHours() < 10 ? "God morgon" : now.getHours() < 18 ? "Hej" : "God kväll";
  let body = "";
  if (!loadedAll()) body = `<div class="status">Hämtar era rutiner…</div>`;
  else body = tab === "rutiner" ? viewRoutines() : tab === "statistik" ? viewStats() : viewToday();
  const scrollY = window.scrollY;
  $("#app").innerHTML = `
  <div class="page">
    <header class="top">
      <div><h1>${tab === "idag" ? `${greet}, ${NAME[me]}` : tab === "rutiner" ? "Rutiner" : "Statistik"}</h1>
      <p>${tab === "idag" ? `${WD_L[dow(today)][0].toUpperCase() + WD_L[dow(today)].slice(1)} ${parseISO(today).getDate()} ${MON[parseISO(today).getMonth()]}` : tab === "rutiner" ? "Skapa, ändra och sortera" : "Hur det går för er"}</p></div>
      <button class="avatar ${me} tap" data-act="settings" aria-label="Inställningar">${me}</button>
    </header>
    ${body}
  </div>
  ${tab === "rutiner" && loadedAll() && listOwner === me ? `<button class="fab tap" data-act="new-routine">${IC.plus}Ny rutin</button>` : ""}
  <nav class="tabs" role="tablist">
    ${[["idag", "Idag", IC.today], ["rutiner", "Rutiner", IC.list], ["statistik", "Statistik", IC.stats]].map(([k, l, i]) => `<button role="tab" class="tap" data-act="tab" data-v="${k}" aria-selected="${tab === k}">${i}${l}</button>`).join("")}
  </nav>`;
  window.scrollTo(0, scrollY);
  // rensa gamla animationer
  const t = performance.now(); for (const [k, v] of pops) if (t - v > 900) pops.delete(k);
}

/* ---------------- vy: Idag ---------------- */
function viewToday() {
  const prog = { A: todayProgress("A"), K: todayProgress("K") };
  const persons = `<div class="persons">${["A", "K"].map(o => `
    <button class="person tap ${o} ${viewOwner === o ? "sel" : ""}" data-act="view" data-v="${o}" aria-pressed="${viewOwner === o}">
      ${ring(prog[o].done, prog[o].total, `var(--${o.toLowerCase()})`)}
      <span><b>${NAME[o]}</b><small>${prog[o].total ? `${prog[o].done} av ${prog[o].total} klara` : "Ledig idag"}</small></span>
    </button>`).join("")}</div>`;
  const o = viewOwner, rs = routinesOf(o);
  let out = persons;
  if (o !== me) out += `<div class="note">${IC.eye}<span>Du tittar på ${GEN[o]} dag. Bara ${NAME[o]} kan bocka av.</span></div>`;
  if (!rs.length) return out + `<div class="empty fade">${IC.list}<b>${o === me ? "Inga rutiner än" : `${NAME[o]} har inga rutiner än`}</b><span>${o === me ? "Skapa din första under fliken Rutiner." : "De dyker upp här när de skapats."}</span>${o === me ? `<button class="btn pri" data-act="tab" data-v="rutiner">Skapa rutin</button>` : ""}</div>`;
  const p = prog[o];
  if (p.total && p.done === p.total) {
    const s = personStreak(o);
    out += `<div class="alldone fade">${IC.trophy}<div><b>${o === me ? "Allt klart för idag!" : `${NAME[o]} är klar för idag!`}</b><span>${s.cur > 0 ? `${s.cur} ${s.cur === 1 ? "dag" : "dagar"} i rad med allt avklarat` : "Snyggt jobbat"}</span></div></div>`;
  }
  let any = false;
  rs.forEach(r => {
    const items = itemsOf(r).filter(it => dueToday(it, today));
    if (!items.length) return; any = true;
    const done = items.filter(it => isChecked(today, it.id)).length, st = routineStreak(r);
    out += `<section class="rsec fade" data-sec="${r.id}">
      <div class="rhead"><h2><small>${esc(r.category)}</small>${esc(r.name)}</h2>
        <div class="rmeta">${st.n ? `<span class="flame" title="Streak">${IC.flame}${st.n}</span>` : ""}<span class="count ${done === items.length ? "full" : ""}">${done}/${items.length}</span></div></div>
      <div class="cards ${items.length === 1 ? "one" : ""}">${items.map(it => card(it)).join("")}</div>
    </section>`;
  });
  if (!any) out += `<div class="empty fade">${IC.sun}<b>Inget planerat idag</b><span>${o === me ? "Vila, eller kolla vad som väntar under Rutiner." : `${NAME[o]} har en ledig dag.`}</span></div>`;
  return out;
}
function card(it) {
  const c = checks[`${today}__${it.id}`], ro = it.owner !== me;
  const chips = amountChips(it);
  if (isWeekly(it)) chips.push(`${weekCount(it, today)}/${it.schedule.times} i veckan`);
  if (it.isRoutine && !c) chips.push("Inga steg än");
  const st = pops.get(it.id), delay = st ? -(performance.now() - st) : 0;
  const pop = st && performance.now() - st < 800;
  return `<div class="card ${c ? "done" : ""} ${ro ? "ro" : ""} ${pop && c ? "pop" : ""}" ${pop ? `style="animation-delay:${delay}ms"` : ""}>
    <div class="media">${media(it.image)}</div>
    <button class="hit" data-act="check" data-id="${it.id}" aria-label="${c ? "Ångra" : "Bocka av"} ${esc(it.name)}" aria-pressed="${!!c}"></button>
    <button class="info tap" data-act="detail" data-id="${it.id}" aria-label="Visa ${esc(it.name)}">${IC.info}</button>
    <span class="chk" ${pop ? `style="animation-delay:${delay}ms"` : ""}>${IC.check}</span>
    <div class="body" style="pointer-events:none"><b>${esc(it.name)}</b>
      <div class="chips">${c ? `<span class="chip done">Klart ${hhmm(c.at)}</span>` : ""}${chips.map(x => `<span class="chip">${x}</span>`).join("")}</div>
    </div>
  </div>`;
}
function openDetail(id) {
  const it = findItem(id); if (!it) return;
  const c = checks[`${today}__${it.id}`], chips = amountChips(it), mine = it.owner === me;
  openSheet(`${shead(it.name, `${esc(it.routine.category)} · ${esc(it.routine.name)}`)}
    <div class="hero">${media(it.image)}</div>
    ${chips.length || it.schedule ? `<div class="kv">${it.sets ? `<span><small>Set</small>${it.sets}</span>` : ""}${it.reps ? `<span><small>Reps</small>${esc(it.reps)}</span>` : ""}${it.time ? `<span><small>Tid</small>${esc(it.time)}</span>` : ""}<span><small>Schema</small>${scheduleText(it.schedule)}</span></div>` : ""}
    ${it.isRoutine ? `<p class="desc muted">Den här rutinen har inga steg än. ${mine ? "Lägg till steg under fliken Rutiner." : ""}</p>` : it.desc ? `<p class="desc">${esc(it.desc)}</p>` : `<p class="desc muted">Ingen instruktion.</p>`}
    ${c ? `<p class="hint" style="text-align:center">Bockades av kl. ${hhmm(c.at)}</p>` : ""}
    ${mine && dueToday(it, today) ? `<button class="btn ${c ? "sec" : "pri"} full tap" data-act="check" data-id="${it.id}" data-close="1">${c ? "Ångra avbockning" : `${IC.check} Bocka av`}</button>` : ""}
    ${mine ? `<button class="btn sec full tap" data-act="${it.isRoutine ? "edit-routine" : "edit-task"}" data-id="${it.id}">Redigera</button>` : ""}`);
}

/* ---------------- vy: Rutiner ---------------- */
function viewRoutines() {
  let out = `<div class="seg">${["A", "K"].map(o => `<button class="tap" data-act="list" data-v="${o}" aria-pressed="${listOwner === o}">${o === me ? "Mina" : GEN[o]}</button>`).join("")}</div>`;
  const rs = routinesOf(listOwner);
  if (!rs.length) return out + `<div class="empty fade">${IC.list}<b>${listOwner === me ? "Inga rutiner än" : `${NAME[listOwner]} har inga rutiner än`}</b>${listOwner === me ? `<span>Tryck på Ny rutin för att börja.</span>` : ""}</div>`;
  const cats = [...new Set(rs.map(r => r.category))];
  cats.forEach(cat => {
    const list = rs.filter(r => r.category === cat);
    out += `<div class="cat fade"><h3>${esc(cat)}</h3>${list.map((r, i) => {
      const n = tasksOf(r.id).length;
      return `<div class="row"><button class="tap" data-act="routine" data-id="${r.id}" style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;text-align:left">
        <span class="thumb">${media(r.image, true)}</span>
        <span class="mid"><b>${esc(r.name)}</b><small>${scheduleText(r.schedule)} · ${n ? `${n} ${n === 1 ? "steg" : "steg"}` : "Inga steg"}</small></span></button>
        ${listOwner === me && list.length > 1 ? `<span class="updown"><button data-act="r-up" data-id="${r.id}" aria-label="Flytta upp" ${i === 0 ? "disabled" : ""}>${IC.up}</button><button data-act="r-down" data-id="${r.id}" aria-label="Flytta ner" ${i === list.length - 1 ? "disabled" : ""}>${IC.down}</button></span>` : `<span class="chev">${IC.chevR}</span>`}
      </div>`;
    }).join("")}</div>`;
  });
  return out;
}
function openRoutine(id) {
  const r = routines.find(x => x.id === id); if (!r) return closeSheet();
  const ts = tasksOf(id), mine = r.owner === me;
  openSheet(`${shead(r.name, `${esc(r.category)} · ${scheduleText(r.schedule)}`)}
    <div class="hero" style="aspect-ratio:16/7">${media(r.image)}</div>
    <div class="lbl">Steg</div>
    ${ts.length ? `<div style="display:flex;flex-direction:column;gap:8px">${ts.map((t, i) => `
      <div class="row" style="background:var(--surface2)">
        <button class="tap" data-act="${mine ? "edit-task" : "detail"}" data-id="${t.id}" style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;text-align:left">
          <span class="thumb">${media(t.image, true)}</span>
          <span class="mid"><b>${esc(t.name)}</b><small>${[...amountChips(t), t.schedule ? scheduleText(t.schedule) : ""].filter(Boolean).join(" · ") || "Tryck för att ändra"}</small></span></button>
        ${mine && ts.length > 1 ? `<span class="updown"><button data-act="t-up" data-id="${t.id}" aria-label="Flytta upp" ${i === 0 ? "disabled" : ""}>${IC.up}</button><button data-act="t-down" data-id="${t.id}" aria-label="Flytta ner" ${i === ts.length - 1 ? "disabled" : ""}>${IC.down}</button></span>` : ""}
      </div>`).join("")}</div>` : `<p class="hint">Inga steg än. ${mine ? "Utan steg bockas rutinen av som en helhet." : ""}</p>`}
    ${mine ? `<button class="btn ghost full tap" data-act="new-task" data-id="${r.id}">${IC.plus}Lägg till steg</button>
    <button class="btn sec full tap" data-act="edit-routine" data-id="${r.id}">Ändra rutinen</button>` : ""}`);
}

/* ---------------- vy: Statistik ---------------- */
function viewStats() {
  const w = { A: weekPct("A"), K: weekPct("K") }, s = { A: personStreak("A"), K: personStreak("K") };
  const lead = w.A.pct === w.K.pct ? "Ni ligger lika denna vecka." : `${NAME[w.A.pct > w.K.pct ? "A" : "K"]} leder denna vecka.`;
  let out = `<div class="panel fade"><h2>Denna vecka</h2><p class="sub">${w.A.total || w.K.total ? lead : "Ingen har något planerat än."}</p>
    <div class="vs">${["A", "K"].map(o => `<div class="vsrow"><span class="avatar sm ${o}">${o}</span><div class="track"><div class="fill" style="width:${w[o].pct}%;background:var(--${o.toLowerCase()})"></div></div><b>${w[o].total ? w[o].pct + " %" : "–"}</b></div>`).join("")}</div>
    <p class="hint">${["A", "K"].map(o => `${NAME[o]}: ${w[o].done} av ${w[o].total}`).join(" · ")} uppgifter hittills i veckan</p></div>`;
  out += `<div class="streaks fade">${["A", "K"].map(o => `<div class="streak"><span class="who"><span class="avatar sm ${o}">${o}</span>${NAME[o]}</span>
    <span class="num ${s[o].cur ? "" : "zero"}">${IC.flame}${s[o].cur}</span><small>${s[o].cur === 1 ? "dag" : "dagar"} i rad med allt klart · bäst ${s[o].best}</small></div>`).join("")}</div>`;
  // kalender
  const ref = new Date(parseISO(today).getFullYear(), parseISO(today).getMonth() + calMonth, 1);
  const first = isoDate(ref), daysIn = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  const itemsA = allItems("A"), itemsK = allItems("K");
  let cells = WD_1.map(d => `<span class="wd">${d}</span>`).join("");
  for (let i = 0; i < dow(first); i++) cells += `<span class="day out"></span>`;
  for (let n = 1; n <= daysIn; n++) {
    const d = isoDate(new Date(ref.getFullYear(), ref.getMonth(), n)), fut = d > today;
    const sa = fut ? null : dayStatus("A", d, itemsA), sk = fut ? null : dayStatus("K", d, itemsK);
    const dot = (o, st) => `<i class="${o} ${st === true ? "ok" : st === false && d !== today ? "miss" : ""}"></i>`;
    cells += `<span class="day ${d === today ? "today" : ""} ${fut ? "future" : ""} ${sa === true && sk === true ? "both" : ""}">${n}<span class="dots">${dot("A", sa)}${dot("K", sk)}</span></span>`;
  }
  out += `<div class="panel fade"><div class="calhead"><button class="arr tap" data-act="cal" data-v="-1" aria-label="Föregående månad">${IC.chevL}</button><b>${MON[ref.getMonth()]} ${ref.getFullYear()}</b><button class="arr tap" data-act="cal" data-v="1" aria-label="Nästa månad" ${calMonth >= 0 ? "disabled style=opacity:.3" : ""}>${IC.chevR}</button></div>
    <div class="cal">${cells}</div>
    <div class="legend"><span><i style="background:var(--a)"></i>Adrian klarade allt</span><span><i style="background:var(--k)"></i>Kemal klarade allt</span><span><i style="background:var(--done)"></i>Båda</span></div></div>`;
  // per rutin
  ["A", "K"].forEach(o => {
    const rs = routinesOf(o); if (!rs.length) return;
    out += `<div class="panel fade"><h2>${GEN[o]} rutiner</h2><div>${rs.map(r => {
      const st = routineStreak(r);
      return `<div class="rstreak"><span class="thumb">${media(r.image, true)}</span><span class="mid"><b>${esc(r.name)}</b><small>${esc(r.category)} · ${scheduleText(r.schedule)}</small></span><span class="flame ${st.n ? "" : "off"}">${IC.flame}${st.n}</span></div>`;
    }).join("")}</div><p class="hint">Siffran visar hur många planerade gånger i rad hela rutinen blev gjord. Rutiner med ”ggr/vecka” räknas i veckor.</p></div>`;
  });
  return out;
}

/* ---------------- inloggning ---------------- */
let loginWho = null, pinBuf = "", pinFirst = null, pinErr = "", fails = 0, lockUntil = 0;
function drawLogin() {
  if (!loginWho) {
    $("#app").innerHTML = `<div class="login fade"><div class="logo">${IC.logo}</div><h1>Rutiner</h1><p>Vem är du?</p>
      <div class="who2">${["A", "K"].map(o => `<button class="tap" data-act="who" data-v="${o}"><span class="avatar xl ${o}">${o}</span>${NAME[o]}</button>`).join("")}</div></div>`;
    return;
  }
  const hasPin = !!(users[loginWho] && users[loginWho].pin);
  const title = hasPin ? `Hej ${NAME[loginWho]}` : pinFirst ? "Bekräfta PIN-koden" : "Välj en PIN-kod";
  const sub = pinErr || (hasPin ? "Skriv din PIN-kod" : pinFirst ? "Skriv samma fyra siffror igen" : "Fyra siffror som bara du kan");
  $("#app").innerHTML = `<div class="login"><span class="avatar xl ${loginWho}">${loginWho}</span><h1 style="font-size:26px">${title}</h1><p style="${pinErr ? "color:var(--danger)" : ""}">${esc(sub)}</p>
    <div class="pinDots" id="dots">${[0, 1, 2, 3].map(i => `<i class="${i < pinBuf.length ? "on" : ""}"></i>`).join("")}</div>
    <div class="pad">${["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map(k => k === "" ? `<span class="blank"></span>` : `<button class="tap" data-act="pin" data-v="${k}" aria-label="${k === "del" ? "Radera" : k}">${k === "del" ? IC.back : k}</button>`).join("")}</div>
    <button class="linkbtn" data-act="who-back">Inte ${NAME[loginWho]}?</button></div>`;
}
async function pinKey(k) {
  if (Date.now() < lockUntil) { pinErr = `Vänta ${Math.ceil((lockUntil - Date.now()) / 1000)} sekunder`; drawLogin(); return }
  if (k === "del") { pinBuf = pinBuf.slice(0, -1); pinErr = ""; drawLogin(); return }
  if (pinBuf.length >= 4) return;
  pinBuf += k; buzz(5); pinErr = ""; drawLogin();
  if (pinBuf.length < 4) return;
  const who = loginWho, pin = pinBuf, hasPin = !!(users[who] && users[who].pin);
  if (hasPin) {
    if (await pinHash(who, pin) === users[who].pin) return loginOk(who);
    fails++; if (fails >= 5) { lockUntil = Date.now() + 30000; fails = 0 }
    return pinWrong("Fel PIN-kod, försök igen");
  }
  if (!pinFirst) { pinFirst = pin; pinBuf = ""; setTimeout(drawLogin, 150); return }
  if (pinFirst !== pin) { pinFirst = null; return pinWrong("Koderna matchade inte. Börja om.") }
  try { await col("users").doc(who).set({ pin: await pinHash(who, pin), created: Date.now() }); loginOk(who) }
  catch (e) { console.error(e); pinWrong("Kunde inte spara. Kolla uppkopplingen.") }
}
function pinWrong(msg) {
  pinErr = msg; buzz([30, 40, 30]);
  setTimeout(() => { pinBuf = ""; drawLogin(); const d = $("#dots"); if (d) { d.classList.add("shake") } }, 120);
}
function loginOk(who) { me = who; viewOwner = who; listOwner = who; ls.set("rut.me", who); pinBuf = ""; pinFirst = null; loginWho = null; render() }

/* ---------------- sheet ---------------- */
let sheetOpen = false;
const shead = (t, s) => `<div class="shead"><div>${s ? `<small>${s}</small>` : ""}<h3>${esc(t)}</h3></div><button class="close tap" data-act="close-sheet" aria-label="Stäng">${IC.close}</button></div>`;
function openSheet(html, mount) {
  const body = $("#sheetBody"); body.innerHTML = html;
  $("#sheetWrap").hidden = false; sheetOpen = true;
  requestAnimationFrame(() => requestAnimationFrame(() => $("#sheetWrap").classList.add("open")));
  $(".sheet").scrollTop = 0;
  mount && mount(body);
}
function closeSheet() {
  sheetOpen = false; $("#sheetWrap").classList.remove("open"); document.activeElement?.blur?.();
  setTimeout(() => { if (!sheetOpen) $("#sheetWrap").hidden = true }, 320);
}
document.addEventListener("keydown", e => { if (e.key === "Escape" && sheetOpen) closeSheet() });

let toastT;
function toast(msg, icon, undo) {
  const t = $("#toast");
  t.innerHTML = `${icon === "flame" ? IC.flame : ""}<span>${esc(msg)}</span>${undo ? `<button>Ångra</button>` : ""}`;
  if (undo) t.querySelector("button").onclick = () => { undo(); t.hidden = true };
  t.hidden = false; t.style.animation = "none"; void t.offsetWidth; t.style.animation = "";
  clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 3200);
}

/* ---------------- formulär ---------------- */
function scheduleEditor(s, onChange) {
  s = s ? JSON.parse(JSON.stringify(s)) : { type: "daily" };
  if (!s.days) s.days = [0, 2, 4]; if (!s.times) s.times = 3;
  const el = document.createElement("div"); el.className = "field";
  const draw = () => {
    el.innerHTML = `<div class="opts">${[["daily", "Varje dag"], ["days", "Vissa dagar"], ["times", "X ggr/vecka"]].map(([k, l]) => `<button type="button" class="opt tap" data-t="${k}" aria-pressed="${s.type === k}">${l}</button>`).join("")}</div>
      ${s.type === "days" ? `<div class="days">${WD.map((d, i) => `<button type="button" class="opt tap" data-d="${i}" aria-pressed="${s.days.includes(i)}" aria-label="${WD_L[i]}">${d}</button>`).join("")}</div>` : ""}
      ${s.type === "times" ? `<div class="stepper"><button type="button" class="tap" data-n="-1" aria-label="Färre">−</button><b>${s.times} ggr</b><button type="button" class="tap" data-n="1" aria-label="Fler">+</button><span class="hint">per vecka</span></div>` : ""}`;
    el.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { s.type = b.dataset.t; draw(); onChange(out()) });
    el.querySelectorAll("[data-d]").forEach(b => b.onclick = () => { const i = +b.dataset.d; s.days = s.days.includes(i) ? s.days.filter(x => x !== i) : [...s.days, i].sort(); draw(); onChange(out()) });
    el.querySelectorAll("[data-n]").forEach(b => b.onclick = () => { s.times = Math.max(1, Math.min(7, s.times + +b.dataset.n)); draw(); onChange(out()) });
  };
  const out = () => s.type === "daily" ? { type: "daily" } : s.type === "days" ? { type: "days", days: [...s.days] } : { type: "times", times: s.times };
  draw(); onChange(out());
  return el;
}
function imagePicker(cur, onChange) {
  let img = cur || "lib:check", libOpen = false;
  const el = document.createElement("div"); el.className = "field";
  const draw = () => {
    el.innerHTML = `<label>Bild</label><div class="imgpick">${media(img)}</div>
      <div class="imgbtns"><label class="btn sec sm tap" style="cursor:pointer">${IC.upload}Ladda upp<input type="file" accept="image/*" hidden></label>
      <button type="button" class="btn sec sm tap" data-lib>${IC.grid}Bildbibliotek</button></div>
      ${libOpen ? `<div class="lib">${Object.entries(LIB).map(([k, v]) => `<button type="button" class="tap" data-k="${k}" aria-pressed="${img === "lib:" + k}">${libSVG(k, { small: true })}<span>${esc(v.label)}</span></button>`).join("")}</div>` : ""}
      <p class="err" hidden></p>`;
    el.querySelector("[data-lib]").onclick = () => { libOpen = !libOpen; draw() };
    el.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { img = "lib:" + b.dataset.k; libOpen = false; onChange(img); draw() });
    el.querySelector("input[type=file]").onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      try { img = await shrink(f); onChange(img); draw() }
      catch (err) { const p = el.querySelector(".err"); p.textContent = "Kunde inte läsa bilden. Prova en annan."; p.hidden = false }
    };
  };
  draw(); onChange(img);
  return el;
}
function shrink(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      let q = .8, max = 900, out;
      for (let i = 0; i < 6; i++) {
        const sc = Math.min(1, max / Math.max(im.width, im.height));
        const c = document.createElement("canvas"); c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        out = c.toDataURL("image/jpeg", q);
        if (out.length < 450000) break;
        q -= .1; max = Math.round(max * .85);
      }
      URL.revokeObjectURL(url); res(out);
    };
    im.onerror = () => { URL.revokeObjectURL(url); rej(new Error("bild")) };
    im.src = url;
  });
}
function dangerBtn(label, onConfirm) {
  const b = document.createElement("button"); b.type = "button"; b.className = "btn danger full tap"; b.textContent = label;
  let armed = false, t;
  b.onclick = () => {
    if (!armed) { armed = true; b.classList.add("armed"); b.textContent = "Tryck igen för att ta bort"; t = setTimeout(() => { armed = false; b.classList.remove("armed"); b.textContent = label }, 3500); return }
    clearTimeout(t); onConfirm();
  };
  return b;
}

function editRoutine(id) {
  const r = id ? routines.find(x => x.id === id) : null;
  const cats = [...new Set([...CAT_ORDER, ...routines.map(x => x.category).filter(Boolean)])];
  let data = { name: r?.name || "", category: r?.category || "Träning", image: r?.image, schedule: r?.schedule };
  openSheet(`${shead(r ? "Ändra rutin" : "Ny rutin")}
    <div class="field"><label for="rName">Namn</label><input class="in" id="rName" placeholder="T.ex. Morgonträning" maxlength="60" autocomplete="off"></div>
    <div class="field"><label>Kategori</label><div class="opts" id="rCats"></div>
      <input class="in" id="rCatNew" placeholder="Eller skriv en ny kategori" maxlength="30" autocomplete="off"></div>
    <div class="lbl">Schema</div><div id="rSched"></div>
    <div id="rImg"></div>
    <p class="err" id="rErr" hidden></p>
    <button class="btn pri full tap" id="rSave">${r ? "Spara" : "Skapa rutin"}</button>
    <div id="rDel"></div>`, el => {
    el.querySelector("#rName").value = data.name;
    const drawCats = () => {
      el.querySelector("#rCats").innerHTML = cats.map(c => `<button type="button" class="opt tap" data-c="${esc(c)}" aria-pressed="${data.category === c}">${esc(c)}</button>`).join("");
      el.querySelectorAll("[data-c]").forEach(b => b.onclick = () => { data.category = b.dataset.c; el.querySelector("#rCatNew").value = ""; drawCats() });
    };
    drawCats();
    el.querySelector("#rCatNew").oninput = e => { const v = e.target.value.trim(); if (v) { data.category = v; el.querySelectorAll("[data-c]").forEach(b => b.setAttribute("aria-pressed", "false")) } };
    el.querySelector("#rSched").appendChild(scheduleEditor(data.schedule, s => data.schedule = s));
    el.querySelector("#rImg").appendChild(imagePicker(data.image, i => data.image = i));
    el.querySelector("#rSave").onclick = async () => {
      data.name = el.querySelector("#rName").value.trim();
      const err = el.querySelector("#rErr");
      if (!data.name) { err.textContent = "Ge rutinen ett namn."; err.hidden = false; return }
      if (data.schedule.type === "days" && !data.schedule.days.length) { err.textContent = "Välj minst en veckodag."; err.hidden = false; return }
      const payload = { name: data.name, category: data.category || "Övrigt", image: data.image, schedule: data.schedule };
      try {
        if (r) await col("routines").doc(r.id).update(payload);
        else {
          const same = routines.filter(x => x.owner === me && x.category === payload.category);
          await col("routines").doc(newId()).set({ ...payload, owner: me, order: same.length ? Math.max(...same.map(x => x.order || 0)) + 1 : 0, created: Date.now() });
        }
        closeSheet(); toast(r ? "Rutinen är sparad" : "Rutinen är skapad");
      } catch (e) { fail(e) }
    };
    if (r) el.querySelector("#rDel").appendChild(dangerBtn("Ta bort rutinen", async () => {
      try { const b = fs.batch(); b.delete(col("routines").doc(r.id)); tasksOf(r.id).forEach(t => b.delete(col("tasks").doc(t.id))); await b.commit(); closeSheet(); toast("Rutinen är borttagen") } catch (e) { fail(e) }
    }));
  });
}
function editTask(id, routineId) {
  const t = id ? tasks.find(x => x.id === id) : null;
  const r = routines.find(x => x.id === (t ? t.routineId : routineId)); if (!r) return;
  let amount = t?.time ? "time" : (t?.sets || t?.reps) ? "reps" : t ? "none" : "reps";
  let data = { image: t?.image, schedule: t?.schedule || null };
  openSheet(`${shead(t ? "Ändra steg" : "Nytt steg", esc(r.name))}
    <div class="field"><label for="tName">Namn</label><input class="in" id="tName" placeholder="T.ex. Shrugs" maxlength="60" autocomplete="off"></div>
    <div class="field"><label for="tDesc">Beskrivning / instruktion</label><textarea class="in" id="tDesc" placeholder="Hur gör man? Vad ska man tänka på?" maxlength="1500"></textarea></div>
    <div id="tImg"></div>
    <div class="field"><label>Mängd</label><div class="opts" id="tAmt"></div><div id="tAmtF"></div></div>
    <div class="field"><label>Schema</label><button type="button" class="toggle tap" id="tOwn" aria-pressed="${!!data.schedule}">Eget schema för steget<span class="sw"></span></button>
      <p class="hint" id="tOwnHint">Följer rutinens schema: ${scheduleText(r.schedule)}</p><div id="tSched"></div></div>
    <p class="err" id="tErr" hidden></p>
    <button class="btn pri full tap" id="tSave">${t ? "Spara" : "Lägg till"}</button>
    <div id="tDel"></div>`, el => {
    el.querySelector("#tName").value = t?.name || ""; el.querySelector("#tDesc").value = t?.desc || "";
    el.querySelector("#tImg").appendChild(imagePicker(data.image || r.image, i => data.image = i));
    let vals = { sets: t?.sets || "", reps: t?.reps || "", time: t?.time || "" };
    const drawAmt = () => {
      el.querySelector("#tAmt").innerHTML = [["reps", "Set & reps"], ["time", "Tid"], ["none", "Ingen"]].map(([k, l]) => `<button type="button" class="opt tap" data-a="${k}" aria-pressed="${amount === k}">${l}</button>`).join("");
      el.querySelector("#tAmtF").innerHTML = amount === "reps" ? `<div class="two"><input class="in" id="tSets" inputmode="numeric" placeholder="Set, t.ex. 3" aria-label="Antal set"><input class="in" id="tReps" placeholder="Reps, t.ex. 15–20" aria-label="Reps"></div>`
        : amount === "time" ? `<input class="in" id="tTime" placeholder="T.ex. 5 min eller 30 sek" aria-label="Tid">` : "";
      if (amount === "reps") { el.querySelector("#tSets").value = vals.sets; el.querySelector("#tReps").value = vals.reps; el.querySelector("#tSets").oninput = e => vals.sets = e.target.value; el.querySelector("#tReps").oninput = e => vals.reps = e.target.value }
      if (amount === "time") { el.querySelector("#tTime").value = vals.time; el.querySelector("#tTime").oninput = e => vals.time = e.target.value }
      el.querySelectorAll("[data-a]").forEach(b => b.onclick = () => { amount = b.dataset.a; drawAmt() });
    };
    drawAmt();
    let own = !!data.schedule, sched = data.schedule;
    const drawOwn = () => {
      el.querySelector("#tOwn").setAttribute("aria-pressed", own); el.querySelector("#tOwnHint").hidden = own;
      const box = el.querySelector("#tSched"); box.innerHTML = "";
      if (own) box.appendChild(scheduleEditor(sched || r.schedule, s => sched = s));
    };
    el.querySelector("#tOwn").onclick = () => { own = !own; drawOwn() };
    drawOwn();
    el.querySelector("#tSave").onclick = async () => {
      const name = el.querySelector("#tName").value.trim(), err = el.querySelector("#tErr");
      if (!name) { err.textContent = "Ge steget ett namn."; err.hidden = false; return }
      if (own && sched.type === "days" && !sched.days.length) { err.textContent = "Välj minst en veckodag."; err.hidden = false; return }
      const sets = parseInt(vals.sets, 10);
      const payload = { name, desc: el.querySelector("#tDesc").value.trim(), image: data.image, sets: amount === "reps" && sets > 0 ? sets : null, reps: amount === "reps" ? vals.reps.trim() : "", time: amount === "time" ? vals.time.trim() : "", schedule: own ? sched : null };
      try {
        if (t) await col("tasks").doc(t.id).update(payload);
        else {
          const ts = tasksOf(r.id);
          await col("tasks").doc(newId()).set({ ...payload, routineId: r.id, owner: r.owner, order: ts.length ? Math.max(...ts.map(x => x.order || 0)) + 1 : 0, created: Date.now() });
        }
        toast(t ? "Steget är sparat" : "Steget är tillagt"); openRoutine(r.id);
      } catch (e) { fail(e) }
    };
    if (t) el.querySelector("#tDel").appendChild(dangerBtn("Ta bort steget", async () => {
      try { await col("tasks").doc(t.id).delete(); toast("Steget är borttaget"); openRoutine(r.id) } catch (e) { fail(e) }
    }));
  });
}
async function move(kind, id, dir) {
  const list = kind === "r" ? (() => { const r = routines.find(x => x.id === id); return routinesOf(r.owner).filter(x => x.category === r.category) })() : (() => { const t = tasks.find(x => x.id === id); return tasksOf(t.routineId) })();
  const i = list.findIndex(x => x.id === id), j = i + dir; if (j < 0 || j >= list.length) return;
  const reordered = [...list];[reordered[i], reordered[j]] = [reordered[j], reordered[i]];
  const c = kind === "r" ? "routines" : "tasks", arr = kind === "r" ? routines : tasks;
  const b = fs.batch();
  reordered.forEach((x, k) => { if (x.order !== k) { b.update(col(c).doc(x.id), { order: k }); const o = arr.find(y => y.id === x.id); if (o) o.order = k } });
  buzz(5);
  if (kind === "t") openRoutine(list[0].routineId); else render();
  b.commit().catch(fail);
}

function openSettings() {
  const link = `${location.origin}${location.pathname}#${KEY}`;
  openSheet(`${shead("Inställningar")}
    <div class="row" style="background:var(--surface2)"><span class="avatar ${me}">${me}</span><span class="mid"><b>${NAME[me]}</b><small>Inloggad på den här telefonen</small></span></div>
    <div class="field"><label>Länk till appen</label><p class="hint">Skicka den till ${NAME[OTHER[me]]} om hen behöver öppna appen på en ny telefon. Dela den inte med någon annan.</p>
      <button class="btn sec full tap" id="sCopy">Kopiera länken</button></div>
    <div class="field"><label>Installera som app</label><p class="hint"><b>iPhone:</b> öppna i Safari → Dela-knappen → Lägg till på hemskärmen.<br><b>Android:</b> Chrome-menyn ⋮ → Installera app.</p></div>
    <button class="btn sec full tap" id="sPin">Byt PIN-kod</button>
    <button class="btn danger full tap" id="sOut">Logga ut</button>`, el => {
    el.querySelector("#sCopy").onclick = async () => { try { await navigator.clipboard.writeText(link); toast("Länken är kopierad") } catch (e) { toast("Kunde inte kopiera. Håll in länken i adressfältet i stället.") } };
    el.querySelector("#sOut").onclick = () => { closeSheet(); ls.set("rut.me", null); me = null; loginWho = null; render() };
    el.querySelector("#sPin").onclick = async () => {
      try { await col("users").doc(me).delete(); const who = me; closeSheet(); ls.set("rut.me", null); me = null; loginWho = who; pinBuf = ""; pinFirst = null; render() } catch (e) { fail(e) }
    };
  });
}

/* ---------------- klick ---------------- */
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const a = b.dataset.act, v = b.dataset.v, id = b.dataset.id;
  switch (a) {
    case "tab": tab = v; ls.set("rut.tab", v); buzz(5); render(); window.scrollTo(0, 0); break;
    case "view": viewOwner = v; buzz(5); render(); break;
    case "list": listOwner = v; render(); break;
    case "check": { const it = findItem(id); if (it) toggleCheck(it); if (b.dataset.close) closeSheet(); break }
    case "detail": openDetail(id); break;
    case "routine": openRoutine(id); break;
    case "new-routine": editRoutine(null); break;
    case "edit-routine": editRoutine(id); break;
    case "new-task": editTask(null, id); break;
    case "edit-task": editTask(id); break;
    case "r-up": move("r", id, -1); break;
    case "r-down": move("r", id, 1); break;
    case "t-up": move("t", id, -1); break;
    case "t-down": move("t", id, 1); break;
    case "cal": calMonth = Math.min(0, calMonth + +v); render(); break;
    case "settings": openSettings(); break;
    case "close-sheet": closeSheet(); break;
    case "who": loginWho = v; pinBuf = ""; pinFirst = null; pinErr = ""; drawLogin(); break;
    case "who-back": loginWho = null; drawLogin(); break;
    case "pin": pinKey(v); break;
  }
});
document.addEventListener("keydown", e => { if (!me && loginWho && /^[0-9]$/.test(e.key)) pinKey(e.key); else if (!me && loginWho && e.key === "Backspace") pinKey("del") });

if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => { });
boot();
