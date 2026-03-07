import { useState, useMemo } from "react";
import { V } from "../lib/constants";
import { fmtNum } from "../lib/utils";

// ============================================================================
// CARD
// ============================================================================

export function Card({ children, className = "", padding = true, ...props }) {
  return (
    <div
      style={{
        background: V.surface,
        borderRadius: 12,
        border: `1px solid ${V.border}`,
        padding: padding ? 20 : 0,
        ...props.style,
      }}
      className={className}
    >
      {children}
    </div>
  );
}

// ============================================================================
// STAT CARD
// ============================================================================

export function StatCard({ label, value, subtext, trend, icon }) {
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
      {trend != null && trend !== undefined && (
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

// ============================================================================
// BUTTON
// ============================================================================

export function Button({ children, variant = "primary", size = "md", ...props }) {
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
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.5 : 1,
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

// ============================================================================
// SELECT
// ============================================================================

export function Select({ value, onChange, options, placeholder, ...props }) {
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

// ============================================================================
// TABS
// ============================================================================

export function Tabs({ tabs, active, onChange }) {
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
              marginLeft: 6, padding: "2px 6px", borderRadius: 10,
              background: V.primary, color: "#fff", fontSize: 10, fontWeight: 600,
            }}>
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// SEARCH INPUT
// ============================================================================

export function SearchInput({ onSearch, placeholder, initialValue = "" }) {
  const [localValue, setLocalValue] = useState(initialValue);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearch(localValue);
    }
  };

  return (
    <div style={{ display: "flex", gap: 0, flex: 1, maxWidth: 400 }}>
      <input
        type="text"
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          flex: 1, padding: "10px 14px", borderRadius: "8px 0 0 8px",
          border: `1px solid ${V.border}`, borderRight: "none", fontSize: 14, minWidth: 0,
        }}
      />
      <Button onClick={() => onSearch(localValue)} style={{ borderRadius: "0 8px 8px 0" }}>Search</Button>
      {localValue && (
        <Button variant="ghost" onClick={() => { setLocalValue(""); onSearch(""); }} style={{ marginLeft: 8 }}>
          Clear
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// DATA TABLE
// ============================================================================

export function DataTable({ data, columns, maxRows = 50 }) {
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
                  padding: "12px 16px", textAlign: col.align || "left", fontWeight: 600,
                  fontSize: 11, color: V.inkMuted, textTransform: "uppercase",
                  letterSpacing: "0.05em", cursor: "pointer", userSelect: "none",
                  whiteSpace: "nowrap", borderBottom: `1px solid ${V.border}`,
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

// ============================================================================
// BADGE
// ============================================================================

export function Badge({ children, color = V.primary }) {
  return (
    <span style={{
      padding: "3px 8px", borderRadius: 6,
      background: `${color}15`, color: color, fontSize: 11, fontWeight: 600,
    }}>
      {children}
    </span>
  );
}

// ============================================================================
// BAND VISUALIZATION
// ============================================================================

export function BandVisualization({ data, globalMin, globalMax }) {
  const scale = v => ((v - globalMin) / (globalMax - globalMin)) * 100;
  return (
    <div style={{ position: "relative", height: 28, background: V.bgAlt, borderRadius: 6 }}>
      {/* P10-P90 range */}
      <div style={{
        position: "absolute", left: `${scale(data.p10)}%`,
        width: `${scale(data.p90) - scale(data.p10)}%`,
        top: 8, height: 12, background: V.primaryMuted, borderRadius: 4,
      }} />
      {/* IQR (P25-P75) */}
      <div style={{
        position: "absolute", left: `${scale(data.p25)}%`,
        width: `${scale(data.p75) - scale(data.p25)}%`,
        top: 6, height: 16, background: `${V.primary}40`, borderRadius: 4,
      }} />
      {/* Median line */}
      <div style={{
        position: "absolute", left: `${scale(data.p50)}%`,
        top: 2, width: 3, height: 24, background: V.primary,
        borderRadius: 2, transform: "translateX(-50%)",
      }} />
    </div>
  );
}

// ============================================================================
// SAMPLE SIZE WARNING
// ============================================================================

export function SampleSizeWarning({ n, threshold = 10 }) {
  if (n >= threshold) return null;
  return (
    <div style={{
      padding: "6px 10px", borderRadius: 6,
      background: V.amberMuted, color: V.amber,
      fontSize: 11, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      ⚠ Small sample (n={n}). Interpret with caution.
    </div>
  );
}
