import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://jyigungffdpqdgknhqao.supabase.co",
  "sb_publishable_Am7kFgOwqUw6BWWwElm0pw_0nS_wzHP"
);

const DEFAULT_AGENTS = ["Emeka Obi","Fatima Yusuf","Chidi Nwosu","Blessing Adeyemi","Musa Ibrahim","Ngozi Eze"];

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT Abuja","Gombe",
  "Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos",
  "Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto",
  "Taraba","Yobe","Zamfara"
];

const BUSINESS_TYPES = [
  "Supermarket","Pharmacy","Hotel","Restaurant","Hospital","School",
  "Logistics","Filling Station","Hardware Store","Fashion Shop",
  "Electronics Store","Church","Mosque","Market","Salon","Bakery",
  "Printing Press","Clinic"
];

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

const EMPTY_LEAD = { name:"", phone:"", location:"", tier:"SME", score:50, source:"Manual", status:"New", agent:"", income:"", business_type:"", notes:"" };

export default function App() {
  const [leads, setLeads]         = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [assignAgent, setAssignAgent] = useState("");
  const [toast, setToast]         = useState("");
  const [page, setPage]           = useState(1);
  const perPage = 10;

  // Filters
  const [search, setSearch]           = useState("");
  const [tierFilter, setTierFilter]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [btypeFilter, setBtypeFilter] = useState("");
  const [dateFrom, setDateFrom]       = useState("");
  const [dateTo, setDateTo]           = useState("");
  const [statClick, setStatClick]     = useState(""); // which stat card is active

  // Agents
  const [agents, setAgents] = useState(() => {
    try { return JSON.parse(localStorage.getItem("lf_agents")) || DEFAULT_AGENTS; }
    catch { return DEFAULT_AGENTS; }
  });
  const [showAgentMgr, setShowAgentMgr] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");

  // Add Lead
  const [showAddLead, setShowAddLead] = useState(false);
  const [newLead, setNewLead]         = useState(EMPTY_LEAD);
  const [saving, setSaving]           = useState(false);

  // Find Leads modal
  const [showFindLeads, setShowFindLeads] = useState(false);

  useEffect(() => { fetchLeads(); }, []);

  useEffect(() => {
    let f = [...leads];
    if (search)       f = f.filter(l => l.name.toLowerCase().includes(search.toLowerCase()) || (l.phone||"").includes(search) || (l.location||"").toLowerCase().includes(search.toLowerCase()));
    if (tierFilter)   f = f.filter(l => l.tier === tierFilter);
    if (statusFilter) f = f.filter(l => l.status === statusFilter);
    if (stateFilter)  f = f.filter(l => (l.location||"").toLowerCase().includes(stateFilter.toLowerCase()));
    if (btypeFilter)  f = f.filter(l => (l.business_type||"").toLowerCase().includes(btypeFilter.toLowerCase()));
    if (dateFrom)     f = f.filter(l => l.created_at && l.created_at >= dateFrom);
    if (dateTo)       f = f.filter(l => l.created_at && l.created_at <= dateTo + "T23:59:59");
    if (statClick === "new")       f = f.filter(l => l.status === "New");
    if (statClick === "assigned")  f = f.filter(l => l.status === "Assigned");
    if (statClick === "converted") f = f.filter(l => l.status === "Converted");
    setFiltered(f);
    setPage(1);
  }, [leads, search, tierFilter, statusFilter, stateFilter, btypeFilter, dateFrom, dateTo, statClick]);

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

  async function saveLead() {
    if (!newLead.name.trim()) return showToast("Name is required");
    setSaving(true);
    const { error } = await supabase.from("leads").insert([{ ...newLead, score: Number(newLead.score) }]);
    setSaving(false);
    if (!error) { showToast("✓ Lead added"); setNewLead(EMPTY_LEAD); setShowAddLead(false); fetchLeads(); }
    else showToast("Error saving lead");
  }

  function addAgent() {
    const name = newAgentName.trim();
    if (!name) return;
    if (agents.includes(name)) return showToast("Agent already exists");
    const updated = [...agents, name];
    setAgents(updated);
    localStorage.setItem("lf_agents", JSON.stringify(updated));
    setNewAgentName("");
    showToast(`✓ ${name} added`);
  }

  function removeAgent(name) {
    const updated = agents.filter(a => a !== name);
    setAgents(updated);
    localStorage.setItem("lf_agents", JSON.stringify(updated));
    showToast(`Removed ${name}`);
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  function exportCSV() {
    const cols = ["name","phone","location","tier","score","source","status","agent","income","business_type","notes"];
    const rows = [cols.join(","), ...filtered.map(l => cols.map(c => `"${(l[c]||"").toString().replace(/"/g,'""')}"`).join(","))];
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(rows.join("\n"));
    a.download = "leadflow-nigeria.csv"; a.click();
    showToast("⬇ CSV downloaded");
  }

  function handleStatClick(key) {
    setStatClick(prev => prev === key ? "" : key);
    setTierFilter(""); setStatusFilter(""); setSearch("");
  }

  function clearAllFilters() {
    setSearch(""); setTierFilter(""); setStatusFilter("");
    setStateFilter(""); setBtypeFilter(""); setDateFrom(""); setDateTo(""); setStatClick("");
  }

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageLeads  = filtered.slice((page-1)*perPage, page*perPage);
  const stats = {
    total:     leads.length,
    newLeads:  leads.filter(l => l.status === "New").length,
    assigned:  leads.filter(l => l.status === "Assigned").length,
    converted: leads.filter(l => l.status === "Converted").length,
  };
  const hasActiveFilters = search||tierFilter||statusFilter||stateFilter||btypeFilter||dateFrom||dateTo||statClick;

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0f1e; color: #f0f4ff; font-family: 'DM Sans', sans-serif; min-height: 100vh; }

        .top-bar { position: sticky; top: 0; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; background: rgba(10,15,30,0.97); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.08); z-index: 100; gap: 8px; }
        .logo { font-family: 'DM Serif Display', serif; font-weight: 400; font-size: 18px; white-space: nowrap; }
        .logo span { color: #60a5fa; }
        .top-actions { display: flex; gap: 6px; flex-wrap: nowrap; }

        .btn { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 500; padding: 7px 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.14); background: #1a2235; color: #f0f4ff; cursor: pointer; transition: background 0.15s; white-space: nowrap; font-family: inherit; }
        .btn:hover { background: #0d1627; }
        .btn-primary { background: #3b82f6; border-color: #3b82f6; color: #fff; }
        .btn-primary:hover { background: #2563eb; }
        .btn-green { background: #059669; border-color: #059669; color: #fff; }
        .btn-green:hover { background: #047857; }
        .btn-danger { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3); color: #ef4444; }
        .btn-danger:hover { background: rgba(239,68,68,0.25); }

        .page { padding: 16px; max-width: 1200px; margin: 0 auto; }
        .section-label { font-size: 11px; font-weight: 500; color: #8899b8; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px; }

        /* STAT CARDS */
        .stat-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; margin-bottom: 20px; }
        @media(min-width:600px){ .stat-grid { grid-template-columns: repeat(4,1fr); } }
        .stat-box { background: #111827; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px; cursor: pointer; transition: border-color 0.15s, background 0.15s; user-select: none; }
        .stat-box:hover { background: #1a2235; }
        .stat-box.active { border-color: #3b82f6; background: rgba(59,130,246,0.08); }
        .stat-num { font-weight: 800; font-size: 26px; letter-spacing: -0.02em; }
        .stat-lbl { font-size: 11px; color: #8899b8; margin-top: 4px; }
        .stat-hint { font-size: 10px; color: #4a5a78; margin-top: 2px; }

        /* DATE + FILTERS */
        .filters-section { background: #111827; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px; margin-bottom: 14px; }
        .filters-title { font-size: 12px; font-weight: 600; color: #8899b8; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; }
        .filters-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        @media(min-width:700px){ .filters-grid { grid-template-columns: repeat(3,1fr); } }
        @media(min-width:1000px){ .filters-grid { grid-template-columns: repeat(6,1fr); } }
        .filter-input, .filter-select { background: #1a2235; border: 1px solid rgba(255,255,255,0.14); border-radius: 10px; color: #f0f4ff; font-size: 12px; font-family: inherit; padding: 7px 10px; outline: none; width: 100%; }
        .filter-input::placeholder { color: #4a5a78; }
        .filter-input[type="date"] { color-scheme: dark; }
        .search-full { grid-column: 1 / -1; }
        @media(min-width:1000px){ .search-full { grid-column: auto; } }
        .clear-btn { font-size: 11px; color: #ef4444; background: none; border: none; cursor: pointer; font-family: inherit; padding: 0; }
        .clear-btn:hover { text-decoration: underline; }

        /* TABLE */
        .table-wrap { background: #111827; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; }
        .table-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap; gap: 8px; }
        .table-title { font-size: 13px; font-weight: 600; }
        .lead-count { font-size: 11px; color: #8899b8; background: #1a2235; padding: 3px 8px; border-radius: 20px; margin-left: 8px; }
        .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 600px; }
        thead th { text-align: left; padding: 10px 14px; font-size: 11px; font-weight: 500; color: #4a5a78; letter-spacing: 0.05em; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.08); background: #1a2235; white-space: nowrap; }
        tbody tr { border-bottom: 1px solid rgba(255,255,255,0.08); cursor: pointer; transition: background 0.1s; }
        tbody tr:last-child { border-bottom: none; }
        tbody tr:hover { background: rgba(255,255,255,0.025); }
        td { padding: 11px 14px; color: #8899b8; vertical-align: middle; }
        td.name { color: #f0f4ff; font-weight: 500; white-space: nowrap; }

        .pill { display: inline-flex; align-items: center; font-size: 11px; font-weight: 500; padding: 3px 9px; border-radius: 20px; white-space: nowrap; }
        .pill-corporate { background: rgba(139,92,246,0.15); color: #8b5cf6; }
        .pill-sme       { background: rgba(59,130,246,0.15);  color: #60a5fa; }
        .pill-mass      { background: rgba(16,185,129,0.15);  color: #10b981; }

        .score-wrap { display: flex; align-items: center; gap: 8px; min-width: 70px; }
        .score-bar { flex: 1; height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; min-width: 36px; }
        .score-fill { height: 100%; border-radius: 2px; }
        .status-dot { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
        .dot-circle { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

        .pagination { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-top: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap; gap: 8px; }
        .page-info { font-size: 12px; color: #8899b8; }
        .page-btns { display: flex; gap: 5px; flex-wrap: wrap; }
        .page-btn { background: #1a2235; border: 1px solid rgba(255,255,255,0.08); color: #8899b8; font-size: 12px; font-family: inherit; padding: 5px 10px; border-radius: 7px; cursor: pointer; }
        .page-btn:hover { color: #f0f4ff; }
        .page-btn.active { background: #3b82f6; border-color: #3b82f6; color: #fff; }
        .page-btn:disabled { opacity: 0.3; pointer-events: none; }

        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 200; }
        .drawer { position: fixed; top: 0; right: 0; bottom: 0; width: min(380px,100vw); background: #111827; border-left: 1px solid rgba(255,255,255,0.14); z-index: 201; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
        .drawer-name { font-weight: 700; font-size: 20px; }
        .drawer-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 9px 0; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 13px; gap: 12px; }
        .drawer-row-label { color: #8899b8; font-size: 12px; flex-shrink: 0; }
        .drawer-row-value { color: #f0f4ff; font-weight: 500; text-align: right; }
        .assign-select { width: 100%; background: #1a2235; border: 1px solid rgba(255,255,255,0.14); border-radius: 10px; color: #f0f4ff; font-size: 13px; font-family: inherit; padding: 9px 12px; outline: none; cursor: pointer; margin-top: 4px; }
        .action-row { display: flex; gap: 8px; }
        .action-row .btn { flex: 1; justify-content: center; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 300; display: flex; align-items: flex-end; justify-content: center; }
        @media(min-width:600px){ .modal-overlay { align-items: center; } }
        .modal { background: #111827; border: 1px solid rgba(255,255,255,0.14); border-radius: 20px 20px 0 0; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
        @media(min-width:600px){ .modal { border-radius: 20px; } }
        .modal-title { font-size: 16px; font-weight: 700; }
        .form-group { display: flex; flex-direction: column; gap: 5px; }
        .form-label { font-size: 11px; color: #8899b8; text-transform: uppercase; letter-spacing: 0.06em; }
        .form-input, .form-select, .form-textarea { background: #1a2235; border: 1px solid rgba(255,255,255,0.14); border-radius: 10px; color: #f0f4ff; font-size: 13px; font-family: inherit; padding: 9px 12px; outline: none; width: 100%; }
        .form-input::placeholder { color: #4a5a78; }
        .form-textarea { resize: vertical; min-height: 60px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .agent-list { display: flex; flex-direction: column; gap: 8px; }
        .agent-item { display: flex; align-items: center; justify-content: space-between; background: #1a2235; border-radius: 10px; padding: 9px 12px; font-size: 13px; }

        /* Find Leads */
        .find-leads-box { background: #1a2235; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .find-leads-box h3 { font-size: 14px; font-weight: 600; }
        .find-leads-box p { font-size: 13px; color: #8899b8; line-height: 1.6; }
        .code-block { background: #0a0f1e; border-radius: 8px; padding: 12px; font-family: monospace; font-size: 12px; color: #10b981; overflow-x: auto; }

        .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(80px); background: #1a2235; border: 1px solid rgba(255,255,255,0.14); border-radius: 20px; padding: 10px 18px; font-size: 13px; color: #f0f4ff; z-index: 400; transition: transform 0.3s; white-space: nowrap; }
        .toast.show { transform: translateX(-50%) translateY(0); }
        .empty { text-align: center; padding: 48px 24px; color: #8899b8; }
      `}</style>

      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap" rel="stylesheet" />

      {/* TOP BAR */}
      <div className="top-bar">
        <div className="logo">Lead<span>Flow</span> NG</div>
        <div className="top-actions">
          <button className="btn btn-green" onClick={() => setShowFindLeads(true)}>⚡ Find Leads</button>
          <button className="btn" onClick={() => setShowAgentMgr(true)}>👥 Agents</button>
          <button className="btn btn-primary" onClick={() => setShowAddLead(true)}>+ Add Lead</button>
          <button className="btn" onClick={exportCSV}>⬇ CSV</button>
          <button className="btn" onClick={fetchLeads}>↻</button>
        </div>
      </div>

      <div className="page">
        {/* STAT CARDS — clickable */}
        <div className="section-label">
          {hasActiveFilters ? `Filtered view — showing ${filtered.length} of ${leads.length} leads` : "Summary — tap a card to filter"}
        </div>
        <div className="stat-grid">
          <div className={`stat-box${statClick===""&&!hasActiveFilters?" active":""}`} onClick={clearAllFilters}>
            <div className="stat-num" style={{color:"#60a5fa"}}>{leads.length}</div>
            <div className="stat-lbl">Total leads</div>
            <div className="stat-hint">Tap to show all</div>
          </div>
          <div className={`stat-box${statClick==="new"?" active":""}`} onClick={() => handleStatClick("new")}>
            <div className="stat-num" style={{color:"#10b981"}}>{stats.newLeads}</div>
            <div className="stat-lbl">New leads</div>
            <div className="stat-hint">Tap to filter</div>
          </div>
          <div className={`stat-box${statClick==="assigned"?" active":""}`} onClick={() => handleStatClick("assigned")}>
            <div className="stat-num" style={{color:"#f59e0b"}}>{stats.assigned}</div>
            <div className="stat-lbl">Assigned</div>
            <div className="stat-hint">Tap to filter</div>
          </div>
          <div className={`stat-box${statClick==="converted"?" active":""}`} onClick={() => handleStatClick("converted")}>
            <div className="stat-num" style={{color:"#f97316"}}>{stats.converted}</div>
            <div className="stat-lbl">Converted</div>
            <div className="stat-hint">Tap to filter</div>
          </div>
        </div>

        {/* FILTERS */}
        <div className="filters-section">
          <div className="filters-title">
            <span>🔎 Filters</span>
            {hasActiveFilters && <button className="clear-btn" onClick={clearAllFilters}>✕ Clear all</button>}
          </div>
          <div className="filters-grid">
            <input className="filter-input search-full" placeholder="Search name, phone, location…" value={search} onChange={e => setSearch(e.target.value)} />
            <select className="filter-select" value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
              <option value="">All states</option>
              {NIGERIAN_STATES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="filter-select" value={btypeFilter} onChange={e => setBtypeFilter(e.target.value)}>
              <option value="">All business types</option>
              {BUSINESS_TYPES.map(b => <option key={b}>{b}</option>)}
            </select>
            <select className="filter-select" value={tierFilter} onChange={e => setTierFilter(e.target.value)}>
              <option value="">All tiers</option>
              <option>Corporate</option><option>SME</option><option>Mass Market</option>
            </select>
            <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              <option>New</option><option>Assigned</option><option>Contacted</option><option>Converted</option>
            </select>
            <div style={{display:"flex",gap:4,alignItems:"center"}}>
              <input type="date" className="filter-input" style={{flex:1}} value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="From date" />
              <span style={{color:"#4a5a78",fontSize:11}}>–</span>
              <input type="date" className="filter-input" style={{flex:1}} value={dateTo} onChange={e => setDateTo(e.target.value)} title="To date" />
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="table-wrap">
          <div className="table-header">
            <div style={{display:"flex",alignItems:"center"}}>
              <span className="table-title">Lead database</span>
              <span className="lead-count">{filtered.length} leads</span>
            </div>
            <span style={{fontSize:12,color:"#4a5a78"}}>Tap a row for details</span>
          </div>
          <div className="table-scroll">
            {loading ? (
              <div className="empty">Loading leads…</div>
            ) : filtered.length === 0 ? (
              <div className="empty">No leads match your filters</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th><th>Phone</th><th>Location</th><th>Tier</th>
                    <th>AI Score</th><th>Business Type</th><th>Status</th><th>Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {pageLeads.map(l => (
                    <tr key={l.id} onClick={() => { setSelected(l); setAssignAgent(l.agent || ""); }}>
                      <td className="name">{l.name}</td>
                      <td style={{fontSize:12,whiteSpace:"nowrap"}}>{l.phone || "—"}</td>
                      <td style={{whiteSpace:"nowrap"}}>{l.location}</td>
                      <td><span className={`pill ${tierClass(l.tier)}`}>{l.tier}</span></td>
                      <td>
                        <div className="score-wrap">
                          <div className="score-bar"><div className="score-fill" style={{width:`${l.score}%`,background:scoreColor(l.score)}}/></div>
                          <span style={{fontSize:12,fontWeight:600,color:scoreColor(l.score),minWidth:24,textAlign:"right"}}>{l.score}</span>
                        </div>
                      </td>
                      <td style={{fontSize:12,whiteSpace:"nowrap"}}>{l.business_type || "—"}</td>
                      <td>
                        <div className="status-dot">
                          <div className="dot-circle" style={{background:statusColor(l.status)}}/>
                          {l.status}
                        </div>
                      </td>
                      <td style={{fontSize:12,color:l.agent?"#f0f4ff":"#4a5a78",whiteSpace:"nowrap"}}>{l.agent || "—"}</td>
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
              {Array.from({length:Math.min(totalPages,7)},(_,i)=>(
                <button key={i} className={`page-btn${page===i+1?" active":""}`} onClick={()=>setPage(i+1)}>{i+1}</button>
              ))}
              {totalPages > 7 && <span style={{color:"#4a5a78",fontSize:12,padding:"0 4px"}}>…{totalPages}</span>}
              <button className="page-btn" disabled={page===totalPages||totalPages===0} onClick={()=>setPage(p=>p+1)}>→</button>
            </div>
          </div>
        </div>
      </div>

      {/* DETAIL DRAWER */}
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
              ["Business", selected.business_type],
              ["Income", selected.income],
              ["AI Score", `${selected.score}/100`],
              ["Source", selected.source],
              ["Status", selected.status],
              ["Agent", selected.agent || "—"],
              ["Notes", selected.notes],
            ].map(([label, value]) => value ? (
              <div className="drawer-row" key={label}>
                <span className="drawer-row-label">{label}</span>
                <span className="drawer-row-value">{value}</span>
              </div>
            ) : null)}
            <div>
              <div className="section-label">Assign to agent</div>
              <select className="assign-select" value={assignAgent} onChange={e => setAssignAgent(e.target.value)}>
                <option value="">— Select agent —</option>
                {agents.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="action-row">
              <button className="btn btn-primary" onClick={assignLead}>✓ Assign</button>
              <button className="btn" onClick={markConverted}>🏆 Converted</button>
            </div>
          </div>
        </>
      )}

      {/* FIND LEADS MODAL */}
      {showFindLeads && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowFindLeads(false)}>
          <div className="modal">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span className="modal-title">⚡ Find New Leads</span>
              <button className="btn" onClick={() => setShowFindLeads(false)}>✕</button>
            </div>
            <div className="find-leads-box">
              <h3>Run the scraper on your laptop</h3>
              <p>The scraper pulls real businesses from Google Maps across Nigeria and adds them directly to this database. Run it anytime you want fresh leads.</p>
              <div className="code-block">
                cd C:\Users\stanl\leadflow-scraper<br/>
                python scraper.py
              </div>
              <p style={{fontSize:12}}>It runs for ~20–40 minutes and adds hundreds of leads automatically. Refresh the dashboard when done.</p>
            </div>
            <div className="find-leads-box">
              <h3>Want to target a specific state or business type?</h3>
              <p>Open <strong>scraper.py</strong> and edit the <strong>CITIES</strong> or <strong>BUSINESS_TYPES</strong> lists at the top of the file. Then run it again.</p>
            </div>
            <button className="btn" style={{justifyContent:"center"}} onClick={() => setShowFindLeads(false)}>Close</button>
          </div>
        </div>
      )}

      {/* ADD LEAD MODAL */}
      {showAddLead && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowAddLead(false)}>
          <div className="modal">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span className="modal-title">Add New Lead</span>
              <button className="btn" onClick={() => setShowAddLead(false)}>✕</button>
            </div>
            <div className="form-grid">
              <div className="form-group" style={{gridColumn:"1/-1"}}>
                <label className="form-label">Full Name *</label>
                <input className="form-input" placeholder="e.g. Chukwuemeka Obi" value={newLead.name} onChange={e=>setNewLead(p=>({...p,name:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" placeholder="08012345678" value={newLead.phone} onChange={e=>setNewLead(p=>({...p,phone:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" placeholder="Lekki, Lagos" value={newLead.location} onChange={e=>setNewLead(p=>({...p,location:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Tier</label>
                <select className="form-select" value={newLead.tier} onChange={e=>setNewLead(p=>({...p,tier:e.target.value}))}>
                  <option>Corporate</option><option>SME</option><option>Mass Market</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">AI Score (0–100)</label>
                <input className="form-input" type="number" min="0" max="100" value={newLead.score} onChange={e=>setNewLead(p=>({...p,score:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Source</label>
                <select className="form-select" value={newLead.source} onChange={e=>setNewLead(p=>({...p,source:e.target.value}))}>
                  <option>Manual</option><option>Google Maps</option><option>CAC Registry</option><option>Facebook</option><option>Referral</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Income</label>
                <input className="form-input" placeholder="e.g. ₦500k/month" value={newLead.income} onChange={e=>setNewLead(p=>({...p,income:e.target.value}))} />
              </div>
              <div className="form-group" style={{gridColumn:"1/-1"}}>
                <label className="form-label">Business Type</label>
                <input className="form-input" placeholder="e.g. Retail, Import/Export" value={newLead.business_type} onChange={e=>setNewLead(p=>({...p,business_type:e.target.value}))} />
              </div>
              <div className="form-group" style={{gridColumn:"1/-1"}}>
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" placeholder="Any extra info…" value={newLead.notes} onChange={e=>setNewLead(p=>({...p,notes:e.target.value}))} />
              </div>
            </div>
            <div className="action-row">
              <button className="btn" onClick={() => setShowAddLead(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveLead} disabled={saving} style={{flex:2,justifyContent:"center"}}>
                {saving ? "Saving…" : "✓ Save Lead"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE AGENTS MODAL */}
      {showAgentMgr && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowAgentMgr(false)}>
          <div className="modal">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span className="modal-title">Manage Agents</span>
              <button className="btn" onClick={() => setShowAgentMgr(false)}>✕</button>
            </div>
            <div style={{display:"flex",gap:8}}>
              <input className="form-input" placeholder="Agent full name" value={newAgentName} onChange={e=>setNewAgentName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addAgent()} />
              <button className="btn btn-primary" onClick={addAgent}>+ Add</button>
            </div>
            <div className="agent-list">
              {agents.map(a => (
                <div className="agent-item" key={a}>
                  <span>{a}</span>
                  <button className="btn btn-danger" style={{padding:"4px 10px",fontSize:11}} onClick={() => removeAgent(a)}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={`toast${toast?" show":""}`}>{toast}</div>
    </>
  );
}
