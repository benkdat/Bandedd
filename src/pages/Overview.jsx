import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import { V } from "../lib/constants";
import { fmtK, fmt, fmtNum } from "../lib/utils";
import { Card, StatCard } from "../components/ui";

export default function Overview({ stats, familyStats, metroStats, sourceStats, data }) {
  return (
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
              <Tooltip formatter={v => fmt(v)} contentStyle={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 8, fontSize: 13 }} />
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
              <Tooltip formatter={v => fmt(v)} contentStyle={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 8, fontSize: 13 }} />
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
}
