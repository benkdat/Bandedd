import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, Cell, Legend, PieChart, Pie,
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
  chartSet: ["#0D9488", "#2563EB", "#D97706", "#E11D48", "#7C3AED", "#059669", "#DC2626", "#7C3AED"],
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
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${V.border}; border-radius: 3px; }
  h1, h2, h3 { text-wrap: balance; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .fade-up { animation: fadeUp 0.4s ease-out both; }
  .fade-up-1 { animation-delay: 0ms; } .fade-up-2 { animation-delay: 60ms; } .fade-up-3 { animation-delay: 120ms; } .fade-up-4 { animation-delay: 180ms; }
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

// Utility functions
const pct = (arr, p) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const i = (p / 100) * (s.length - 1);
  const l = Math.floor(i);
  return l === Math.ceil(i) ? s[l] : s[l] + (s[Math.ceil(i)] - s[l]) * (i - l);
};
const fmt = n => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const fmtK = n => "$" + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(n / 1000)) + "K";
const fmtNum = n => new Intl.NumberFormat("en-US").format(n);
const timeAgo = (date) => {
  if (!date) return 'Never';
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return then.toLocaleDateString();
};

// Reusable components
function Metric({ label, value, detail, accent = V.teal, delay = 0 }) {
  return (
    <div className={`fade-up fade-up-${delay + 1}`} style={{ flex: "1 1 200px", minWidth: 180, padding: "20px 22px", background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 2, background: accent, opacity: 0.5 }} />
      <p style={{ fontSize: 11, fontWeight: 600, color: V.inkMuted, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 700, color: V.ink, marginTop: 6, fontFamily: "var(--font-display)", lineHeight: 1.1 }}>{value}</p>
      {detail && <p style={{ fontSize: 12, color: V.inkFaint, marginTop: 6 }}>{detail}</p>}
    </div>
  );
}

