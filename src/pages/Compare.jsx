import { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { V, JOB_FAMILIES, METROS } from "../lib/constants";
import { fmtK, fmt, pct } from "../lib/utils";
import { Card, Select, SampleSizeWarning } from "../components/ui";

export default function Compare({ data }) {
  const [role1, setRole1] = useState({ family: "Software Engineering", metro: "San Francisco" });
  const [role2, setRole2] = useState({ family: "Software Engineering", metro: "Remote" });

  const getStats = (family, metro) => {
    const relevant = data.filter(r => r.family === family && (metro === "All" || r.metro === metro));
    const mids = relevant.map(r => r.mid).filter(Boolean);
    return {
      count: relevant.length,
      median: pct(mids, 50),
      p10: pct(mids, 10),
      p25: pct(mids, 25),
      p75: pct(mids, 75),
      p90: pct(mids, 90),
    };
  };

  const stats1 = getStats(role1.family, role1.metro);
  const stats2 = getStats(role2.family, role2.metro);
  const diff = stats1.median && stats2.median ? ((stats1.median - stats2.median) / stats2.median * 100).toFixed(1) : 0;

  // Distribution comparison data for chart
  const comparisonData = [
    { label: "P10", roleA: stats1.p10, roleB: stats2.p10 },
    { label: "P25", roleA: stats1.p25, roleB: stats2.p25 },
    { label: "Median", roleA: stats1.median, roleB: stats2.median },
    { label: "P75", roleA: stats1.p75, roleB: stats2.p75 },
    { label: "P90", roleA: stats1.p90, roleB: stats2.p90 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Card>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Compare Compensation</h3>
        <p style={{ fontSize: 13, color: V.inkMuted, marginBottom: 20 }}>
          Compare salaries across job families and locations. Useful for relocation decisions or career pivots.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 24, alignItems: "start" }}>
          {/* Role A */}
          <div style={{ padding: 20, background: V.bgAlt, borderRadius: 12 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: V.primary }}>Role A</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Select value={role1.family} onChange={v => setRole1({ ...role1, family: v })} options={Object.keys(JOB_FAMILIES)} style={{ width: "100%" }} />
              <Select value={role1.metro} onChange={v => setRole1({ ...role1, metro: v })} options={["All", ...METROS.map(m => m.name)]} style={{ width: "100%" }} />
            </div>
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <p style={{ fontSize: 32, fontWeight: 700, color: V.ink }}>{fmtK(stats1.median)}</p>
              <p style={{ fontSize: 12, color: V.inkMuted }}>Median · n={stats1.count}</p>
              <div style={{ marginTop: 8 }}>
                <SampleSizeWarning n={stats1.count} />
              </div>
            </div>
          </div>

          {/* VS */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0" }}>
            <div style={{
              padding: "8px 16px", borderRadius: 20,
              background: diff > 0 ? V.greenMuted : diff < 0 ? V.roseMuted : V.bgAlt,
              color: diff > 0 ? V.green : diff < 0 ? V.rose : V.inkMuted,
              fontWeight: 600, fontSize: 14,
            }}>
              {diff > 0 ? "+" : ""}{diff}%
            </div>
          </div>

          {/* Role B */}
          <div style={{ padding: 20, background: V.bgAlt, borderRadius: 12 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: V.blue }}>Role B</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Select value={role2.family} onChange={v => setRole2({ ...role2, family: v })} options={Object.keys(JOB_FAMILIES)} style={{ width: "100%" }} />
              <Select value={role2.metro} onChange={v => setRole2({ ...role2, metro: v })} options={["All", ...METROS.map(m => m.name)]} style={{ width: "100%" }} />
            </div>
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <p style={{ fontSize: 32, fontWeight: 700, color: V.ink }}>{fmtK(stats2.median)}</p>
              <p style={{ fontSize: 12, color: V.inkMuted }}>Median · n={stats2.count}</p>
              <div style={{ marginTop: 8 }}>
                <SampleSizeWarning n={stats2.count} />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Distribution overlay chart */}
      {(stats1.median > 0 || stats2.median > 0) && (
        <Card>
          <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Distribution Comparison</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={comparisonData} margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={V.border} />
              <XAxis dataKey="label" tick={{ fill: V.inkMuted, fontSize: 12 }} />
              <YAxis tickFormatter={v => fmtK(v)} tick={{ fill: V.inkMuted, fontSize: 11 }} />
              <Tooltip formatter={v => fmt(v)} contentStyle={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 8, fontSize: 13 }} />
              <Legend />
              <Bar dataKey="roleA" name="Role A" fill={V.primary} radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="roleB" name="Role B" fill={V.blue} radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
