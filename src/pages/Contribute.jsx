import { useState } from "react";
import { V, JOB_FAMILIES, METROS } from "../lib/constants";
import { fmt, pct } from "../lib/utils";
import { Card, Select, Button } from "../components/ui";
import { supabase } from "../lib/supabaseClient";

export default function Contribute({ data }) {
  const [form, setForm] = useState({ title: "", company: "", family: "", salary: "", metro: "" });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  /**
   * Check if submitted salary is a reasonable outlier for the family/metro.
   * Returns a warning message if it seems suspicious, null if OK.
   */
  const checkOutlier = (salary, family, metro) => {
    const comparable = data.filter(r =>
      r.family === family &&
      (metro === "All" || r.metro === metro) &&
      r.mid
    );
    if (comparable.length < 5) return null; // not enough data to judge

    const mids = comparable.map(r => r.mid);
    const p10 = pct(mids, 5);
    const p90 = pct(mids, 95);

    if (salary < p10 * 0.5 || salary > p90 * 2) {
      return `This salary seems unusual for ${family} in ${metro || 'this market'}. Typical range is ${fmt(p10)} to ${fmt(p90)}. Are you sure?`;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const salary = parseInt(form.salary);
    if (isNaN(salary) || salary < 20000 || salary > 2000000) {
      setStatus({ type: "error", message: "Please enter a valid salary between $20,000 and $2,000,000." });
      return;
    }

    // Outlier check
    const warning = checkOutlier(salary, form.family, form.metro);
    if (warning && status.type !== "warning-confirmed") {
      setStatus({ type: "warning", message: warning });
      return;
    }

    setSubmitting(true);
    setStatus({ type: "info", message: "Submitting..." });

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

        <div onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: V.inkMuted, marginBottom: 6 }}>Job Title *</label>
            <input
              type="text" required value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Senior Software Engineer"
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${V.border}`, fontSize: 14 }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: V.inkMuted, marginBottom: 6 }}>Company *</label>
              <input
                type="text" required value={form.company}
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
                type="number" required value={form.salary}
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

          <Button onClick={handleSubmit} disabled={submitting || !form.title || !form.company || !form.family || !form.salary || !form.metro} size="lg" style={{ marginTop: 8 }}>
            {submitting ? "Submitting..." : status.type === "warning" ? "Submit Anyway" : "Submit Anonymously"}
          </Button>

          {status.message && (
            <div style={{
              padding: 12, borderRadius: 8,
              background: status.type === "success" ? V.greenMuted : status.type === "error" ? V.roseMuted : status.type === "warning" ? V.amberMuted : V.blueMuted,
              color: status.type === "success" ? V.green : status.type === "error" ? V.rose : status.type === "warning" ? V.amber : V.blue,
              fontSize: 13,
            }}>
              {status.message}
              {status.type === "warning" && (
                <Button
                  variant="ghost" size="sm"
                  onClick={() => { setStatus({ type: "warning-confirmed", message: "" }); }}
                  style={{ marginLeft: 8, color: V.amber, textDecoration: "underline" }}
                >
                  Yes, submit
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
