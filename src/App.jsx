import { useState, useMemo, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { supabase } from "./supabaseClient";

// ============================================================================
// DESIGN SYSTEM
// ============================================================================

const V = {
  // Backgrounds
  bg: "#F8FAFC", bgAlt: "#F1F5F9", surface: "#FFFFFF", surfaceHover: "#F8FAFC",
  // Borders
  border: "#E2E8F0", borderLight: "#F1F5F9",
  // Text
  ink: "#0F172A", inkSoft: "#334155", inkMuted: "#64748B", inkFaint: "#94A3B8",
  // Primary (teal)
  primary: "#0D9488", primaryDark: "#0F766E", primaryLight: "#CCFBF1", primaryMuted: "rgba(13,148,136,0.1)",
  // Accents
  blue: "#3B82F6", blueMuted: "rgba(59,130,246,0.1)",
  amber: "#F59E0B", amberMuted: "rgba(245,158,11,0.1)",
  rose: "#F43F5E", roseMuted: "rgba(244,63,94,0.1)",
  violet: "#8B5CF6", violetMuted: "rgba(139,92,246,0.1)",
  green: "#10B981", greenMuted: "rgba(16,185,129,0.1)",
  // Charts
  chartColors: ["#0D9488", "#3B82F6", "#F59E0B", "#F43F5E", "#8B5CF6", "#10B981"],
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { font-size: 16px; }
  body { 
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
    background: ${V.bg}; 
    color: ${V.ink}; 
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  button { font-family: inherit; }
  input, select { font-family: inherit; }
  
  /* Mobile-first responsive */
  @media (max-width: 768px) {
    html { font-size: 14px; }
  }
  
  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${V.border}; border-radius: 3px; }
  
  /* Animations */
  @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  .fade-in { animation: fadeIn 0.3s ease-out; }
  
  /* Focus states */
  :focus-visible { outline: 2px solid ${V.primary}; outline-offset: 2px; border-radius: 4px; }
`;

// ============================================================================
// DATA CONFIG
// ============================================================================

const JOB_FAMILIES = {
  "Software Engineering": { icon: "💻", levels: ["Junior", "Mid", "Senior", "Staff", "Principal", "Distinguished"], codes: ["L3", "L4", "L5", "L6", "L7", "L8"] },
  "Product Management": { icon: "📊", levels: ["Associate PM", "PM", "Senior PM", "Group PM", "Director", "VP"], codes: ["L3", "L4", "L5", "L6", "M1", "M2"] },
  "Data Science": { icon: "🔬", levels: ["Junior", "Data Scientist", "Senior DS", "Staff DS", "Principal DS"], codes: ["L3", "L4", "L5", "L6", "L7"] },
  "Design": { icon: "🎨", levels: ["Junior", "Designer", "Senior", "Staff", "Director"], codes: ["L3", "L4", "L5", "L6", "M1"] },
  "Marketing": { icon: "📢", levels: ["Coordinator", "Manager", "Senior Mgr", "Director", "VP"], codes: ["L3", "L4", "L5", "M1", "M2"] },
  "Sales": { icon: "💼", levels: ["SDR", "AE", "Senior AE", "Enterprise AE", "Director"], codes: ["L3", "L4", "L5", "L6", "M1"] },
  "People / HR": { icon: "👥", levels: ["Coordinator", "Generalist", "HRBP", "Senior HRBP", "Director"], codes: ["L3", "L4", "L5", "L6", "M1"] },
  "Operations": { icon: "⚙️", levels: ["Analyst", "Manager", "Senior Mgr", "Director", "VP"], codes: ["L3", "L4", "L5", "M1", "M2"] },
  "Finance": { icon: "💰", levels: ["Analyst", "Senior Analyst", "Manager", "Director", "VP"], codes: ["L3", "L4", "L5", "M1", "M2"] },
  "Customer Success": { icon: "🤝", levels: ["Associate", "CSM", "Senior CSM", "Manager", "Director"], codes: ["L3", "L4", "L5", "M1", "M2"] },
  "Other": { icon: "📁", levels: ["Entry", "Mid", "Senior", "Lead", "Director"], codes: ["L3", "L4", "L5", "L6", "M1"] },
};

const METROS = [
  { name: "San Francisco", state: "CA", abbr: "SF" },
  { name: "New York", state: "NY", abbr: "NYC" },
  { name: "Seattle", state: "WA", abbr: "SEA" },
  { name: "Austin", state: "TX", abbr: "AUS" },
  { name: "Denver", state: "CO", abbr: "DEN" },
  { name: "Boston", state: "MA", abbr: "BOS" },
  { name: "Chicago", state: "IL", abbr: "CHI" },
  { name: "Los Angeles", state: "CA", abbr: "LA" },
  { name: "Remote", state: "US", abbr: "RMT" },
];

// ============================================================================
// UTILITIES
// ============================================================================

const fmt = n => n ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n) : "—";
const fmtK = n => n ? "$" + Math.round(n / 1000) + "K" : "—";
const fmtNum = n => new Intl.NumberFormat("en-US").format(n);
const pct = (arr, p) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const i = (p / 100) * (s.length - 1);
  return Math.round(s[Math.floor(i)] + (s[Math.ceil(i)] - s[Math.floor(i)]) * (i - Math.floor(i)));
};

// ============================================================================
// REUSABLE COMPONENTS
// ============================================================================

function Card({ children, className = "", padding = true, ...props }) {
  return (
    <div 
      style={{ 
        background: V.surface, 
        borderRadius: 12, 
        border: `1px solid ${V.border}`,
        padding: padding ? 20 : 0,
        ...props.style 
      }}
      className={className}
    >
      {children}
    </div>
  );
}

function StatCard({ label, value, subtext, trend, icon }) {
  return (
    <Card style={{ minWidth: 150, flex: "1 1 200px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 500, color: V.inkMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: V.ink, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{value}</p>
          {subtext && <p style={{ fontSize: 12, color: V.inkFaint, marginTop: 4 }}>{subtext}</p>}
        </div>
        {icon && <span style={{ fontSize: 24, opacity: 0.6 }}>{icon}</span>}
      </div>
      {trend && (
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: trend > 0 ? V.green : V.rose, fontSize: 12, fontWeight: 600 }}>
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
          <span style={{ color: V.inkFaint, fontSize: 11 }}>vs last month</span>
        </div>
      )}
    </Card>
  );
}

function Button({ children, variant = "primary", size = "md", ...props }) {
  const styles = {
    primary: { background: V.primary, color: "#fff", border: "none" },
    secondary: { background: V.surface, color: V.ink, border: `1px solid ${V.border}` },
    ghost: { background: "transparent", color: V.inkMuted, border: "none" },
  };
  const sizes = {
    sm: { padding: "6px 12px", fontSize: 12 },
    md: { padding: "8px 16px", fontSize: 14 },
    lg: { padding: "12px 24px", fontSize: 16 },
  };
  return (
    <button
      {...props}
      style={{
        ...styles[variant],
        ...sizes[size],
        borderRadius: 8,
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.15s ease",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        ...props.style,
      }}
    >
      {children}
    </button>
  );
}

function Select({ value, onChange, options, placeholder, ...props }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        padding: "8px 32px 8px 12px",
        borderRadius: 8,
        border: `1px solid ${V.border}`,
        background: V.surface,
        color: V.ink,
        fontSize: 14,
        cursor: "pointer",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748B' d='M3 4.5L6 7.5L9 4.5'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
        minWidth: 140,
        ...props.style,
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => (
        <option key={opt.value ?? opt} value={opt.value ?? opt}>{opt.label ?? opt}</option>
      ))}
    </select>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, background: V.bgAlt, padding: 4, borderRadius: 10, overflow: "auto" }}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: active === tab.key ? V.surface : "transparent",
            color: active === tab.key ? V.ink : V.inkMuted,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: active === tab.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            transition: "all 0.15s ease",
          }}
        >
          {tab.icon && <span style={{ marginRight: 6 }}>{tab.icon}</span>}
          {tab.label}
          {tab.badge && (
            <span style={{ 
              marginLeft: 6, 
              padding: "2px 6px", 
              borderRadius: 10, 
              background: V.primary, 
              color: "#fff", 
              fontSize: 10, 
              fontWeight: 600 
            }}>
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function SearchInput({ value, onChange, onSearch, placeholder }) {
  return (
    <div style={{ display: "flex", gap: 0, flex: 1, maxWidth: 400 }}>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === "Enter" && onSearch()}
        placeholder={placeholder}
        style={{
          flex: 1,
          padding: "10px 14px",
          borderRadius: "8px 0 0 8px",
          border: `1px solid ${V.border}`,
          borderRight: "none",
          fontSize: 14,
          minWidth: 0,
        }}
      />
      <Button onClick={onSearch} style={{ borderRadius: "0 8px 8px 0" }}>Search</Button>
    </div>
  );
}

function DataTable({ data, columns, maxRows = 50 }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("desc");
  
  const sorted = useMemo(() => {
    if (!sortKey) return data.slice(0, maxRows);
    return [...data].sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      if (typeof va === "number") return sortDir === "asc" ? va - vb : vb - va;
      return sortDir === "asc" ? String(va || "").localeCompare(String(vb || "")) : String(vb || "").localeCompare(String(va || ""));
    }).slice(0, maxRows);
  }, [data, sortKey, sortDir, maxRows]);

  return (
    <div style={{ overflowX: "auto", borderRadius: 8, border: `1px solid ${V.border}` }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: V.bgAlt }}>
            {columns.map(col => (
              <th 
                key={col.key} 
                onClick={() => {
                  if (sortKey === col.key) setSortDir(d => d === "asc" ? "desc" : "asc");
                  else { setSortKey(col.key); setSortDir("desc"); }
                }}
                style={{ 
                  padding: "12px 16px", 
                  textAlign: col.align || "left", 
                  fontWeight: 600, 
                  fontSize: 11, 
                  color: V.inkMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                  userSelect: "none",
                  whiteSpace: "nowrap",
                  borderBottom: `1px solid ${V.border}`,
                }}
              >
                {col.label}
                {sortKey === col.key && <span style={{ marginLeft: 4 }}>{sortDir === "asc" ? "↑" : "↓"}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={row.id ?? i} style={{ borderBottom: `1px solid ${V.borderLight}` }}>
              {columns.map(col => (
                <td key={col.key} style={{ padding: "12px 16px", color: V.inkSoft, textAlign: col.align || "left" }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > maxRows && (
        <div style={{ padding: 12, textAlign: "center", background: V.bgAlt, borderTop: `1px solid ${V.border}` }}>
          <span style={{ fontSize: 12, color: V.inkMuted }}>Showing {maxRows} of {fmtNum(data.length)} records</span>
        </div>
      )}
    </div>
  );
}

function Badge({ children, color = V.primary }) {
  return (
    <span style={{
      padding: "3px 8px",
      borderRadius: 6,
      background: `${color}15`,
      color: color,
      fontSize: 11,
      fontWeight: 600,
    }}>
      {children}
    </span>
  );
}

function BandVisualization({ data, globalMin, globalMax }) {
  const scale = v => ((v - globalMin) / (globalMax - globalMin)) * 100;
  return (
    <div style={{ position: "relative", height: 28, background: V.bgAlt, borderRadius: 6 }}>
      {/* Range bar */}
      <div style={{
        position: "absolute",
        left: `${scale(data.p10)}%`,
        width: `${scale(data.p90) - scale(data.p10)}%`,
        top: 8,
        height: 12,
        background: V.primaryMuted,
        borderRadius: 4,
      }} />
      {/* IQR */}
      <div style={{
        position: "absolute",
        left: `${scale(data.p25)}%`,
        width: `${scale(data.p75) - scale(data.p25)}%`,
        top: 6,
        height: 16,
        background: `${V.primary}40`,
        borderRadius: 4,
      }} />
      {/* Median */}
      <div style={{
        position: "absolute",
        left: `${scale(data.p50)}%`,
        top: 2,
        width: 3,
        height: 24,
        background: V.primary,
        borderRadius: 2,
        transform: "translateX(-50%)",
      }} />
    </div>
  );
}

// ============================================================================
// MAIN APP
// ============================================================================

export default function Banded() {
  // State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState("loading");
  const [submissions, setSubmissions] = useState([]);
  const [tab, setTab] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [familyFilter, setFamilyFilter] = useState("All");
  const [metroFilter, setMetroFilter] = useState("All");
  const [levelFilter, setLevelFilter] = useState("All");
  
  // Band Builder
  const [bandFamily, setBandFamily] = useState("Software Engineering");
  const [bandMetro, setBandMetro] = useState("All");
  
  // Admin
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check admin
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsAdmin(params.get('admin') === 'true');
  }, []);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const { data: compData, error } = await supabase
          .from('comp_data')
          .select('*')
          .order('id', { ascending: false })
          .limit(10000);
        
        if (!error && compData?.length > 0) {
          const transformed = compData.map(r => ({
            id: r.id,
            company: r.company,
            title: r.title,
            family: r.family || "Other",
            metro: r.metro,
            state: r.state,
            sMin: r.salary_min,
            sMax: r.salary_max,
            mid: r.midpoint,
            source: r.source,
            status: r.status,
          }));
          setData(transformed);
          setDataSource("database");
        } else {
          setData([]);
          setDataSource("empty");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setData([]);
        setDataSource("error");
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // Fetch submissions for admin
  useEffect(() => {
    if (!isAdmin) return;
    async function fetchSubmissions() {
      const { data: subs } = await supabase
        .from('submissions')
        .select('*')
        .order('submitted_at', { ascending: false });
      if (subs) setSubmissions(subs);
    }
    fetchSubmissions();
  }, [isAdmin, tab]);

  // Filtered data
  const filtered = useMemo(() => {
    return data.filter(r => {
      if (familyFilter !== "All" && r.family !== familyFilter) return false;
      if (metroFilter !== "All" && r.metro !== metroFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return r.company?.toLowerCase().includes(q) || r.title?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [data, familyFilter, metroFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const mids = filtered.map(r => r.mid).filter(Boolean);
    const families = [...new Set(filtered.map(r => r.family))];
    const companies = [...new Set(filtered.map(r => r.company))];
    const sources = [...new Set(data.map(r => r.source))];
    return {
      count: filtered.length,
      totalRecords: data.length,
      median: pct(mids, 50),
      p25: pct(mids, 25),
      p75: pct(mids, 75),
      p90: pct(mids, 90),
      familyCount: families.length,
      companyCount: companies.length,
      sourceCount: sources.length,
    };
  }, [filtered, data]);

  // Charts data
  const familyStats = useMemo(() => {
    const byFamily = {};
    filtered.forEach(r => {
      if (!byFamily[r.family]) byFamily[r.family] = { mids: [], count: 0 };
      if (r.mid) {
        byFamily[r.family].mids.push(r.mid);
        byFamily[r.family].count++;
      }
    });
    return Object.entries(byFamily)
      .map(([family, d]) => ({
        family,
        icon: JOB_FAMILIES[family]?.icon || "📁",
        median: pct(d.mids, 50),
        p25: pct(d.mids, 25),
        p75: pct(d.mids, 75),
        count: d.count,
      }))
      .filter(d => d.count > 0)
      .sort((a, b) => b.median - a.median);
  }, [filtered]);

  const metroStats = useMemo(() => {
    const byMetro = {};
    filtered.forEach(r => {
      if (!r.metro) return;
      if (!byMetro[r.metro]) byMetro[r.metro] = { mids: [], count: 0 };
      if (r.mid) {
        byMetro[r.metro].mids.push(r.mid);
        byMetro[r.metro].count++;
      }
    });
    return Object.entries(byMetro)
      .map(([metro, d]) => ({
        metro,
        median: pct(d.mids, 50),
        count: d.count,
      }))
      .filter(d => d.count > 0)
      .sort((a, b) => b.median - a.median);
  }, [filtered]);

  const sourceStats = useMemo(() => {
    const counts = {};
    data.forEach(r => { counts[r.source] = (counts[r.source] || 0) + 1; });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  // Band builder data
  const bandData = useMemo(() => {
    const config = JOB_FAMILIES[bandFamily];
    if (!config) return [];
    
    // Get all relevant data
    const relevant = data.filter(r => 
      r.family === bandFamily && 
      (bandMetro === "All" || r.metro === bandMetro)
    );
    
    const mids = relevant.map(r => r.mid).filter(Boolean);
    if (!mids.length) return [];
    
    const globalMin = Math.min(...mids) * 0.9;
    const globalMax = Math.max(...mids) * 1.1;
    
    // Group by rough level based on title keywords
    const levels = config.levels.map((level, i) => {
      const levelMids = relevant
        .filter(r => r.title?.toLowerCase().includes(level.toLowerCase().split(" ")[0]))
        .map(r => r.mid)
        .filter(Boolean);
      
      if (levelMids.length < 3) {
        // Estimate based on position in ladder
        const ratio = i / (config.levels.length - 1);
        const estMedian = globalMin + (globalMax - globalMin) * ratio;
        return {
          level,
          code: config.codes[i],
          p10: Math.round(estMedian * 0.85),
          p25: Math.round(estMedian * 0.92),
          p50: Math.round(estMedian),
          p75: Math.round(estMedian * 1.08),
          p90: Math.round(estMedian * 1.15),
          n: 0,
          estimated: true,
        };
      }
      
      return {
        level,
        code: config.codes[i],
        p10: pct(levelMids, 10),
        p25: pct(levelMids, 25),
        p50: pct(levelMids, 50),
        p75: pct(levelMids, 75),
        p90: pct(levelMids, 90),
        n: levelMids.length,
        estimated: false,
      };
    });
    
    return { levels, globalMin, globalMax };
  }, [data, bandFamily, bandMetro]);

  // Navigation
  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const tabs = [
    { key: "overview", label: "Overview", icon: "📊" },
    { key: "explore", label: "Explore Data", icon: "🔍" },
    { key: "bands", label: "Band Builder", icon: "📈" },
    { key: "compare", label: "Compare", icon: "⚖️" },
    { key: "contribute", label: "Contribute", icon: "➕" },
    ...(isAdmin ? [{ key: "admin", label: "Admin", icon: "⚙️", badge: pendingCount || null }] : []),
  ];

  // Loading
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: V.bg }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${V.border}`, borderTopColor: V.primary, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: V.inkMuted }}>Loading compensation data...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ============================================================================
  // PAGES
  // ============================================================================

  const Overview = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Stats row */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard label="Total Records" value={fmtNum(stats.totalRecords)} subtext={`${stats.companyCount} companies`} icon="📊" />
        <StatCard label="Median Salary" value={fmtK(stats.median)} subtext={`P25: ${fmtK(stats.p25)} · P75: ${fmtK(stats.p75)}`} icon="💰" />
        <StatCard label="Job Families" value={stats.familyCount} subtext="Tracked" icon="📁" />
        <StatCard label="Data Sources" value={stats.sourceCount} subtext="Active" icon="🔗" />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 16 }}>
        <Card>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Salary by Job Family</h3>
          <p style={{ fontSize: 12, color: V.inkMuted, marginBottom: 16 }}>Median total compensation</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={familyStats.slice(0, 8)} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={V.border} />
              <XAxis type="number" tickFormatter={v => fmtK(v)} tick={{ fill: V.inkMuted, fontSize: 11 }} />
              <YAxis type="category" dataKey="family" width={130} tick={{ fill: V.inkSoft, fontSize: 12 }} />
              <Tooltip 
                formatter={v => fmt(v)} 
                contentStyle={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 8, fontSize: 13 }} 
              />
              <Bar dataKey="median" fill={V.primary} radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Salary by Metro</h3>
          <p style={{ fontSize: 12, color: V.inkMuted, marginBottom: 16 }}>Top markets by median pay</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={metroStats.slice(0, 8)} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={V.border} />
              <XAxis type="number" tickFormatter={v => fmtK(v)} tick={{ fill: V.inkMuted, fontSize: 11 }} />
              <YAxis type="category" dataKey="metro" width={100} tick={{ fill: V.inkSoft, fontSize: 12 }} />
              <Tooltip 
                formatter={v => fmt(v)} 
                contentStyle={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 8, fontSize: 13 }} 
              />
              <Bar dataKey="median" fill={V.blue} radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Data sources */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Data Sources</h3>
        <p style={{ fontSize: 12, color: V.inkMuted, marginBottom: 16 }}>Record distribution by source</p>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 200px", minWidth: 200 }}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={sourceStats.slice(0, 6)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                  {sourceStats.slice(0, 6).map((_, i) => <Cell key={i} fill={V.chartColors[i % V.chartColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 8, fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex: "2 1 300px", display: "flex", flexDirection: "column", gap: 8 }}>
            {sourceStats.slice(0, 6).map((s, i) => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: V.chartColors[i % V.chartColors.length] }} />
                <span style={{ flex: 1, fontSize: 13, color: V.inkSoft }}>{s.name}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: V.ink, fontVariantNumeric: "tabular-nums" }}>{fmtNum(s.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );

  const Explore = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Filters */}
      <Card padding={false} style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <SearchInput 
            value={searchTerm} 
            onChange={setSearchTerm} 
            onSearch={() => setSearchQuery(searchTerm)}
            placeholder="Search company or title..."
          />
          <Select 
            value={familyFilter} 
            onChange={setFamilyFilter} 
            options={["All", ...Object.keys(JOB_FAMILIES)]} 
          />
          <Select 
            value={metroFilter} 
            onChange={setMetroFilter} 
            options={["All", ...METROS.map(m => m.name)]} 
          />
          {(searchQuery || familyFilter !== "All" || metroFilter !== "All") && (
            <Button variant="ghost" onClick={() => { setSearchTerm(""); setSearchQuery(""); setFamilyFilter("All"); setMetroFilter("All"); }}>
              Clear filters
            </Button>
          )}
        </div>
      </Card>

      {/* Results count */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: 14, color: V.inkMuted }}>
          <strong style={{ color: V.ink }}>{fmtNum(filtered.length)}</strong> records
          {filtered.length !== data.length && ` (filtered from ${fmtNum(data.length)})`}
        </p>
      </div>

      {/* Table */}
      <DataTable 
        data={filtered} 
        maxRows={100}
        columns={[
          { key: "company", label: "Company", render: v => <strong style={{ color: V.ink }}>{v}</strong> },
          { key: "title", label: "Title" },
          { key: "family", label: "Family", render: v => <Badge color={V.primary}>{v}</Badge> },
          { key: "metro", label: "Metro" },
          { key: "mid", label: "Midpoint", align: "right", render: v => <span style={{ fontWeight: 600, color: V.primary, fontVariantNumeric: "tabular-nums" }}>{fmt(v)}</span> },
          { key: "source", label: "Source", render: v => <span style={{ fontSize: 11, color: V.inkFaint }}>{v}</span> },
        ]}
      />
    </div>
  );

  const BandBuilder = () => {
    const { levels = [], globalMin = 50000, globalMax = 500000 } = bandData;
    
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <Card>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Salary Band Builder</h3>
          <p style={{ fontSize: 13, color: V.inkMuted, marginBottom: 20 }}>
            Build market-based salary bands from aggregated compensation data. Great for benchmarking your company's pay ranges.
          </p>
          
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: V.inkMuted, marginBottom: 6 }}>Job Family</label>
              <Select value={bandFamily} onChange={setBandFamily} options={Object.keys(JOB_FAMILIES)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: V.inkMuted, marginBottom: 6 }}>Geography</label>
              <Select value={bandMetro} onChange={setBandMetro} options={["All", ...METROS.map(m => m.name)]} />
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 16, marginBottom: 16, fontSize: 11, color: V.inkMuted }}>
            <span>◼︎ P25-P75 (IQR)</span>
            <span>│ Median</span>
            <span style={{ opacity: 0.5 }}>◼︎ P10-P90 Range</span>
          </div>

          {/* Bands */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {levels.map((lvl, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "140px 50px 1fr 80px 80px 80px 40px", gap: 12, alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${V.borderLight}` }}>
                <span style={{ fontWeight: 500, color: V.ink, fontSize: 13 }}>{lvl.level}</span>
                <span style={{ fontSize: 11, color: V.blue, fontWeight: 600 }}>{lvl.code}</span>
                <BandVisualization data={lvl} globalMin={globalMin} globalMax={globalMax} />
                <span style={{ fontSize: 12, color: V.inkMuted, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtK(lvl.p25)}</span>
                <span style={{ fontSize: 13, color: V.primary, fontWeight: 600, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtK(lvl.p50)}</span>
                <span style={{ fontSize: 12, color: V.inkMuted, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtK(lvl.p75)}</span>
                <span style={{ fontSize: 10, color: V.inkFaint, textAlign: "right" }}>{lvl.estimated ? "est" : `n=${lvl.n}`}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>How to use this data</h4>
          <ul style={{ fontSize: 13, color: V.inkMuted, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            <li><strong>For job seekers:</strong> Use median (P50) as your target, P75 for strong negotiation</li>
            <li><strong>For comp teams:</strong> P25-P75 represents the competitive range for most roles</li>
            <li><strong>For planning:</strong> P10-P90 shows the full market spread including outliers</li>
          </ul>
        </Card>
      </div>
    );
  };

  const Compare = () => {
    const [role1, setRole1] = useState({ family: "Software Engineering", metro: "San Francisco" });
    const [role2, setRole2] = useState({ family: "Software Engineering", metro: "Remote" });

    const getStats = (family, metro) => {
      const relevant = data.filter(r => r.family === family && (metro === "All" || r.metro === metro));
      const mids = relevant.map(r => r.mid).filter(Boolean);
      return {
        count: relevant.length,
        median: pct(mids, 50),
        p25: pct(mids, 25),
        p75: pct(mids, 75),
      };
    };

    const stats1 = getStats(role1.family, role1.metro);
    const stats2 = getStats(role2.family, role2.metro);
    const diff = stats1.median && stats2.median ? ((stats1.median - stats2.median) / stats2.median * 100).toFixed(1) : 0;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <Card>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Compare Compensation</h3>
          <p style={{ fontSize: 13, color: V.inkMuted, marginBottom: 20 }}>
            Compare salaries across job families and locations. Useful for relocation decisions or career pivots.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 24, alignItems: "start" }}>
            {/* Role 1 */}
            <div style={{ padding: 20, background: V.bgAlt, borderRadius: 12 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Role A</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Select value={role1.family} onChange={v => setRole1({ ...role1, family: v })} options={Object.keys(JOB_FAMILIES)} style={{ width: "100%" }} />
                <Select value={role1.metro} onChange={v => setRole1({ ...role1, metro: v })} options={["All", ...METROS.map(m => m.name)]} style={{ width: "100%" }} />
              </div>
              <div style={{ marginTop: 16, textAlign: "center" }}>
                <p style={{ fontSize: 32, fontWeight: 700, color: V.ink }}>{fmtK(stats1.median)}</p>
                <p style={{ fontSize: 12, color: V.inkMuted }}>Median · n={stats1.count}</p>
              </div>
            </div>

            {/* VS */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0" }}>
              <div style={{ 
                padding: "8px 16px", 
                borderRadius: 20, 
                background: diff > 0 ? V.greenMuted : diff < 0 ? V.roseMuted : V.bgAlt,
                color: diff > 0 ? V.green : diff < 0 ? V.rose : V.inkMuted,
                fontWeight: 600,
                fontSize: 14,
              }}>
                {diff > 0 ? "+" : ""}{diff}%
              </div>
            </div>

            {/* Role 2 */}
            <div style={{ padding: 20, background: V.bgAlt, borderRadius: 12 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Role B</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Select value={role2.family} onChange={v => setRole2({ ...role2, family: v })} options={Object.keys(JOB_FAMILIES)} style={{ width: "100%" }} />
                <Select value={role2.metro} onChange={v => setRole2({ ...role2, metro: v })} options={["All", ...METROS.map(m => m.name)]} style={{ width: "100%" }} />
              </div>
              <div style={{ marginTop: 16, textAlign: "center" }}>
                <p style={{ fontSize: 32, fontWeight: 700, color: V.ink }}>{fmtK(stats2.median)}</p>
                <p style={{ fontSize: 12, color: V.inkMuted }}>Median · n={stats2.count}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const Contribute = () => {
    const [form, setForm] = useState({ title: "", company: "", family: "", salary: "", metro: "" });
    const [status, setStatus] = useState({ type: "", message: "" });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (submitting) return;
      
      setSubmitting(true);
      setStatus({ type: "info", message: "Submitting..." });

      const salary = parseInt(form.salary);
      if (isNaN(salary) || salary < 20000 || salary > 2000000) {
        setStatus({ type: "error", message: "Please enter a valid salary between $20,000 and $2,000,000." });
        setSubmitting(false);
        return;
      }

      try {
        const { error } = await supabase.from('submissions').insert([{
          job_title: form.title.trim(),
          company: form.company.trim(),
          job_family: form.family,
          base_salary: salary,
          metro: form.metro,
          status: 'pending',
        }]);

        if (error) throw error;
        
        setStatus({ type: "success", message: "Thank you! Your submission is pending review." });
        setForm({ title: "", company: "", family: "", salary: "", metro: "" });
      } catch (err) {
        setStatus({ type: "error", message: "Failed to submit: " + err.message });
      }
      setSubmitting(false);
    };

    return (
      <div style={{ maxWidth: 600 }}>
        <Card>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Share Your Compensation</h3>
          <p style={{ fontSize: 13, color: V.inkMuted, marginBottom: 20 }}>
            Help build the most comprehensive compensation database. All submissions are anonymous and reviewed before publishing.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: V.inkMuted, marginBottom: 6 }}>Job Title *</label>
              <input 
                type="text" 
                required 
                value={form.title} 
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Senior Software Engineer"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${V.border}`, fontSize: 14 }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: V.inkMuted, marginBottom: 6 }}>Company *</label>
                <input 
                  type="text" 
                  required 
                  value={form.company} 
                  onChange={e => setForm({ ...form, company: e.target.value })}
                  placeholder="e.g. Stripe"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${V.border}`, fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: V.inkMuted, marginBottom: 6 }}>Job Family *</label>
                <Select value={form.family} onChange={v => setForm({ ...form, family: v })} options={Object.keys(JOB_FAMILIES)} placeholder="Select..." style={{ width: "100%" }} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: V.inkMuted, marginBottom: 6 }}>Base Salary (USD) *</label>
                <input 
                  type="number" 
                  required 
                  value={form.salary} 
                  onChange={e => setForm({ ...form, salary: e.target.value })}
                  placeholder="150000"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${V.border}`, fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: V.inkMuted, marginBottom: 6 }}>Metro *</label>
                <Select value={form.metro} onChange={v => setForm({ ...form, metro: v })} options={METROS.map(m => m.name)} placeholder="Select..." style={{ width: "100%" }} />
              </div>
            </div>

            <Button type="submit" disabled={submitting} size="lg" style={{ marginTop: 8 }}>
              {submitting ? "Submitting..." : "Submit Anonymously"}
            </Button>

            {status.message && (
              <div style={{ 
                padding: 12, 
                borderRadius: 8, 
                background: status.type === "success" ? V.greenMuted : status.type === "error" ? V.roseMuted : V.blueMuted,
                color: status.type === "success" ? V.green : status.type === "error" ? V.rose : V.blue,
                fontSize: 13,
              }}>
                {status.message}
              </div>
            )}
          </form>
        </Card>
      </div>
    );
  };

  const Admin = () => {
    const [adminTab, setAdminTab] = useState("pending");
    const [loading, setLoading] = useState(null);

    const handleApprove = async (id, sub) => {
      if (sub.status !== 'pending') return;
      setLoading(id);
      
      try {
        await supabase.from('comp_data').insert([{
          company: sub.company,
          family: sub.job_family,
          title: sub.job_title,
          metro: sub.metro,
          midpoint: sub.base_salary,
          salary_min: Math.round(sub.base_salary * 0.9),
          salary_max: Math.round(sub.base_salary * 1.1),
          source: 'User Submission',
          status: 'approved',
        }]);
        
        await supabase.from('submissions').update({ status: 'approved' }).eq('id', id);
        setSubmissions(s => s.map(x => x.id === id ? { ...x, status: 'approved' } : x));
      } catch (err) {
        alert("Error: " + err.message);
      }
      setLoading(null);
    };

    const handleReject = async (id) => {
      setLoading(id);
      await supabase.from('submissions').update({ status: 'rejected' }).eq('id', id);
      setSubmissions(s => s.map(x => x.id === id ? { ...x, status: 'rejected' } : x));
      setLoading(null);
    };

    const pending = submissions.filter(s => s.status === 'pending');
    const approved = submissions.filter(s => s.status === 'approved');
    const rejected = submissions.filter(s => s.status === 'rejected');

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Tabs 
          tabs={[
            { key: "pending", label: `Pending (${pending.length})` },
            { key: "approved", label: `Approved (${approved.length})` },
            { key: "rejected", label: `Rejected (${rejected.length})` },
          ]}
          active={adminTab}
          onChange={setAdminTab}
        />

        <Card>
          {adminTab === "pending" && (
            pending.length === 0 ? (
              <p style={{ color: V.inkMuted, textAlign: "center", padding: 40 }}>No pending submissions 🎉</p>
            ) : (
              <DataTable data={pending} columns={[
                { key: "job_title", label: "Title", render: v => <strong>{v}</strong> },
                { key: "company", label: "Company" },
                { key: "job_family", label: "Family" },
                { key: "base_salary", label: "Salary", align: "right", render: v => fmt(v) },
                { key: "metro", label: "Metro" },
                { key: "actions", label: "", render: (_, row) => (
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button size="sm" onClick={() => handleApprove(row.id, row)} disabled={loading === row.id}>
                      {loading === row.id ? "..." : "Approve"}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleReject(row.id)} disabled={loading === row.id}>
                      Reject
                    </Button>
                  </div>
                )}
              ]} />
            )
          )}

          {adminTab === "approved" && (
            approved.length === 0 ? (
              <p style={{ color: V.inkMuted, textAlign: "center", padding: 40 }}>No approved submissions yet</p>
            ) : (
              <DataTable data={approved} columns={[
                { key: "job_title", label: "Title" },
                { key: "company", label: "Company" },
                { key: "base_salary", label: "Salary", align: "right", render: v => fmt(v) },
                { key: "metro", label: "Metro" },
              ]} />
            )
          )}

          {adminTab === "rejected" && (
            rejected.length === 0 ? (
              <p style={{ color: V.inkMuted, textAlign: "center", padding: 40 }}>No rejected submissions</p>
            ) : (
              <DataTable data={rejected} columns={[
                { key: "job_title", label: "Title" },
                { key: "company", label: "Company" },
                { key: "base_salary", label: "Salary", align: "right", render: v => fmt(v) },
              ]} />
            )
          )}
        </Card>
      </div>
    );
  };

  const pages = { overview: Overview, explore: Explore, bands: BandBuilder, compare: Compare, contribute: Contribute, admin: Admin };
  const CurrentPage = pages[tab] || Overview;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div style={{ minHeight: "100vh", background: V.bg }}>
      <style>{GLOBAL_CSS}</style>

      {/* Header */}
      <header style={{ 
        background: V.surface, 
        borderBottom: `1px solid ${V.border}`, 
        padding: "12px 24px",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ 
              width: 36, 
              height: 36, 
              borderRadius: 10, 
              background: `linear-gradient(135deg, ${V.primary}, ${V.blue})`,
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
            }}>
              B
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: V.ink, margin: 0 }}>Banded</h1>
              <p style={{ fontSize: 11, color: V.inkMuted, margin: 0 }}>Compensation Intelligence</p>
            </div>
          </div>
          
          {/* Desktop nav */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }} className="desktop-nav">
            <Tabs tabs={tabs} active={tab} onChange={setTab} />
          </div>

          {/* Mobile menu button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ display: "none", padding: 8, background: "none", border: "none", cursor: "pointer" }}
            className="mobile-menu-btn"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={V.ink} strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div style={{ padding: "16px 0", borderTop: `1px solid ${V.border}`, marginTop: 12 }}>
            <Tabs tabs={tabs} active={tab} onChange={(t) => { setTab(t); setMobileMenuOpen(false); }} />
          </div>
        )}
      </header>

      {/* Main content */}
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: 24 }}>
        {dataSource === "empty" && (
          <div style={{ marginBottom: 24, padding: 16, background: V.amberMuted, borderRadius: 8, border: `1px solid ${V.amber}30` }}>
            <p style={{ margin: 0, fontSize: 13, color: V.amber }}>📊 No data yet. Run your scrapers or add data via the Contribute page.</p>
          </div>
        )}
        
        <CurrentPage />
      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${V.border}`, padding: "24px", marginTop: 48, textAlign: "center" }}>
        <p style={{ fontSize: 12, color: V.inkFaint }}>
          {fmtNum(data.length)} records from {stats.sourceCount} sources · Updated continuously
        </p>
      </footer>

      {/* Mobile styles */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </div>
  );
}
