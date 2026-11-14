// Inbyggt bildbibliotek: gradient + ikon, ritas som SVG (ingen nedladdning behövs)
const HEAD = '<circle cx="12" cy="7.5" r="3.5"/><path d="M10.5 11v3M13.5 11v3"/><path d="M4.5 21c.8-3.5 3.8-6 7.5-6s6.7 2.5 7.5 6"/>';
const LIB = {
  neckCurl:  { label: "Neck curls",      g: ["#5b6cff", "#9a5bff"], i: HEAD + '<path d="M17.5 4.5a6 6 0 0 1 1 5.5"/><path d="M19.6 8.6l-1.1 1.5-1.6-.9"/>' },
  neckExt:   { label: "Neck extensions", g: ["#7a5cff", "#d65bff"], i: HEAD + '<path d="M6.5 4.5a6 6 0 0 0-1 5.5"/><path d="M4.4 8.6l1.1 1.5 1.6-.9"/>' },
  neckSide:  { label: "Sidoböjningar",   g: ["#3f7cff", "#38c3ff"], i: HEAD + '<path d="M2.5 7.5h3M3.8 6.2 2.5 7.5l1.3 1.3M21.5 7.5h-3M20.2 6.2l1.3 1.3-1.3 1.3"/>' },
  shrug:     { label: "Shrugs",          g: ["#ff6a3d", "#ff3d81"], i: HEAD + '<path d="M6 13.5V10M4.6 11.4 6 10l1.4 1.4M18 13.5V10M16.6 11.4 18 10l1.4 1.4"/>' },
  dumbbell:  { label: "Styrka",          g: ["#ff8a3d", "#f5455c"], i: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>' },
  pulse:     { label: "Kondition",       g: ["#ff4d6d", "#c9184a"], i: '<path d="M3 12h4l2-5 4 10 2-5h6"/>' },
  stretch:   { label: "Stretch",         g: ["#14c9a0", "#0b8f8a"], i: '<circle cx="12" cy="4.5" r="2"/><path d="M12 7v6M5 9l7 2 7-2M8.5 21l3.5-8 3.5 8"/>' },
  mind:      { label: "Andning",         g: ["#2ec4b6", "#3a86ff"], i: '<circle cx="12" cy="5" r="2"/><path d="M12 8v5M7 13c2-1 3.2-1 5 0s3 1 5 0M4 19c3-1 5-3 8-3s5 2 8 3"/>' },
  sun:       { label: "Morgon",          g: ["#ffb341", "#ff6b3d"], i: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M2.5 12h2M19.5 12h2M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>' },
  moon:      { label: "Kväll",           g: ["#3a3f9e", "#7b4bd1"], i: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/><path d="M17 3.5v2M16 4.5h2"/>' },
  drop:      { label: "Återfuktning",    g: ["#36b5ff", "#3a6bff"], i: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/>' },
  bottle:    { label: "Serum",           g: ["#ff7eb3", "#ff4f8b"], i: '<rect x="8" y="9" width="8" height="12" rx="2"/><path d="M10 9V6.5h4V9M11 3.5h2v3h-2z"/>' },
  face:      { label: "Ansikte",         g: ["#f6a6c1", "#c86dd7"], i: '<circle cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01M8.5 15c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8"/>' },
  sparkle:   { label: "Rengöring",       g: ["#22d3ee", "#a855f7"], i: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>' },
  tooth:     { label: "Tänder",          g: ["#4fd1c5", "#319795"], i: '<path d="M7 3c-2.5 0-4 2-4 4.5 0 3 1.5 4.5 2 7 .5 3 1 6.5 2.5 6.5S9.5 17 12 17s3 4 4.5 4 1.5-3.5 2-6.5c.5-2.5 2-4 2-7C20.5 5 19 3 16.5 3c-2 0-2.5 1-4.5 1S9 3 7 3z"/>' },
  pill:      { label: "Vitaminer",       g: ["#84cc16", "#16a34a"], i: '<rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-45 12 12)"/><path d="M9.5 9.5l5 5"/>' },
  book:      { label: "Läsa",            g: ["#a78bfa", "#6d28d9"], i: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M19 19v2H6"/>' },
  bed:       { label: "Sömn",            g: ["#334155", "#6366f1"], i: '<path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.5"/>' },
  water:     { label: "Vatten",          g: ["#0ea5e9", "#2563eb"], i: '<path d="M6 3h12l-1.5 17a1.5 1.5 0 0 1-1.5 1.4H9a1.5 1.5 0 0 1-1.5-1.4z"/><path d="M6.6 10c1.8-1 3.6-1 5.4 0s3.6 1 5.4 0"/>' },
  home:      { label: "Hemma",           g: ["#f59e0b", "#d97706"], i: '<path d="M3.5 10.5 12 3.5l8.5 7V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19z"/><path d="M9.5 20.5v-6h5v6"/>' },
  check:     { label: "Övrigt",          g: ["#8b5cf6", "#ec4899"], i: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.8"/>' }
};
let _gid = 0;
function libSVG(key, opts = {}) {
  const it = LIB[key] || LIB.check, id = "g" + (++_gid);
  const big = opts.small ? "translate(58,26) scale(1.8)" : "translate(54,20) scale(2.2)";
  return `<svg class="libimg" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${it.g[0]}"/><stop offset="1" stop-color="${it.g[1]}"/></linearGradient></defs>
    <rect width="160" height="100" fill="url(#${id})"/>
    <circle cx="138" cy="12" r="34" fill="#fff" opacity=".09"/><circle cx="18" cy="96" r="40" fill="#000" opacity=".1"/>
    <g transform="${big}" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity=".95">${it.i}</g>
  </svg>`;
}
