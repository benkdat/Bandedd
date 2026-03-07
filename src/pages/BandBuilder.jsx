import { useState, useMemo } from "react";
import { V, JOB_FAMILIES, METROS } from "../lib/constants";
import { fmtK, pct } from "../lib/utils";
import { Card, Select, BandVisualization } from "../components/ui";

/**
 * Infer job level from title + salary position within the family.
 * Uses a combination of title keywords and salary quartile.
 */
const LEVEL_KEYWORDS = {
  "Junior": ["junior", "jr", "associate", "entry", "intern", "new grad", "i ", " i,"],
  "Mid": ["mid", " ii ", " ii,", "intermediate"],
  "Senior": ["senior", "sr", " iii ", " iii,", "lead"],
  "Staff": ["staff", " iv ", "principal"],
  "Principal": ["principal", "distinguished", "fellow"],
  "Director": ["director", "head of", "vp", "vice president"],
};

function inferLevel(title, midpoint, familyMedian) {
  if (!title) return null;
  const t = ` ${title.toLowerCase()} `;

  // Check title keywords (most reliable signal)
  for (const [level, keywords] of Object.entries(LEVEL_KEYWORDS)) {
    if (keywords.some(kw => t.includes(kw))) return level;
  }

  // Fall back to salary-based inference
  if (!midpoint || !familyMedian) return null;
  const ratio = midpoint / familyMedian;
  if (ratio < 0.7) return "Junior";
  if (ratio < 0.9) return "Mid";
  if (ratio < 1.15) return "Senior";
  if (ratio < 1.4) return "Staff";
  return "Principal";
}


export default function BandBuilder({ data, bandFamily, setBandFamily, bandMetro, setBandMetro }) {
  const bandData = useMemo(() => {
    const config = JOB_FAMILIES[bandFamily];
    if (!config) return { levels: [], globalMin: 50000, globalMax: 500000 };

    const relevant = data.filter(r =>
      r.family === bandFamily &&
      (bandMetro === "All" || r.metro === bandMetro)
    );

    const mids = relevant.map(r => r.mid).filter(Boolean);
    if (!mids.length) return { levels: [], globalMin: 50000, globalMax: 500000 };

    const familyMedian = pct(mids, 50);
    const globalMin = Math.min(...mids) * 0.9;
    const globalMax = Math.max(...mids) * 1.1;

    // Group records by inferred level
    const levelBuckets = {};
    config.levels.forEach(level => { levelBuckets[level] = []; });

    relevant.forEach(r => {
      if (!r.mid) return;
      const level = inferLevel(r.title, r.mid, familyMedian);
      // Map inferred level to closest config level
      if (level && levelBuckets[level] !== undefined) {
        levelBuckets[level].push(r.mid);
      } else if (level) {
        // Try fuzzy match to config levels
        const match = config.levels.find(l => l.toLowerCase().includes(level.toLowerCase()));
        if (match) levelBuckets[match].push(r.mid);
      }
    });

    const levels = config.levels.map((level, i) => {
      const levelMids = levelBuckets[level] || [];

      if (levelMids.length < 3) {
        // Estimate based on ladder position
        const ratio = i / (config.levels.length - 1);
        const estMedian = globalMin + (globalMax - globalMin) * ratio;
        return {
          level, code: config.codes[i],
          p10: Math.round(estMedian * 0.85), p25: Math.round(estMedian * 0.92),
          p50: Math.round(estMedian), p75: Math.round(estMedian * 1.08),
          p90: Math.round(estMedian * 1.15),
          n: levelMids.length, estimated: true,
        };
      }

      return {
        level, code: config.codes[i],
        p10: pct(levelMids, 10), p25: pct(levelMids, 25),
        p50: pct(levelMids, 50), p75: pct(levelMids, 75),
        p90: pct(levelMids, 90),
        n: levelMids.length, estimated: false,
      };
    });

    return { levels, globalMin, globalMax };
  }, [data, bandFamily, bandMetro]);

  const { levels = [], globalMin = 50000, globalMax = 500000 } = bandData;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Card>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Salary Band Builder</h3>
        <p style={{ fontSize: 13, color: V.inkMuted, marginBottom: 20 }}>
          Build market-based salary bands from aggregated compensation data. Uses title keywords and salary positioning to infer levels.
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
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "140px 50px 1fr 80px 80px 80px 40px",
              gap: 12, alignItems: "center", padding: "8px 0",
              borderBottom: `1px solid ${V.borderLight}`,
              opacity: lvl.estimated ? 0.6 : 1,
            }}>
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
          <li>Rows with "est" have fewer than 3 data points and are estimated from ladder position</li>
        </ul>
      </Card>
    </div>
  );
}
