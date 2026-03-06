import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, Cell, Legend,
} from "recharts";
import _ from "lodash";
import { supabase } from "./supabaseClient";

const V = {
  bg: "#FAFAF7", bgWarm: "#F5F3EE", surface: "#FFFFFF", surfaceMuted: "#F0EDE6",
  border: "#E4E0D8", borderLight: "#EBE8E1", ink: "#1A1A18", inkSoft: "#3D3D38",
  inkMuted: "#7A7A70", inkFaint: "#B0AEA4", teal: "#0D9488", tealDark: "#0F766E",
  tealLight: "#CCFBF1", tealMuted: "rgba(13,148,136,0.08)", rose: "#E11D48",
  roseMuted: "rgba(225,29,72,0.06)", amber: "#D97706", amberMuted: "rgba(217,119,6,0.08)",
  blue: "#2563EB", blueMuted: "rgba(37,99,235,0.06)", violet: "#7C3AED",
  chartSet: ["#0D9488", "#2563EB", "#D97706", "#E11D48", "#7C3AED"],
  focus: "0 0 0 2px #FAFAF7, 0 0 0 4px #0D9488",
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; }
  :root { color-scheme: light; --font-display: 'Instrument Serif', Georgia, serif; --font-body: 'Geist', -apple-system, sans-serif; --font-mono: 'Geist Mono', 'SF Mono', monospace; }
  body { font-family: var(--font-body); -webkit-font-smoothing: antialiased; }
  :focus-visible { outline: none; box-shadow: ${V.focus}; border-radius: 4px; }
  :focus:not(:focus-visible) { outline: none; }
  .mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${V.border}; border-radius: 3px; }
  h1, h2, h3 { text-wrap: balance; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .fade-up { animation: fadeUp 0.4s ease-out both; }
  .fade-up-1 { animation-delay: 0ms; } .fade-up-2 { animation-delay: 60ms; } .fade-up-3 { animation-delay: 120ms; } .fade-up-4 { animation-delay: 180ms; } .fade-up-5 { animation-delay: 240ms; }
`;

const JOB_FAMILIES = {
  "Software Engineering": { levels: ["Junior Engineer", "Engineer", "Senior Engineer", "Staff Engineer", "Principal Engineer", "Distinguished Engineer"], codes: ["IC1", "IC2", "IC3", "IC4", "IC5", "IC6"], base: [85000, 450000] },
  "Product Management": { levels: ["Associate PM", "Product Manager", "Senior PM", "Group PM", "Director of Product", "VP Product"], codes: ["IC1", "IC2", "IC3", "IC4", "M3", "M5"], base: [90000, 380000] },
  "Data Science": { levels: ["Junior Data Scientist", "Data Scientist", "Senior Data Scientist", "Staff Data Scientist", "Principal Data Scientist"], codes: ["IC1", "IC2", "IC3", "IC4", "IC5"], base: [80000, 350000] },
  "Design": { levels: ["Junior Designer", "Product Designer", "Senior Designer", "Staff Designer", "Design Director"], codes: ["IC1", "IC2", "IC3", "IC4", "M3"], base: [70000, 300000] },
  "DevOps / SRE": { levels: ["Junior SRE", "SRE", "Senior SRE", "Staff SRE", "Principal SRE"], codes: ["IC1", "IC2", "IC3", "IC4", "IC5"], base: [82000, 370000] },
  "People / HR": { levels: ["HR Coordinator", "HR Generalist", "HRBP", "Senior HRBP", "Director HR", "VP People"], codes: ["IC1", "IC2", "IC3", "IC4", "M3", "M5"], base: [55000, 280000] },
  "Marketing": { levels: ["Marketing Coordinator", "Marketing Manager", "Senior Marketing Manager", "Director Marketing", "VP Marketing"], codes: ["IC1", "IC2", "IC3", "M3", "M5"], base: [55000, 300000] },
  "Sales": { levels: ["SDR", "Account Executive", "Senior AE", "Enterprise AE", "Sales Director", "VP Sales"], codes: ["IC1", "IC2", "IC3", "IC4", "M3", "M5"], base: [50000, 320000] },
};

const METROS = [
  { name: "San Francisco", state: "CA", cola: 1.35, region: "West" }, { name: "New York", state: "NY", cola: 1.28, region: "Northeast" },
  { name: "Seattle", state: "WA", cola: 1.22, region: "West" }, { name: "Austin", state: "TX", cola: 1.05, region: "South" },
  { name: "Denver", state: "CO", cola: 1.08, region: "West" }, { name: "Boston", state: "MA", cola: 1.20, region: "Northeast" },
  { name: "Chicago", state: "IL", cola: 1.02, region: "Midwest" }, { name: "Los Angeles", state: "CA", cola: 1.25, region: "West" },
  { name: "Miami", state: "FL", cola: 1.0, region: "South" }, { name: "Remote", state: "US", cola: 1.0, region: "National" },
  { name: "Portland", state: "OR", cola: 1.10, region: "West" }, { name: "Atlanta", state: "GA", cola: 0.98, region: "South" },
  { name: "Raleigh", state: "NC", cola: 0.95, region: "South" },
];

const COMPANIES = [
  { name: "Stripe", size: "enterprise", industry: "Fintech" }, { name: "Datadog", size: "enterprise", industry: "DevTools" },
  { name: "Snowflake", size: "enterprise", industry: "Data/Cloud" }, { name: "Figma", size: "mid-market", industry: "Design" },
  { name: "Notion", size: "mid-market", industry: "Productivity" }, { name: "Vercel", size: "mid-market", industry: "DevTools" },
  { name: "Linear", size: "smb", industry: "DevTools" }, { name: "Retool", size: "mid-market", industry: "DevTools" },
  { name: "Coinbase", size: "enterprise", industry: "Fintech" }, { name: "Plaid", size: "enterprise", industry: "Fintech" },
  { name: "Anthropic", size: "enterprise", industry: "AI/ML" }, { name: "OpenAI", size: "enterprise", industry: "AI/ML" },
];

const SKILLS_MAP = {
  "Software Engineering": ["Python", "Rust", "Go", "TypeScript", "React", "Kubernetes", "AWS"],
  "Product Management": ["SQL", "A/B Testing", "Roadmapping", "OKRs", "User Research"],
  "Data Science": ["Python", "SQL", "PyTorch", "TensorFlow", "MLOps", "Spark"],
  "Design": ["Figma", "Prototyping", "Design Systems", "User Research"],
  "DevOps / SRE": ["Kubernetes", "Terraform", "AWS", "GCP", "Docker"],
  "People / HR": ["Workday", "UKG", "Compensation", "Benefits", "HRIS"],
  "Marketing": ["SEO", "Content Strategy", "HubSpot", "Google Analytics"],
  "Sales": ["Salesforce", "Enterprise Sales", "SaaS", "Negotiation"],
};

const WORK_MODELS = ["Remote", "Hybrid", "Onsite"];
const SOURCES = ["LinkedIn Jobs", "Indeed", "Greenhouse Board", "CO Transparency", "CA Transparency", "Levels.fyi", "BLS OEWS"];

// Demo data generator (fallback when database is empty)
function sr(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

function buildDemoDataset() {
  const r = sr(42); const out = []; let id = 0;
  for (const co of COMPANIES) {
    for (const [fam, cfg] of Object.entries(JOB_FAMILIES)) {
      const n = Math.floor(r() * 3) + 1;
      for (let p = 0; p < n; p++) {
        const li = Math.floor(r() * cfg.levels.length); const m = METROS[Math.floor(r() * METROS.length)];
        const pct = li / (cfg.levels.length - 1); const bMin = cfg.base[0] + (cfg.base[1] - cfg.base[0]) * pct * 0.7;
        const bMax = bMin * (1.15 + r() * 0.25); const sMin = Math.round(bMin * m.cola / 1000) * 1000;
        const sMax = Math.round(bMax * m.cola / 1000) * 1000; const mid = Math.round((sMin + sMax) / 2 / 1000) * 1000;
        const sk = SKILLS_MAP[fam] || []; const picked = sk.slice(0, Math.floor(r() * 3) + 1);
        const dAgo = Math.floor(r() * 90); const dt = new Date(); dt.setDate(dt.getDate() - dAgo);
        out.push({ id: ++id, company: co.name, size: co.size, industry: co.industry, family: fam, title: cfg.levels[li], code: cfg.codes[li], level: li + 1, metro: m.name, state: m.state, region: m.region, sMin, sMax, mid, work: WORK_MODELS[Math.floor(r() * 3)], skills: picked, source: SOURCES[Math.floor(r() * SOURCES.length)], posted: dt.toISOString().split("T")[0], daysAgo: dAgo });
      }
    }
  }
  return out;
}

function buildTrends() {
  const months = ["Sep '25", "Oct '25", "Nov '25", "Dec '25", "Jan '26", "Feb '26"];
  return months.map((m, i) => ({ month: m, "Software Engineering": 175000 + i * 2800 + Math.random() * 3000, "Product Management": 162000 + i * 2200 + Math.random() * 2500, "Data Science": 155000 + i * 2500 + Math.random() * 2000, "Design": 130000 + i * 1800 + Math.random() * 2000, "DevOps / SRE": 158000 + i * 2600 + Math.random() * 2500 }));
}

const pct = (arr, p) => { const s = [...arr].sort((a, b) => a - b); const i = (p / 100) * (s.length - 1); const l = Math.floor(i); return l === Math.ceil(i) ? s[l] : s[l] + (s[Math.ceil(i)] - s[l]) * (i - l); };
const fmt = n => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const fmtK = n => "$" + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(n / 1000)) + "K";
const fmtNum = n => new Intl.NumberFormat("en-US").format(n);

function Metric({ label, value, detail, accent = V.teal, delay = 0 }) {
  return (<div className={`fade-up fade-up-${delay + 1}`} style={{ flex: "1 1 220px", minWidth: 200, padding: "22px 24px", background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 2, background: accent, opacity: 0.5 }} />
    <p style={{ fontSize: 11, fontWeight: 600, color: V.inkMuted, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>{label}</p>
    <p style={{ fontSize: 28, fontWeight: 700, color: V.ink, marginTop: 6, fontFamily: "var(--font-display)", lineHeight: 1.1 }}>{value}</p>
    {detail && <p style={{ fontSize: 12, color: V.inkFaint, marginTop: 6 }}>{detail}</p>}
  </div>);
}

function Pill({ children, active, onClick }) {
  return (<button onClick={onClick} aria-pressed={active} style={{ padding: "5px 13px", borderRadius: 6, border: `1px solid ${active ? V.teal : V.border}`, background: active ? V.tealMuted : "transparent", color: active ? V.tealDark : V.inkMuted, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-body)", whiteSpace: "nowrap", transition: "background 0.15s ease" }}>{children}</button>);
}

function NavBtn({ children, active, onClick, icon }) {
  return (<button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderRadius: 8, border: "none", width: "100%", textAlign: "left", background: active ? V.tealMuted : "transparent", color: active ? V.tealDark : V.inkSoft, fontSize: 13, fontWeight: active ? 600 : 450, cursor: "pointer", fontFamily: "var(--font-body)" }} onMouseEnter={e => { if (!active) e.currentTarget.style.background = V.surfaceMuted; }} onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? V.tealMuted : "transparent"; }}>
    <span style={{ fontSize: 15, width: 22, textAlign: "center", opacity: active ? 1 : 0.6 }}>{icon}</span>{children}
  </button>);
}

function SourceTag({ source }) {
  const isTransparency = source?.includes("Transparency"); const isGov = source?.includes("BLS") || source?.includes("H-1B");
  const c = isTransparency ? V.teal : isGov ? V.amber : V.blue;
  return (<span style={{ padding: "2px 7px", borderRadius: 4, background: `${c}12`, color: c, fontSize: 10, fontWeight: 600, fontFamily: "var(--font-mono)" }}>{source || "Unknown"}</span>);
}

function SortableTable({ data, columns, maxRows = 50 }) {
  const [sortKey, setSortKey] = useState(null); const [sortDir, setSortDir] = useState("desc");
  const sorted = useMemo(() => {
    if (!sortKey) return data.slice(0, maxRows);
    return [...data].sort((a, b) => { const va = a[sortKey], vb = b[sortKey]; if (typeof va === "number") return sortDir === "asc" ? va - vb : vb - va; return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va)); }).slice(0, maxRows);
  }, [data, sortKey, sortDir, maxRows]);
  const toggle = (k) => { if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortKey(k); setSortDir("desc"); } };
  return (<div style={{ overflowX: "auto", borderRadius: 8, border: `1px solid ${V.border}` }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "var(--font-body)" }}>
      <thead><tr>{columns.map(col => (<th key={col.key}>
        <button onClick={() => toggle(col.key)} style={{ display: "flex", alignItems: "center", gap: 4, width: "100%", justifyContent: col.align === "right" ? "flex-end" : "flex-start", padding: "11px 14px", background: V.bgWarm, color: V.inkMuted, border: "none", borderBottom: `1px solid ${V.border}`, fontWeight: 600, fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", cursor: "pointer", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
          {col.label}{sortKey === col.key && <span style={{ fontSize: 10 }}>{sortDir === "asc" ? " ↑" : " ↓"}</span>}
        </button></th>))}</tr></thead>
      <tbody>{sorted.map((row, i) => (<tr key={row.id ?? i} style={{ borderBottom: `1px solid ${V.borderLight}` }} onMouseEnter={e => e.currentTarget.style.background = V.bgWarm} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
        {columns.map(col => (<td key={col.key} style={{ padding: "10px 14px", color: V.inkSoft, textAlign: col.align || "left", whiteSpace: "nowrap" }}>{col.render ? col.render(row[col.key], row) : row[col.key]}</td>))}
      </tr>))}</tbody>
    </table>
    {data.length > maxRows && (<p style={{ padding: 12, textAlign: "center", color: V.inkFaint, fontSize: 12, background: V.bgWarm, margin: 0 }}>Showing {fmtNum(maxRows)} of {fmtNum(data.length)} records</p>)}
  </div>);
}

function BandBar({ min, max, p25, p50, p75, gMin, gMax }) {
  const s = v => ((v - gMin) / (gMax - gMin)) * 100;
  return (<div style={{ position: "relative", height: 24, background: V.surfaceMuted, borderRadius: 4 }}>
    <div style={{ position: "absolute", left: `${s(min)}%`, width: `${s(max) - s(min)}%`, top: 4, height: 16, background: V.tealMuted, borderRadius: 3, border: `1px solid ${V.teal}30` }} />
    <div style={{ position: "absolute", left: `${s(p25)}%`, top: 3, width: 2, height: 18, background: V.blue, borderRadius: 1 }} />
    <div style={{ position: "absolute", left: `${s(p50)}%`, top: 1, width: 3, height: 22, background: V.teal, borderRadius: 1 }} />
    <div style={{ position: "absolute", left: `${s(p75)}%`, top: 3, width: 2, height: 18, background: V.amber, borderRadius: 1 }} />
  </div>);
}

const chartTooltipStyle = { background: V.surface, border: `1px solid ${V.border}`, borderRadius: 8, fontSize: 12, fontFamily: "var(--font-body)", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" };

export default function Banded() {
  const [tab, setTab] = useState("dashboard");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState("loading");
  const [submissions, setSubmissions] = useState([]);
  const [trends] = useState(buildTrends);
  
  const [famF, setFamF] = useState("All");
  const [metF, setMetF] = useState("All");
  const [sizeF, setSizeF] = useState("All");
  const [lvlF, setLvlF] = useState("All");
  const [q, setQ] = useState("");
  const [bandFam, setBandFam] = useState("Software Engineering");
  const [bandMet, setBandMet] = useState("All");
  
  // Admin mode (toggle with ?admin=true in URL)
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsAdmin(params.get('admin') === 'true');
  }, []);

  // Fetch data from Supabase
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const { data: compData, error } = await supabase
          .from('comp_data')
          .select('*')
          .eq('status', 'approved');
        
        if (error) throw error;
        
        if (compData && compData.length > 0) {
          // Transform database records to match expected format
          const transformed = compData.map(r => ({
            id: r.id,
            company: r.company,
            size: r.size,
            industry: r.industry,
            family: r.family,
            title: r.title,
            code: r.code,
            level: r.level,
            metro: r.metro,
            state: r.state,
            region: r.region,
            sMin: r.salary_min,
            sMax: r.salary_max,
            mid: r.midpoint,
            work: r.work_model,
            skills: r.skills || [],
            source: r.source,
            posted: r.posted_date,
          }));
          setData(transformed);
          setDataSource("database");
        } else {
          // Fallback to demo data
          setData(buildDemoDataset());
          setDataSource("demo");
        }
      } catch (err) {
        console.error("Error fetching from Supabase:", err);
        setData(buildDemoDataset());
        setDataSource("demo");
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // Fetch submissions for admin
  useEffect(() => {
    if (!isAdmin) return;
    async function fetchSubmissions() {
      const { data: subs, error } = await supabase
        .from('submissions')
        .select('*')
        .order('submitted_at', { ascending: false });
      if (!error && subs) setSubmissions(subs);
    }
    fetchSubmissions();
  }, [isAdmin, tab]);

  const skills = useMemo(() => {
    const sm = {}; data.forEach(r => (r.skills || []).forEach(s => { if (!sm[s]) sm[s] = { t: 0, n: 0 }; sm[s].t += r.mid; sm[s].n++; }));
    const avg = data.length ? data.reduce((a, r) => a + r.mid, 0) / data.length : 0;
    return Object.entries(sm).map(([skill, d]) => ({ skill, avgPay: Math.round(d.t / d.n), premium: Math.round(d.t / d.n - avg), postings: d.n, trend: Math.round((Math.random() - 0.38) * 16 * 10) / 10 })).sort((a, b) => b.premium - a.premium);
  }, [data]);

  const filtered = useMemo(() => data.filter(r => {
    if (famF !== "All" && r.family !== famF) return false;
    if (metF !== "All" && r.metro !== metF) return false;
    if (sizeF !== "All" && r.size !== sizeF) return false;
    if (lvlF !== "All" && r.code !== lvlF) return false;
    if (q) { const lq = q.toLowerCase(); return r.company?.toLowerCase().includes(lq) || r.title?.toLowerCase().includes(lq) || (r.skills || []).some(s => s.toLowerCase().includes(lq)); }
    return true;
  }), [data, famF, metF, sizeF, lvlF, q]);

  const stats = useMemo(() => {
    if (!filtered.length) return { med: 0, p25: 0, p75: 0, p90: 0, n: 0, cos: 0 };
    const m = filtered.map(r => r.mid);
    return { med: pct(m, 50), p25: pct(m, 25), p75: pct(m, 75), p90: pct(m, 90), n: filtered.length, cos: new Set(filtered.map(r => r.company)).size };
  }, [filtered]);

  const geoData = useMemo(() => {
    const bm = {};
    filtered.forEach(r => { if (!bm[r.metro]) bm[r.metro] = { mids: [], n: 0, state: r.state, region: r.region }; bm[r.metro].mids.push(r.mid); bm[r.metro].n++; });
    return Object.entries(bm).map(([metro, d]) => ({ metro, state: d.state, region: d.region, median: Math.round(pct(d.mids, 50)), p25: Math.round(pct(d.mids, 25)), p75: Math.round(pct(d.mids, 75)), postings: d.n })).sort((a, b) => b.median - a.median);
  }, [filtered]);

  const bandRows = useMemo(() => {
    const cfg = JOB_FAMILIES[bandFam]; if (!cfg) return [];
    return cfg.levels.map((lv, i) => {
      const mx = data.filter(r => r.family === bandFam && r.title === lv && (bandMet === "All" || r.metro === bandMet));
      if (!mx.length) { const bM = cfg.base[0] + (cfg.base[1] - cfg.base[0]) * (i / (cfg.levels.length - 1)) * 0.7; const m = bM * 1.1; return { level: lv, code: cfg.codes[i], p25: Math.round(m * .88), p50: Math.round(m), p75: Math.round(m * 1.15), p90: Math.round(m * 1.3), min: Math.round(m * .82), max: Math.round(m * 1.35), n: 0 }; }
      const ms = mx.map(r => r.mid);
      return { level: lv, code: cfg.codes[i], p25: Math.round(pct(ms, 25)), p50: Math.round(pct(ms, 50)), p75: Math.round(pct(ms, 75)), p90: Math.round(pct(ms, 90)), min: Math.round(pct(ms, 10)), max: Math.round(pct(ms, 90)), n: mx.length };
    });
  }, [data, bandFam, bandMet]);

  const pages = [
    { key: "dashboard", label: "Dashboard", icon: "◉" },
    { key: "explore", label: "Explore", icon: "⬡" },
    { key: "skills", label: "Skills Intel", icon: "◈" },
    { key: "bands", label: "Band Builder", icon: "▤" },
    { key: "trends", label: "Trends", icon: "◆" },
    { key: "contribute", label: "Contribute", icon: "✦" },
    ...(isAdmin ? [{ key: "admin", label: "Admin Review", icon: "⚙" }] : []),
  ];

  const searchInputRef = useRef(null);
  const [localSearch, setLocalSearch] = useState("");
  const searchTimeoutRef = useRef(null);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setLocalSearch(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => { setQ(value); }, 300);
  }, []);

  const filterBarContent = (
    <div className="fade-up fade-up-1" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input ref={searchInputRef} value={localSearch} onChange={handleSearchChange} placeholder="Search company, title, skill…" autoComplete="off" style={{ padding: "7px 14px", borderRadius: 7, border: `1px solid ${V.border}`, background: V.surface, color: V.ink, fontSize: 13, width: 260, fontFamily: "var(--font-body)" }} onFocus={e => e.target.style.borderColor = V.teal} onBlur={e => e.target.style.borderColor = V.border} />
        <span style={{ width: 1, height: 20, background: V.border }} />
        <span style={{ fontSize: 10, color: V.inkFaint, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Family</span>
        <Pill active={famF === "All"} onClick={() => setFamF("All")}>All</Pill>
        {Object.keys(JOB_FAMILIES).map(f => <Pill key={f} active={famF === f} onClick={() => setFamF(f)}>{f}</Pill>)}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, color: V.inkFaint, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-mono)", minWidth: 44 }}>Metro</span>
        <Pill active={metF === "All"} onClick={() => setMetF("All")}>All</Pill>
        {["San Francisco", "New York", "Seattle", "Denver", "Austin", "Boston", "Remote"].map(m => <Pill key={m} active={metF === m} onClick={() => setMetF(m)}>{m}</Pill>)}
        <span style={{ width: 1, height: 20, background: V.border }} />
        <span style={{ fontSize: 10, color: V.inkFaint, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Size</span>
        <Pill active={sizeF === "All"} onClick={() => setSizeF("All")}>All</Pill>
        {["smb", "mid-market", "enterprise"].map(s => <Pill key={s} active={sizeF === s} onClick={() => setSizeF(s)}>{s.charAt(0).toUpperCase() + s.slice(1)}</Pill>)}
      </div>
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: V.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${V.border}`, borderTopColor: V.teal, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: V.inkMuted, fontSize: 14 }}>Loading compensation data...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const Dashboard = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {dataSource === "demo" && (
        <div style={{ padding: "12px 16px", background: V.amberMuted, border: `1px solid ${V.amber}30`, borderRadius: 8 }}>
          <p style={{ margin: 0, fontSize: 13, color: V.amber }}>📊 Showing demo data. Add records to your Supabase database to see real data.</p>
        </div>
      )}
      {filterBarContent}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <Metric label="Median Total Comp" value={fmtK(stats.med)} detail={`P25: ${fmtK(stats.p25)} · P75: ${fmtK(stats.p75)}`} delay={0} />
        <Metric label="Data Points" value={fmtNum(stats.n)} detail={`${fmtNum(stats.cos)} companies`} accent={V.blue} delay={1} />
        <Metric label="90th Percentile" value={fmtK(stats.p90)} detail="Top-of-market" accent={V.amber} delay={2} />
        <Metric label="Data Source" value={dataSource === "demo" ? "Demo" : "Live"} detail={dataSource === "demo" ? "Sample data" : "Supabase"} accent={dataSource === "demo" ? V.amber : V.teal} delay={3} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <section className="fade-up fade-up-4" style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 22 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: V.ink }}>Compensation Trends</h3>
          <p style={{ fontSize: 11, color: V.inkFaint, marginTop: 2, marginBottom: 16 }}>Median by family, 6 months</p>
          <ResponsiveContainer width="100%" height={270}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke={V.borderLight} />
              <XAxis dataKey="month" tick={{ fill: V.inkFaint, fontSize: 11 }} axisLine={{ stroke: V.border }} />
              <YAxis tick={{ fill: V.inkFaint, fontSize: 11 }} tickFormatter={v => fmtK(v)} axisLine={{ stroke: V.border }} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={v => fmt(v)} />
              {["Software Engineering", "Product Management", "Data Science"].map((f, i) => (<Line key={f} type="monotone" dataKey={f} stroke={V.chartSet[i]} strokeWidth={2} dot={false} />))}
            </LineChart>
          </ResponsiveContainer>
        </section>
        <section className="fade-up fade-up-5" style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 22 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: V.ink }}>Pay by Metro</h3>
          <p style={{ fontSize: 11, color: V.inkFaint, marginTop: 2, marginBottom: 16 }}>Median total comp</p>
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={geoData.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={V.borderLight} />
              <XAxis type="number" tick={{ fill: V.inkFaint, fontSize: 11 }} tickFormatter={v => fmtK(v)} axisLine={{ stroke: V.border }} />
              <YAxis type="category" dataKey="metro" tick={{ fill: V.inkMuted, fontSize: 11 }} width={100} axisLine={{ stroke: V.border }} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={v => fmt(v)} />
              <Bar dataKey="median" fill={V.teal} radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>
    </div>
  );

  const Explore = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {filterBarContent}
      <p style={{ fontSize: 13, color: V.inkMuted, margin: 0 }}><strong style={{ color: V.teal }}>{fmtNum(filtered.length)}</strong> records</p>
      <SortableTable data={filtered} maxRows={80} columns={[
        { key: "company", label: "Company", render: (v, r) => <span><strong style={{ color: V.ink }}>{v}</strong> <span style={{ color: V.inkFaint, fontSize: 10 }}>({r.size})</span></span> },
        { key: "title", label: "Title" },
        { key: "code", label: "Level", align: "center", render: v => <span className="mono" style={{ fontSize: 11, color: V.blue, fontWeight: 600 }}>{v}</span> },
        { key: "metro", label: "Metro" },
        { key: "mid", label: "Midpoint", align: "right", render: v => <span className="mono" style={{ color: V.tealDark, fontWeight: 600 }}>{fmt(v)}</span> },
        { key: "source", label: "Source", render: v => <SourceTag source={v} /> },
      ]} />
    </div>
  );

  const Skills = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <Metric label="Highest Premium" value={skills[0]?.skill || "N/A"} detail={skills[0] ? `+${fmtK(skills[0].premium)} over baseline` : ""} />
        <Metric label="Skills Tracked" value={String(skills.length)} detail="Across all families" accent={V.violet} delay={1} />
      </div>
      <section style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 22 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: V.ink, marginBottom: 16 }}>Skill Premium Breakdown</h3>
        <SortableTable data={skills} maxRows={20} columns={[
          { key: "skill", label: "Skill", render: v => <strong style={{ color: V.ink }}>{v}</strong> },
          { key: "premium", label: "Premium", align: "right", render: v => <span className="mono" style={{ color: v >= 0 ? V.tealDark : V.rose, fontWeight: 600 }}>{v >= 0 ? "+" : ""}{fmtK(v)}</span> },
          { key: "avgPay", label: "Avg Pay", align: "right", render: v => <span className="mono">{fmtK(v)}</span> },
          { key: "postings", label: "Posts", align: "right" },
        ]} />
      </section>
    </div>
  );

  const Bands = () => {
    const gMin = Math.min(...bandRows.map(d => d.min));
    const gMax = Math.max(...bandRows.map(d => d.max));
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <section style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 400, color: V.ink, fontFamily: "var(--font-display)" }}>Salary Band Builder</h2>
          <p style={{ fontSize: 13, color: V.inkMuted, marginTop: 4, marginBottom: 22 }}>Build market-based salary bands from aggregated data.</p>
          <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
            <div>
              <label style={{ display: "block", fontSize: 10, color: V.inkFaint, marginBottom: 5, fontWeight: 600, textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Job Family</label>
              <select value={bandFam} onChange={e => setBandFam(e.target.value)} style={{ padding: "8px 12px", borderRadius: 7, border: `1px solid ${V.border}`, background: V.surface, color: V.ink, fontSize: 13, minWidth: 200 }}>{Object.keys(JOB_FAMILIES).map(f => <option key={f} value={f}>{f}</option>)}</select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, color: V.inkFaint, marginBottom: 5, fontWeight: 600, textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Geography</label>
              <select value={bandMet} onChange={e => setBandMet(e.target.value)} style={{ padding: "8px 12px", borderRadius: 7, border: `1px solid ${V.border}`, background: V.surface, color: V.ink, fontSize: 13, minWidth: 200 }}><option value="All">All Markets</option>{METROS.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}</select>
            </div>
          </div>
          {bandRows.map((b, i) => (<div key={i} style={{ display: "grid", gridTemplateColumns: "150px 50px 1fr 70px 70px 70px", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${V.borderLight}` }}>
            <span style={{ color: V.ink, fontWeight: 600, fontSize: 13 }}>{b.level}</span>
            <span className="mono" style={{ fontSize: 11, color: V.blue }}>{b.code}</span>
            <BandBar min={b.min} max={b.max} p25={b.p25} p50={b.p50} p75={b.p75} gMin={gMin} gMax={gMax} />
            <span className="mono" style={{ fontSize: 12, color: V.inkMuted, textAlign: "right" }}>{fmtK(b.p25)}</span>
            <span className="mono" style={{ fontSize: 12, color: V.tealDark, textAlign: "right", fontWeight: 600 }}>{fmtK(b.p50)}</span>
            <span className="mono" style={{ fontSize: 12, color: V.inkMuted, textAlign: "right" }}>{fmtK(b.p75)}</span>
          </div>))}
        </section>
      </div>
    );
  };

  const Trends = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <section style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 22 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: V.ink }}>Trend Lines</h3>
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart data={trends}>
            <defs>{V.chartSet.map((c, i) => (<linearGradient key={i} id={`tg${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={c} stopOpacity={0.2} /><stop offset="95%" stopColor={c} stopOpacity={0} /></linearGradient>))}</defs>
            <CartesianGrid strokeDasharray="3 3" stroke={V.borderLight} />
            <XAxis dataKey="month" tick={{ fill: V.inkFaint, fontSize: 11 }} axisLine={{ stroke: V.border }} />
            <YAxis tick={{ fill: V.inkFaint, fontSize: 11 }} tickFormatter={v => fmtK(v)} axisLine={{ stroke: V.border }} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={v => fmt(v)} />
            <Legend />
            {["Software Engineering", "Product Management", "Data Science", "Design", "DevOps / SRE"].map((f, i) => (<Area key={f} type="monotone" dataKey={f} stroke={V.chartSet[i]} fill={`url(#tg${i})`} strokeWidth={2} />))}
          </AreaChart>
        </ResponsiveContainer>
      </section>
    </div>
  );

  const Contribute = () => {
    const [formData, setFormData] = useState({ jobTitle: '', company: '', baseSalary: '', yoe: '', metro: '', jobFamily: '' });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      setStatus({ type: 'info', message: 'Submitting...' });

      try {
        const { error } = await supabase.from('submissions').insert([{
          job_title: formData.jobTitle,
          company: formData.company,
          job_family: formData.jobFamily,
          base_salary: parseInt(formData.baseSalary),
          years_of_exp: parseInt(formData.yoe),
          metro: formData.metro,
          status: 'pending'
        }]);

        if (error) throw error;

        setStatus({ type: 'success', message: 'Submitted for review! Thank you for contributing.' });
        setFormData({ jobTitle: '', company: '', baseSalary: '', yoe: '', metro: '', jobFamily: '' });
      } catch (err) {
        console.error("Submission error:", err);
        setStatus({ type: 'error', message: 'Failed to submit. Please try again.' });
      }
      setIsSubmitting(false);
    };

    const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 7, border: `1px solid ${V.border}`, background: V.surface, color: V.ink, fontSize: 14, fontFamily: 'var(--font-body)' };
    const labelStyle = { display: 'block', fontSize: 11, color: V.inkMuted, marginBottom: 6, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' };

    return (
      <div style={{ maxWidth: 720 }}>
        <section style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 400, color: V.ink, fontFamily: 'var(--font-display)', margin: 0 }}>Anonymously Share Your Comp</h2>
          <p style={{ fontSize: 13, color: V.inkMuted, marginTop: 8, marginBottom: 24 }}>Help democratize salary data. All submissions are reviewed before going live.</p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div><label style={labelStyle}>Job Title</label><input type="text" required placeholder="e.g. Senior Software Engineer" value={formData.jobTitle} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} style={inputStyle} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div><label style={labelStyle}>Company</label><input type="text" required placeholder="e.g. Stripe" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>Job Family</label><select required value={formData.jobFamily} onChange={(e) => setFormData({ ...formData, jobFamily: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}><option value="">Select...</option>{Object.keys(JOB_FAMILIES).map(f => <option key={f} value={f}>{f}</option>)}</select></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div><label style={labelStyle}>Base Salary (USD)</label><input type="number" required placeholder="150000" value={formData.baseSalary} onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>Years of Exp</label><input type="number" required placeholder="5" value={formData.yoe} onChange={(e) => setFormData({ ...formData, yoe: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>Metro</label><select required value={formData.metro} onChange={(e) => setFormData({ ...formData, metro: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}><option value="">Select...</option>{METROS.map(m => <option key={m.name} value={m.name}>{m.name}, {m.state}</option>)}</select></div>
            </div>
            <button type="submit" disabled={isSubmitting} style={{ marginTop: 8, padding: '12px 24px', borderRadius: 7, border: 'none', background: isSubmitting ? V.inkFaint : V.teal, color: '#fff', fontSize: 14, fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>{isSubmitting ? 'Submitting...' : 'Submit Anonymously'}</button>
            {status.message && (<div style={{ marginTop: 8, padding: '12px 16px', borderRadius: 7, background: status.type === 'success' ? V.tealMuted : status.type === 'error' ? V.roseMuted : V.blueMuted }}><p style={{ margin: 0, fontSize: 13, color: status.type === 'success' ? V.tealDark : status.type === 'error' ? V.rose : V.blue }}>{status.message}</p></div>)}
          </form>
        </section>
      </div>
    );
  };

  const AdminReview = () => {
    const handleApprove = async (id, sub) => {
      // Add to comp_data
      await supabase.from('comp_data').insert([{
        company: sub.company,
        family: sub.job_family,
        title: sub.job_title,
        metro: sub.metro,
        midpoint: sub.base_salary,
        salary_min: Math.round(sub.base_salary * 0.85),
        salary_max: Math.round(sub.base_salary * 1.15),
        source: 'User Submission',
        status: 'approved'
      }]);
      // Update submission status
      await supabase.from('submissions').update({ status: 'approved' }).eq('id', id);
      setSubmissions(s => s.filter(x => x.id !== id));
    };

    const handleReject = async (id) => {
      await supabase.from('submissions').update({ status: 'rejected' }).eq('id', id);
      setSubmissions(s => s.filter(x => x.id !== id));
    };

    const pending = submissions.filter(s => s.status === 'pending');

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ padding: "12px 16px", background: V.blueMuted, border: `1px solid ${V.blue}30`, borderRadius: 8 }}>
          <p style={{ margin: 0, fontSize: 13, color: V.blue }}>🔒 Admin view. {pending.length} submissions pending review.</p>
        </div>
        <section style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 22 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: V.ink, marginBottom: 16 }}>Pending Submissions</h3>
          {pending.length === 0 ? (
            <p style={{ color: V.inkMuted, fontSize: 13 }}>No pending submissions.</p>
          ) : (
            <SortableTable data={pending} columns={[
              { key: "job_title", label: "Title", render: v => <strong style={{ color: V.ink }}>{v}</strong> },
              { key: "company", label: "Company" },
              { key: "job_family", label: "Family" },
              { key: "base_salary", label: "Salary", align: "right", render: v => <span className="mono">{fmt(v)}</span> },
              { key: "metro", label: "Metro" },
              { key: "submitted_at", label: "Submitted", render: v => <span style={{ fontSize: 11, color: V.inkFaint }}>{new Date(v).toLocaleDateString()}</span> },
              { key: "actions", label: "Actions", render: (_, row) => (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleApprove(row.id, row)} style={{ padding: "4px 12px", borderRadius: 5, border: "none", background: V.teal, color: "#fff", fontSize: 11, cursor: "pointer" }}>Approve</button>
                  <button onClick={() => handleReject(row.id)} style={{ padding: "4px 12px", borderRadius: 5, border: `1px solid ${V.rose}`, background: "transparent", color: V.rose, fontSize: 11, cursor: "pointer" }}>Reject</button>
                </div>
              )}
            ]} />
          )}
        </section>
      </div>
    );
  };

  const content = { dashboard: Dashboard, explore: Explore, skills: Skills, bands: Bands, trends: Trends, contribute: Contribute, admin: AdminReview };
  const Page = content[tab] || Dashboard;

  return (
    <div style={{ minHeight: "100vh", background: V.bg, color: V.ink, fontFamily: "var(--font-body)", display: "flex" }}>
      <style>{GLOBAL_CSS}</style>
      <nav style={{ width: 220, minHeight: "100vh", background: V.surface, borderRight: `1px solid ${V.border}`, padding: "20px 12px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "0 12px", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: V.teal, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="2" rx="1" fill="white" /><rect x="4" y="7" width="8" height="2" rx="1" fill="white" opacity="0.7" /><rect x="3" y="11" width="10" height="2" rx="1" fill="white" opacity="0.4" /></svg>
            </div>
            <div><p style={{ fontSize: 17, fontWeight: 400, color: V.ink, fontFamily: "var(--font-display)", margin: 0 }}>Banded</p><p style={{ fontSize: 9, color: V.inkFaint, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "var(--font-mono)", margin: 0 }}>Comp Intelligence</p></div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>{pages.map(p => (<NavBtn key={p.key} active={tab === p.key} onClick={() => setTab(p.key)} icon={p.icon}>{p.label}</NavBtn>))}</div>
        <div style={{ marginTop: "auto", padding: "14px 12px", borderTop: `1px solid ${V.borderLight}` }}>
          <p style={{ fontSize: 10, color: V.inkFaint, lineHeight: 1.7, margin: 0 }}><strong style={{ color: V.inkMuted }}>Data</strong><br />{dataSource === "demo" ? "Demo mode" : "Connected to Supabase"}</p>
        </div>
      </nav>
      <main style={{ flex: 1, overflow: "auto", maxHeight: "100vh", minWidth: 0 }}>
        <header style={{ padding: "18px 32px", borderBottom: `1px solid ${V.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: V.surface }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 400, margin: 0, fontFamily: "var(--font-display)", color: V.ink }}>{pages.find(p => p.key === tab)?.label}</h1>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {isAdmin && <span style={{ padding: "4px 10px", borderRadius: 5, background: V.roseMuted, color: V.rose, fontSize: 11, fontWeight: 600 }}>ADMIN</span>}
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: V.teal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>BK</div>
          </div>
        </header>
        <div style={{ padding: 32 }}><Page /></div>
      </main>
    </div>
  );
}
