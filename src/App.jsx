import { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, Cell, Legend,
} from "recharts";
import _ from "lodash";

/* ═══════════════════════════════════════════════════════════════════════════
   BANDED — Open-Source Compensation Intelligence
   
   Design direction: "Editorial Precision" — inspired by financial terminals 
   meets modern editorial design. Warm sand/cream light theme with ink-black
   type, precise geometric accents, and a signature teal signal color.
   Feels like Bloomberg Terminal redesigned by Monocle magazine.
   
   Typography: Instrument Serif (display) + Geist (body) + Geist Mono (data)
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── PALETTE (CSS-variable-ready) ────────────────────────────────────────────
const V = {
  bg:           "#FAFAF7",
  bgWarm:       "#F5F3EE",
  surface:      "#FFFFFF",
  surfaceMuted: "#F0EDE6",
  border:       "#E4E0D8",
  borderLight:  "#EBE8E1",
  ink:          "#1A1A18",
  inkSoft:      "#3D3D38",
  inkMuted:     "#7A7A70",
  inkFaint:     "#B0AEA4",
  teal:         "#0D9488",
  tealDark:     "#0F766E",
  tealLight:    "#CCFBF1",
  tealMuted:    "rgba(13,148,136,0.08)",
  rose:         "#E11D48",
  roseMuted:    "rgba(225,29,72,0.06)",
  amber:        "#D97706",
  amberMuted:   "rgba(217,119,6,0.08)",
  blue:         "#2563EB",
  blueMuted:    "rgba(37,99,235,0.06)",
  violet:       "#7C3AED",
  chartSet:     ["#0D9488", "#2563EB", "#D97706", "#E11D48", "#7C3AED"],
  focus:        "0 0 0 2px #FAFAF7, 0 0 0 4px #0D9488",
};

// ─── GLOBAL STYLES (injected once) ──────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; }

  :root {
    color-scheme: light;
    --font-display: 'Instrument Serif', Georgia, serif;
    --font-body: 'Geist', -apple-system, sans-serif;
    --font-mono: 'Geist Mono', 'SF Mono', monospace;
  }

  body {
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
    touch-action: manipulation;
  }

  /* Focus-visible ring (Vercel guideline: never outline-none without replacement) */
  :focus-visible {
    outline: none;
    box-shadow: ${V.focus};
    border-radius: 4px;
  }
  :focus:not(:focus-visible) { outline: none; }

  /* Tabular nums for data columns */
  .mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }

  /* Reduced motion (Vercel guideline: honor prefers-reduced-motion) */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${V.border}; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: ${V.inkFaint}; }

  /* Text balance on headings (Vercel guideline) */
  h1, h2, h3 { text-wrap: balance; }

  /* Staggered entrance animation */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-up {
    animation: fadeUp 0.4s ease-out both;
  }
  .fade-up-1 { animation-delay: 0ms; }
  .fade-up-2 { animation-delay: 60ms; }
  .fade-up-3 { animation-delay: 120ms; }
  .fade-up-4 { animation-delay: 180ms; }
  .fade-up-5 { animation-delay: 240ms; }
