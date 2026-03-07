import { V, JOB_FAMILIES, METROS } from "../lib/constants";
import { fmt, fmtNum } from "../lib/utils";
import { Card, SearchInput, Select, Button, DataTable, Badge } from "../components/ui";

export default function Explore({ filtered, data, searchQuery, setSearchQuery, familyFilter, setFamilyFilter, metroFilter, setMetroFilter }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Filters */}
      <Card padding={false} style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <SearchInput onSearch={setSearchQuery} placeholder="Search company or title..." />
          <Select value={familyFilter} onChange={setFamilyFilter} options={["All", ...Object.keys(JOB_FAMILIES)]} />
          <Select value={metroFilter} onChange={setMetroFilter} options={["All", ...METROS.map(m => m.name)]} />
          {(searchQuery || familyFilter !== "All" || metroFilter !== "All") && (
            <Button variant="ghost" onClick={() => { setSearchQuery(""); setFamilyFilter("All"); setMetroFilter("All"); }}>
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
}
