import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://jyigungffdpqdgknhqao.supabase.co",
  "sb_publishable_Am7kFgOwqUw6BWWwElm0pw_0nS_wzHP"
);

const API_URL = "https://leadflow-api-production-50e2.up.railway.app";

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

function statusColor(s) {
  if (s === "Converted") return "#a3a3a3";
  if (s === "Contacted") return "#737373";
  if (s === "Assigned")  return "#525252";
  return "#404040";
}
function tierColor(t) {
  if (t === "Corporate") return { bg: "rgba(255,255,255,0.1)", color: "#e5e5e5" };
  if (t === "SME")       return { bg: "rgba(255,255,255,0.07)", color: "#a3a3a3" };
  return { bg: "rgba(255,255,255,0.05)", color: "#737373" };
}

const EMPTY_LEAD = { name:"", phone:"", location:"", tier:"SME", score:50, source:"Manual", status:"New", agent:"", income:"", business_type:"", notes:"" };

// ── AUTH STYLES (shared) ──────────────────────────────────────────────────────
const authStyle = {
  page: { minHeight:"100vh", background:"#0c0c0c", display:"flex", alignItems:"center", justifyContent:"center", padding:"20px", fontFamily:"'DM Sans',sans-serif" },
  box:  { width:"100%", maxWidth:380 },
  logo: { textAlign:"center", marginBottom:32 },
  logoText: { fontWeight:800, fontSize:26, color:"#e5e5e5", letterSpacing:"-0.02em" },
  logoSpan: { color:"#fff" },
  sub:  { fontSize:13, color:"#525252", marginTop:6 },
  form: { display:"flex", flexDirection:"column", gap:12 },
  group: { display:"flex", flexDirection:"column", gap:5 },
  label: { fontSize:11, color:"#525252", textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600 },
  input: { background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:8, color:"#e5e5e5", fontSize:14, fontFamily:"inherit", padding:"11px 12px", outline:"none", width:"100%" },
  btn:   { marginTop:4, background:"#fff", border:"none", borderRadius:8, color:"#000", fontWeight:700, fontSize:14, fontFamily:"inherit", padding:"12px", cursor:"pointer" },
  btnDisabled: { opacity:0.6, cursor:"not-allowed" },
  err:  { fontSize:13, color:"#ef4444", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:7, padding:"9px 12px" },
  ok:   { fontSize:13, color:"#34d399", background:"rgba(52,211,153,0.08)", border:"1px solid rgba(52,211,153,0.2)", borderRadius:7, padding:"9px 12px" },
  link: { textAlign:"center", marginTop:16, fontSize:13, color:"#525252" },
  linkBtn: { background:"none", border:"none", color:"#a3a3a3", fontFamily:"inherit", fontSize:13, cursor:"pointer", textDecoration:"underline" },
  foot: { textAlign:"center", marginTop:28, fontSize:12, color:"#2a2a2a" },
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginScreen({ onSwitch }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError("Invalid email or password."); setLoading(false); }
  }

  return (
    <div style={authStyle.page}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={authStyle.box}>
        <div style={authStyle.logo}>
          <div style={authStyle.logoText}>Lead<span style={authStyle.logoSpan}>Flow</span></div>
          <div style={authStyle.sub}>Sign in to your account</div>
        </div>
        <form onSubmit={handleLogin} style={authStyle.form}>
          <div style={authStyle.group}>
            <label style={authStyle.label}>Email</label>
            <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" style={authStyle.input} />
          </div>
          <div style={authStyle.group}>
            <label style={authStyle.label}>Password</label>
            <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" style={authStyle.input} />
          </div>
          {error && <div style={authStyle.err}>{error}</div>}
          <button type="submit" disabled={loading} style={{...authStyle.btn, ...(loading?authStyle.btnDisabled:{})}}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <div style={authStyle.link}>
          No account? <button style={authStyle.linkBtn} onClick={onSwitch}>Create one</button>
        </div>
        <div style={authStyle.foot}>LeadFlow Nigeria · Secure access only</div>
      </div>
    </div>
  );
}

