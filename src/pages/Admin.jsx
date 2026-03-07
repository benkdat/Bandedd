import { useState, useEffect } from "react";
import { V } from "../lib/constants";
import { fmt } from "../lib/utils";
import { Card, Tabs, DataTable, Button } from "../components/ui";
import { supabase } from "../lib/supabaseClient";

// Simple admin password check.
// Set VITE_ADMIN_KEY in your .env to something like a random string.
// Access admin with ?admin=YOUR_KEY
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || '';

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get('admin');

    // If ADMIN_KEY is set, require it to match. If not set, fall back to ?admin=true for dev.
    if (ADMIN_KEY) {
      setIsAdmin(key === ADMIN_KEY);
    } else {
      setIsAdmin(key === 'true');
    }
  }, []);

  return isAdmin;
}


export default function Admin({ submissions, setSubmissions }) {
  const [adminTab, setAdminTab] = useState("pending");
  const [loading, setLoading] = useState(null);
  const [scrapeLogs, setScrapeLogs] = useState([]);

  // Fetch scrape logs
  useEffect(() => {
    async function fetchLogs() {
      const { data } = await supabase
        .from('scrape_log')
        .select('*')
        .order('ran_at', { ascending: false })
        .limit(20);
      if (data) setScrapeLogs(data);
    }
    fetchLogs();
  }, []);

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
          { key: "freshness", label: "Data Freshness" },
        ]}
        active={adminTab}
        onChange={setAdminTab}
      />

      <Card>
        {adminTab === "pending" && (
          pending.length === 0 ? (
            <p style={{ color: V.inkMuted, textAlign: "center", padding: 40 }}>No pending submissions</p>
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

        {adminTab === "freshness" && (
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Recent Scraper Runs</h4>
            {scrapeLogs.length === 0 ? (
              <p style={{ color: V.inkMuted, fontSize: 13 }}>
                No scrape logs yet. Create a <code>scrape_log</code> table in Supabase with columns:
                source (text), records_found (int), records_inserted (int), errors (int), ran_at (timestamptz).
              </p>
            ) : (
              <DataTable data={scrapeLogs} columns={[
                { key: "source", label: "Source", render: v => <strong>{v}</strong> },
                { key: "records_found", label: "Found", align: "right" },
                { key: "records_inserted", label: "Inserted", align: "right" },
                { key: "errors", label: "Errors", align: "right", render: v => (
                  <span style={{ color: v > 0 ? V.rose : V.green, fontWeight: 600 }}>{v}</span>
                )},
                { key: "ran_at", label: "When", render: v => {
                  const d = new Date(v);
                  const now = new Date();
                  const hours = Math.round((now - d) / (1000 * 60 * 60));
                  if (hours < 1) return <span style={{ color: V.green }}>Just now</span>;
                  if (hours < 24) return <span style={{ color: V.green }}>{hours}h ago</span>;
                  const days = Math.round(hours / 24);
                  return <span style={{ color: days > 7 ? V.rose : V.amber }}>{days}d ago</span>;
                }},
              ]} />
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