function Pill({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${active ? V.teal : V.border}`, background: active ? V.tealMuted : "transparent", color: active ? V.tealDark : V.inkMuted, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-body)", whiteSpace: "nowrap", transition: "all 0.15s ease" }}>
      {children}
    </button>
  );
}

function NavBtn({ children, active, onClick, icon, badge }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderRadius: 8, border: "none", width: "100%", textAlign: "left", background: active ? V.tealMuted : "transparent", color: active ? V.tealDark : V.inkSoft, fontSize: 13, fontWeight: active ? 600 : 450, cursor: "pointer", fontFamily: "var(--font-body)" }} onMouseEnter={e => { if (!active) e.currentTarget.style.background = V.surfaceMuted; }} onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? V.tealMuted : "transparent"; }}>
      <span style={{ fontSize: 15, width: 22, textAlign: "center", opacity: active ? 1 : 0.6 }}>{icon}</span>
      <span style={{ flex: 1 }}>{children}</span>
      {badge && <span style={{ padding: "2px 6px", borderRadius: 4, background: V.teal, color: "#fff", fontSize: 10, fontWeight: 600 }}>{badge}</span>}
    </button>
  );
}

function SourceTag({ source, showConfidence, confidence }) {
  const colors = {
    'Greenhouse': V.teal,
    'Lever': V.blue,
    'Ashby': V.violet,
    'Workday': V.amber,
    'H-1B Disclosure': '#059669',
    'PERM Disclosure': '#059669',
    'BLS OEWS': '#059669',
    'SEC Proxy': '#059669',
    'User Submission': V.rose,
  };
  const c = colors[source] || V.blue;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ padding: "2px 7px", borderRadius: 4, background: `${c}15`, color: c, fontSize: 10, fontWeight: 600, fontFamily: "var(--font-mono)" }}>{source || "Unknown"}</span>
      {showConfidence && confidence && (
        <span style={{ fontSize: 9, color: V.inkFaint }}>{confidence}%</span>
      )}
    </span>
  );
}

// SearchBar component - isolated to prevent focus loss
function SearchBar({ onSearch, onClear, hasActiveSearch }) {
  const [value, setValue] = useState("");
  
  const handleSubmit = () => {
    onSearch(value);
  };
  
  const handleClear = () => {
    setValue("");
    onClear();
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch(value);
    }
  };
  
  return (
    <div style={{ display: "flex", gap: 0 }}>
      <input 
        type="text"
        value={value} 
        onChange={(e) => setValue(e.target.value)} 
        onKeyDown={handleKeyDown}
        placeholder="Search company, title, skill…" 
        autoComplete="off" 
        style={{ padding: "7px 14px", borderRadius: "7px 0 0 7px", border: `1px solid ${V.border}`, borderRight: "none", background: V.surface, color: V.ink, fontSize: 13, width: 200, fontFamily: "var(--font-body)" }} 
      />
      <button 
        type="button"
        onClick={handleSubmit}
        style={{ padding: "7px 14px", borderRadius: "0 7px 7px 0", border: `1px solid ${V.teal}`, background: V.teal, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}
      >
        Search
      </button>
      {hasActiveSearch && (
        <button 
          type="button"
          onClick={handleClear}
          style={{ marginLeft: 6, padding: "7px 10px", borderRadius: 7, border: `1px solid ${V.border}`, background: "transparent", color: V.inkMuted, fontSize: 12, cursor: "pointer" }}
        >
          Clear
        </button>
      )}
    </div>
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
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>
                <button onClick={() => toggle(col.key)} style={{ display: "flex", alignItems: "center", gap: 4, width: "100%", justifyContent: col.align === "right" ? "flex-end" : "flex-start", padding: "11px 14px", background: V.bgWarm, color: V.inkMuted, border: "none", borderBottom: `1px solid ${V.border}`, fontWeight: 600, fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", cursor: "pointer", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
                  {col.label}{sortKey === col.key && <span style={{ fontSize: 10 }}>{sortDir === "asc" ? " ↑" : " ↓"}</span>}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={row.id ?? i} style={{ borderBottom: `1px solid ${V.borderLight}` }} onMouseEnter={e => e.currentTarget.style.background = V.bgWarm} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              {columns.map(col => (
                <td key={col.key} style={{ padding: "10px 14px", color: V.inkSoft, textAlign: col.align || "left", whiteSpace: "nowrap" }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > maxRows && (
        <p style={{ padding: 12, textAlign: "center", color: V.inkFaint, fontSize: 12, background: V.bgWarm, margin: 0 }}>
          Showing {fmtNum(maxRows)} of {fmtNum(data.length)} records
        </p>
      )}
    </div>
  );
}

function BandBar({ min, max, p25, p50, p75, gMin, gMax }) {
  const s = v => ((v - gMin) / (gMax - gMin)) * 100;
  return (
    <div style={{ position: "relative", height: 24, background: V.surfaceMuted, borderRadius: 4 }}>
      <div style={{ position: "absolute", left: `${s(min)}%`, width: `${Math.max(s(max) - s(min), 1)}%`, top: 4, height: 16, background: V.tealMuted, borderRadius: 3, border: `1px solid ${V.teal}30` }} />
      <div style={{ position: "absolute", left: `${s(p25)}%`, top: 3, width: 2, height: 18, background: V.blue, borderRadius: 1 }} />
      <div style={{ position: "absolute", left: `${s(p50)}%`, top: 1, width: 3, height: 22, background: V.teal, borderRadius: 1 }} />
      <div style={{ position: "absolute", left: `${s(p75)}%`, top: 3, width: 2, height: 18, background: V.amber, borderRadius: 1 }} />
    </div>
  );
}

const chartTooltipStyle = { background: V.surface, border: `1px solid ${V.border}`, borderRadius: 8, fontSize: 12, fontFamily: "var(--font-body)", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" };

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

export default function Banded() {
  const [tab, setTab] = useState("dashboard");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState("loading");
  const [submissions, setSubmissions] = useState([]);
  const [dataSources, setDataSources] = useState([]);
  const [sourceStats, setSourceStats] = useState({});
  
  // Filters
  const [famF, setFamF] = useState("All");
  const [metF, setMetF] = useState("All");
  const [sizeF, setSizeF] = useState("All");
  const [lvlF, setLvlF] = useState("All");
  const [q, setQ] = useState("");
  const [bandFam, setBandFam] = useState("Software Engineering");
  const [bandMet, setBandMet] = useState("All");
  
  // Admin mode
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsAdmin(params.get('admin') === 'true');
  }, []);

  // Fetch main comp data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const { data: compData, error } = await supabase
          .from('comp_data')
          .select('*')
          .eq('status', 'approved')
          .order('scraped_at', { ascending: false })
          .limit(10000);
        
        if (error) throw error;
        
        if (compData && compData.length > 0) {
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
            scrapedAt: r.scraped_at,
            confidence: r.confidence_score || 80,
            jobUrl: r.job_url,
          }));
          setData(transformed);
          setDataSource("database");
          
          // Calculate source stats
          const stats = {};
          transformed.forEach(r => {
            if (!stats[r.source]) {
              stats[r.source] = { count: 0, latestDate: null, avgConfidence: 0, confidenceSum: 0 };
            }
            stats[r.source].count++;
            stats[r.source].confidenceSum += (r.confidence || 80);
            if (!stats[r.source].latestDate || new Date(r.scrapedAt) > new Date(stats[r.source].latestDate)) {
              stats[r.source].latestDate = r.scrapedAt;
            }
          });
          Object.keys(stats).forEach(k => {
            stats[k].avgConfidence = Math.round(stats[k].confidenceSum / stats[k].count);
          });
          setSourceStats(stats);
        } else {
          setData([]);
          setDataSource("empty");
        }
      } catch (err) {
        console.error("Error fetching from Supabase:", err);
        setData([]);
        setDataSource("error");
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // Fetch data sources health
  useEffect(() => {
    async function fetchSources() {
      try {
        const { data: sources, error } = await supabase
          .from('data_sources')
          .select('*')
          .order('source_name');
        
        if (!error && sources) {
          setDataSources(sources);
        }
      } catch (err) {
        console.error("Error fetching sources:", err);
      }
    }
    fetchSources();
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

  // Derived data
  const filtered = useMemo(() => data.filter(r => {
    if (famF !== "All" && r.family !== famF) return false;
    if (metF !== "All" && r.metro !== metF) return false;
    if (sizeF !== "All" && r.size !== sizeF) return false;
    if (lvlF !== "All" && r.code !== lvlF) return false;
    if (q) {
      const lq = q.toLowerCase();
      return r.company?.toLowerCase().includes(lq) || r.title?.toLowerCase().includes(lq) || (r.skills || []).some(s => s.toLowerCase().includes(lq));
    }
    return true;
  }), [data, famF, metF, sizeF, lvlF, q]);

  const stats = useMemo(() => {
    if (!filtered.length) return { med: 0, p25: 0, p75: 0, p90: 0, n: 0, cos: 0, sources: 0 };
    const m = filtered.map(r => r.mid).filter(x => x);
    const uniqueSources = new Set(filtered.map(r => r.source));
    return {
      med: pct(m, 50),
      p25: pct(m, 25),
      p75: pct(m, 75),
      p90: pct(m, 90),
      n: filtered.length,
      cos: new Set(filtered.map(r => r.company)).size,
      sources: uniqueSources.size,
    };
  }, [filtered]);

  const geoData = useMemo(() => {
    const bm = {};
    filtered.forEach(r => {
      if (!r.metro) return;
      if (!bm[r.metro]) bm[r.metro] = { mids: [], n: 0, state: r.state, region: r.region };
      if (r.mid) {
        bm[r.metro].mids.push(r.mid);
        bm[r.metro].n++;
      }
    });
    return Object.entries(bm)
      .filter(([_, d]) => d.mids.length > 0)
      .map(([metro, d]) => ({
        metro,
        state: d.state,
        region: d.region,
        median: Math.round(pct(d.mids, 50)),
        p25: Math.round(pct(d.mids, 25)),
        p75: Math.round(pct(d.mids, 75)),
        postings: d.n
      }))
      .sort((a, b) => b.median - a.median);
  }, [filtered]);

  const sourceBreakdown = useMemo(() => {
    const counts = {};
    data.forEach(r => {
      const src = r.source || 'Unknown';
      counts[src] = (counts[src] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const bandRows = useMemo(() => {
    const cfg = JOB_FAMILIES[bandFam];
    if (!cfg) return [];
    return cfg.levels.map((lv, i) => {
      const mx = data.filter(r => r.family === bandFam && r.title === lv && (bandMet === "All" || r.metro === bandMet));
      if (!mx.length) {
        const bM = cfg.base[0] + (cfg.base[1] - cfg.base[0]) * (i / (cfg.levels.length - 1)) * 0.7;
        const m = bM * 1.1;
        return { level: lv, code: cfg.codes[i], p25: Math.round(m * .88), p50: Math.round(m), p75: Math.round(m * 1.15), p90: Math.round(m * 1.3), min: Math.round(m * .82), max: Math.round(m * 1.35), n: 0 };
      }
      const ms = mx.map(r => r.mid).filter(x => x);
      return {
        level: lv,
        code: cfg.codes[i],
        p25: Math.round(pct(ms, 25)),
        p50: Math.round(pct(ms, 50)),
        p75: Math.round(pct(ms, 75)),
        p90: Math.round(pct(ms, 90)),
        min: Math.round(pct(ms, 10)),
        max: Math.round(pct(ms, 90)),
        n: mx.length
      };
    });
  }, [data, bandFam, bandMet]);

  // Navigation pages
  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const pages = [
    { key: "dashboard", label: "Dashboard", icon: "◉" },
    { key: "explore", label: "Explore", icon: "⬡" },
    { key: "bands", label: "Band Builder", icon: "▤" },
    { key: "sources", label: "Data Sources", icon: "◈" },
    { key: "contribute", label: "Contribute", icon: "✦" },
    ...(isAdmin ? [{ key: "admin", label: "Admin Review", icon: "⚙", badge: pendingCount > 0 ? pendingCount : null }] : []),
  ];

  // Search is handled by SearchBar component
  
  const filterBarContent = (
    <div className="fade-up fade-up-1" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <SearchBar 
          onSearch={(term) => setQ(term)} 
          onClear={() => setQ("")} 
          hasActiveSearch={!!q} 
        />
        <span style={{ width: 1, height: 20, background: V.border }} />
        <span style={{ fontSize: 10, color: V.inkFaint, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Family</span>
        <Pill active={famF === "All"} onClick={() => setFamF("All")}>All</Pill>
        {Object.keys(JOB_FAMILIES).map(f => <Pill key={f} active={famF === f} onClick={() => setFamF(f)}>{f}</Pill>)}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, color: V.inkFaint, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-mono)", minWidth: 44 }}>Metro</span>
        <Pill active={metF === "All"} onClick={() => setMetF("All")}>All</Pill>
        {["San Francisco", "New York", "Seattle", "Denver", "Austin", "Boston", "Chicago", "Los Angeles", "Remote"].map(m => <Pill key={m} active={metF === m} onClick={() => setMetF(m)}>{m}</Pill>)}
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

  // ============================================================================
  // PAGE COMPONENTS
  // ============================================================================

  const Dashboard = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {dataSource === "empty" && (
        <div style={{ padding: "14px 18px", background: V.amberMuted, border: `1px solid ${V.amber}30`, borderRadius: 8 }}>
          <p style={{ margin: 0, fontSize: 13, color: V.amber }}>📊 No data yet. Run your scrapers or add data via the Contribute page.</p>
        </div>
      )}
      {filterBarContent}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <Metric label="Median Comp" value={stats.med ? fmtK(stats.med) : "—"} detail={stats.med ? `P25: ${fmtK(stats.p25)} · P75: ${fmtK(stats.p75)}` : "No data"} delay={0} />
        <Metric label="Data Points" value={fmtNum(stats.n)} detail={`${fmtNum(stats.cos)} companies`} accent={V.blue} delay={1} />
        <Metric label="Data Sources" value={stats.sources} detail={`${sourceBreakdown.length} active`} accent={V.violet} delay={2} />
        <Metric label="90th Percentile" value={stats.p90 ? fmtK(stats.p90) : "—"} detail="Top-of-market" accent={V.amber} delay={3} />
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
        <section style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 22 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: V.ink }}>Pay by Metro</h3>
          <p style={{ fontSize: 11, color: V.inkFaint, marginTop: 2, marginBottom: 16 }}>Median total comp</p>
          {geoData.length > 0 ? (
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={geoData.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={V.borderLight} />
                <XAxis type="number" tick={{ fill: V.inkFaint, fontSize: 11 }} tickFormatter={v => fmtK(v)} axisLine={{ stroke: V.border }} />
                <YAxis type="category" dataKey="metro" tick={{ fill: V.inkMuted, fontSize: 11 }} width={100} axisLine={{ stroke: V.border }} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={v => fmt(v)} />
                <Bar dataKey="median" fill={V.teal} radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 270, display: "flex", alignItems: "center", justifyContent: "center", color: V.inkFaint }}>No geographic data available</div>
          )}
        </section>
        
        <section style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 22 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: V.ink }}>Data by Source</h3>
          <p style={{ fontSize: 11, color: V.inkFaint, marginTop: 2, marginBottom: 16 }}>Record distribution</p>
          {sourceBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={270}>
              <PieChart>
                <Pie data={sourceBreakdown.slice(0, 6)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {sourceBreakdown.slice(0, 6).map((_, i) => <Cell key={i} fill={V.chartSet[i % V.chartSet.length]} />)}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} formatter={v => fmtNum(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 270, display: "flex", alignItems: "center", justifyContent: "center", color: V.inkFaint }}>No source data available</div>
          )}
        </section>
      </div>
    </div>
  );

  const Explore = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {filterBarContent}
      <p style={{ fontSize: 13, color: V.inkMuted, margin: 0 }}><strong style={{ color: V.teal }}>{fmtNum(filtered.length)}</strong> records</p>
      <SortableTable data={filtered} maxRows={100} columns={[
        { key: "company", label: "Company", render: (v, r) => <span><strong style={{ color: V.ink }}>{v}</strong></span> },
        { key: "title", label: "Title" },
        { key: "code", label: "Level", align: "center", render: v => <span className="mono" style={{ fontSize: 11, color: V.blue, fontWeight: 600 }}>{v}</span> },
        { key: "metro", label: "Metro" },
        { key: "mid", label: "Midpoint", align: "right", render: v => <span className="mono" style={{ color: V.tealDark, fontWeight: 600 }}>{v ? fmt(v) : "—"}</span> },
        { key: "source", label: "Source", render: (v, r) => <SourceTag source={v} showConfidence confidence={r.confidence} /> },
        { key: "scrapedAt", label: "Added", render: v => <span style={{ fontSize: 11, color: V.inkFaint }}>{timeAgo(v)}</span> },
      ]} />
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
          {bandRows.map((b, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "150px 50px 1fr 70px 70px 70px 50px", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${V.borderLight}` }}>
              <span style={{ color: V.ink, fontWeight: 600, fontSize: 13 }}>{b.level}</span>
              <span className="mono" style={{ fontSize: 11, color: V.blue }}>{b.code}</span>
              <BandBar min={b.min} max={b.max} p25={b.p25} p50={b.p50} p75={b.p75} gMin={gMin || 50000} gMax={gMax || 500000} />
              <span className="mono" style={{ fontSize: 12, color: V.inkMuted, textAlign: "right" }}>{fmtK(b.p25)}</span>
              <span className="mono" style={{ fontSize: 12, color: V.tealDark, textAlign: "right", fontWeight: 600 }}>{fmtK(b.p50)}</span>
              <span className="mono" style={{ fontSize: 12, color: V.inkMuted, textAlign: "right" }}>{fmtK(b.p75)}</span>
              <span style={{ fontSize: 10, color: V.inkFaint, textAlign: "right" }}>n={b.n}</span>
            </div>
          ))}
        </section>
      </div>
    );
  };

  const DataSources = () => {
    const sourceList = Object.entries(sourceStats).map(([name, stats]) => ({
      name,
      count: stats.count,
      lastUpdate: stats.latestDate,
      avgConfidence: stats.avgConfidence,
    })).sort((a, b) => b.count - a.count);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Metric label="Total Sources" value={sourceList.length} detail="Active data pipelines" />
          <Metric label="Total Records" value={fmtNum(data.length)} detail="In database" accent={V.blue} delay={1} />
          <Metric label="Avg Confidence" value={`${Math.round(sourceList.reduce((a, s) => a + s.avgConfidence, 0) / sourceList.length || 0)}%`} detail="Data quality score" accent={V.teal} delay={2} />
        </div>
        
        <section style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 22 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: V.ink, marginBottom: 16 }}>Source Health</h3>
          <SortableTable data={sourceList} columns={[
            { key: "name", label: "Source", render: v => <SourceTag source={v} /> },
            { key: "count", label: "Records", align: "right", render: v => <span className="mono">{fmtNum(v)}</span> },
            { key: "avgConfidence", label: "Confidence", align: "right", render: v => {
              const c = v >= 80 ? V.teal : v >= 60 ? V.amber : V.rose;
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                  <div style={{ width: 50, height: 5, background: V.surfaceMuted, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${v}%`, height: "100%", background: c, borderRadius: 3 }} />
                  </div>
                  <span className="mono" style={{ fontSize: 11, color: c, fontWeight: 600, width: 35 }}>{v}%</span>
                </div>
              );
            }},
            { key: "lastUpdate", label: "Last Update", render: v => <span style={{ fontSize: 11, color: V.inkFaint }}>{timeAgo(v)}</span> },
          ]} />
        </section>
        
        <section style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 22 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: V.ink, marginBottom: 8 }}>About Data Quality</h3>
          <p style={{ fontSize: 13, color: V.inkMuted, lineHeight: 1.6, margin: 0 }}>
            Confidence scores reflect data reliability. Government sources (H-1B, BLS) score highest (90-100%) as they contain verified salary data. 
            Job board postings (Greenhouse, Lever) score 70-85% based on salary range completeness. 
            User submissions start at 70% and increase after verification.
          </p>
        </section>
      </div>
    );
  };

  const Contribute = () => {
    const [formData, setFormData] = useState({ jobTitle: '', company: '', baseSalary: '', yoe: '', metro: '', jobFamily: '' });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      // Prevent double submission
      if (isSubmitting) return;
      
      setIsSubmitting(true);
      setStatus({ type: 'info', message: 'Submitting...' });

      // Validate salary
      const salary = parseInt(formData.baseSalary);
      if (isNaN(salary) || salary < 20000 || salary > 2000000) {
        setStatus({ type: 'error', message: 'Please enter a valid salary between $20,000 and $2,000,000.' });
        setIsSubmitting(false);
        return;
      }

      try {
        const { data: result, error } = await supabase
          .from('submissions')
          .insert([{
            job_title: formData.jobTitle.trim(),
            company: formData.company.trim(),
            job_family: formData.jobFamily,
            base_salary: salary,
            years_of_exp: parseInt(formData.yoe) || null,
            metro: formData.metro,
            status: 'pending',
            confidence_score: 70,
          }])
          .select();

        if (error) {
          console.error("Submission error:", error);
          setStatus({ type: 'error', message: `Failed to submit: ${error.message}` });
          setIsSubmitting(false);
          return;
        }

        // Success!
        setStatus({ type: 'success', message: 'Thank you! Your submission is pending review and will appear once approved.' });
        setFormData({ jobTitle: '', company: '', baseSalary: '', yoe: '', metro: '', jobFamily: '' });
        
      } catch (err) {
        console.error("Unexpected error:", err);
        setStatus({ type: 'error', message: 'An unexpected error occurred. Please try again.' });
      }
      
      setIsSubmitting(false);
    };

    const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 7, border: `1px solid ${V.border}`, background: V.surface, color: V.ink, fontSize: 14, fontFamily: 'var(--font-body)' };
    const labelStyle = { display: 'block', fontSize: 11, color: V.inkMuted, marginBottom: 6, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' };

    return (
      <div style={{ maxWidth: 720 }}>
        <section style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 400, color: V.ink, fontFamily: 'var(--font-display)', margin: 0 }}>Anonymously Share Your Comp</h2>
          <p style={{ fontSize: 13, color: V.inkMuted, marginTop: 8, marginBottom: 24 }}>
            Help build the most comprehensive compensation database. All submissions are anonymous and reviewed before publishing.
          </p>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={labelStyle}>Job Title *</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Senior Software Engineer" 
                value={formData.jobTitle} 
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} 
                style={inputStyle}
                disabled={isSubmitting}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Company *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Stripe" 
                  value={formData.company} 
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })} 
                  style={inputStyle}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label style={labelStyle}>Job Family *</label>
                <select 
                  required 
                  value={formData.jobFamily} 
                  onChange={(e) => setFormData({ ...formData, jobFamily: e.target.value })} 
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  disabled={isSubmitting}
                >
                  <option value="">Select...</option>
                  {Object.keys(JOB_FAMILIES).map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Base Salary (USD) *</label>
                <input 
                  type="number" 
                  required 
                  placeholder="150000" 
                  value={formData.baseSalary} 
                  onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })} 
                  style={inputStyle}
                  min="20000"
                  max="2000000"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label style={labelStyle}>Years of Exp</label>
                <input 
                  type="number" 
                  placeholder="5" 
                  value={formData.yoe} 
                  onChange={(e) => setFormData({ ...formData, yoe: e.target.value })} 
                  style={inputStyle}
                  min="0"
                  max="50"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label style={labelStyle}>Metro *</label>
                <select 
                  required 
                  value={formData.metro} 
                  onChange={(e) => setFormData({ ...formData, metro: e.target.value })} 
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  disabled={isSubmitting}
                >
                  <option value="">Select...</option>
                  {METROS.map(m => <option key={m.name} value={m.name}>{m.name}, {m.state}</option>)}
                </select>
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmitting} 
              style={{ 
                marginTop: 8, 
                padding: '12px 24px', 
                borderRadius: 7, 
                border: 'none', 
                background: isSubmitting ? V.inkFaint : V.teal, 
                color: '#fff', 
                fontSize: 14, 
                fontWeight: 600, 
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s ease'
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Anonymously'}
            </button>
            
            {status.message && (
              <div style={{ 
                marginTop: 8, 
                padding: '12px 16px', 
                borderRadius: 7, 
                background: status.type === 'success' ? V.tealMuted : status.type === 'error' ? V.roseMuted : V.blueMuted,
                border: `1px solid ${status.type === 'success' ? V.teal : status.type === 'error' ? V.rose : V.blue}30`
              }}>
                <p style={{ margin: 0, fontSize: 13, color: status.type === 'success' ? V.tealDark : status.type === 'error' ? V.rose : V.blue }}>
                  {status.message}
                </p>
              </div>
            )}
          </form>
        </section>
        
        <section style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 24, marginTop: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: V.ink, marginBottom: 12 }}>What happens to your data?</h3>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: V.inkMuted, lineHeight: 1.8 }}>
            <li>Your submission is completely anonymous - we don't collect any identifying information</li>
            <li>Data is reviewed for accuracy before being added to the database</li>
            <li>Approved submissions appear with a "User Submission" source tag</li>
            <li>All data contributes to more accurate salary bands for everyone</li>
          </ul>
        </section>
      </div>
    );
  };

  const AdminReview = () => {
    const [actionLoading, setActionLoading] = useState(null);
    const [adminTab, setAdminTab] = useState('pending');
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    const startEdit = (sub) => {
      setEditingId(sub.id);
      setEditForm({
        job_title: sub.job_title,
        company: sub.company,
        job_family: sub.job_family,
        base_salary: sub.base_salary,
        metro: sub.metro,
      });
    };

    const cancelEdit = () => {
      setEditingId(null);
      setEditForm({});
    };

    const saveEdit = async (id) => {
      setActionLoading(id);
      try {
        const { error } = await supabase
          .from('submissions')
          .update({
            job_title: editForm.job_title,
            company: editForm.company,
            job_family: editForm.job_family,
            base_salary: parseInt(editForm.base_salary),
            metro: editForm.metro,
          })
          .eq('id', id);
        
        if (error) {
          alert("Failed to save: " + error.message);
        } else {
          setSubmissions(s => s.map(x => x.id === id ? { ...x, ...editForm, base_salary: parseInt(editForm.base_salary) } : x));
          setEditingId(null);
          setEditForm({});
        }
      } catch (err) {
        alert("Error: " + err.message);
      }
      setActionLoading(null);
    };

    const handleApprove = async (id, sub) => {
      // Check if already approved to prevent duplicates
      if (sub.status === 'approved') {
        alert("This submission has already been approved.");
        return;
      }
      
      setActionLoading(id);
      try {
        // Add to comp_data
        const insertData = {
          company: sub.company,
          family: sub.job_family,
          title: sub.job_title,
          metro: sub.metro,
          midpoint: sub.base_salary,
          salary_min: Math.round(sub.base_salary * 0.9),
          salary_max: Math.round(sub.base_salary * 1.1),
          source: 'User Submission',
          status: 'approved',
        };
        
        const { error: insertError } = await supabase.from('comp_data').insert([insertData]);
        
        if (insertError) {
          console.error("Insert error:", insertError);
          alert("Failed to add to comp_data: " + insertError.message);
          setActionLoading(null);
          return;
        }
        
        // Update submission status
        const { error: updateError } = await supabase
          .from('submissions')
          .update({ status: 'approved' })
          .eq('id', id);
        
        if (updateError) {
          console.error("Update error:", updateError);
        }
        
        // Update local state
        setSubmissions(s => s.map(x => x.id === id ? { ...x, status: 'approved' } : x));
        
      } catch (err) {
        console.error("Approve error:", err);
        alert("Failed to approve: " + err.message);
      }
      setActionLoading(null);
    };

    const handleReject = async (id) => {
      setActionLoading(id);
      try {
        const { error } = await supabase
          .from('submissions')
          .update({ status: 'rejected' })
          .eq('id', id);
        
        if (error) {
          console.error("Reject error:", error);
        }
        
        setSubmissions(s => s.map(x => x.id === id ? { ...x, status: 'rejected' } : x));
      } catch (err) {
        console.error("Reject error:", err);
      }
      setActionLoading(null);
    };

    const handleDelete = async (id) => {
      if (!confirm("Delete this submission permanently?")) return;
      
      setActionLoading(id);
      try {
        const { error } = await supabase
          .from('submissions')
          .delete()
          .eq('id', id);
        
        if (!error) {
          setSubmissions(s => s.filter(x => x.id !== id));
        }
      } catch (err) {
        console.error("Delete error:", err);
      }
      setActionLoading(null);
    };

    const pending = submissions.filter(s => s.status === 'pending');
    const approved = submissions.filter(s => s.status === 'approved');
    const rejected = submissions.filter(s => s.status === 'rejected');

    const inputStyle = { padding: '6px 10px', borderRadius: 5, border: `1px solid ${V.border}`, fontSize: 12, width: '100%' };

    const renderEditableRow = (row) => {
      if (editingId === row.id) {
        return (
          <tr key={row.id} style={{ background: V.bgWarm }}>
            <td style={{ padding: 10 }}>
              <input style={inputStyle} value={editForm.job_title} onChange={e => setEditForm({...editForm, job_title: e.target.value})} />
            </td>
            <td style={{ padding: 10 }}>
              <input style={inputStyle} value={editForm.company} onChange={e => setEditForm({...editForm, company: e.target.value})} />
            </td>
            <td style={{ padding: 10 }}>
              <select style={inputStyle} value={editForm.job_family} onChange={e => setEditForm({...editForm, job_family: e.target.value})}>
                {Object.keys(JOB_FAMILIES).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </td>
            <td style={{ padding: 10 }}>
              <input style={inputStyle} type="number" value={editForm.base_salary} onChange={e => setEditForm({...editForm, base_salary: e.target.value})} />
            </td>
            <td style={{ padding: 10 }}>
              <select style={inputStyle} value={editForm.metro} onChange={e => setEditForm({...editForm, metro: e.target.value})}>
                {METROS.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
              </select>
            </td>
            <td style={{ padding: 10 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => saveEdit(row.id)} style={{ padding: "4px 10px", borderRadius: 4, border: "none", background: V.teal, color: "#fff", fontSize: 11, cursor: "pointer" }}>Save</button>
                <button onClick={cancelEdit} style={{ padding: "4px 10px", borderRadius: 4, border: `1px solid ${V.border}`, background: "transparent", color: V.inkMuted, fontSize: 11, cursor: "pointer" }}>Cancel</button>
              </div>
            </td>
          </tr>
        );
      }
      return null;
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ padding: "12px 16px", background: V.blueMuted, border: `1px solid ${V.blue}30`, borderRadius: 8 }}>
          <p style={{ margin: 0, fontSize: 13, color: V.blue }}>
            🔒 Admin view. {pending.length} pending · {approved.length} approved · {rejected.length} rejected
          </p>
        </div>
        
        {/* Tabs */}
        <div style={{ display: "flex", gap: 8 }}>
          <Pill active={adminTab === 'pending'} onClick={() => setAdminTab('pending')}>
            Pending ({pending.length})
          </Pill>
          <Pill active={adminTab === 'approved'} onClick={() => setAdminTab('approved')}>
            Approved ({approved.length})
          </Pill>
          <Pill active={adminTab === 'rejected'} onClick={() => setAdminTab('rejected')}>
            Rejected ({rejected.length})
          </Pill>
        </div>
        
        {/* Pending Tab */}
        {adminTab === 'pending' && (
          <section style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 22 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: V.ink, marginBottom: 16 }}>Pending Submissions</h3>
            {pending.length === 0 ? (
              <p style={{ color: V.inkMuted, fontSize: 13 }}>No pending submissions. 🎉</p>
            ) : (
              <div style={{ overflowX: "auto", borderRadius: 8, border: `1px solid ${V.border}` }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      {["Title", "Company", "Family", "Salary", "Metro", "Actions"].map(h => (
                        <th key={h} style={{ padding: "11px 14px", background: V.bgWarm, color: V.inkMuted, border: "none", borderBottom: `1px solid ${V.border}`, fontWeight: 600, fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", textAlign: "left", fontFamily: "var(--font-mono)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map(row => (
                      editingId === row.id ? renderEditableRow(row) : (
                        <tr key={row.id} style={{ borderBottom: `1px solid ${V.borderLight}` }}>
                          <td style={{ padding: "10px 14px" }}><strong style={{ color: V.ink }}>{row.job_title}</strong></td>
                          <td style={{ padding: "10px 14px", color: V.inkSoft }}>{row.company}</td>
                          <td style={{ padding: "10px 14px", color: V.inkSoft }}>{row.job_family}</td>
                          <td style={{ padding: "10px 14px" }}><span className="mono">{fmt(row.base_salary)}</span></td>
                          <td style={{ padding: "10px 14px", color: V.inkSoft }}>{row.metro}</td>
                          <td style={{ padding: "10px 14px" }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => startEdit(row)} style={{ padding: "4px 10px", borderRadius: 4, border: `1px solid ${V.border}`, background: "transparent", color: V.inkMuted, fontSize: 11, cursor: "pointer" }}>Edit</button>
                              <button onClick={() => handleApprove(row.id, row)} disabled={actionLoading === row.id} style={{ padding: "4px 10px", borderRadius: 4, border: "none", background: V.teal, color: "#fff", fontSize: 11, cursor: "pointer", opacity: actionLoading === row.id ? 0.5 : 1 }}>{actionLoading === row.id ? '...' : 'Approve'}</button>
                              <button onClick={() => handleReject(row.id)} disabled={actionLoading === row.id} style={{ padding: "4px 10px", borderRadius: 4, border: `1px solid ${V.rose}`, background: "transparent", color: V.rose, fontSize: 11, cursor: "pointer" }}>Reject</button>
                            </div>
                          </td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
        
        {/* Approved Tab */}
        {adminTab === 'approved' && (
          <section style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 22 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: V.ink, marginBottom: 16 }}>Approved Submissions</h3>
            <p style={{ fontSize: 12, color: V.inkFaint, marginBottom: 16 }}>These have been added to comp_data.</p>
            {approved.length === 0 ? (
              <p style={{ color: V.inkMuted, fontSize: 13 }}>No approved submissions yet.</p>
            ) : (
              <SortableTable data={approved} columns={[
                { key: "job_title", label: "Title", render: v => <strong style={{ color: V.ink }}>{v}</strong> },
                { key: "company", label: "Company" },
                { key: "job_family", label: "Family" },
                { key: "base_salary", label: "Salary", align: "right", render: v => <span className="mono">{fmt(v)}</span> },
                { key: "metro", label: "Metro" },
                { key: "actions", label: "", render: (_, row) => (
                  <button onClick={() => handleDelete(row.id)} style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${V.border}`, background: "transparent", color: V.inkFaint, fontSize: 10, cursor: "pointer" }}>Delete</button>
                )}
              ]} />
            )}
          </section>
        )}
        
        {/* Rejected Tab */}
        {adminTab === 'rejected' && (
          <section style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 10, padding: 22 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: V.ink, marginBottom: 16 }}>Rejected Submissions</h3>
            {rejected.length === 0 ? (
              <p style={{ color: V.inkMuted, fontSize: 13 }}>No rejected submissions.</p>
            ) : (
              <SortableTable data={rejected} columns={[
                { key: "job_title", label: "Title", render: v => <strong style={{ color: V.ink }}>{v}</strong> },
                { key: "company", label: "Company" },
                { key: "job_family", label: "Family" },
                { key: "base_salary", label: "Salary", align: "right", render: v => <span className="mono">{fmt(v)}</span> },
                { key: "metro", label: "Metro" },
                { key: "actions", label: "", render: (_, row) => (
                  <button onClick={() => handleDelete(row.id)} style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${V.border}`, background: "transparent", color: V.inkFaint, fontSize: 10, cursor: "pointer" }}>Delete</button>
                )}
              ]} />
            )}
          </section>
        )}
      </div>
    );
  };

  const content = { dashboard: Dashboard, explore: Explore, bands: Bands, sources: DataSources, contribute: Contribute, admin: AdminReview };
  const Page = content[tab] || Dashboard;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div style={{ minHeight: "100vh", background: V.bg, color: V.ink, fontFamily: "var(--font-body)", display: "flex" }}>
      <style>{GLOBAL_CSS}</style>
      
      {/* Sidebar */}
      <nav style={{ width: 220, minHeight: "100vh", background: V.surface, borderRight: `1px solid ${V.border}`, padding: "20px 12px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "0 12px", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: V.teal, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="2" rx="1" fill="white" /><rect x="4" y="7" width="8" height="2" rx="1" fill="white" opacity="0.7" /><rect x="3" y="11" width="10" height="2" rx="1" fill="white" opacity="0.4" /></svg>
            </div>
            <div>
              <p style={{ fontSize: 17, fontWeight: 400, color: V.ink, fontFamily: "var(--font-display)", margin: 0 }}>Banded</p>
              <p style={{ fontSize: 9, color: V.inkFaint, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "var(--font-mono)", margin: 0 }}>Comp Intelligence</p>
            </div>
          </div>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {pages.map(p => (
            <NavBtn key={p.key} active={tab === p.key} onClick={() => setTab(p.key)} icon={p.icon} badge={p.badge}>
              {p.label}
            </NavBtn>
          ))}
        </div>
        
        <div style={{ marginTop: "auto", padding: "14px 12px", borderTop: `1px solid ${V.borderLight}` }}>
          <p style={{ fontSize: 10, color: V.inkFaint, lineHeight: 1.7, margin: 0 }}>
            <strong style={{ color: V.inkMuted }}>Status</strong><br />
            {dataSource === "database" ? `${fmtNum(data.length)} records` : dataSource === "empty" ? "No data" : "Loading..."}
          </p>
        </div>
      </nav>
      
      {/* Main content */}
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
