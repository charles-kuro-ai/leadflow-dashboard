import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://jyigungffdpqdgknhqao.supabase.co",
  "sb_publishable_Am7kFgOwqUw6BWWwElm0pw_0nS_wzHP"
);

// ── CHANGE THIS after deploying to Railway ──
const API_URL = "https://your-api.railway.app";

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

const DATE_OPTIONS = [
  { label: "All time", value: "" },
  { label: "Today", value: "today" },
  { label: "This week", value: "week" },
  { label: "This month", value: "month" },
  { label: "Last month", value: "last_month" },
  { label: "Last 3 months", value: "3months" },
];

function getDateRange(value) {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  if (!value) return { from: "", to: "" };
  if (value === "today") return { from: today, to: today };
  if (value === "week") {
    const d = new Date(now); d.setDate(d.getDate() - 7);
    return { from: d.toISOString().split("T")[0], to: today };
  }
  if (value === "month") {
    return { from: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-01`, to: today };
  }
  if (value === "last_month") {
    const d = new Date(now.getFullYear(), now.getMonth()-1, 1);
    const e = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: d.toISOString().split("T")[0], to: e.toISOString().split("T")[0] };
  }
  if (value === "3months") {
    const d = new Date(now); d.setMonth(d.getMonth()-3);
    return { from: d.toISOString().split("T")[0], to: today };
  }
  return { from: "", to: "" };
}

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
  const [editMode, setEditMode]   = useState(false);
  const [editData, setEditData]   = useState({});
  const [assignAgent, setAssignAgent] = useState("");
  const [toast, setToast]         = useState("");
  const [page, setPage]           = useState(1);
  const perPage = 10;

  // Selection for bulk delete
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Filters
  const [search, setSearch]           = useState("");
  const [tierFilter, setTierFilter]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [btypeFilter, setBtypeFilter] = useState("");
  const [dateFilter, setDateFilter]   = useState("");
  const [statClick, setStatClick]     = useState("");

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

  // Find Leads
  const [showFindLeads, setShowFindLeads] = useState(false);
  const [scrapeConfig, setScrapeConfig] = useState({ cities: [], business_types: [], max_per_search: 20 });
  const [scrapeJob, setScrapeJob]     = useState(null);
  const [scrapeStatus, setScrapeStatus] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => { fetchLeads(); }, []);

  useEffect(() => {
    const { from, to } = getDateRange(dateFilter);
    let f = [...leads];
    if (search)       f = f.filter(l => l.name.toLowerCase().includes(search.toLowerCase()) || (l.phone||"").includes(search) || (l.location||"").toLowerCase().includes(search.toLowerCase()));
    if (tierFilter)   f = f.filter(l => l.tier === tierFilter);
    if (statusFilter) f = f.filter(l => l.status === statusFilter);
    if (stateFilter)  f = f.filter(l => (l.location||"").toLowerCase().includes(stateFilter.toLowerCase()));
    if (btypeFilter)  f = f.filter(l => (l.business_type||"").toLowerCase().includes(btypeFilter.toLowerCase()));
    if (from) f = f.filter(l => l.created_at && l.created_at >= from);
    if (to)   f = f.filter(l => l.created_at && l.created_at <= to + "T23:59:59");
    if (statClick === "new")       f = f.filter(l => l.status === "New");
    if (statClick === "assigned")  f = f.filter(l => l.status === "Assigned");
    if (statClick === "converted") f = f.filter(l => l.status === "Converted");
    setFiltered(f);
    setPage(1);
    setSelectedIds(new Set());
  }, [leads, search, tierFilter, statusFilter, stateFilter, btypeFilter, dateFilter, statClick]);

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

  async function saveEdit() {
    if (!editData.name?.trim()) return showToast("Name is required");
    setSaving(true);
    const { error } = await supabase.from("leads").update({
      name: editData.name, phone: editData.phone, location: editData.location,
      tier: editData.tier, status: editData.status, agent: editData.agent,
      income: editData.income, business_type: editData.business_type, notes: editData.notes,
      score: Number(editData.score),
    }).eq("id", selected.id);
    setSaving(false);
    if (!error) { showToast("✓ Lead updated"); setEditMode(false); setSelected(null); fetchLeads(); }
    else showToast("Error saving");
  }

  async function deleteLead(id) {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (!error) { showToast("Lead deleted"); setSelected(null); fetchLeads(); }
  }

  async function deleteSelected() {
    const ids = [...selectedIds];
    for (const id of ids) {
      await supabase.from("leads").delete().eq("id", id);
    }
    showToast(`✓ Deleted ${ids.length} leads`);
    setSelectedIds(new Set());
    setConfirmDelete(false);
    fetchLeads();
  }

  async function saveLead() {
    if (!newLead.name.trim()) return showToast("Name is required");
    setSaving(true);
    const { error } = await supabase.from("leads").insert([{ ...newLead, score: Number(newLead.score) }]);
    setSaving(false);
    if (!error) { showToast("✓ Lead added"); setNewLead(EMPTY_LEAD); setShowAddLead(false); fetchLeads(); }
    else showToast("Error saving lead");
  }

  async function startScrape() {
    if (!scrapeConfig.cities.length) return showToast("Select at least one state");
    if (!scrapeConfig.business_types.length) return showToast("Select at least one business type");
    try {
      const r = await fetch(`${API_URL}/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scrapeConfig)
      });
      const data = await r.json();
      if (data.job_id) {
        setScrapeJob(data.job_id);
        setScrapeStatus({ status: "starting", added: 0, progress: 0 });
        pollRef.current = setInterval(() => pollJob(data.job_id), 2000);
      } else {
        showToast("Failed to start scraper");
      }
    } catch (e) {
      showToast("Cannot reach API — is Railway deployed?");
    }
  }

  async function pollJob(jobId) {
    try {
      const r = await fetch(`${API_URL}/status/${jobId}`);
      const data = await r.json();
      setScrapeStatus(data);
      if (data.status === "done") {
        clearInterval(pollRef.current);
        showToast(`✅ Done! ${data.added} leads added`);
        fetchLeads();
      }
    } catch {}
  }

  function cancelScrape() {
    if (scrapeJob) fetch(`${API_URL}/cancel/${scrapeJob}`, { method: "POST" });
    clearInterval(pollRef.current);
    setScrapeJob(null);
    setScrapeStatus(null);
  }

  function toggleCity(city) {
    setScrapeConfig(p => ({
      ...p,
      cities: p.cities.includes(city) ? p.cities.filter(c => c !== city) : [...p.cities, city]
    }));
  }

  function toggleBtype(b) {
    setScrapeConfig(p => ({
      ...p,
      business_types: p.business_types.includes(b) ? p.business_types.filter(x => x !== b) : [...p.business_types, b]
    }));
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
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 3500); }

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
    setStateFilter(""); setBtypeFilter(""); setDateFilter(""); setStatClick("");
  }

  function toggleSelect(id, e) {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === pageLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pageLeads.map(l => l.id)));
    }
  }

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageLeads  = filtered.slice((page-1)*perPage, page*perPage);
  const stats = {
    total:     leads.length,
    newLeads:  leads.filter(l => l.status === "New").length,
    assigned:  leads.filter(l => l.status === "Assigned").length,
    converted: leads.filter(l => l.status === "Converted").length,
  };
  const hasActiveFilters = search||tierFilter||statusFilter||stateFilter||btypeFilter||dateFilter||statClick;

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0f1e; color: #f0f4ff; font-family: 'DM Sans', sans-serif; min-height: 100vh; }

        .top-bar { position: sticky; top: 0; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; background: rgba(10,15,30,0.97); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.08); z-index: 100; gap: 8px; flex-wrap: wrap; }
        .logo { font-family: 'DM Serif Display', serif; font-weight: 400; font-size: 18px; white-space: nowrap; }
        .logo span { color: #60a5fa; }
        .top-actions { display: flex; gap: 6px; flex-wrap: wrap; }

        .btn { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 500; padding: 7px 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.14); background: #1a2235; color: #f0f4ff; cursor: pointer; transition: background 0.15s; white-space: nowrap; font-family: inherit; }
        .btn:hover { background: #0d1627; }
        .btn-primary { background: #3b82f6; border-color: #3b82f6; color: #fff; }
        .btn-primary:hover { background: #2563eb; }
        .btn-green { background: #059669; border-color: #059669; color: #fff; }
        .btn-green:hover { background: #047857; }
        .btn-danger { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3); color: #ef4444; }
        .btn-danger:hover { background: rgba(239,68,68,0.25); }
        .btn-red { background: #dc2626; border-color: #dc2626; color: #fff; }
        .btn-red:hover { background: #b91c1c; }

        .page { padding: 16px; max-width: 1200px; margin: 0 auto; }
        .section-label { font-size: 11px; font-weight: 500; color: #8899b8; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px; }

        .stat-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; margin-bottom: 20px; }
        @media(min-width:600px){ .stat-grid { grid-template-columns: repeat(4,1fr); } }
        .stat-box { background: #111827; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px; cursor: pointer; transition: border-color 0.15s, background 0.15s; user-select: none; }
        .stat-box:hover { background: #1a2235; }
        .stat-box.active { border-color: #3b82f6; background: rgba(59,130,246,0.08); }
        .stat-num { font-weight: 800; font-size: 26px; letter-spacing: -0.02em; }
        .stat-lbl { font-size: 11px; color: #8899b8; margin-top: 4px; }
        .stat-hint { font-size: 10px; color: #4a5a78; margin-top: 2px; }

        .filters-section { background: #111827; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px; margin-bottom: 14px; }
        .filters-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .filters-title { font-size: 12px; font-weight: 600; color: #8899b8; }
        .filters-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        @media(min-width:700px){ .filters-grid { grid-template-columns: repeat(3,1fr); } }
        @media(min-width:1000px){ .filters-grid { grid-template-columns: repeat(6,1fr); } }
        .filter-input, .filter-select { background: #1a2235; border: 1px solid rgba(255,255,255,0.14); border-radius: 10px; color: #f0f4ff; font-size: 12px; font-family: inherit; padding: 7px 10px; outline: none; width: 100%; }
        .filter-input::placeholder { color: #4a5a78; }
        .search-full { grid-column: 1 / -1; }
        @media(min-width:1000px){ .search-full { grid-column: auto; } }
        .clear-btn { font-size: 11px; color: #ef4444; background: none; border: none; cursor: pointer; font-family: inherit; padding: 0; }
        .clear-btn:hover { text-decoration: underline; }

        .bulk-bar { display: flex; align-items: center; gap: 10px; padding: 10px 16px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 10px; margin-bottom: 10px; }
        .bulk-bar span { font-size: 13px; color: #f0f4ff; flex: 1; }

        .table-wrap { background: #111827; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; }
        .table-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap; gap: 8px; }
        .table-title { font-size: 13px; font-weight: 600; }
        .lead-count { font-size: 11px; color: #8899b8; background: #1a2235; padding: 3px 8px; border-radius: 20px; margin-left: 8px; }
        .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 640px; }
        thead th { text-align: left; padding: 10px 12px; font-size: 11px; font-weight: 500; color: #4a5a78; letter-spacing: 0.05em; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.08); background: #1a2235; white-space: nowrap; }
        tbody tr { border-bottom: 1px solid rgba(255,255,255,0.08); cursor: pointer; transition: background 0.1s; }
        tbody tr:last-child { border-bottom: none; }
        tbody tr:hover { background: rgba(255,255,255,0.025); }
        tbody tr.row-selected { background: rgba(59,130,246,0.08); }
        td { padding: 10px 12px; color: #8899b8; vertical-align: middle; }
        td.name { color: #f0f4ff; font-weight: 500; white-space: nowrap; }
        td.check { width: 36px; }
        input[type="checkbox"] { width: 15px; height: 15px; accent-color: #3b82f6; cursor: pointer; }

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
        .drawer { position: fixed; top: 0; right: 0; bottom: 0; width: min(400px,100vw); background: #111827; border-left: 1px solid rgba(255,255,255,0.14); z-index: 201; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
        .drawer-name { font-weight: 700; font-size: 20px; }
        .drawer-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 9px 0; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 13px; gap: 12px; }
        .drawer-row-label { color: #8899b8; font-size: 12px; flex-shrink: 0; }
        .drawer-row-value { color: #f0f4ff; font-weight: 500; text-align: right; }
        .assign-select { width: 100%; background: #1a2235; border: 1px solid rgba(255,255,255,0.14); border-radius: 10px; color: #f0f4ff; font-size: 13px; font-family: inherit; padding: 9px 12px; outline: none; cursor: pointer; margin-top: 4px; }
        .action-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .action-row .btn { flex: 1; justify-content: center; min-width: 80px; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 300; display: flex; align-items: flex-end; justify-content: center; }
        @media(min-width:600px){ .modal-overlay { align-items: center; } }
        .modal { background: #111827; border: 1px solid rgba(255,255,255,0.14); border-radius: 20px 20px 0 0; width: 100%; max-width: 540px; max-height: 92vh; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
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
        .chip-grid { display: flex; flex-wrap: wrap; gap: 6px; }
        .chip { font-size: 12px; padding: 5px 11px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.14); background: #1a2235; color: #8899b8; cursor: pointer; transition: all 0.15s; }
        .chip:hover { border-color: #3b82f6; color: #f0f4ff; }
        .chip.on { background: #3b82f6; border-color: #3b82f6; color: #fff; }
        .progress-bar-wrap { background: rgba(255,255,255,0.08); border-radius: 8px; height: 8px; overflow: hidden; }
        .progress-bar-fill { height: 100%; background: #3b82f6; border-radius: 8px; transition: width 0.4s; }
        .scrape-status { background: #1a2235; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }

        .edit-input { background: #1a2235; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #f0f4ff; font-size: 13px; font-family: inherit; padding: 6px 10px; outline: none; width: 100%; }
        .edit-select { background: #1a2235; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #f0f4ff; font-size: 13px; font-family: inherit; padding: 6px 10px; outline: none; width: 100%; }

        .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(80px); background: #1a2235; border: 1px solid rgba(255,255,255,0.14); border-radius: 20px; padding: 10px 18px; font-size: 13px; color: #f0f4ff; z-index: 500; transition: transform 0.3s; white-space: nowrap; }
        .toast.show { transform: translateX(-50%) translateY(0); }
        .empty { text-align: center; padding: 48px 24px; color: #8899b8; }

        .confirm-box { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .confirm-box p { font-size: 13px; color: #f0f4ff; }
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
        {/* STAT CARDS */}
        <div className="section-label">{hasActiveFilters ? `Filtered — ${filtered.length} of ${leads.length} leads` : "Summary — tap a card to filter"}</div>
        <div className="stat-grid">
          <div className={`stat-box${!statClick&&!hasActiveFilters?" active":""}`} onClick={clearAllFilters}>
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
          <div className="filters-top">
            <span className="filters-title">🔎 Filters</span>
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
            <select className="filter-select" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
              {DATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* BULK DELETE BAR */}
        {selectedIds.size > 0 && (
          <div className="bulk-bar">
            <span>{selectedIds.size} lead{selectedIds.size > 1 ? "s" : ""} selected</span>
            <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>🗑 Delete selected</button>
            <button className="btn" onClick={() => setSelectedIds(new Set())}>✕ Clear</button>
          </div>
        )}

        {/* CONFIRM DELETE */}
        {confirmDelete && (
          <div className="confirm-box" style={{marginBottom:12}}>
            <p>Delete {selectedIds.size} lead{selectedIds.size>1?"s":""}? This cannot be undone.</p>
            <div style={{display:"flex",gap:8}}>
              <button className="btn btn-red" onClick={deleteSelected}>Yes, delete</button>
              <button className="btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
            </div>
          </div>
        )}

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
                    <th className="check">
                      <input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.size===pageLeads.length&&pageLeads.length>0} />
                    </th>
                    <th>Name</th><th>Phone</th><th>Location</th><th>Tier</th>
                    <th>AI Score</th><th>Business Type</th><th>Status</th><th>Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {pageLeads.map(l => (
                    <tr key={l.id} className={selectedIds.has(l.id)?"row-selected":""} onClick={() => { setSelected(l); setAssignAgent(l.agent||""); setEditMode(false); }}>
                      <td className="check" onClick={e => toggleSelect(l.id, e)}>
                        <input type="checkbox" checked={selectedIds.has(l.id)} onChange={()=>{}} />
                      </td>
                      <td className="name">{l.name}</td>
                      <td style={{fontSize:12,whiteSpace:"nowrap"}}>{l.phone||"—"}</td>
                      <td style={{whiteSpace:"nowrap"}}>{l.location}</td>
                      <td><span className={`pill ${tierClass(l.tier)}`}>{l.tier}</span></td>
                      <td>
                        <div className="score-wrap">
                          <div className="score-bar"><div className="score-fill" style={{width:`${l.score}%`,background:scoreColor(l.score)}}/></div>
                          <span style={{fontSize:12,fontWeight:600,color:scoreColor(l.score),minWidth:24,textAlign:"right"}}>{l.score}</span>
                        </div>
                      </td>
                      <td style={{fontSize:12,whiteSpace:"nowrap"}}>{l.business_type||"—"}</td>
                      <td><div className="status-dot"><div className="dot-circle" style={{background:statusColor(l.status)}}/>{l.status}</div></td>
                      <td style={{fontSize:12,color:l.agent?"#f0f4ff":"#4a5a78",whiteSpace:"nowrap"}}>{l.agent||"—"}</td>
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
              {totalPages>7 && <span style={{color:"#4a5a78",fontSize:12,padding:"0 4px"}}>…{totalPages}</span>}
              <button className="page-btn" disabled={page===totalPages||totalPages===0} onClick={()=>setPage(p=>p+1)}>→</button>
            </div>
          </div>
        </div>
      </div>

      {/* DETAIL / EDIT DRAWER */}
      {selected && (
        <>
          <div className="overlay" onClick={() => { setSelected(null); setEditMode(false); }} />
          <div className="drawer">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span className="section-label" style={{margin:0}}>{editMode ? "Edit Lead" : "Lead Detail"}</span>
              <button className="btn" onClick={() => { setSelected(null); setEditMode(false); }}>✕</button>
            </div>

            {editMode ? (
              <>
                <div className="form-grid">
                  {[["Name","name"],["Phone","phone"],["Location","location"],["Income","income"],["Business Type","business_type"]].map(([label,key]) => (
                    <div className="form-group" key={key} style={key==="name"||key==="business_type"?{gridColumn:"1/-1"}:{}}>
                      <label className="form-label">{label}</label>
                      <input className="edit-input" value={editData[key]||""} onChange={e=>setEditData(p=>({...p,[key]:e.target.value}))} />
                    </div>
                  ))}
                  <div className="form-group">
                    <label className="form-label">Tier</label>
                    <select className="edit-select" value={editData.tier||"SME"} onChange={e=>setEditData(p=>({...p,tier:e.target.value}))}>
                      <option>Corporate</option><option>SME</option><option>Mass Market</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="edit-select" value={editData.status||"New"} onChange={e=>setEditData(p=>({...p,status:e.target.value}))}>
                      <option>New</option><option>Assigned</option><option>Contacted</option><option>Converted</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Agent</label>
                    <select className="edit-select" value={editData.agent||""} onChange={e=>setEditData(p=>({...p,agent:e.target.value}))}>
                      <option value="">— None —</option>
                      {agents.map(a=><option key={a}>{a}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">AI Score</label>
                    <input className="edit-input" type="number" min="0" max="100" value={editData.score||50} onChange={e=>setEditData(p=>({...p,score:e.target.value}))} />
                  </div>
                  <div className="form-group" style={{gridColumn:"1/-1"}}>
                    <label className="form-label">Notes</label>
                    <textarea className="form-textarea" value={editData.notes||""} onChange={e=>setEditData(p=>({...p,notes:e.target.value}))} />
                  </div>
                </div>
                <div className="action-row">
                  <button className="btn" onClick={() => setEditMode(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={saveEdit} disabled={saving} style={{flex:2}}>
                    {saving ? "Saving…" : "✓ Save Changes"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="drawer-name">{selected.name}</div>
                <span className={`pill ${tierClass(selected.tier)}`}>{selected.tier}</span>
                {[
                  ["Phone", selected.phone],["Location", selected.location],
                  ["Business", selected.business_type],["Income", selected.income],
                  ["AI Score", `${selected.score}/100`],["Source", selected.source],
                  ["Status", selected.status],["Agent", selected.agent||"—"],["Notes", selected.notes],
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
                <div className="action-row">
                  <button className="btn" onClick={() => { setEditMode(true); setEditData({...selected}); }}>✏️ Edit Lead</button>
                  <button className="btn btn-danger" onClick={() => deleteLead(selected.id)}>🗑 Delete</button>
                </div>
              </>
            )}
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

            {scrapeStatus ? (
              <div className="scrape-status">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontWeight:600}}>{scrapeStatus.status === "done" ? "✅ Done!" : "⚡ Scraping…"}</span>
                  <span style={{fontSize:13,color:"#8899b8"}}>{scrapeStatus.added || 0} leads added</span>
                </div>
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill" style={{width:`${scrapeStatus.progress||0}%`}} />
                </div>
                <span style={{fontSize:12,color:"#8899b8"}}>{scrapeStatus.progress||0}% complete</span>
                {scrapeStatus.status !== "done" && (
                  <button className="btn btn-danger" onClick={cancelScrape}>✕ Cancel</button>
                )}
                {scrapeStatus.status === "done" && (
                  <button className="btn btn-primary" onClick={() => { setScrapeStatus(null); setScrapeJob(null); }}>Start another search</button>
                )}
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Select States ({scrapeConfig.cities.length} selected)</label>
                  <div className="chip-grid">
                    {NIGERIAN_STATES.map(s => (
                      <div key={s} className={`chip${scrapeConfig.cities.includes(s)?" on":""}`} onClick={() => toggleCity(s)}>{s}</div>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Business Types ({scrapeConfig.business_types.length} selected)</label>
                  <div className="chip-grid">
                    {BUSINESS_TYPES.map(b => (
                      <div key={b} className={`chip${scrapeConfig.business_types.includes(b)?" on":""}`} onClick={() => toggleBtype(b)}>{b}</div>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Max results per search (1–20)</label>
                  <input className="form-input" type="number" min="1" max="20" value={scrapeConfig.max_per_search}
                    onChange={e => setScrapeConfig(p => ({...p, max_per_search: Number(e.target.value)}))} />
                </div>
                <div className="action-row">
                  <button className="btn" onClick={() => setShowFindLeads(false)}>Cancel</button>
                  <button className="btn btn-green" onClick={startScrape} style={{flex:2,justifyContent:"center"}}>⚡ Start Finding Leads</button>
                </div>
              </>
            )}
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
