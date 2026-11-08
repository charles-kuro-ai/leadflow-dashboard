import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://jyigungffdpqdgknhqao.supabase.co",
  "sb_publishable_Am7kFgOwqUw6BWWwElm0pw_0nS_wzHP"
);

const AGENTS = ["Emeka Obi","Fatima Yusuf","Chidi Nwosu","Blessing Adeyemi","Musa Ibrahim","Ngozi Eze"];

function scoreColor(s) {
  if (s >= 75) return "#8b5cf6";
  if (s >= 45) return "#60a5fa";
  return "#10b981";
}

function statusColor(s) {
  if (s === "Converted") return "#10b981";
  if (s === "Contacted") return "#f59e0b";
  if (s === "Assigned")  return "#60a5fa";
  return "#4a5a78";
}

function tierClass(t) {
  if (t === "Corporate") return "pill-corporate";
  if (t === "SME")       return "pill-sme";
  return "pill-mass";
}

export default function App() {
  const [leads, setLeads]           = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected]     = useState(null);
  const [assignAgent, setAssignAgent] = useState("");
  const [toast, setToast]           = useState("");
  const [page, setPage]             = useState(1);
  const perPage = 10;

  useEffect(() => { fetchLeads(); }, []);

  useEffect(() => {
    let f = [...leads];
    if (search)       f = f.filter(l => l.name.toLowerCase().includes(search.toLowerCase()) || (l.phone||"").includes(search) || (l.location||"").toLowerCase().includes(search.toLowerCase()));
    if (tierFilter)   f = f.filter(l => l.tier === tierFilter);
    if (statusFilter) f = f.filter(l => l.status === statusFilter);
    setFiltered(f);
    setPage(1);
  }, [leads, search, tierFilter, statusFilter]);

  async function fetchLeads() {
    setLoading(true);
    const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (!error) setLeads(data);
    setLoading(false);
  }

  async function assignLead() {
    if (!assignAgent || !selected) return showToast("Select an agent first");
    const { error } = await supabase.from("leads").update({ agent: assignAgent, status: selected.status === "New" ? "Assigned" : selected.status }).eq("id", selected.id);
    if (!error) { showToast(`✓ Assigned to ${assignAgent}`); setSelected(null); fetchLeads(); }
  }

  async function markConverted() {
    if (!selected) return;
    const { error } = await supabase.from("leads").update({ status: "Converted" }).eq("id", selected.id);
    if (!error) { showToast("🏆 Marked as converted"); setSelected(null); fetchLeads(); }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  function exportCSV() {
    const cols = ["name","phone","location","tier","score","source","status","agent","income","business_type","notes"];
    const rows = [cols.join(","), ...filtered.map(l => cols.map(c => `"${(l[c]||"").toString().replace(/"/g,'""')}"`).join(","))];
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(rows.join("\n"));
    a.download = "leadflow-nigeria.csv";
    a.click();
    showToast("⬇ CSV downloaded");
  }

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageLeads  = filtered.slice((page - 1) * perPage, page * perPage);
  const stats = {
    total:     leads.length,
    newLeads:  leads.filter(l => l.status === "New").length,
    assigned:  leads.filter(l => l.status === "Assigned").length,
    converted: leads.filter(l => l.status === "Converted").length,
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0f1e; color: #f0f4ff; font-family: 'DM Sans', sans-serif; min-height: 100vh; }
        .top-bar { position: sticky; top: 0; padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; background: rgba(10,15,30,0.95); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.08); z-index: 100; }
        .logo { font-family: 'DM Serif Display', serif; font-weight: 400; font-size: 19px; letter-spacing: 0em; }
        .logo span { color: #60a5fa; }
        .btn { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; padding: 7px 14px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.14); background: #1a2235; color: #f0f4ff; cursor: pointer; transition: background 0.15s; white-space: nowrap; font-family: inherit; }
        .btn:hover { background: #111827; }
        .btn-primary { background: #3b82f6; border-color: #3b82f6; color: #fff; }
        .btn-primary:hover { background: #2563eb; }
        .page { padding: 20px; max-width: 1100px; margin: 0 auto; }
        .section-label { font-size: 11px; font-weight: 500; color: #8899b8; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px; }
        .stat-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; margin-bottom: 24px; }
        @media(min-width:600px){ .stat-grid { grid-template-columns: repeat(4,1fr); } }
        .stat-box { background: #111827; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 16px; }
        .stat-num { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 28px; letter-spacing: -0.02em; }
        .stat-lbl { font-size: 11px; color: #8899b8; margin-top: 4px; }
        .filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
        .filter-input, .filter-select { background: #111827; border: 1px solid rgba(255,255,255,0.14); border-radius: 10px; color: #f0f4ff; font-size: 13px; font-family: inherit; padding: 8px 12px; outline: none; }
        .filter-input { flex: 1; min-width: 160px; }
        .filter-input::placeholder { color: #4a5a78; }
        .table-wrap { background: #111827; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; }
        .table-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .table-title { font-size: 13px; font-weight: 600; }
        .lead-count { font-size: 11px; color: #8899b8; background: #1a2235; padding: 3px 8px; border-radius: 20px; margin-left: 8px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        thead th { text-align: left; padding: 10px 16px; font-size: 11px; font-weight: 500; color: #4a5a78; letter-spacing: 0.05em; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.08); background: #1a2235; white-space: nowrap; }
        tbody tr { border-bottom: 1px solid rgba(255,255,255,0.08); cursor: pointer; transition: background 0.1s; }
        tbody tr:last-child { border-bottom: none; }
        tbody tr:hover { background: rgba(255,255,255,0.025); }
        td { padding: 12px 16px; color: #8899b8; vertical-align: middle; }
        td.name { color: #f0f4ff; font-weight: 500; }
        .pill { display: inline-flex; align-items: center; font-size: 11px; font-weight: 500; padding: 3px 9px; border-radius: 20px; white-space: nowrap; }
        .pill-corporate { background: rgba(139,92,246,0.15); color: #8b5cf6; }
        .pill-sme       { background: rgba(59,130,246,0.15);  color: #60a5fa; }
        .pill-mass      { background: rgba(16,185,129,0.15);  color: #10b981; }
        .score-wrap { display: flex; align-items: center; gap: 8px; min-width: 80px; }
        .score-bar { flex: 1; height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; }
        .score-fill { height: 100%; border-radius: 2px; }
        .status-dot { display: inline-flex; align-items: center; gap: 6px; }
        .dot-circle { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .pagination { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.08); }
        .page-info { font-size: 12px; color: #8899b8; }
        .page-btns { display: flex; gap: 6px; }
        .page-btn { background: #1a2235; border: 1px solid rgba(255,255,255,0.08); color: #8899b8; font-size: 12px; font-family: inherit; padding: 5px 11px; border-radius: 7px; cursor: pointer; }
        .page-btn:hover { color: #f0f4ff; }
        .page-btn.active { background: #3b82f6; border-color: #3b82f6; color: #fff; }
        .page-btn:disabled { opacity: 0.3; pointer-events: none; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; }
        .drawer { position: fixed; top: 0; right: 0; bottom: 0; width: min(360px,100vw); background: #111827; border-left: 1px solid rgba(255,255,255,0.14); z-index: 201; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
        .drawer-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 20px; }
        .drawer-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 13px; gap: 12px; }
        .drawer-row-label { color: #8899b8; font-size: 12px; flex-shrink: 0; }
        .drawer-row-value { color: #f0f4ff; font-weight: 500; text-align: right; }
        .assign-select { width: 100%; background: #1a2235; border: 1px solid rgba(255,255,255,0.14); border-radius: 10px; color: #f0f4ff; font-size: 13px; font-family: inherit; padding: 9px 12px; outline: none; cursor: pointer; margin-top: 4px; }
        .action-row { display: flex; gap: 8px; }
        .action-row .btn { flex: 1; justify-content: center; }
        .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(80px); background: #1a2235; border: 1px solid rgba(255,255,255,0.14); border-radius: 20px; padding: 10px 18px; font-size: 13px; color: #f0f4ff; z-index: 300; transition: transform 0.3s; white-space: nowrap; }
        .toast.show { transform: translateX(-50%) translateY(0); }
        .empty { text-align: center; padding: 48px 24px; color: #8899b8; }
        .top-actions { display: flex; gap: 8px; }
      `}</style>

      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display&display=swap" rel="stylesheet" />

      {/* TOP BAR */}
      <div className="top-bar">
        <div className="logo">Lead<span>Flow</span> NG</div>
        <div className="top-actions">
          <button className="btn" onClick={exportCSV}>⬇ Export CSV</button>
          <button className="btn btn-primary" onClick={fetchLeads}>↻ Refresh</button>
        </div>
      </div>

      <div className="page">
        {/* STATS */}
        <div className="section-label" style={{marginBottom:10}}>Today's summary</div>
        <div className="stat-grid">
          <div className="stat-box"><div className="stat-num" style={{color:"#60a5fa"}}>{stats.total}</div><div className="stat-lbl">Total leads</div></div>
          <div className="stat-box"><div className="stat-num" style={{color:"#10b981"}}>{stats.newLeads}</div><div className="stat-lbl">New leads</div></div>
          <div className="stat-box"><div className="stat-num" style={{color:"#f59e0b"}}>{stats.assigned}</div><div className="stat-lbl">Assigned</div></div>
          <div className="stat-box"><div className="stat-num" style={{color:"#f97316"}}>{stats.converted}</div><div className="stat-lbl">Converted</div></div>
        </div>

        {/* FILTERS */}
        <div className="filters">
          <input className="filter-input" placeholder="Search name, phone, location…" value={search} onChange={e => setSearch(e.target.value)} />
          <select className="filter-select" value={tierFilter} onChange={e => setTierFilter(e.target.value)}>
            <option value="">All tiers</option>
            <option>Corporate</option><option>SME</option><option>Mass Market</option>
          </select>
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option>New</option><option>Assigned</option><option>Contacted</option><option>Converted</option>
          </select>
        </div>

        {/* TABLE */}
        <div className="table-wrap">
          <div className="table-header">
            <div style={{display:"flex",alignItems:"center"}}>
              <span className="table-title">Lead database</span>
              <span className="lead-count">{filtered.length} leads</span>
            </div>
            <span style={{fontSize:12,color:"#4a5a78"}}>Click a row for details</span>
          </div>
          <div style={{overflowX:"auto"}}>
            {loading ? (
              <div className="empty">Loading leads…</div>
            ) : filtered.length === 0 ? (
              <div className="empty">No leads match your filters</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th><th>Phone</th><th>Location</th><th>Tier</th>
                    <th>AI Score</th><th>Source</th><th>Status</th><th>Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {pageLeads.map(l => (
                    <tr key={l.id} onClick={() => { setSelected(l); setAssignAgent(l.agent || ""); }}>
                      <td className="name">{l.name}</td>
                      <td style={{fontSize:12}}>{l.phone}</td>
                      <td>{l.location}</td>
                      <td><span className={`pill ${tierClass(l.tier)}`}>{l.tier}</span></td>
                      <td>
                        <div className="score-wrap">
                          <div className="score-bar"><div className="score-fill" style={{width:`${l.score}%`,background:scoreColor(l.score)}}/></div>
                          <span style={{fontSize:12,fontWeight:600,color:scoreColor(l.score),minWidth:24,textAlign:"right"}}>{l.score}</span>
                        </div>
                      </td>
                      <td style={{fontSize:12}}>{l.source}</td>
                      <td>
                        <div className="status-dot">
                          <div className="dot-circle" style={{background:statusColor(l.status)}}/>
                          {l.status}
                        </div>
                      </td>
                      <td style={{fontSize:12,color:l.agent?"#f0f4ff":"#4a5a78"}}>{l.agent || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="pagination">
            <span className="page-info">Showing {Math.min((page-1)*perPage+1,filtered.length)}–{Math.min(page*perPage,filtered.length)} of {filtered.length}</span>
            <div className="page-btns">
              <button className="page-btn" disabled={page===1} onClick={()=>setPage(p=>p-1)}>←</button>
              {Array.from({length:totalPages},(_,i)=>(
                <button key={i} className={`page-btn${page===i+1?" active":""}`} onClick={()=>setPage(i+1)}>{i+1}</button>
              ))}
              <button className="page-btn" disabled={page===totalPages||totalPages===0} onClick={()=>setPage(p=>p+1)}>→</button>
            </div>
          </div>
        </div>
      </div>

      {/* DRAWER */}
      {selected && (
        <>
          <div className="overlay" onClick={() => setSelected(null)} />
          <div className="drawer">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span className="section-label" style={{margin:0}}>Lead detail</span>
              <button className="btn" onClick={() => setSelected(null)}>✕ Close</button>
            </div>
            <div className="drawer-name">{selected.name}</div>
            <span className={`pill ${tierClass(selected.tier)}`}>{selected.tier}</span>
            {[
              ["Phone", selected.phone],
              ["Location", selected.location],
              ["Income", selected.income],
              ["Business", selected.business_type],
              ["AI Score", `${selected.score}/100`],
              ["Source", selected.source],
              ["Status", selected.status],
              ["Agent", selected.agent || "—"],
              ["Notes", selected.notes],
            ].map(([label, value]) => (
              <div className="drawer-row" key={label}>
                <span className="drawer-row-label">{label}</span>
                <span className="drawer-row-value">{value}</span>
              </div>
            ))}
            <div>
              <div className="section-label">Assign to agent</div>
              <select className="assign-select" value={assignAgent} onChange={e => setAssignAgent(e.target.value)}>
                <option value="">— Select agent —</option>
                {AGENTS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="action-row">
              <button className="btn btn-primary" onClick={assignLead}>✓ Assign</button>
              <button className="btn" onClick={markConverted}>🏆 Converted</button>
            </div>
            <button className="btn" style={{width:"100%",justifyContent:"center"}} onClick={exportCSV}>⬇ Export CSV</button>
          </div>
        </>
      )}

      {/* TOAST */}
      <div className={`toast${toast?" show":""}`}>{toast}</div>
    </>
  );
}