`;

// ─── DATA ENGINE ─────────────────────────────────────────────────────────────
const COMPANIES = [
  { name: "Stripe", size: "enterprise", industry: "Fintech" },
  { name: "Datadog", size: "enterprise", industry: "DevTools" },
  { name: "Snowflake", size: "enterprise", industry: "Data/Cloud" },
  { name: "Figma", size: "mid-market", industry: "Design" },
  { name: "Notion", size: "mid-market", industry: "Productivity" },
  { name: "Vercel", size: "mid-market", industry: "DevTools" },
  { name: "Linear", size: "smb", industry: "DevTools" },
  { name: "Retool", size: "mid-market", industry: "DevTools" },
  { name: "Coinbase", size: "enterprise", industry: "Fintech" },
  { name: "Plaid", size: "enterprise", industry: "Fintech" },
  { name: "HashiCorp", size: "enterprise", industry: "DevTools" },
  { name: "Cloudflare", size: "enterprise", industry: "Infrastructure" },
  { name: "Toast", size: "enterprise", industry: "Restaurant Tech" },
  { name: "Gusto", size: "mid-market", industry: "HR Tech" },
  { name: "Rippling", size: "enterprise", industry: "HR Tech" },
  { name: "Scale AI", size: "enterprise", industry: "AI/ML" },
  { name: "Anthropic", size: "enterprise", industry: "AI/ML" },
  { name: "OpenAI", size: "enterprise", industry: "AI/ML" },
  { name: "Databricks", size: "enterprise", industry: "Data/Cloud" },
  { name: "MongoDB", size: "enterprise", industry: "Data/Cloud" },
  { name: "Twilio", size: "enterprise", industry: "Communications" },
  { name: "HubSpot", size: "enterprise", industry: "Marketing Tech" },
  { name: "Atlassian", size: "enterprise", industry: "DevTools" },
  { name: "GitLab", size: "enterprise", industry: "DevTools" },
  { name: "Elastic", size: "enterprise", industry: "Search/Analytics" },
];

const JOB_FAMILIES = {
  "Software Engineering": {
    levels: ["Junior Engineer", "Engineer", "Senior Engineer", "Staff Engineer", "Principal Engineer", "Distinguished Engineer"],
    codes: ["IC1", "IC2", "IC3", "IC4", "IC5", "IC6"],
    base: [85000, 450000],
  },
  "Product Management": {
    levels: ["Associate PM", "Product Manager", "Senior PM", "Group PM", "Director of Product", "VP Product"],
    codes: ["IC1", "IC2", "IC3", "IC4", "M3", "M5"],
    base: [90000, 380000],
  },
  "Data Science": {
    levels: ["Junior Data Scientist", "Data Scientist", "Senior Data Scientist", "Staff Data Scientist", "Principal Data Scientist"],
    codes: ["IC1", "IC2", "IC3", "IC4", "IC5"],
    base: [80000, 350000],
  },
  "Design": {
    levels: ["Junior Designer", "Product Designer", "Senior Designer", "Staff Designer", "Design Director"],
    codes: ["IC1", "IC2", "IC3", "IC4", "M3"],
    base: [70000, 300000],
  },
  "DevOps / SRE": {
    levels: ["Junior SRE", "SRE", "Senior SRE", "Staff SRE", "Principal SRE"],
    codes: ["IC1", "IC2", "IC3", "IC4", "IC5"],
    base: [82000, 370000],
  },
  "People / HR": {
    levels: ["HR Coordinator", "HR Generalist", "HRBP", "Senior HRBP", "Director HR", "VP People"],
    codes: ["IC1", "IC2", "IC3", "IC4", "M3", "M5"],
    base: [55000, 280000],
  },
  "Marketing": {
    levels: ["Marketing Coordinator", "Marketing Manager", "Senior Marketing Manager", "Director Marketing", "VP Marketing"],
    codes: ["IC1", "IC2", "IC3", "M3", "M5"],
    base: [55000, 300000],
  },
  "Sales": {
    levels: ["SDR", "Account Executive", "Senior AE", "Enterprise AE", "Sales Director", "VP Sales"],
    codes: ["IC1", "IC2", "IC3", "IC4", "M3", "M5"],
    base: [50000, 320000],
  },
};

const METROS = [
  { name: "San Francisco", state: "CA", cola: 1.35, region: "West" },
  { name: "New York", state: "NY", cola: 1.28, region: "Northeast" },
  { name: "Seattle", state: "WA", cola: 1.22, region: "West" },
  { name: "Austin", state: "TX", cola: 1.05, region: "South" },
  { name: "Denver", state: "CO", cola: 1.08, region: "West" },
  { name: "Boston", state: "MA", cola: 1.20, region: "Northeast" },
  { name: "Chicago", state: "IL", cola: 1.02, region: "Midwest" },
  { name: "Los Angeles", state: "CA", cola: 1.25, region: "West" },
  { name: "Miami", state: "FL", cola: 1.0, region: "South" },
  { name: "Remote", state: "US", cola: 1.0, region: "National" },
  { name: "Portland", state: "OR", cola: 1.10, region: "West" },
  { name: "Atlanta", state: "GA", cola: 0.98, region: "South" },
  { name: "Raleigh", state: "NC", cola: 0.95, region: "South" },
];

const SKILLS_MAP = {
  "Software Engineering": ["Python", "Rust", "Go", "TypeScript", "React", "Kubernetes", "AWS", "Java", "C++", "GraphQL", "Terraform", "PostgreSQL", "Redis", "Kafka"],
  "Product Management": ["SQL", "A/B Testing", "Roadmapping", "OKRs", "User Research", "Agile", "Data Analysis"],
  "Data Science": ["Python", "SQL", "PyTorch", "TensorFlow", "MLOps", "Spark", "Statistical Modeling", "NLP", "Computer Vision"],
  "Design": ["Figma", "Prototyping", "Design Systems", "User Research", "Accessibility", "Motion Design", "CSS"],
  "DevOps / SRE": ["Kubernetes", "Terraform", "AWS", "GCP", "Docker", "Prometheus", "CI/CD", "Linux"],
  "People / HR": ["Workday", "UKG", "Compensation", "Benefits", "HRIS", "People Analytics"],
  "Marketing": ["SEO", "Content Strategy", "HubSpot", "Google Analytics", "Paid Media", "Brand Strategy"],
  "Sales": ["Salesforce", "Enterprise Sales", "SaaS", "Negotiation", "CRM", "Account Management"],
};

const WORK_MODELS = ["Remote", "Hybrid", "Onsite"];
const SOURCES = ["LinkedIn Jobs", "Indeed", "Greenhouse Board", "CO\u00a0Transparency", "CA\u00a0Transparency", "NY\u00a0Transparency", "WA\u00a0Transparency", "Levels.fyi", "Glassdoor", "BLS\u00a0OEWS", "H-1B\u00a0Disclosure", "SEC\u00a0Proxy"];

function sr(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

function buildDataset() {
  const r = sr(42);
  const out = [];
  let id = 0;
  for (const co of COMPANIES) {
    for (const [fam, cfg] of Object.entries(JOB_FAMILIES)) {
      const n = Math.floor(r() * 4) + 1;
      for (let p = 0; p < n; p++) {
        const li = Math.floor(r() * cfg.levels.length);
        const m = METROS[Math.floor(r() * METROS.length)];
        const pct = li / (cfg.levels.length - 1);
        const bMin = cfg.base[0] + (cfg.base[1] - cfg.base[0]) * pct * 0.7;
        const bMax = bMin * (1.15 + r() * 0.25);
        const sMin = Math.round(bMin * m.cola / 1000) * 1000;
        const sMax = Math.round(bMax * m.cola / 1000) * 1000;
        const mid = Math.round((sMin + sMax) / 2 / 1000) * 1000;
        const sk = SKILLS_MAP[fam] || [];
        const picked = [];
        for (let s = 0; s < Math.floor(r() * 4) + 2 && s < sk.length; s++) {
          const x = sk[Math.floor(r() * sk.length)];
          if (!picked.includes(x)) picked.push(x);
        }
        const dAgo = Math.floor(r() * 90);
        const dt = new Date(); dt.setDate(dt.getDate() - dAgo);
        out.push({ id: ++id, company: co.name, size: co.size, industry: co.industry, family: fam, title: cfg.levels[li], code: cfg.codes[li], level: li + 1, metro: m.name, state: m.state, region: m.region, sMin, sMax, mid, work: WORK_MODELS[Math.floor(r() * 3)], skills: picked, source: SOURCES[Math.floor(r() * SOURCES.length)], posted: dt.toISOString().split("T")[0], daysAgo: dAgo });
      }
    }
  }
  return out;
}

function buildSkillPremiums(data) {
  const sm = {};
  data.forEach(r => r.skills.forEach(s => {
    if (!sm[s]) sm[s] = { t: 0, n: 0 };
    sm[s].t += r.mid; sm[s].n++;
  }));
  const avg = data.reduce((a, r) => a + r.mid, 0) / data.length;
  return Object.entries(sm).map(([skill, d]) => ({
    skill, avgPay: Math.round(d.t / d.n), premium: Math.round(d.t / d.n - avg), postings: d.n, trend: Math.round((Math.random() - 0.38) * 16 * 10) / 10,
  })).sort((a, b) => b.premium - a.premium);
}

function buildTrends() {
  const months = ["Sep\u00a0'25", "Oct\u00a0'25", "Nov\u00a0'25", "Dec\u00a0'25", "Jan\u00a0'26", "Feb\u00a0'26"];
  return months.map((m, i) => ({
    month: m,
    "Software Engineering": 175000 + i * 2800 + Math.random() * 3000,
    "Product Management": 162000 + i * 2200 + Math.random() * 2500,
    "Data Science": 155000 + i * 2500 + Math.random() * 2000,
    "Design": 130000 + i * 1800 + Math.random() * 2000,
    "DevOps / SRE": 158000 + i * 2600 + Math.random() * 2500,
  }));
}

const pct = (arr, p) => { const s = [...arr].sort((a, b) => a - b); const i = (p / 100) * (s.length - 1); const l = Math.floor(i); return l === Math.ceil(i) ? s[l] : s[l] + (s[Math.ceil(i)] - s[l]) * (i - l); };
const fmt = n => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const fmtK = n => "$" + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(n / 1000)) + "K";
const fmtNum = n => new Intl.NumberFormat("en-US").format(n);

// ─── MICRO-COMPONENTS ────────────────────────────────────────────────────────

function Metric({ label, value, detail, accent = V.teal, delay = 0 }) {
  return (
    <div className={`fade-up fade-up-${delay + 1}`} style={{
      flex: "1 1 220px", minWidth: 200, padding: "22px 24px",
      background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 2, background: accent, opacity: 0.5 }} />
      <p style={{ fontSize: 11, fontWeight: 600, color: V.inkMuted, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: V.ink, marginTop: 6, fontFamily: "var(--font-display)", lineHeight: 1.1 }}>{value}</p>
      {detail && <p style={{ fontSize: 12, color: V.inkFaint, marginTop: 6 }}>{detail}</p>}
    </div>
  );
}

function Pill({ children, active, onClick }) {
  return (
    <button onClick={onClick} aria-pressed={active} style={{
      padding: "5px 13px", borderRadius: 6,
      border: `1px solid ${active ? V.teal : V.border}`,
      background: active ? V.tealMuted : "transparent",
      color: active ? V.tealDark : V.inkMuted,
      fontSize: 12, fontWeight: 500, cursor: "pointer",
      fontFamily: "var(--font-body)", whiteSpace: "nowrap",
      transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
    }}>{children}</button>
  );
}

function NavBtn({ children, active, onClick, icon }) {
  return (
    <button onClick={onClick} aria-current={active ? "page" : undefined} style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "9px 14px", borderRadius: 8, border: "none", width: "100%", textAlign: "left",
      background: active ? V.tealMuted : "transparent",
      color: active ? V.tealDark : V.inkSoft,
      fontSize: 13, fontWeight: active ? 600 : 450, cursor: "pointer",
      fontFamily: "var(--font-body)",
      transition: "background 0.15s ease, color 0.15s ease",
    }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = V.surfaceMuted; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ fontSize: 15, width: 22, textAlign: "center", opacity: active ? 1 : 0.6 }}>{icon}</span>
      {children}
    </button>
  );
}

function SourceTag({ source }) {
  const isTransparency = source.includes("Transparency");
  const isGov = source.includes("BLS") || source.includes("H-1B") || source.includes("SEC");
  const c = isTransparency ? V.teal : isGov ? V.amber : V.blue;
  return (
    <span style={{ padding: "2px 7px", borderRadius: 4, background: `${c}12`, color: c, fontSize: 10, fontWeight: 600, fontFamily: "var(--font-mono)", letterSpacing: "0.02em" }}>
      {source}
    </span>
  );
}

function SortableTable({ data, columns, maxRows = 50 }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("desc");

  const sorted = useMemo(() => {
    if (!sortKey) return data.slice(0, maxRows);
    return [...data].sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      if (typeof va === "number") return sortDir === "asc" ? va - vb : vb - va;
      return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    }).slice(0, maxRows);
  }, [data, sortKey, sortDir, maxRows]);

  const toggle = (k) => {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  };

  return (
    <div style={{ overflowX: "auto", borderRadius: 8, border: `1px solid ${V.border}` }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "var(--font-body)" }} role="grid">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} role="columnheader" aria-sort={sortKey === col.key ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                <button onClick={() => toggle(col.key)} aria-label={`Sort by ${col.label}`} style={{
                  display: "flex", alignItems: "center", gap: 4, width: "100%", justifyContent: col.align === "right" ? "flex-end" : "flex-start",
                  padding: "11px 14px", background: V.bgWarm, color: V.inkMuted, border: "none", borderBottom: `1px solid ${V.border}`,
                  fontWeight: 600, fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", cursor: "pointer",
                  fontFamily: "var(--font-mono)", whiteSpace: "nowrap",
                }}>
                  {col.label}
                  {sortKey === col.key && <span style={{ fontSize: 10 }}>{sortDir === "asc" ? " ↑" : " ↓"}</span>}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={row.id ?? i}
              style={{ borderBottom: `1px solid ${V.borderLight}`, transition: "background 0.1s ease" }}
              onMouseEnter={e => e.currentTarget.style.background = V.bgWarm}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {columns.map(col => (
                <td key={col.key} style={{ padding: "10px 14px", color: V.inkSoft, textAlign: col.align || "left", whiteSpace: "nowrap", fontVariantNumeric: typeof row[col.key] === "number" ? "tabular-nums" : undefined }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > maxRows && (
        <p style={{ padding: 12, textAlign: "center", color: V.inkFaint, fontSize: 12, background: V.bgWarm, margin: 0, borderTop: `1px solid ${V.borderLight}` }}>
          Showing {fmtNum(maxRows)} of {fmtNum(data.length)} records
        </p>
      )}
    </div>
  );
}

function BandBar({ min, max, p25, p50, p75, gMin, gMax }) {
  const s = v => ((v - gMin) / (gMax - gMin)) * 100;
  return (
    <div style={{ position: "relative", height: 24, background: V.surfaceMuted, borderRadius: 4 }} role="img" aria-label={`Range ${fmtK(min)} to ${fmtK(max)}, median ${fmtK(p50)}`}>
      <div style={{ position: "absolute", left: `${s(min)}%`, width: `${s(max) - s(min)}%`, top: 4, height: 16, background: V.tealMuted, borderRadius: 3, border: `1px solid ${V.teal}30` }} />
      <div style={{ position: "absolute", left: `${s(p25)}%`, top: 3, width: 2, height: 18, background: V.blue, borderRadius: 1 }} />
      <div style={{ position: "absolute", left: `${s(p50)}%`, top: 1, width: 3, height: 22, background: V.teal, borderRadius: 1 }} />
      <div style={{ position: "absolute", left: `${s(p75)}%`, top: 3, width: 2, height: 18, background: V.amber, borderRadius: 1 }} />
    </div>
  );
}

const chartTooltipStyle = { background: V.surface, border: `1px solid ${V.border}`, borderRadius: 8, fontSize: 12, fontFamily: "var(--font-body)", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" };

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function Banded() {
  const [tab, setTab] = useState("dashboard");
  const [data] = useState(buildDataset);
  const [skills] = useState(() => buildSkillPremiums(buildDataset()));
  const [trends] = useState(buildTrends);

  const [famF, setFamF] = useState("All");
  const [metF, setMetF] = useState("All");
  const [sizeF, setSizeF] = useState("All");
  const [lvlF, setLvlF] = useState("All");
  const [q, setQ] = useState("");

  const [bandFam, setBandFam] = useState("Software Engineering");
  const [bandMet, setBandMet] = useState("All");

  const filtered = useMemo(() => data.filter(r => {
    if (famF !== "All" && r.family !== famF) return false;
    if (metF !== "All" && r.metro !== metF) return false;
    if (sizeF !== "All" && r.size !== sizeF) return false;
    if (lvlF !== "All" && r.code !== lvlF) return false;
    if (q) { const lq = q.toLowerCase(); return r.company.toLowerCase().includes(lq) || r.title.toLowerCase().includes(lq) || r.skills.some(s => s.toLowerCase().includes(lq)); }
    return true;
  }), [data, famF, metF, sizeF, lvlF, q]);

  const stats = useMemo(() => {
    if (!filtered.length) return { med: 0, p25: 0, p75: 0, p90: 0, n: 0, cos: 0 };
    const m = filtered.map(r => r.mid);
    return { med: pct(m, 50), p25: pct(m, 25), p75: pct(m, 75), p90: pct(m, 90), n: filtered.length, cos: new Set(filtered.map(r => r.company)).size };
  }, [filtered]);

  const geoData = useMemo(() => {
    const bm = {};
    filtered.forEach(r => {
      if (!bm[r.metro]) bm[r.metro] = { mids: [], n: 0, state: r.state, region: r.region };
      bm[r.metro].mids.push(r.mid); bm[r.metro].n++;
    });
    return Object.entries(bm).map(([metro, d]) => ({
      metro, state: d.state, region: d.region, median: Math.round(pct(d.mids, 50)), p25: Math.round(pct(d.mids, 25)), p75: Math.round(pct(d.mids, 75)), postings: d.n,
    })).sort((a, b) => b.median - a.median);
  }, [filtered]);

  const bandRows = useMemo(() => {
    const cfg = JOB_FAMILIES[bandFam]; if (!cfg) return [];
    return cfg.levels.map((lv, i) => {
      const mx = data.filter(r => r.family === bandFam && r.title === lv && (bandMet === "All" || r.metro === bandMet));
      if (!mx.length) {
        const bM = cfg.base[0] + (cfg.base[1] - cfg.base[0]) * (i / (cfg.levels.length - 1)) * 0.7;
        const m = bM * 1.1;
        return { level: lv, code: cfg.codes[i], p25: Math.round(m * .88), p50: Math.round(m), p75: Math.round(m * 1.15), p90: Math.round(m * 1.3), min: Math.round(m * .82), max: Math.round(m * 1.35), n: 0 };
      }
      const ms = mx.map(r => r.mid);
      return { level: lv, code: cfg.codes[i], p25: Math.round(pct(ms, 25)), p50: Math.round(pct(ms, 50)), p75: Math.round(pct(ms, 75)), p90: Math.round(pct(ms, 90)), min: Math.round(pct(ms, 10)), max: Math.round(pct(ms, 90)), n: mx.length };
    });
  }, [data, bandFam, bandMet]);

  const scrapers = [
    { source: "LinkedIn Jobs", status: "active", last: "2h\u00a0ago", records: "12,847", hp: 98 },
    { source: "Indeed", status: "active", last: "4h\u00a0ago", records: "8,432", hp: 95 },
    { source: "Greenhouse Boards", status: "active", last: "6h\u00a0ago", records: "5,219", hp: 99 },
    { source: "CO Transparency", status: "active", last: "1d\u00a0ago", records: "3,891", hp: 100 },
    { source: "CA Transparency", status: "active", last: "1d\u00a0ago", records: "6,742", hp: 100 },
    { source: "NY Transparency", status: "active", last: "1d\u00a0ago", records: "4,123", hp: 100 },
    { source: "WA Transparency", status: "active", last: "1d\u00a0ago", records: "2,847", hp: 100 },
    { source: "Levels.fyi", status: "active", last: "12h\u00a0ago", records: "15,621", hp: 92 },
    { source: "BLS OEWS", status: "scheduled", last: "7d\u00a0ago", records: "872,000", hp: 100 },
    { source: "H-1B Disclosure", status: "scheduled", last: "30d\u00a0ago", records: "645,000", hp: 100 },
    { source: "SEC Proxy Filings", status: "active", last: "3d\u00a0ago", records: "2,841", hp: 97 },
    { source: "Glassdoor", status: "paused", last: "14d\u00a0ago", records: "28,412", hp: 45 },
  ];

  const alertItems = [
    { id: 1, kind: "up", text: "Senior Engineer median in SF increased 8.2% (90\u00a0days)" },
    { id: 2, kind: "up", text: "Staff Data Scientist roles in NYC up 12% (90\u00a0days)" },
    { id: 3, kind: "skill", text: "Rust skill premium grew +$4.2K this quarter" },
    { id: 4, kind: "down", text: "Junior Designer postings in Austin down 15% (90\u00a0days)" },
    { id: 5, kind: "skill", text: "Kubernetes premium now +$21K over baseline" },
  ];

  const pages = [
    { key: "dashboard", label: "Dashboard", icon: "◉" },
    { key: "explore", label: "Explore", icon: "⬡" },
    { key: "skills", label: "Skills Intel", icon: "◈" },
    { key: "bands", label: "Band Builder", icon: "▤" },
    { key: "trends", label: "Trends", icon: "◆" },
    { key: "scrapers", label: "Scrapers", icon: "⟐" },
    { key: "alerts", label: "Alerts", icon: "◎" },
  ];

  // ─── FILTER BAR ───────────────────────────────────────────────────────────
  const Filters = () => (
    <div className="fade-up fade-up-1" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <label htmlFor="banded-search" className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>Search</label>
        <input id="banded-search" value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search company, title, skill…" autoComplete="off" spellCheck={false}
          style={{ padding: "7px 14px", borderRadius: 7, border: `1px solid ${V.border}`, background: V.surface, color: V.ink, fontSize: 13, width: 260, fontFamily: "var(--font-body)", transition: "border-color 0.15s ease" }}
          onFocus={e => e.target.style.borderColor = V.teal}
          onBlur={e => e.target.style.borderColor = V.border}
        />
        <span style={{ width: 1, height: 20, background: V.border }} aria-hidden="true" />
        <span style={{ fontSize: 10, color: V.inkFaint, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Family</span>
        <Pill active={famF === "All"} onClick={() => setFamF("All")}>All</Pill>
        {Object.keys(JOB_FAMILIES).map(f => <Pill key={f} active={famF === f} onClick={() => setFamF(f)}>{f}</Pill>)}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, color: V.inkFaint, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-mono)", minWidth: 44 }}>Metro</span>
        <Pill active={metF === "All"} onClick={() => setMetF("All")}>All</Pill>
        {["San Francisco", "New York", "Seattle", "Denver", "Austin", "Boston", "Remote"].map(m => <Pill key={m} active={metF === m} onClick={() => setMetF(m)}>{m}</Pill>)}
        <span style={{ width: 1, height: 20, background: V.border }} aria-hidden="true" />
        <span style={{ fontSize: 10, color: V.inkFaint, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Size</span>
        <Pill active={sizeF === "All"} onClick={() => setSizeF("All")}>All</Pill>
        {["smb", "mid-market", "enterprise"].map(s => <Pill key={s} active={sizeF === s} onClick={() => setSizeF(s)}>{s.charAt(0).toUpperCase() + s.slice(1)}</Pill>)}
        <span style={{ width: 1, height: 20, background: V.border }} aria-hidden="true" />
        <span style={{ fontSize: 10, color: V.inkFaint, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Level</span>
        <Pill active={lvlF === "All"} onClick={() => setLvlF("All")}>All</Pill>
        {["IC1", "IC2", "IC3", "IC4", "IC5"].map(l => <Pill key={l} active={lvlF === l} onClick={() => setLvlF(l)}>{l}</Pill>)}
      </div>
    </div>
  );

  // ─── PAGES ────────────────────────────────────────────────────────────────

  const Dashboard = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Filters />
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <Metric label="Median Total Comp" value={fmtK(stats.med)} detail={`P25:\u00a0${fmtK(stats.p25)}\u2002·\u2002P75:\u00a0${fmtK(stats.p75)}`} delay={0} />
        <Metric label="Data Points" value={fmtNum(stats.n)} detail={`${fmtNum(stats.cos)} companies represented`} accent={V.blue} delay={1} />
        <Metric label="90th Percentile" value={fmtK(stats.p90)} detail="Top-of-market benchmark" accent={V.amber} delay={2} />
        <Metric label="Active Sources" value="12" detail="11\u00a0active\u2002·\u20021\u00a0paused" accent={V.violet} delay={3} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <section className="fade-up fade-up-4" style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 22 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: V.ink }}>Compensation Trends by Family</h3>
          <p style={{ fontSize: 11, color: V.inkFaint, marginTop: 2, marginBottom: 16 }}>Median midpoint, trailing 6\u00a0months</p>
          <ResponsiveContainer width="100%" height={270}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke={V.borderLight} />
              <XAxis dataKey="month" tick={{ fill: V.inkFaint, fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={{ stroke: V.border }} />
              <YAxis tick={{ fill: V.inkFaint, fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={{ stroke: V.border }} tickFormatter={v => fmtK(v)} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={v => fmt(v)} />
              {["Software Engineering", "Product Management", "Data Science", "Design", "DevOps / SRE"].map((f, i) => (
                <Line key={f} type="monotone" dataKey={f} stroke={V.chartSet[i]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </section>
        <section className="fade-up fade-up-5" style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 22 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: V.ink }}>Pay by Metro</h3>
          <p style={{ fontSize: 11, color: V.inkFaint, marginTop: 2, marginBottom: 16 }}>Median total comp, filtered view</p>
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={geoData.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={V.borderLight} />
              <XAxis type="number" tick={{ fill: V.inkFaint, fontSize: 11, fontFamily: "var(--font-mono)" }} tickFormatter={v => fmtK(v)} axisLine={{ stroke: V.border }} />
              <YAxis type="category" dataKey="metro" tick={{ fill: V.inkMuted, fontSize: 11 }} width={100} axisLine={{ stroke: V.border }} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={v => fmt(v)} />
              <Bar dataKey="median" fill={V.teal} radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>
      <section className="fade-up fade-up-4" style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 22 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: V.ink }}>Top Skill Premiums</h3>
        <p style={{ fontSize: 11, color: V.inkFaint, marginTop: 2, marginBottom: 16 }}>Pay delta vs.\u00a0overall median</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={skills.slice(0, 15)}>
            <CartesianGrid strokeDasharray="3 3" stroke={V.borderLight} />
            <XAxis dataKey="skill" tick={{ fill: V.inkFaint, fontSize: 10, angle: -30 }} height={55} axisLine={{ stroke: V.border }} />
            <YAxis tick={{ fill: V.inkFaint, fontSize: 11, fontFamily: "var(--font-mono)" }} tickFormatter={v => (v >= 0 ? "+" : "") + fmtK(v)} axisLine={{ stroke: V.border }} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={v => (v >= 0 ? "+" : "") + fmt(v)} />
            <Bar dataKey="premium" radius={[3, 3, 0, 0]} barSize={22}>
              {skills.slice(0, 15).map((e, i) => <Cell key={i} fill={e.premium >= 0 ? V.teal : V.rose} fillOpacity={0.75} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  );

  const Explore = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Filters />
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <p style={{ fontSize: 13, color: V.inkMuted, margin: 0 }}><strong style={{ color: V.teal, fontVariantNumeric: "tabular-nums" }}>{fmtNum(filtered.length)}</strong> records</p>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button aria-label="Export as CSV" style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${V.border}`, background: V.surface, color: V.inkMuted, fontSize: 12, cursor: "pointer", fontFamily: "var(--font-mono)" }}>↓\u00a0CSV</button>
          <button aria-label="Export as Excel" style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${V.teal}`, background: V.tealMuted, color: V.tealDark, fontSize: 12, cursor: "pointer", fontFamily: "var(--font-mono)", fontWeight: 600 }}>↓\u00a0XLSX</button>
        </div>
      </div>
      <SortableTable data={filtered} maxRows={80} columns={[
        { key: "company", label: "Company", render: (v, r) => <span><strong style={{ color: V.ink }}>{v}</strong> <span style={{ color: V.inkFaint, fontSize: 10 }}>({r.size})</span></span> },
        { key: "title", label: "Title" },
        { key: "code", label: "Level", align: "center", render: v => <span className="mono" style={{ fontSize: 11, color: V.blue, fontWeight: 600 }}>{v}</span> },
        { key: "family", label: "Family" },
        { key: "metro", label: "Metro" },
        { key: "sMin", label: "Min", align: "right", render: v => <span className="mono">{fmt(v)}</span> },
        { key: "sMax", label: "Max", align: "right", render: v => <span className="mono">{fmt(v)}</span> },
        { key: "mid", label: "Midpoint", align: "right", render: v => <span className="mono" style={{ color: V.tealDark, fontWeight: 600 }}>{fmt(v)}</span> },
        { key: "work", label: "Model" },
        { key: "source", label: "Source", render: v => <SourceTag source={v} /> },
        { key: "posted", label: "Posted", render: v => <span style={{ color: V.inkFaint, fontSize: 11 }}>{v}</span> },
      ]} />
    </div>
  );

  const Skills = () => {
    const gainers = skills.filter(s => s.trend > 0).sort((a, b) => b.trend - a.trend).slice(0, 8);
    const losers = skills.filter(s => s.trend < 0).sort((a, b) => a.trend - b.trend).slice(0, 6);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Metric label="Highest Premium" value={skills[0]?.skill} detail={`+${fmtK(skills[0]?.premium)} over baseline`} />
          <Metric label="Fastest Growing" value={gainers[0]?.skill} detail={`+${gainers[0]?.trend}% QoQ`} accent={V.blue} delay={1} />
          <Metric label="Skills Tracked" value={String(skills.length)} detail="Across all job families" accent={V.violet} delay={2} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
          <section style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 22 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: V.ink, marginBottom: 16 }}>Skill Premium Breakdown</h3>
            <SortableTable data={skills} maxRows={30} columns={[
              { key: "skill", label: "Skill", render: v => <strong style={{ color: V.ink }}>{v}</strong> },
              { key: "premium", label: "Premium", align: "right", render: v => <span className="mono" style={{ color: v >= 0 ? V.tealDark : V.rose, fontWeight: 600 }}>{v >= 0 ? "+" : ""}{fmtK(v)}</span> },
              { key: "avgPay", label: "Avg\u00a0Pay", align: "right", render: v => <span className="mono">{fmtK(v)}</span> },
              { key: "postings", label: "Posts", align: "right" },
              { key: "trend", label: "QoQ", align: "right", render: v => <span style={{ color: v >= 0 ? V.tealDark : V.rose, fontWeight: 600 }}>{v >= 0 ? "↑" : "↓"}\u00a0{Math.abs(v)}%</span> },
            ]} />
          </section>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <section style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: V.tealDark, marginBottom: 12 }}>↑ Rising Premiums</h3>
              {gainers.map(s => (
                <div key={s.skill} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${V.borderLight}` }}>
                  <span style={{ color: V.ink, fontSize: 13 }}>{s.skill}</span>
                  <span className="mono" style={{ color: V.tealDark, fontSize: 12 }}>+{s.trend}%</span>
                </div>
              ))}
            </section>
            <section style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: V.rose, marginBottom: 12 }}>↓ Declining Premiums</h3>
              {losers.map(s => (
                <div key={s.skill} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${V.borderLight}` }}>
                  <span style={{ color: V.ink, fontSize: 13 }}>{s.skill}</span>
                  <span className="mono" style={{ color: V.rose, fontSize: 12 }}>{s.trend}%</span>
                </div>
              ))}
            </section>
          </div>
        </div>
      </div>
    );
  };

  const Bands = () => {
    const gMin = Math.min(...bandRows.map(d => d.min));
    const gMax = Math.max(...bandRows.map(d => d.max));
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <section style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 400, color: V.ink, fontFamily: "var(--font-display)" }}>Salary Band Builder</h2>
          <p style={{ fontSize: 13, color: V.inkMuted, marginTop: 4, marginBottom: 22, maxWidth: 640 }}>
            Auto-generate market-based salary bands from aggregated posting data. Select a job family and geography to build your comp structure.
          </p>
          <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
            <div>
              <label htmlFor="band-fam" style={{ display: "block", fontSize: 10, color: V.inkFaint, marginBottom: 5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Job Family</label>
              <select id="band-fam" value={bandFam} onChange={e => setBandFam(e.target.value)} style={{ padding: "8px 12px", borderRadius: 7, border: `1px solid ${V.border}`, background: V.surface, color: V.ink, fontSize: 13, minWidth: 220, fontFamily: "var(--font-body)" }}>
                {Object.keys(JOB_FAMILIES).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="band-geo" style={{ display: "block", fontSize: 10, color: V.inkFaint, marginBottom: 5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Geography</label>
              <select id="band-geo" value={bandMet} onChange={e => setBandMet(e.target.value)} style={{ padding: "8px 12px", borderRadius: 7, border: `1px solid ${V.border}`, background: V.surface, color: V.ink, fontSize: 13, minWidth: 220, fontFamily: "var(--font-body)" }}>
                <option value="All">All Markets (National)</option>
                {METROS.map(m => <option key={m.name} value={m.name}>{m.name}, {m.state}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 14, display: "flex", gap: 20, fontSize: 11, color: V.inkFaint }}>
            <span><span style={{ display: "inline-block", width: 12, height: 2, background: V.blue, marginRight: 6, verticalAlign: "middle" }} aria-hidden="true" />P25</span>
            <span><span style={{ display: "inline-block", width: 12, height: 3, background: V.teal, marginRight: 6, verticalAlign: "middle" }} aria-hidden="true" />P50</span>
            <span><span style={{ display: "inline-block", width: 12, height: 2, background: V.amber, marginRight: 6, verticalAlign: "middle" }} aria-hidden="true" />P75</span>
          </div>
          {bandRows.map((b, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "170px 60px 1fr 80px 80px 80px 80px 50px", gap: 10, alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${V.borderLight}` }}>
              <span style={{ color: V.ink, fontWeight: 600, fontSize: 13 }}>{b.level}</span>
              <span className="mono" style={{ fontSize: 11, color: V.blue }}>{b.code}</span>
              <BandBar min={b.min} max={b.max} p25={b.p25} p50={b.p50} p75={b.p75} gMin={gMin} gMax={gMax} />
              <span className="mono" style={{ fontSize: 12, color: V.inkMuted, textAlign: "right" }}>{fmtK(b.p25)}</span>
              <span className="mono" style={{ fontSize: 12, color: V.tealDark, textAlign: "right", fontWeight: 600 }}>{fmtK(b.p50)}</span>
              <span className="mono" style={{ fontSize: 12, color: V.inkMuted, textAlign: "right" }}>{fmtK(b.p75)}</span>
              <span className="mono" style={{ fontSize: 12, color: V.amber, textAlign: "right" }}>{fmtK(b.p90)}</span>
              <span style={{ fontSize: 10, color: V.inkFaint, textAlign: "right" }}>n={b.n}</span>
            </div>
          ))}
          <div style={{ marginTop: 22, display: "flex", gap: 10 }}>
            <button style={{ padding: "10px 22px", borderRadius: 7, border: "none", background: V.teal, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", transition: "opacity 0.15s ease" }} onMouseEnter={e => e.currentTarget.style.opacity = "0.85"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              ↓\u00a0Export Bands
            </button>
          </div>
        </section>
        <section style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 22 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: V.ink, marginBottom: 16 }}>Band Visualization\u2002—\u2002{bandFam}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={bandRows} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke={V.borderLight} />
              <XAxis dataKey="code" tick={{ fill: V.inkFaint, fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={{ stroke: V.border }} />
              <YAxis tick={{ fill: V.inkFaint, fontSize: 11, fontFamily: "var(--font-mono)" }} tickFormatter={v => fmtK(v)} axisLine={{ stroke: V.border }} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={v => fmt(v)} />
              <Bar dataKey="p25" fill={V.blue} fillOpacity={0.35} name="P25" radius={[0, 0, 0, 0]} />
              <Bar dataKey="p50" fill={V.teal} fillOpacity={0.55} name="P50" />
              <Bar dataKey="p75" fill={V.amber} fillOpacity={0.35} name="P75" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>
    );
  };

  const Trends = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <Metric label="Avg Market Movement" value="+4.7%" detail="All tracked families (90\u00a0days)" />
        <Metric label="Hottest Vertical" value="AI/ML" detail="+11.3% median increase (90\u00a0days)" accent={V.amber} delay={1} />
        <Metric label="Total Records" value="1.58M" detail="Across all ingested sources" accent={V.blue} delay={2} />
      </div>
      <section className="fade-up fade-up-3" style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 22 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: V.ink }}>Trend Lines</h3>
        <p style={{ fontSize: 11, color: V.inkFaint, marginTop: 2, marginBottom: 16 }}>Median total comp by family, trailing 6\u00a0months</p>
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart data={trends}>
            <defs>
              {V.chartSet.map((c, i) => (
                <linearGradient key={i} id={`tg${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={c} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={c} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={V.borderLight} />
            <XAxis dataKey="month" tick={{ fill: V.inkFaint, fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={{ stroke: V.border }} />
            <YAxis tick={{ fill: V.inkFaint, fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={{ stroke: V.border }} tickFormatter={v => fmtK(v)} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={v => fmt(v)} />
            <Legend />
            {["Software Engineering", "Product Management", "Data Science", "Design", "DevOps / SRE"].map((f, i) => (
              <Area key={f} type="monotone" dataKey={f} stroke={V.chartSet[i]} fill={`url(#tg${i})`} strokeWidth={2} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </section>
      <section className="fade-up fade-up-4" style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 22 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: V.ink, marginBottom: 16 }}>Geographic Pay Distribution</h3>
        <SortableTable data={geoData} maxRows={15} columns={[
          { key: "metro", label: "Metro", render: (v, r) => <span><strong style={{ color: V.ink }}>{v}</strong> <span style={{ color: V.inkFaint, fontSize: 10 }}>{r.state}</span></span> },
          { key: "region", label: "Region" },
          { key: "p25", label: "P25", align: "right", render: v => <span className="mono">{fmtK(v)}</span> },
          { key: "median", label: "Median", align: "right", render: v => <span className="mono" style={{ color: V.tealDark, fontWeight: 600 }}>{fmtK(v)}</span> },
          { key: "p75", label: "P75", align: "right", render: v => <span className="mono">{fmtK(v)}</span> },
          { key: "postings", label: "Postings", align: "right" },
        ]} />
      </section>
    </div>
  );

  const Scrapers = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <Metric label="Active Pipelines" value="11" detail="1\u00a0paused (Glassdoor rate-limited)" />
        <Metric label="Total Records" value="1.58M" detail="All ingested sources" accent={V.blue} delay={1} />
        <Metric label="Avg Refresh" value="6.2h" detail="Weighted by source priority" accent={V.amber} delay={2} />
        <Metric label="System Health" value="96%" detail="All systems nominal" accent={V.teal} delay={3} />
      </div>
      <section style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 22 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: V.ink, marginBottom: 16 }}>Pipeline Status</h3>
        <SortableTable data={scrapers} columns={[
          { key: "source", label: "Source", render: v => <strong style={{ color: V.ink }}>{v}</strong> },
          { key: "status", label: "Status", render: v => {
            const c = { active: V.teal, scheduled: V.amber, paused: V.rose }[v];
            return <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: c }} aria-hidden="true" />
              <span style={{ color: c, fontWeight: 600, fontSize: 11, fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>{v}</span>
            </span>;
          }},
          { key: "last", label: "Last Run" },
          { key: "records", label: "Records", align: "right", render: v => <span className="mono">{v}</span> },
          { key: "hp", label: "Health", align: "right", render: v => {
            const c = v >= 90 ? V.teal : v >= 70 ? V.amber : V.rose;
            return <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
              <div style={{ width: 56, height: 5, background: V.surfaceMuted, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${v}%`, height: "100%", background: c, borderRadius: 3, transition: "width 0.3s ease" }} />
              </div>
              <span className="mono" style={{ fontSize: 11, color: c, fontWeight: 600 }}>{v}%</span>
            </div>;
          }},
        ]} />
      </section>
      <section style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 22 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: V.ink, marginBottom: 14 }}>Architecture</h3>
        <pre style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: V.inkMuted, lineHeight: 1.9, background: V.bgWarm, padding: 20, borderRadius: 8, border: `1px solid ${V.borderLight}`, overflowX: "auto", margin: 0 }}>
{`┌─────────────┐    ┌──────────────┐    ┌───────────────┐
│  Scheduler   │───▶│  Scraper      │───▶│  Redis Queue  │
│  (Airflow)   │    │  Workers (8)  │    │  (Job Buffer) │
└─────────────┘    └──────────────┘    └───────┬───────┘
                                               │
                   ┌──────────────┐    ┌───────▼───────┐
                   │  NLP Engine   │◀──│  Normalizer   │
                   │  (Embeddings) │    │  (Title Map)  │
                   └──────┬───────┘    └───────────────┘
                          │
       ┌──────────────────▼──────────────────┐
       │         PostgreSQL + Elastic         │
       │     (Structured + Search Index)      │
       └──────────────────┬──────────────────┘
                          │
       ┌──────────────────▼──────────────────┐
       │          FastAPI Backend              │
       │    (REST + GraphQL + WebSockets)      │
       └──────────────────┬──────────────────┘
                          │
       ┌──────────────────▼──────────────────┐
       │     React + Tailwind Dashboard       │
       │  (Charts · Filters · Band Builder)   │
       └─────────────────────────────────────┘`}
        </pre>
      </section>
    </div>
  );

  const Alerts = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <section style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 400, color: V.ink, fontFamily: "var(--font-display)" }}>Alerts</h2>
        <p style={{ fontSize: 13, color: V.inkMuted, marginTop: 4, marginBottom: 22 }}>
          Track market movements. Get notified when compensation shifts in the roles, geographies, or skill clusters you monitor.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {alertItems.map(a => {
            const c = a.kind === "up" ? V.teal : a.kind === "down" ? V.rose : V.blue;
            const bg = a.kind === "up" ? V.tealMuted : a.kind === "down" ? V.roseMuted : V.blueMuted;
            return (
              <article key={a.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", borderRadius: 8, border: `1px solid ${V.borderLight}`, background: bg }}>
                <div style={{ width: 34, height: 34, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, background: `${c}18`, color: c, flexShrink: 0 }} aria-hidden="true">
                  {a.kind === "up" ? "↑" : a.kind === "down" ? "↓" : "◈"}
                </div>
                <p style={{ flex: 1, color: V.ink, fontSize: 14, margin: 0 }}>{a.text}</p>
                <span style={{ fontSize: 11, color: V.inkFaint, whiteSpace: "nowrap" }}>2h\u00a0ago</span>
              </article>
            );
          })}
        </div>
      </section>

      <section style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: V.ink, marginBottom: 16 }}>Create Alert</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
          <div>
            <label htmlFor="alert-type" style={{ display: "block", fontSize: 10, color: V.inkFaint, marginBottom: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-mono)" }}>Type</label>
            <select id="alert-type" style={{ width: "100%", padding: "8px 12px", borderRadius: 7, border: `1px solid ${V.border}`, background: V.surface, color: V.ink, fontSize: 13, fontFamily: "var(--font-body)" }}>
              <option>Pay Movement (+/- %)</option>
              <option>Skill Premium Change</option>
              <option>New Postings Volume</option>
            </select>
          </div>
          <div>
            <label htmlFor="alert-fam" style={{ display: "block", fontSize: 10, color: V.inkFaint, marginBottom: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-mono)" }}>Job Family</label>
            <select id="alert-fam" style={{ width: "100%", padding: "8px 12px", borderRadius: 7, border: `1px solid ${V.border}`, background: V.surface, color: V.ink, fontSize: 13, fontFamily: "var(--font-body)" }}>
              <option value="">All Families</option>
              {Object.keys(JOB_FAMILIES).map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="alert-geo" style={{ display: "block", fontSize: 10, color: V.inkFaint, marginBottom: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-mono)" }}>Geography</label>
            <select id="alert-geo" style={{ width: "100%", padding: "8px 12px", borderRadius: 7, border: `1px solid ${V.border}`, background: V.surface, color: V.ink, fontSize: 13, fontFamily: "var(--font-body)" }}>
              <option value="">All Markets</option>
              {METROS.map(m => <option key={m.name}>{m.name}</option>)}
            </select>
          </div>
          <button style={{ padding: "8px 20px", borderRadius: 7, border: "none", background: V.teal, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", height: 38, fontFamily: "var(--font-body)", transition: "opacity 0.15s ease" }} onMouseEnter={e => e.currentTarget.style.opacity = "0.85"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            + Add
          </button>
        </div>
      </section>

      <section style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: V.ink, marginBottom: 14 }}>Access Tiers</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          {[
            { tier: "Free", price: "$0", color: V.inkMuted, features: ["25\u00a0searches/month", "Public data only", "Basic filters", "Community support"] },
            { tier: "Pro", price: "$49/mo", color: V.teal, features: ["Unlimited searches", "Full dashboard", "Band builder", "CSV/XLSX export", "5\u00a0active alerts", "Email support"] },
            { tier: "Enterprise", price: "Custom", color: V.violet, features: ["Everything in Pro", "API access", "Custom taxonomies", "Team seats", "White-label option", "HRIS integrations", "Dedicated CSM"] },
          ].map(t => (
            <div key={t.tier} style={{ padding: 20, borderRadius: 8, border: `1px solid ${t.color === V.teal ? V.teal : V.border}`, background: t.color === V.teal ? V.tealMuted : "transparent" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: t.color, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-mono)", margin: 0 }}>{t.tier}</p>
              <p style={{ fontSize: 26, fontWeight: 400, color: V.ink, marginTop: 8, fontFamily: "var(--font-display)", margin: 0 }}>{t.price}</p>
              <div style={{ marginTop: 14 }}>
                {t.features.map(f => (
                  <p key={f} style={{ fontSize: 12, color: V.inkMuted, padding: "3px 0", display: "flex", gap: 8, margin: 0 }}>
                    <span style={{ color: t.color }} aria-hidden="true">✓</span>{f}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const content = { dashboard: Dashboard, explore: Explore, skills: Skills, bands: Bands, trends: Trends, scrapers: Scrapers, alerts: Alerts };
  const Page = content[tab] || Dashboard;

  return (
    <div style={{ minHeight: "100vh", background: V.bg, color: V.ink, fontFamily: "var(--font-body)", display: "flex" }}>
      <style>{GLOBAL_CSS}</style>

      {/* ─── Sidebar ─── */}
      <nav aria-label="Main navigation" style={{
        width: 232, minHeight: "100vh", background: V.surface, borderRight: `1px solid ${V.border}`,
        padding: "20px 12px", display: "flex", flexDirection: "column", flexShrink: 0,
      }}>
        <div style={{ padding: "0 12px", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 7,
              background: V.teal, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="2" y="3" width="12" height="2" rx="1" fill="white" />
                <rect x="4" y="7" width="8" height="2" rx="1" fill="white" opacity="0.7" />
                <rect x="3" y="11" width="10" height="2" rx="1" fill="white" opacity="0.4" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 17, fontWeight: 400, color: V.ink, fontFamily: "var(--font-display)", margin: 0, lineHeight: 1.1 }}>Banded</p>
              <p style={{ fontSize: 9, color: V.inkFaint, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "var(--font-mono)", margin: 0 }}>Comp Intelligence</p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {pages.map(p => (
            <NavBtn key={p.key} active={tab === p.key} onClick={() => setTab(p.key)} icon={p.icon}>
              {p.label}
            </NavBtn>
          ))}
        </div>

        <div style={{ marginTop: "auto", padding: "14px 12px", borderTop: `1px solid ${V.borderLight}` }}>
          <p style={{ fontSize: 10, color: V.inkFaint, lineHeight: 1.7, margin: 0 }}>
            <strong style={{ color: V.inkMuted }}>Data Provenance</strong><br />
            Only publicly accessible data. No\u00a0PII collected. All sources flagged.
          </p>
          <p className="mono" style={{ fontSize: 9, color: V.inkFaint, marginTop: 10 }}>v0.9.0-beta\u2002·\u20021.58M\u00a0records</p>
        </div>
      </nav>

      {/* ─── Main ─── */}
      <main style={{ flex: 1, overflow: "auto", maxHeight: "100vh", minWidth: 0 }}>
        <header style={{
          padding: "18px 32px", borderBottom: `1px solid ${V.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", background: V.surface,
        }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 400, margin: 0, fontFamily: "var(--font-display)", color: V.ink }}>
              {pages.find(p => p.key === tab)?.label}
            </h1>
            <p style={{ fontSize: 12, color: V.inkFaint, marginTop: 2, margin: 0 }}>
              {tab === "dashboard" && "Aggregated intelligence across 12\u00a0data sources"}
              {tab === "explore" && "Browse and filter all compensation records"}
              {tab === "skills" && "Skills-based pay signal analysis"}
              {tab === "bands" && "Build market-based salary structures"}
              {tab === "trends" && "Compensation movement and market signals"}
              {tab === "scrapers" && "Data pipeline health and ingestion status"}
              {tab === "alerts" && "Monitor compensation movements"}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="mono" style={{ padding: "4px 10px", borderRadius: 5, background: V.tealMuted, color: V.tealDark, fontSize: 11, fontWeight: 600 }}>PRO</span>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: V.teal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "var(--font-mono)" }} aria-label="User account">BK</div>
          </div>
        </header>

        <div style={{ padding: 32 }}>
          <Page />
        </div>
      </main>
    </div>
  );
}
