// ============================================================================
// DESIGN SYSTEM + DATA CONFIG
// ============================================================================

export const V = {
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

export const GLOBAL_CSS = `
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

  @media (max-width: 768px) {
    html { font-size: 14px; }
  }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${V.border}; border-radius: 3px; }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  .fade-in { animation: fadeIn 0.3s ease-out; }

  :focus-visible { outline: 2px solid ${V.primary}; outline-offset: 2px; border-radius: 4px; }
`;

export const JOB_FAMILIES = {
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

export const METROS = [
  { name: "San Francisco", state: "CA", abbr: "SF" },
  { name: "New York", state: "NY", abbr: "NYC" },
  { name: "Seattle", state: "WA", abbr: "SEA" },
  { name: "Austin", state: "TX", abbr: "AUS" },
  { name: "Denver", state: "CO", abbr: "DEN" },
  { name: "Boston", state: "MA", abbr: "BOS" },
  { name: "Chicago", state: "IL", abbr: "CHI" },
  { name: "Los Angeles", state: "CA", abbr: "LA" },
  { name: "Portland", state: "OR", abbr: "PDX" },
  { name: "Washington DC", state: "DC", abbr: "DC" },
  { name: "Remote", state: "US", abbr: "RMT" },
];
