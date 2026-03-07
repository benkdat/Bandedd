import { useState, useMemo, useEffect } from "react";
import { V, GLOBAL_CSS, JOB_FAMILIES, METROS } from "./lib/constants";
import { fmtK, fmtNum, pct } from "./lib/utils";
import { supabase } from "./lib/supabaseClient";
import { Tabs } from "./components/ui";

// Pages
import Overview from "./pages/Overview";
import Explore from "./pages/Explore";
import BandBuilder from "./pages/BandBuilder";
import Compare from "./pages/Compare";
import Contribute from "./pages/Contribute";
import Admin, { useAdminAuth } from "./pages/Admin";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [familyFilter, setFamilyFilter] = useState("All");
  const [metroFilter, setMetroFilter] = useState("All");

  // Band Builder
  const [bandFamily, setBandFamily] = useState("Software Engineering");
  const [bandMetro, setBandMetro] = useState("All");

  // Admin
  const isAdmin = useAdminAuth();

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
    const companies = [...new Set(filtered.map(r => r.company))];
    const sources = [...new Set(data.map(r => r.source))];
    const families = [...new Set(filtered.map(r => r.family))];
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

  // Chart data
  const familyStats = useMemo(() => {
    const byFamily = {};
    filtered.forEach(r => {
      if (!byFamily[r.family]) byFamily[r.family] = { mids: [], count: 0 };
      if (r.mid) { byFamily[r.family].mids.push(r.mid); byFamily[r.family].count++; }
    });
    return Object.entries(byFamily)
      .map(([family, d]) => ({
        family, icon: JOB_FAMILIES[family]?.icon || "📁",
        median: pct(d.mids, 50), p25: pct(d.mids, 25), p75: pct(d.mids, 75), count: d.count,
      }))
      .filter(d => d.count > 0)
      .sort((a, b) => b.median - a.median);
  }, [filtered]);

  const metroStats = useMemo(() => {
    const byMetro = {};
    filtered.forEach(r => {
      if (!r.metro) return;
      if (!byMetro[r.metro]) byMetro[r.metro] = { mids: [], count: 0 };
      if (r.mid) { byMetro[r.metro].mids.push(r.mid); byMetro[r.metro].count++; }
    });
    return Object.entries(byMetro)
      .map(([metro, d]) => ({ metro, median: pct(d.mids, 50), count: d.count }))
      .filter(d => d.count > 0)
      .sort((a, b) => b.median - a.median);
  }, [filtered]);

  const sourceStats = useMemo(() => {
    const counts = {};
    data.forEach(r => { counts[r.source] = (counts[r.source] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [data]);

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
        <style>{GLOBAL_CSS}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${V.border}`, borderTopColor: V.primary, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: V.inkMuted }}>Loading compensation data...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  const renderPage = () => {
    switch (tab) {
      case "overview":
        return <Overview stats={stats} familyStats={familyStats} metroStats={metroStats} sourceStats={sourceStats} data={data} />;
      case "explore":
        return <Explore filtered={filtered} data={data} searchQuery={searchQuery} setSearchQuery={setSearchQuery} familyFilter={familyFilter} setFamilyFilter={setFamilyFilter} metroFilter={metroFilter} setMetroFilter={setMetroFilter} />;
      case "bands":
        return <BandBuilder data={data} bandFamily={bandFamily} setBandFamily={setBandFamily} bandMetro={bandMetro} setBandMetro={setBandMetro} />;
      case "compare":
        return <Compare data={data} />;
      case "contribute":
        return <Contribute data={data} />;
      case "admin":
        return <Admin submissions={submissions} setSubmissions={setSubmissions} />;
      default:
        return <Overview stats={stats} familyStats={familyStats} metroStats={metroStats} sourceStats={sourceStats} data={data} />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: V.bg }}>
      <style>{GLOBAL_CSS}</style>

      {/* Header */}
      <header style={{
        background: V.surface, borderBottom: `1px solid ${V.border}`,
        padding: "12px 24px", position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, ${V.primary}, ${V.blue})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 16,
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
        {renderPage()}
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