// ── SIGNUP ────────────────────────────────────────────────────────────────────
function SignupScreen({ onSwitch }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [done, setDone]         = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true); setError("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else setDone(true);
  }

  return (
    <div style={authStyle.page}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={authStyle.box}>
        <div style={authStyle.logo}>
          <div style={authStyle.logoText}>Lead<span style={authStyle.logoSpan}>Flow</span></div>
          <div style={authStyle.sub}>Create your account</div>
        </div>
        {done ? (
          <>
            <div style={authStyle.ok}>Account created! Check your email to confirm, then sign in.</div>
            <div style={authStyle.link}><button style={authStyle.linkBtn} onClick={onSwitch}>Back to sign in</button></div>
          </>
        ) : (
          <>
            <form onSubmit={handleSignup} style={authStyle.form}>
              <div style={authStyle.group}>
                <label style={authStyle.label}>Email</label>
                <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" style={authStyle.input} />
              </div>
              <div style={authStyle.group}>
                <label style={authStyle.label}>Password</label>
                <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min. 8 characters" style={authStyle.input} />
              </div>
              <div style={authStyle.group}>
                <label style={authStyle.label}>Confirm password</label>
                <input type="password" required value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repeat password" style={authStyle.input} />
              </div>
              {error && <div style={authStyle.err}>{error}</div>}
              <button type="submit" disabled={loading} style={{...authStyle.btn, ...(loading?authStyle.btnDisabled:{})}}>
                {loading ? "Creating account…" : "Create account"}
              </button>
            </form>
            <div style={authStyle.link}>
              Already have an account? <button style={authStyle.linkBtn} onClick={onSwitch}>Sign in</button>
            </div>
          </>
        )}
        <div style={authStyle.foot}>LeadFlow Nigeria · Secure access only</div>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(undefined);
  const [showSignup, setShowSignup] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return null;
  if (!session) {
    return showSignup
      ? <SignupScreen onSwitch={() => setShowSignup(false)} />
      : <LoginScreen onSwitch={() => setShowSignup(true)} />;
  }
  return <Dashboard session={session} onLogout={() => supabase.auth.signOut()} />;
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard({ session, onLogout }) {
  const userId = session.user.id;

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

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [search, setSearch]           = useState("");
  const [tierFilter, setTierFilter]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [btypeFilter, setBtypeFilter] = useState("");
  const [dateFilter, setDateFilter]   = useState("");
  const [statClick, setStatClick]     = useState("");

  const [agents, setAgents] = useState(() => {
    try { return JSON.parse(localStorage.getItem("lf_agents_" + userId)) || DEFAULT_AGENTS; }
    catch { return DEFAULT_AGENTS; }
  });
  const [showAgentMgr, setShowAgentMgr] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");

  const [showAddLead, setShowAddLead] = useState(false);
  const [newLead, setNewLead]         = useState(EMPTY_LEAD);
  const [saving, setSaving]           = useState(false);

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
    if (!error) { showToast("Assigned to " + assignAgent); setSelected(null); fetchLeads(); }
  }

  async function markConverted() {
    if (!selected) return;
    const { error } = await supabase.from("leads").update({ status: "Converted" }).eq("id", selected.id);
    if (!error) { showToast("Marked as converted"); setSelected(null); fetchLeads(); }
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
    if (!error) { showToast("Lead updated"); setEditMode(false); setSelected(null); fetchLeads(); }
    else showToast("Error saving");
  }

  async function deleteSingleLead(id) {
    await supabase.from("leads").delete().eq("id", id);
    showToast("Lead deleted");
    setSelected(null);
    fetchLeads();
  }

  async function deleteSelected() {
    const ids = [...selectedIds];
    for (const id of ids) await supabase.from("leads").delete().eq("id", id);
    showToast(`Deleted ${ids.length} lead${ids.length > 1 ? "s" : ""}`);
    setSelectedIds(new Set());
    setConfirmDelete(false);
    fetchLeads();
  }

  async function saveLead() {
    if (!newLead.name.trim()) return showToast("Name is required");
    setSaving(true);
    const { error } = await supabase.from("leads").insert([{ ...newLead, score: Number(newLead.score), user_id: userId }]);
    setSaving(false);
    if (!error) { showToast("Lead added"); setNewLead(EMPTY_LEAD); setShowAddLead(false); fetchLeads(); }
    else showToast("Error saving lead");
  }

  async function startScrape() {
    if (!scrapeConfig.cities.length) return showToast("Select at least one state");
    if (!scrapeConfig.business_types.length) return showToast("Select at least one business type");
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const token = currentSession?.access_token;
      const r = await fetch(`${API_URL}/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ ...scrapeConfig })
      });
      const data = await r.json();
      if (data.job_id) {
        setScrapeJob(data.job_id);
        setScrapeStatus({ status: "starting", added: 0, progress: 0 });
        pollRef.current = setInterval(() => pollJob(data.job_id), 2000);
      } else showToast("Failed to start scraper");
    } catch {
      showToast("Cannot reach API — check Railway deployment");
    }
  }

  async function pollJob(jobId) {
    try {
      const r = await fetch(`${API_URL}/status/${jobId}`);
      const data = await r.json();
      setScrapeStatus(data);
      if (data.status === "done") {
        clearInterval(pollRef.current);
        showToast(`Done! ${data.added} leads added`);
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

  function addAgent() {
    const name = newAgentName.trim();
    if (!name) return;
    if (agents.includes(name)) return showToast("Agent already exists");
    const updated = [...agents, name];
    setAgents(updated);
    localStorage.setItem("lf_agents_" + userId, JSON.stringify(updated));
    setNewAgentName("");
    showToast(name + " added");
  }

  function removeAgent(name) {
    const updated = agents.filter(a => a !== name);
    setAgents(updated);
    localStorage.setItem("lf_agents_" + userId, JSON.stringify(updated));
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 3500); }

  function exportCSV() {
    const cols = ["name","phone","location","tier","score","source","status","agent","income","business_type","notes"];
    const rows = [cols.join(","), ...filtered.map(l => cols.map(c => `"${(l[c]||"").toString().replace(/"/g,'""')}"`).join(","))];
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(rows.join("\n"));
    a.download = "leadflow.csv"; a.click();
    showToast("CSV downloaded");
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
    if (selectedIds.size === pageLeads.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(pageLeads.map(l => l.id)));
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
        body { background: #0c0c0c; color: #e5e5e5; font-family: 'DM Sans', sans-serif; min-height: 100vh; }

        .top-bar { position: sticky; top: 0; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; background: rgba(12,12,12,0.97); backdrop-filter: blur(12px); border-bottom: 1px solid #1f1f1f; z-index: 100; gap: 8px; flex-wrap: wrap; }
        .logo { font-weight: 800; font-size: 17px; letter-spacing: -0.02em; color: #e5e5e5; white-space: nowrap; }
        .top-actions { display: flex; gap: 6px; flex-wrap: wrap; }

        .btn { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 500; padding: 7px 13px; border-radius: 8px; border: 1px solid #2a2a2a; background: #1a1a1a; color: #d4d4d4; cursor: pointer; transition: background 0.15s, border-color 0.15s; white-space: nowrap; font-family: inherit; }
        .btn:hover { background: #222; border-color: #333; color: #e5e5e5; }
        .btn-primary { background: #fff; border-color: #fff; color: #000; font-weight: 600; }
        .btn-primary:hover { background: #e5e5e5; border-color: #e5e5e5; }
        .btn-danger { background: #1a1a1a; border-color: #3a1a1a; color: #ef4444; }
        .btn-danger:hover { background: #2a1a1a; }
        .btn-red { background: #ef4444; border-color: #ef4444; color: #fff; font-weight: 600; }
        .btn-red:hover { background: #dc2626; }
        .btn-signout { color: #525252; }
        .btn-signout:hover { color: #ef4444; border-color: #3a1a1a; }

        .page { padding: 16px; max-width: 1200px; margin: 0 auto; }
        .section-label { font-size: 11px; font-weight: 500; color: #525252; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px; }

        .stat-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 8px; margin-bottom: 16px; }
        @media(min-width:600px){ .stat-grid { grid-template-columns: repeat(4,1fr); } }
        .stat-box { background: #111; border: 1px solid #1f1f1f; border-radius: 10px; padding: 14px; cursor: pointer; transition: border-color 0.15s, background 0.15s; user-select: none; }
        .stat-box:hover { background: #161616; border-color: #2a2a2a; }
        .stat-box.active { border-color: #333; background: #161616; }
        .stat-num { font-weight: 800; font-size: 26px; letter-spacing: -0.03em; color: #e5e5e5; }
        .stat-lbl { font-size: 11px; color: #525252; margin-top: 4px; }

        .filters-section { background: #111; border: 1px solid #1f1f1f; border-radius: 10px; padding: 12px; margin-bottom: 12px; }
        .filters-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .filters-title { font-size: 11px; font-weight: 600; color: #525252; text-transform: uppercase; letter-spacing: 0.06em; }
        .filters-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
        @media(min-width:700px){ .filters-grid { grid-template-columns: repeat(3,1fr); } }
        @media(min-width:1000px){ .filters-grid { grid-template-columns: repeat(6,1fr); } }
        .filter-input, .filter-select { background: #0c0c0c; border: 1px solid #1f1f1f; border-radius: 7px; color: #d4d4d4; font-size: 12px; font-family: inherit; padding: 7px 10px; outline: none; width: 100%; }
        .filter-input::placeholder { color: #3a3a3a; }
        .filter-select option { background: #111; }
        .search-full { grid-column: 1 / -1; }
        @media(min-width:1000px){ .search-full { grid-column: auto; } }
        .clear-btn { font-size: 11px; color: #525252; background: none; border: none; cursor: pointer; font-family: inherit; padding: 0; }
        .clear-btn:hover { color: #ef4444; }

        .bulk-bar { display: flex; align-items: center; gap: 10px; padding: 9px 14px; background: #111; border: 1px solid #1f1f1f; border-radius: 8px; margin-bottom: 10px; }
        .bulk-bar span { font-size: 13px; color: #a3a3a3; flex: 1; }

        .table-wrap { background: #111; border: 1px solid #1f1f1f; border-radius: 10px; overflow: hidden; }
        .table-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid #1f1f1f; flex-wrap: wrap; gap: 8px; }
        .table-title { font-size: 13px; font-weight: 600; color: #e5e5e5; }
        .lead-count { font-size: 11px; color: #525252; background: #0c0c0c; border: 1px solid #1f1f1f; padding: 2px 8px; border-radius: 20px; margin-left: 8px; }
        .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; min-width: 640px; }
        thead th { text-align: left; padding: 9px 12px; font-size: 10px; font-weight: 600; color: #3a3a3a; letter-spacing: 0.06em; text-transform: uppercase; border-bottom: 1px solid #1f1f1f; background: #0f0f0f; white-space: nowrap; }
        tbody tr { border-bottom: 1px solid #161616; cursor: pointer; transition: background 0.1s; }
        tbody tr:last-child { border-bottom: none; }
        tbody tr:hover { background: rgba(255,255,255,0.02); }
        tbody tr.row-selected { background: rgba(255,255,255,0.03); }
        td { padding: 10px 12px; color: #737373; vertical-align: middle; }
        td.name { color: #d4d4d4; font-weight: 500; white-space: nowrap; }
        td.check { width: 36px; }
        input[type="checkbox"] { width: 14px; height: 14px; accent-color: #fff; cursor: pointer; }

        .pill { display: inline-flex; align-items: center; font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 4px; white-space: nowrap; }
        .score-wrap { display: flex; align-items: center; gap: 7px; min-width: 70px; }
        .score-bar { flex: 1; height: 3px; background: #1f1f1f; border-radius: 2px; overflow: hidden; min-width: 36px; }
        .score-fill { height: 100%; border-radius: 2px; background: #404040; }
        .status-dot { display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }
        .dot-circle { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        .pagination { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-top: 1px solid #1f1f1f; flex-wrap: wrap; gap: 8px; }
        .page-info { font-size: 11px; color: #525252; }
        .page-btns { display: flex; gap: 4px; flex-wrap: wrap; }
        .page-btn { background: #0c0c0c; border: 1px solid #1f1f1f; color: #525252; font-size: 11px; font-family: inherit; padding: 4px 9px; border-radius: 5px; cursor: pointer; }
        .page-btn:hover { color: #d4d4d4; border-color: #2a2a2a; }
        .page-btn.active { background: #fff; border-color: #fff; color: #000; font-weight: 600; }
        .page-btn:disabled { opacity: 0.25; pointer-events: none; }

        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 200; }
        .drawer { position: fixed; top: 0; right: 0; bottom: 0; width: min(380px,100vw); background: #111; border-left: 1px solid #1f1f1f; z-index: 201; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px; }
        .drawer-name { font-weight: 700; font-size: 18px; color: #e5e5e5; }
        .drawer-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid #1a1a1a; font-size: 12px; gap: 12px; }
        .drawer-row-label { color: #525252; flex-shrink: 0; }
        .drawer-row-value { color: #d4d4d4; font-weight: 500; text-align: right; }
        .assign-select { width: 100%; background: #0c0c0c; border: 1px solid #1f1f1f; border-radius: 7px; color: #d4d4d4; font-size: 12px; font-family: inherit; padding: 8px 10px; outline: none; cursor: pointer; margin-top: 4px; }
        .action-row { display: flex; gap: 7px; flex-wrap: wrap; }
        .action-row .btn { flex: 1; justify-content: center; min-width: 80px; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 300; display: flex; align-items: flex-end; justify-content: center; }
        @media(min-width:600px){ .modal-overlay { align-items: center; } }
        .modal { background: #111; border: 1px solid #1f1f1f; border-radius: 14px 14px 0 0; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
        @media(min-width:600px){ .modal { border-radius: 14px; } }
        .modal-title { font-size: 15px; font-weight: 700; color: #e5e5e5; }
        .form-group { display: flex; flex-direction: column; gap: 5px; }
        .form-label { font-size: 10px; color: #525252; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
        .form-input, .form-select, .form-textarea { background: #0c0c0c; border: 1px solid #1f1f1f; border-radius: 7px; color: #d4d4d4; font-size: 13px; font-family: inherit; padding: 9px 10px; outline: none; width: 100%; }
        .form-input::placeholder { color: #3a3a3a; }
        .form-textarea { resize: vertical; min-height: 60px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .agent-list { display: flex; flex-direction: column; gap: 7px; }
        .agent-item { display: flex; align-items: center; justify-content: space-between; background: #0c0c0c; border: 1px solid #1f1f1f; border-radius: 7px; padding: 8px 12px; font-size: 13px; color: #d4d4d4; }
        .edit-input { background: #0c0c0c; border: 1px solid #2a2a2a; border-radius: 7px; color: #d4d4d4; font-size: 12px; font-family: inherit; padding: 6px 9px; outline: none; width: 100%; }
        .edit-select { background: #0c0c0c; border: 1px solid #2a2a2a; border-radius: 7px; color: #d4d4d4; font-size: 12px; font-family: inherit; padding: 6px 9px; outline: none; width: 100%; }

        .confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 400; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .confirm-modal { background: #161616; border: 1px solid #2a2a2a; border-radius: 12px; padding: 24px; max-width: 340px; width: 100%; display: flex; flex-direction: column; gap: 16px; }
        .confirm-title { font-size: 15px; font-weight: 700; color: #e5e5e5; }
        .confirm-body { font-size: 13px; color: #737373; line-height: 1.5; }
        .confirm-actions { display: flex; gap: 8px; }

        .progress-bar-wrap { background: #1f1f1f; border-radius: 6px; height: 6px; overflow: hidden; }
        .progress-bar-fill { height: 100%; background: #fff; border-radius: 6px; transition: width 0.4s; }
        .scrape-status { background: #0c0c0c; border: 1px solid #1f1f1f; border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }

        .user-email { font-size: 11px; color: #3a3a3a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }

        .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(80px); background: #fff; border-radius: 8px; padding: 10px 18px; font-size: 12px; font-weight: 600; color: #000; z-index: 500; transition: transform 0.3s; white-space: nowrap; }
        .toast.show { transform: translateX(-50%) translateY(0); }
        .empty { text-align: center; padding: 48px 24px; color: #3a3a3a; font-size: 13px; }
      `}</style>

      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      <div className="top-bar">
        <div className="logo">LeadFlow</div>
        <div className="top-actions">
          <span className="user-email">{session.user.email}</span>
          <button className="btn" onClick={() => setShowFindLeads(true)}>Find Leads</button>
          <button className="btn" onClick={() => setShowAgentMgr(true)}>Agents</button>
          <button className="btn btn-primary" onClick={() => setShowAddLead(true)}>+ Add Lead</button>
          <button className="btn" onClick={exportCSV}>Export CSV</button>
          <button className="btn" onClick={fetchLeads}>↻</button>
          <button className="btn btn-signout" onClick={onLogout}>Sign out</button>
        </div>
      </div>

      <div className="page">
        <div className="section-label">{hasActiveFilters ? `Filtered — ${filtered.length} of ${leads.length} leads` : "Overview"}</div>
        <div className="stat-grid">
          <div className={`stat-box${!statClick&&!hasActiveFilters?" active":""}`} onClick={clearAllFilters}>
            <div className="stat-num">{leads.length}</div>
            <div className="stat-lbl">Total leads</div>
          </div>
          <div className={`stat-box${statClick==="new"?" active":""}`} onClick={() => handleStatClick("new")}>
            <div className="stat-num">{stats.newLeads}</div>
            <div className="stat-lbl">New</div>
          </div>
          <div className={`stat-box${statClick==="assigned"?" active":""}`} onClick={() => handleStatClick("assigned")}>
            <div className="stat-num">{stats.assigned}</div>
            <div className="stat-lbl">Assigned</div>
          </div>
          <div className={`stat-box${statClick==="converted"?" active":""}`} onClick={() => handleStatClick("converted")}>
            <div className="stat-num">{stats.converted}</div>
            <div className="stat-lbl">Converted</div>
          </div>
        </div>

        <div className="filters-section">
          <div className="filters-top">
            <span className="filters-title">Filters</span>
            {hasActiveFilters && <button className="clear-btn" onClick={clearAllFilters}>Clear all</button>}
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

        {selectedIds.size > 0 && (
          <div className="bulk-bar">
            <span>{selectedIds.size} selected</span>
            <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>Delete selected</button>
            <button className="btn" onClick={() => setSelectedIds(new Set())}>Clear</button>
          </div>
        )}

        <div className="table-wrap">
          <div className="table-header">
            <div style={{display:"flex",alignItems:"center"}}>
              <span className="table-title">Leads</span>
              <span className="lead-count">{filtered.length}</span>
            </div>
            <span style={{fontSize:11,color:"#3a3a3a"}}>Tap row for details</span>
          </div>
          <div className="table-scroll">
            {loading ? (
              <div className="empty">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="empty">No leads yet — use Find Leads or Add Lead to get started</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th className="check">
                      <input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.size===pageLeads.length&&pageLeads.length>0} />
                    </th>
                    <th>Name</th><th>Phone</th><th>Location</th><th>Tier</th>
                    <th>Score</th><th>Business</th><th>Status</th><th>Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {pageLeads.map(l => {
                    const tc = tierColor(l.tier);
                    return (
                      <tr key={l.id} className={selectedIds.has(l.id)?"row-selected":""} onClick={() => { setSelected(l); setAssignAgent(l.agent||""); setEditMode(false); }}>
                        <td className="check" onClick={e => toggleSelect(l.id, e)}>
                          <input type="checkbox" checked={selectedIds.has(l.id)} onChange={()=>{}} />
                        </td>
                        <td className="name">{l.name}</td>
                        <td style={{fontSize:11,whiteSpace:"nowrap"}}>{l.phone||"—"}</td>
                        <td style={{whiteSpace:"nowrap",fontSize:11}}>{l.location}</td>
                        <td><span className="pill" style={{background:tc.bg,color:tc.color}}>{l.tier}</span></td>
                        <td>
                          <div className="score-wrap">
                            <div className="score-bar"><div className="score-fill" style={{width:`${l.score}%`}}/></div>
                            <span style={{fontSize:11,color:"#525252",minWidth:22,textAlign:"right"}}>{l.score}</span>
                          </div>
                        </td>
                        <td style={{fontSize:11,whiteSpace:"nowrap"}}>{l.business_type||"—"}</td>
                        <td><div className="status-dot"><div className="dot-circle" style={{background:statusColor(l.status)}}/><span style={{fontSize:11}}>{l.status}</span></div></td>
                        <td style={{fontSize:11,color:l.agent?"#a3a3a3":"#2a2a2a",whiteSpace:"nowrap"}}>{l.agent||"—"}</td>
                      </tr>
                    );
                  })}
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
              {totalPages>7 && <span style={{color:"#3a3a3a",fontSize:11,padding:"0 4px"}}>…{totalPages}</span>}
              <button className="page-btn" disabled={page===totalPages||totalPages===0} onClick={()=>setPage(p=>p+1)}>→</button>
            </div>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <div className="confirm-overlay" onClick={e => e.target===e.currentTarget && setConfirmDelete(false)}>
          <div className="confirm-modal">
            <div className="confirm-title">Delete {selectedIds.size} lead{selectedIds.size>1?"s":""}?</div>
            <div className="confirm-body">This cannot be undone. Selected leads will be permanently removed.</div>
            <div className="confirm-actions">
              <button className="btn" style={{flex:1,justifyContent:"center"}} onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className="btn btn-red" style={{flex:1,justifyContent:"center"}} onClick={deleteSelected}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <>
          <div className="overlay" onClick={() => { setSelected(null); setEditMode(false); }} />
          <div className="drawer">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span className="section-label" style={{margin:0}}>{editMode ? "Edit Lead" : "Lead Detail"}</span>
              <button className="btn" style={{padding:"5px 10px"}} onClick={() => { setSelected(null); setEditMode(false); }}>✕</button>
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
                    <label className="form-label">Score</label>
                    <input className="edit-input" type="number" min="0" max="100" value={editData.score||50} onChange={e=>setEditData(p=>({...p,score:e.target.value}))} />
                  </div>
                  <div className="form-group" style={{gridColumn:"1/-1"}}>
                    <label className="form-label">Notes</label>
                    <textarea className="form-textarea edit-input" value={editData.notes||""} onChange={e=>setEditData(p=>({...p,notes:e.target.value}))} />
                  </div>
                </div>
                <div className="action-row">
                  <button className="btn" onClick={() => setEditMode(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={saveEdit} disabled={saving} style={{flex:2}}>
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="drawer-name">{selected.name}</div>
                {[
                  ["Phone",selected.phone],["Location",selected.location],
                  ["Tier",selected.tier],["Business",selected.business_type],
                  ["Income",selected.income],["Score",`${selected.score}/100`],
                  ["Source",selected.source],["Status",selected.status],
                  ["Agent",selected.agent||"—"],["Notes",selected.notes],
                ].map(([label,value]) => value ? (
                  <div className="drawer-row" key={label}>
                    <span className="drawer-row-label">{label}</span>
                    <span className="drawer-row-value">{value}</span>
                  </div>
                ) : null)}
                <div>
                  <div className="section-label" style={{marginBottom:4}}>Assign agent</div>
                  <select className="assign-select" value={assignAgent} onChange={e => setAssignAgent(e.target.value)}>
                    <option value="">— Select —</option>
                    {agents.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div className="action-row">
                  <button className="btn btn-primary" onClick={assignLead}>Assign</button>
                  <button className="btn" onClick={markConverted}>Mark Converted</button>
                </div>
                <div className="action-row">
                  <button className="btn" onClick={() => { setEditMode(true); setEditData({...selected}); }}>Edit Lead</button>
                  <button className="btn btn-danger" onClick={() => deleteSingleLead(selected.id)}>Delete</button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {showFindLeads && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowFindLeads(false)}>
          <div className="modal">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span className="modal-title">Find New Leads</span>
              <button className="btn" style={{padding:"5px 10px"}} onClick={() => setShowFindLeads(false)}>✕</button>
            </div>
            {scrapeStatus ? (
              <div className="scrape-status">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontWeight:600,color:"#e5e5e5",fontSize:14}}>{scrapeStatus.status==="done"?"Done":"Scraping…"}</span>
                  <span style={{fontSize:13,color:"#737373"}}>{scrapeStatus.added||0} leads added</span>
                </div>
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill" style={{width:`${scrapeStatus.progress||0}%`}} />
                </div>
                <span style={{fontSize:12,color:"#525252"}}>{scrapeStatus.progress||0}% complete</span>
                {scrapeStatus.status!=="done" && <button className="btn btn-danger" onClick={cancelScrape}>Cancel</button>}
                {scrapeStatus.status==="done" && <button className="btn btn-primary" onClick={()=>{setScrapeStatus(null);setScrapeJob(null);}}>Search again</button>}
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <select className="form-select" onChange={e=>{const v=e.target.value;if(v&&!scrapeConfig.cities.includes(v))setScrapeConfig(p=>({...p,cities:[...p.cities,v]}));}}>
                    <option value="">— Select a state —</option>
                    {NIGERIAN_STATES.map(s=><option key={s}>{s}</option>)}
                  </select>
                  {scrapeConfig.cities.length>0&&(
                    <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:6}}>
                      {scrapeConfig.cities.map(c=>(
                        <span key={c} style={{background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:5,padding:"3px 8px",fontSize:11,color:"#a3a3a3",display:"flex",alignItems:"center",gap:5}}>
                          {c}<span style={{cursor:"pointer",color:"#525252"}} onClick={()=>setScrapeConfig(p=>({...p,cities:p.cities.filter(x=>x!==c)}))}>✕</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Business Type</label>
                  <select className="form-select" onChange={e=>{const v=e.target.value;if(v&&!scrapeConfig.business_types.includes(v))setScrapeConfig(p=>({...p,business_types:[...p.business_types,v]}));}}>
                    <option value="">— Select a business type —</option>
                    {BUSINESS_TYPES.map(b=><option key={b}>{b}</option>)}
                  </select>
                  {scrapeConfig.business_types.length>0&&(
                    <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:6}}>
                      {scrapeConfig.business_types.map(b=>(
                        <span key={b} style={{background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:5,padding:"3px 8px",fontSize:11,color:"#a3a3a3",display:"flex",alignItems:"center",gap:5}}>
                          {b}<span style={{cursor:"pointer",color:"#525252"}} onClick={()=>setScrapeConfig(p=>({...p,business_types:p.business_types.filter(x=>x!==b)}))}>✕</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Max results per search (1–20)</label>
                  <input className="form-input" type="number" min="1" max="20" value={scrapeConfig.max_per_search} onChange={e=>setScrapeConfig(p=>({...p,max_per_search:Number(e.target.value)}))} />
                </div>
                <div className="action-row">
                  <button className="btn" onClick={()=>setShowFindLeads(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={startScrape} style={{flex:2,justifyContent:"center"}}>Start Finding Leads</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showAddLead && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowAddLead(false)}>
          <div className="modal">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span className="modal-title">Add New Lead</span>
              <button className="btn" style={{padding:"5px 10px"}} onClick={()=>setShowAddLead(false)}>✕</button>
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
                <label className="form-label">Score (0–100)</label>
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
                <input className="form-input" placeholder="e.g. Retail" value={newLead.business_type} onChange={e=>setNewLead(p=>({...p,business_type:e.target.value}))} />
              </div>
              <div className="form-group" style={{gridColumn:"1/-1"}}>
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" value={newLead.notes} onChange={e=>setNewLead(p=>({...p,notes:e.target.value}))} />
              </div>
            </div>
            <div className="action-row">
              <button className="btn" onClick={()=>setShowAddLead(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveLead} disabled={saving} style={{flex:2,justifyContent:"center"}}>{saving?"Saving…":"Save Lead"}</button>
            </div>
          </div>
        </div>
      )}

      {showAgentMgr && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowAgentMgr(false)}>
          <div className="modal">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span className="modal-title">Manage Agents</span>
              <button className="btn" style={{padding:"5px 10px"}} onClick={()=>setShowAgentMgr(false)}>✕</button>
            </div>
            <div style={{display:"flex",gap:7}}>
              <input className="form-input" placeholder="Agent full name" value={newAgentName} onChange={e=>setNewAgentName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addAgent()} />
              <button className="btn btn-primary" onClick={addAgent}>Add</button>
            </div>
            <div className="agent-list">
              {agents.map(a=>(
                <div className="agent-item" key={a}>
                  <span>{a}</span>
                  <button className="btn btn-danger" style={{padding:"4px 10px",fontSize:11}} onClick={()=>removeAgent(a)}>Remove</button>
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
