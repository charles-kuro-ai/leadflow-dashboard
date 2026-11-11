import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://jyigungffdpqdgknhqao.supabase.co",
  "sb_publishable_Am7kFgOwqUw6BWWwElm0pw_0nS_wzHP"
);

const API_URL = "https://leadflow-api-production-d2f0.up.railway.app";

const BUSINESS_KEYWORDS = {
  "Supermarket": ["supermarket","grocery store","food market"],
  "Pharmacy": ["pharmacy","chemist","drug store"],
  "Hotel": ["hotel","guest house","lodge"],
  "Restaurant": ["restaurant","eatery","food canteen"],
  "Hospital": ["hospital","medical centre","clinic"],
  "School": ["school","academy","college"],
  "Logistics": ["logistics company","courier service","transport company"],
  "Filling Station": ["filling station","petrol station","fuel station"],
  "Hardware Store": ["hardware store","building materials","ironmonger"],
  "Fashion Shop": ["fashion shop","boutique","clothing store"],
  "Electronics Store": ["electronics store","phone shop","computer shop"],
  "Church": ["church","ministry","evangelical church"],
  "Mosque": ["mosque","islamic centre","masjid"],
  "Market": ["market","trade centre","shopping complex"],
  "Salon": ["salon","barber shop","hair stylist"],
  "Bakery": ["bakery","bread shop","confectionery"],
  "Printing Press": ["printing press","print shop","signage company"],
  "Clinic": ["clinic","medical centre","health centre"],
};

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT Abuja","Gombe",
  "Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos",
  "Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto",
  "Taraba","Yobe","Zamfara"
];

const BUSINESS_TYPES = Object.keys(BUSINESS_KEYWORDS);

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
  if (s === "Converted")        return "#22c55e";
  if (s === "Pending Approval") return "#f97316";
  if (s === "Contacted")        return "#737373";
  if (s === "In Progress")      return "#60a5fa";
  if (s === "Assigned")         return "#525252";
  return "#404040";
}
function tierColor(t) {
  if (t === "Corporate") return { bg: "rgba(255,255,255,0.1)", color: "#e5e5e5" };
  if (t === "SME")       return { bg: "rgba(255,255,255,0.07)", color: "#a3a3a3" };
  return { bg: "rgba(255,255,255,0.05)", color: "#737373" };
}

function roleColor(r) {
  if (r === "admin") return { bg: "rgba(239,68,68,0.1)", color: "#ef4444" };
  if (r === "branch_manager") return { bg: "rgba(251,191,36,0.1)", color: "#fbbf24" };
  return { bg: "rgba(52,211,153,0.1)", color: "#34d399" };
}

const EMPTY_LEAD = { name:"", phone:"", location:"", tier:"SME", score:50, source:"Manual", status:"New", agent:"", income:"", business_type:"", notes:"" };

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

function LoginScreen() {
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
          <button type="submit" disabled={loading} style={{...authStyle.btn,...(loading?authStyle.btnDisabled:{})}}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <div style={authStyle.foot}>LeadFlow Nigeria · Secure access only</div>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) fetchProfile();
    else setProfile(null);
  }, [session]);

  async function fetchProfile() {
    setProfileLoading(true);
    const { data } = await supabase.from("profiles").select("*").eq("user_id", session.user.id).single();
    setProfile(data || null);
    setProfileLoading(false);
  }

  if (session === undefined || (session && profileLoading)) return (
    <div style={{minHeight:"100vh",background:"#0c0c0c",display:"flex",alignItems:"center",justifyContent:"center",color:"#525252",fontFamily:"DM Sans,sans-serif",fontSize:13}}>
      Loading…
    </div>
  );

  if (!session) return <LoginScreen />;

  if (!profile) return (
    <div style={{minHeight:"100vh",background:"#0c0c0c",display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"DM Sans,sans-serif"}}>
      <div style={{textAlign:"center",maxWidth:360}}>
        <div style={{fontWeight:800,fontSize:22,color:"#e5e5e5",marginBottom:12}}>Access Pending</div>
        <div style={{fontSize:13,color:"#525252",lineHeight:1.6,marginBottom:20}}>Your account has been created but no role has been assigned yet. Please contact your branch manager or administrator to get access.</div>
        <div style={{fontSize:12,color:"#3a3a3a",marginBottom:20}}>{session.user.email}</div>
        <button style={{background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:8,color:"#d4d4d4",fontSize:13,fontFamily:"inherit",padding:"10px 20px",cursor:"pointer"}} onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
    </div>
  );

  return <Dashboard session={session} profile={profile} onLogout={() => supabase.auth.signOut()} />;
}

function Dashboard({ session, profile, onLogout }) {
  const userId = session.user.id;
  const role = profile.role; // "admin" | "branch_manager" | "agent"
  const isAdmin = role === "admin";
  const isBM = role === "branch_manager";
  const isAgent = role === "agent";
  const canSeeAll = isAdmin || isBM;

  const [leads, setLeads]           = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [editMode, setEditMode]     = useState(false);
  const [editData, setEditData]     = useState({});
  const [assignAgent, setAssignAgent] = useState("");
  const [toast, setToast]           = useState("");
  const [page, setPage]             = useState(1);
  const perPage = 10;

  const [selectedIds, setSelectedIds]     = useState(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [search, setSearch]             = useState("");
  const [tierFilter, setTierFilter]     = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stateFilter, setStateFilter]   = useState("");
  const [btypeFilter, setBtypeFilter]   = useState("");
  const [dateFilter, setDateFilter]     = useState("");
  const [statClick, setStatClick]       = useState("");

  const [teamMembers, setTeamMembers]   = useState([]);
  const [showUserMgr, setShowUserMgr]   = useState(false);
  const [newUser, setNewUser]           = useState({ name:"", email:"", password:"", role:"agent", branch:"" });
  const [creatingUser, setCreatingUser] = useState(false);
  const [userError, setUserError]       = useState("");
  const [userSuccess, setUserSuccess]   = useState("");

  const [showAddLead, setShowAddLead]   = useState(false);
  const [newLead, setNewLead]           = useState(EMPTY_LEAD);
  const [saving, setSaving]             = useState(false);

  const [showFindLeads, setShowFindLeads] = useState(false);
  const [scrapeConfig, setScrapeConfig]   = useState({ cities:[], business_types:[], keywords_map:{}, max_total:20 });
  const [scrapeJob, setScrapeJob]         = useState(null);
  const [scrapeStatus, setScrapeStatus]   = useState(null);
  const pollRef = useRef(null);

  const [showAuditLog, setShowAuditLog]   = useState(false);
  const [auditLogs, setAuditLogs]         = useState([]);
  const [auditLoading, setAuditLoading]   = useState(false);

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showApprovals, setShowApprovals]     = useState(false);

  // Lead detail tabs
  const [detailTab, setDetailTab]         = useState("info");
  const [comments, setComments]           = useState([]);
  const [newComment, setNewComment]       = useState("");
  const [leadHistory, setLeadHistory]     = useState([]);
  const [followUps, setFollowUps]         = useState([]);
  const [newFollowUp, setNewFollowUp]     = useState({ due_date:"", note:"" });

  // Aging alert threshold (days)
  const AGING_DAYS = 7;

  useEffect(() => { fetchLeads(); fetchTeamMembers(); }, []);

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
    if (statClick === "pending")   f = f.filter(l => l.status === "Pending Approval");
    if (statClick === "aging")     f = f.filter(l => isAging(l));
    setFiltered(f);
    setPage(1);
    setSelectedIds(new Set());
  }, [leads, search, tierFilter, statusFilter, stateFilter, btypeFilter, dateFilter, statClick]);

  function isAging(lead) {
    if (lead.status === "Converted") return false;
    if (!lead.created_at) return false;
    const days = (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return days > AGING_DAYS && lead.status !== "Converted";
  }

  async function fetchLeads() {
    setLoading(true);
    let query = supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (isAgent) query = query.eq("agent", profile.name);
    // Branch managers only see leads in their branch
    if (isBM && profile.branch) query = query.eq("branch", profile.branch);
    const { data, error } = await query;
    if (!error) setLeads(data || []);
    setLoading(false);
  }

  async function fetchTeamMembers() {
    if (!canSeeAll) return;
    let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });
    // Branch managers only see their own branch's team
    if (isBM && profile.branch) query = query.eq("branch", profile.branch);
    const { data } = await query;
    setTeamMembers(data || []);
  }

  async function fetchComments(leadId) {
    const { data } = await supabase.from("lead_comments").select("*").eq("lead_id", leadId).order("created_at", { ascending: true });
    setComments(data || []);
  }

  async function fetchHistory(leadId) {
    const { data } = await supabase.from("lead_history").select("*").eq("lead_id", leadId).order("created_at", { ascending: false });
    setLeadHistory(data || []);
  }

  async function fetchFollowUps(leadId) {
    const { data } = await supabase.from("follow_ups").select("*").eq("lead_id", leadId).order("due_date", { ascending: true });
    setFollowUps(data || []);
  }

  async function addComment() {
    if (!newComment.trim() || !selected) return;
    await supabase.from("lead_comments").insert([{
      lead_id: selected.id, user_id: userId,
      user_name: profile.name, comment: newComment.trim()
    }]);
    await logAudit("Added comment", "lead", selected.id, { comment: newComment.trim() });
    setNewComment("");
    fetchComments(selected.id);
  }

  async function addFollowUp() {
    if (!newFollowUp.due_date || !selected) return;
    await supabase.from("follow_ups").insert([{
      lead_id: selected.id, user_id: userId,
      due_date: newFollowUp.due_date, note: newFollowUp.note
    }]);
    setNewFollowUp({ due_date:"", note:"" });
    fetchFollowUps(selected.id);
  }

  async function markFollowUpDone(id) {
    await supabase.from("follow_ups").update({ done: true }).eq("id", id);
    fetchFollowUps(selected.id);
  }

  async function logAudit(action, targetType, targetId, details) {
    await supabase.from("audit_logs").insert([{
      user_id: userId, user_name: profile.name,
      action, target_type: targetType,
      target_id: String(targetId), details
    }]);
  }

  async function logHistory(leadId, field, oldVal, newVal) {
    await supabase.from("lead_history").insert([{
      lead_id: leadId, user_id: userId, user_name: profile.name,
      field_changed: field, old_value: String(oldVal||""), new_value: String(newVal||"")
    }]);
  }

  async function assignLead() {
    if (!assignAgent || !selected) return showToast("Select a team member first");
    const oldAgent = selected.agent;
    const { error } = await supabase.from("leads").update({
      agent: assignAgent,
      status: selected.status === "New" ? "Assigned" : selected.status
    }).eq("id", selected.id);
    if (!error) {
      await logAudit("Assigned lead", "lead", selected.id, { from: oldAgent, to: assignAgent });
      await logHistory(selected.id, "agent", oldAgent, assignAgent);
      showToast("Assigned to " + assignAgent);
      setSelected(null);
      fetchLeads();
    }
  }

  async function markStatus(newStatus) {
    if (!selected) return;
    const old = selected.status;
    // Agents requesting conversion go to Pending Approval, not straight to Converted
    const actualStatus = (isAgent && newStatus === "Converted") ? "Pending Approval" : newStatus;
    const { error } = await supabase.from("leads").update({ status: actualStatus }).eq("id", selected.id);
    if (!error) {
      await logAudit(`Marked as ${actualStatus}`, "lead", selected.id, { from: old, to: actualStatus });
      await logHistory(selected.id, "status", old, actualStatus);
      showToast(actualStatus === "Pending Approval" ? "Sent for manager approval" : `Marked as ${actualStatus}`);
      setSelected(null);
      fetchLeads();
    }
  }

  async function approveConversion(leadId) {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    const { error } = await supabase.from("leads").update({ status: "Converted" }).eq("id", leadId);
    if (!error) {
      await logAudit("Approved conversion", "lead", leadId, { agent: lead.agent });
      await logHistory(leadId, "status", "Pending Approval", "Converted");
      showToast("Conversion approved ✓");
      fetchLeads();
    }
  }

  async function rejectConversion(leadId) {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    const { error } = await supabase.from("leads").update({ status: "In Progress" }).eq("id", leadId);
    if (!error) {
      await logAudit("Rejected conversion", "lead", leadId, { agent: lead.agent });
      await logHistory(leadId, "status", "Pending Approval", "In Progress");
      showToast("Conversion rejected — lead back to In Progress");
      fetchLeads();
    }
  }

  async function saveEdit() {
    if (!editData.name?.trim()) return showToast("Name is required");
    setSaving(true);
    const changes = {};
    ["name","phone","location","tier","status","agent","income","business_type","notes","score"].forEach(k => {
      if (String(editData[k]||"") !== String(selected[k]||"")) changes[k] = editData[k];
    });
    const { error } = await supabase.from("leads").update({
      name: editData.name, phone: editData.phone, location: editData.location,
      tier: editData.tier, status: editData.status, agent: editData.agent,
      income: editData.income, business_type: editData.business_type,
      notes: editData.notes, score: Number(editData.score),
    }).eq("id", selected.id);
    setSaving(false);
    if (!error) {
      for (const [k, v] of Object.entries(changes)) {
        await logHistory(selected.id, k, selected[k], v);
      }
      await logAudit("Edited lead", "lead", selected.id, changes);
      showToast("Lead updated");
      setEditMode(false);
      setSelected(null);
      fetchLeads();
    } else showToast("Error saving");
  }

  async function deleteSingleLead(id) {
    await supabase.from("leads").delete().eq("id", id);
    await logAudit("Deleted lead", "lead", id, {});
    showToast("Lead deleted");
    setSelected(null);
    fetchLeads();
  }

  async function deleteSelected() {
    const ids = [...selectedIds];
    for (const id of ids) {
      await supabase.from("leads").delete().eq("id", id);
      await logAudit("Deleted lead", "lead", id, {});
    }
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
    if (!error) {
      await logAudit("Added lead manually", "lead", newLead.name, {});
      showToast("Lead added");
      setNewLead(EMPTY_LEAD);
      setShowAddLead(false);
      fetchLeads();
    } else showToast("Error saving lead");
  }

  async function createUser() {
    setUserError(""); setUserSuccess("");
    if (!newUser.name || !newUser.email || !newUser.password) return setUserError("All fields are required");
    if (newUser.password.length < 8) return setUserError("Password must be at least 8 characters");
    setCreatingUser(true);
    const { data: { session: s } } = await supabase.auth.getSession();
    const r = await fetch(`${API_URL}/create-user`, {
      method: "POST",
      headers: { "Content-Type":"application/json", "Authorization":`Bearer ${s.access_token}` },
      body: JSON.stringify(newUser)
    });
    const data = await r.json();
    setCreatingUser(false);
    if (data.error) return setUserError(data.error);
    setUserSuccess(`${newUser.role === "agent" ? "Agent" : "Branch Manager"} "${newUser.name}" created!`);
    setNewUser({ name:"", email:"", password:"", role:"agent", branch:"" });
    fetchTeamMembers();
  }

  async function startScrape() {
    if (!scrapeConfig.cities.length) return showToast("Select at least one state");
    if (!scrapeConfig.business_types.length) return showToast("Select at least one business type");
    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      const r = await fetch(`${API_URL}/scrape`, {
        method: "POST",
        headers: { "Content-Type":"application/json", "Authorization":`Bearer ${s.access_token}` },
        body: JSON.stringify({ ...scrapeConfig })
      });
      const data = await r.json();
      if (data.job_id) {
        setScrapeJob(data.job_id);
        setScrapeStatus({ status:"starting", added:0, progress:0 });
        pollRef.current = setInterval(() => pollJob(data.job_id), 2000);
        await logAudit("Started scraper", "scraper", data.job_id, { cities: scrapeConfig.cities, types: scrapeConfig.business_types });
      } else showToast("Failed to start scraper");
    } catch { showToast("Cannot reach API"); }
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
      } else if (data.status === "cancelled") {
        clearInterval(pollRef.current);
        showToast(`Cancelled — ${data.added} leads saved`);
        fetchLeads();
      }
    } catch {}
  }

  function cancelScrape() {
    if (scrapeJob) fetch(`${API_URL}/cancel/${scrapeJob}`, { method:"POST" });
    clearInterval(pollRef.current);
    setScrapeJob(null);
    setScrapeStatus(null);
  }

  async function fetchAuditLogs() {
    setAuditLoading(true);
    const { data: { session: s } } = await supabase.auth.getSession();
    const r = await fetch(`${API_URL}/audit-logs`, {
      headers: { "Authorization":`Bearer ${s.access_token}` }
    });
    const data = await r.json();
    setAuditLogs(Array.isArray(data) ? data : []);
    setAuditLoading(false);
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 3500); }

  function exportCSV() {
    const cols = ["name","phone","location","tier","score","source","status","agent","income","business_type","notes"];
    const rows = [cols.join(","), ...filtered.map(l => cols.map(c => `"${(l[c]||"").toString().replace(/"/g,'""')}"`).join(","))];
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(rows.join("\n"));
    a.download = "leadflow.csv"; a.click();
    showToast("CSV downloaded");
    logAudit("Exported CSV", "leads", "bulk", { count: filtered.length });
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
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toggleSelectAll() {
    if (selectedIds.size === pageLeads.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(pageLeads.map(l => l.id)));
  }

  function openLead(l) {
    setSelected(l);
    setAssignAgent(l.agent || "");
    setEditMode(false);
    setDetailTab("info");
    fetchComments(l.id);
    fetchHistory(l.id);
    fetchFollowUps(l.id);
  }

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageLeads  = filtered.slice((page-1)*perPage, page*perPage);
  const agingCount = leads.filter(isAging).length;
  const pendingApprovals = leads.filter(l => l.status === "Pending Approval");
  const stats = {
    total:     leads.length,
    newLeads:  leads.filter(l => l.status === "New").length,
    assigned:  leads.filter(l => l.status === "Assigned").length,
    converted: leads.filter(l => l.status === "Converted").length,
    pending:   pendingApprovals.length,
  };
  const hasActiveFilters = search||tierFilter||statusFilter||stateFilter||btypeFilter||dateFilter||statClick;

  // Leaderboard data
  const leaderboard = teamMembers
    .filter(m => m.role === "agent")
    .map(m => ({
      name: m.name,
      assigned: leads.filter(l => l.agent === m.name).length,
      converted: leads.filter(l => l.agent === m.name && l.status === "Converted").length,
    }))
    .sort((a,b) => b.converted - a.converted);

  // Due follow-ups
  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0c0c0c; color: #e5e5e5; font-family: 'DM Sans', sans-serif; min-height: 100vh; }

        .top-bar { position: sticky; top: 0; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; background: rgba(12,12,12,0.97); backdrop-filter: blur(12px); border-bottom: 1px solid #1f1f1f; z-index: 100; gap: 8px; flex-wrap: wrap; }
        .logo { font-weight: 800; font-size: 17px; letter-spacing: -0.02em; color: #e5e5e5; white-space: nowrap; }
        .top-actions { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }

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

        .role-badge { font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em; }

        .page { padding: 16px; max-width: 1200px; margin: 0 auto; }
        .section-label { font-size: 11px; font-weight: 500; color: #525252; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px; }

        .stat-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 8px; margin-bottom: 16px; }
        @media(min-width:600px){ .stat-grid { grid-template-columns: repeat(5,1fr); } }
        .stat-box { background: #111; border: 1px solid #1f1f1f; border-radius: 10px; padding: 14px; cursor: pointer; transition: border-color 0.15s, background 0.15s; user-select: none; }
        .stat-box:hover { background: #161616; border-color: #2a2a2a; }
        .stat-box.active { border-color: #333; background: #161616; }
        .stat-num { font-weight: 800; font-size: 26px; letter-spacing: -0.03em; color: #e5e5e5; }
        .stat-lbl { font-size: 11px; color: #525252; margin-top: 4px; }
        .stat-box.aging .stat-num { color: #f97316; }

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
        tbody tr.row-aging { border-left: 2px solid #f97316; }
        tbody tr.row-pending { border-left: 2px solid #f97316; background: rgba(249,115,22,0.03); }
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
        .drawer { position: fixed; top: 0; right: 0; bottom: 0; width: min(420px,100vw); background: #111; border-left: 1px solid #1f1f1f; z-index: 201; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px; }
        .drawer-name { font-weight: 700; font-size: 18px; color: #e5e5e5; }
        .drawer-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid #1a1a1a; font-size: 12px; gap: 12px; }
        .drawer-row-label { color: #525252; flex-shrink: 0; }
        .drawer-row-value { color: #d4d4d4; font-weight: 500; text-align: right; }
        .assign-select { width: 100%; background: #0c0c0c; border: 1px solid #1f1f1f; border-radius: 7px; color: #d4d4d4; font-size: 12px; font-family: inherit; padding: 8px 10px; outline: none; cursor: pointer; margin-top: 4px; }
        .action-row { display: flex; gap: 7px; flex-wrap: wrap; }
        .action-row .btn { flex: 1; justify-content: center; min-width: 80px; }

        .detail-tabs { display: flex; gap: 2px; border-bottom: 1px solid #1f1f1f; margin-bottom: 12px; }
        .detail-tab { background: none; border: none; border-bottom: 2px solid transparent; color: #525252; font-family: inherit; font-size: 12px; font-weight: 500; padding: 6px 12px; cursor: pointer; margin-bottom: -1px; }
        .detail-tab.active { color: #e5e5e5; border-bottom-color: #fff; }

        .comment-list { display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto; }
        .comment-item { background: #0c0c0c; border: 1px solid #1f1f1f; border-radius: 7px; padding: 8px 10px; }
        .comment-meta { font-size: 10px; color: #525252; margin-bottom: 3px; }
        .comment-text { font-size: 12px; color: #d4d4d4; }
        .comment-input-row { display: flex; gap: 6px; }

        .history-list { display: flex; flex-direction: column; gap: 6px; max-height: 240px; overflow-y: auto; }
        .history-item { font-size: 11px; color: #737373; border-left: 2px solid #1f1f1f; padding-left: 8px; }
        .history-field { color: #a3a3a3; font-weight: 600; }

        .followup-list { display: flex; flex-direction: column; gap: 6px; }
        .followup-item { background: #0c0c0c; border: 1px solid #1f1f1f; border-radius: 7px; padding: 8px 10px; display: flex; align-items: center; gap: 8px; }
        .followup-item.overdue { border-color: #3a1a1a; }
        .followup-item.done { opacity: 0.4; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 300; display: flex; align-items: flex-end; justify-content: center; }
        @media(min-width:600px){ .modal-overlay { align-items: center; } }
        .modal { background: #111; border: 1px solid #1f1f1f; border-radius: 14px 14px 0 0; width: 100%; max-width: 540px; max-height: 90vh; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
        @media(min-width:600px){ .modal { border-radius: 14px; } }
        .modal-title { font-size: 15px; font-weight: 700; color: #e5e5e5; }
        .form-group { display: flex; flex-direction: column; gap: 5px; }
        .form-label { font-size: 10px; color: #525252; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
        .form-input, .form-select, .form-textarea { background: #0c0c0c; border: 1px solid #1f1f1f; border-radius: 7px; color: #d4d4d4; font-size: 13px; font-family: inherit; padding: 9px 10px; outline: none; width: 100%; }
        .form-input::placeholder { color: #3a3a3a; }
        .form-textarea { resize: vertical; min-height: 60px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .edit-input { background: #0c0c0c; border: 1px solid #2a2a2a; border-radius: 7px; color: #d4d4d4; font-size: 12px; font-family: inherit; padding: 6px 9px; outline: none; width: 100%; }
        .edit-select { background: #0c0c0c; border: 1px solid #2a2a2a; border-radius: 7px; color: #d4d4d4; font-size: 12px; font-family: inherit; padding: 6px 9px; outline: none; width: 100%; }

        .user-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .user-table th { text-align: left; padding: 7px 10px; font-size: 10px; color: #3a3a3a; letter-spacing: 0.06em; text-transform: uppercase; border-bottom: 1px solid #1f1f1f; }
        .user-table td { padding: 9px 10px; border-bottom: 1px solid #161616; color: #737373; }
        .user-table td:first-child { color: #d4d4d4; font-weight: 500; }

        .audit-list { display: flex; flex-direction: column; gap: 6px; max-height: 500px; overflow-y: auto; }
        .audit-item { background: #0c0c0c; border: 1px solid #1f1f1f; border-radius: 7px; padding: 8px 12px; font-size: 12px; }
        .audit-meta { font-size: 10px; color: #525252; margin-top: 2px; }

        .lb-row { display: flex; align-items: center; gap: 10px; padding: 10px; background: #0c0c0c; border: 1px solid #1f1f1f; border-radius: 8px; }
        .lb-rank { font-size: 13px; font-weight: 800; color: #3a3a3a; width: 20px; }
        .lb-name { flex: 1; font-size: 13px; color: #d4d4d4; font-weight: 500; }
        .lb-stat { font-size: 12px; color: #525252; }
        .lb-converted { font-size: 13px; font-weight: 700; color: #34d399; min-width: 30px; text-align: right; }

        .confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 400; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .confirm-modal { background: #161616; border: 1px solid #2a2a2a; border-radius: 12px; padding: 24px; max-width: 340px; width: 100%; display: flex; flex-direction: column; gap: 16px; }
        .confirm-title { font-size: 15px; font-weight: 700; color: #e5e5e5; }
        .confirm-body { font-size: 13px; color: #737373; line-height: 1.5; }
        .confirm-actions { display: flex; gap: 8px; }

        .progress-bar-wrap { background: #1f1f1f; border-radius: 6px; height: 6px; overflow: hidden; }
        .progress-bar-fill { height: 100%; background: #fff; border-radius: 6px; transition: width 0.4s; }
        .scrape-status { background: #0c0c0c; border: 1px solid #1f1f1f; border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }

        .kw-pill { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 3px 8px; border-radius: 5px; border: 1px solid; cursor: pointer; transition: all 0.1s; }

        .user-email { font-size: 11px; color: #3a3a3a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
        .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(80px); background: #fff; border-radius: 8px; padding: 10px 18px; font-size: 12px; font-weight: 600; color: #000; z-index: 500; transition: transform 0.3s; white-space: nowrap; }
        .toast.show { transform: translateX(-50%) translateY(0); }
        .empty { text-align: center; padding: 48px 24px; color: #3a3a3a; font-size: 13px; }
        .aging-badge { font-size: 10px; background: rgba(249,115,22,0.1); color: #f97316; border: 1px solid rgba(249,115,22,0.2); border-radius: 4px; padding: 1px 5px; margin-left: 6px; }
      `}</style>

      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* TOP BAR */}
      <div className="top-bar">
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div className="logo">LeadFlow</div>
          <span className="role-badge" style={{background:roleColor(role).bg,color:roleColor(role).color}}>{role.replace("_"," ")}</span>
        </div>
        <div className="top-actions">
          <span className="user-email">{profile.name || session.user.email}{isBM && profile.branch ? ` · ${profile.branch}` : ""}</span>
          <button className="btn" onClick={() => setShowFindLeads(true)}>Find Leads</button>
          {canSeeAll && <button className="btn" onClick={() => { setShowUserMgr(true); setUserError(""); setUserSuccess(""); }}>Team</button>}
          {canSeeAll && stats.pending > 0 && (
            <button className="btn" style={{borderColor:"#f97316",color:"#f97316",fontWeight:700}} onClick={() => setShowApprovals(true)}>
              ⏳ Approvals <span style={{background:"#f97316",color:"#fff",borderRadius:99,padding:"1px 7px",fontSize:11,marginLeft:4}}>{stats.pending}</span>
            </button>
          )}
          {canSeeAll && <button className="btn" onClick={() => { setShowLeaderboard(true); }}>Leaderboard</button>}
          {canSeeAll && <button className="btn" onClick={() => { setShowAuditLog(true); fetchAuditLogs(); }}>Audit Log</button>}
          <button className="btn btn-primary" onClick={() => setShowAddLead(true)}>+ Add Lead</button>
          <button className="btn" onClick={exportCSV}>Export CSV</button>
          <button className="btn" onClick={fetchLeads}>↻</button>
          <button className="btn btn-signout" onClick={onLogout}>Sign out</button>
        </div>
      </div>

      <div className="page">
        <div className="section-label">{hasActiveFilters ? `Filtered — ${filtered.length} of ${leads.length} leads` : "Overview"}</div>

        {/* STATS */}
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
          {canSeeAll && (
            <div className={`stat-box${statClick==="pending"?" active":""}`} style={stats.pending>0?{borderColor:"rgba(249,115,22,0.3)"}:{}} onClick={() => handleStatClick("pending")}>
              <div className="stat-num" style={stats.pending>0?{color:"#f97316"}:{}}>{stats.pending}</div>
              <div className="stat-lbl">Pending Approval</div>
            </div>
          )}
          <div className={`stat-box aging${statClick==="aging"?" active":""}`} onClick={() => handleStatClick("aging")}>
            <div className="stat-num">{agingCount}</div>
            <div className="stat-lbl">Aging ({AGING_DAYS}d+)</div>
          </div>
        </div>

        {/* FILTERS */}
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
              <option>New</option><option>Assigned</option><option>Contacted</option><option>In Progress</option><option>Pending Approval</option><option>Converted</option>
            </select>
            <select className="filter-select" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
              {DATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* BULK BAR */}
        {selectedIds.size > 0 && (
          <div className="bulk-bar">
            <span>{selectedIds.size} selected</span>
            {canSeeAll && (
              <select className="filter-select" style={{maxWidth:180}} onChange={async e => {
                const agent = e.target.value;
                if (!agent) return;
                const ids = [...selectedIds];
                for (const id of ids) {
                  await supabase.from("leads").update({ agent, status:"Assigned" }).eq("id", id);
                }
                await logAudit("Bulk assigned", "leads", "bulk", { agent, count: ids.length });
                showToast(`${ids.length} leads assigned to ${agent}`);
                setSelectedIds(new Set());
                fetchLeads();
                e.target.value = "";
              }}>
                <option value="">Bulk assign to…</option>
                {teamMembers.filter(m => m.role === "agent").map(m => <option key={m.id}>{m.name}</option>)}
              </select>
            )}
            <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>Delete selected</button>
            <button className="btn" onClick={() => setSelectedIds(new Set())}>Clear</button>
          </div>
        )}

        {/* TABLE */}
        <div className="table-wrap">
          <div className="table-header">
            <div style={{display:"flex",alignItems:"center"}}>
              <span className="table-title">Leads</span>
              <span className="lead-count">{filtered.length}</span>
              {agingCount > 0 && statClick !== "aging" && (
                <span className="aging-badge" style={{cursor:"pointer"}} onClick={() => handleStatClick("aging")}>
                  {agingCount} aging
                </span>
              )}
            </div>
            <span style={{fontSize:11,color:"#3a3a3a"}}>Tap row for details</span>
          </div>
          <div className="table-scroll">
            {loading ? (
              <div className="empty">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="empty">No leads found</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th className="check"><input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.size===pageLeads.length&&pageLeads.length>0} /></th>
                    <th>Name</th><th>Phone</th><th>Location</th><th>Tier</th>
                    <th>Score</th><th>Business</th><th>Status</th><th>Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {pageLeads.map(l => {
                    const tc = tierColor(l.tier);
                    const aging = isAging(l);
                    return (
                      <tr key={l.id} className={`${selectedIds.has(l.id)?"row-selected":""} ${aging?"row-aging":""} ${l.status==="Pending Approval"?"row-pending":""}`} onClick={() => openLead(l)}>
                        <td className="check" onClick={e => toggleSelect(l.id, e)}><input type="checkbox" checked={selectedIds.has(l.id)} onChange={()=>{}} /></td>
                        <td className="name">{l.name}{aging && <span className="aging-badge">aging</span>}</td>
                        <td style={{fontSize:11,whiteSpace:"nowrap"}}>{l.phone||"—"}</td>
                        <td style={{whiteSpace:"nowrap",fontSize:11}}>{l.location}</td>
                        <td><span className="pill" style={{background:tc.bg,color:tc.color}}>{l.tier}</span></td>
                        <td><div className="score-wrap"><div className="score-bar"><div className="score-fill" style={{width:`${l.score}%`}}/></div><span style={{fontSize:11,color:"#525252",minWidth:22,textAlign:"right"}}>{l.score}</span></div></td>
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
              {totalPages>7&&<span style={{color:"#3a3a3a",fontSize:11,padding:"0 4px"}}>…{totalPages}</span>}
              <button className="page-btn" disabled={page===totalPages||totalPages===0} onClick={()=>setPage(p=>p+1)}>→</button>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRM DELETE */}
      {confirmDelete && (
        <div className="confirm-overlay" onClick={e=>e.target===e.currentTarget&&setConfirmDelete(false)}>
          <div className="confirm-modal">
            <div className="confirm-title">Delete {selectedIds.size} lead{selectedIds.size>1?"s":""}?</div>
            <div className="confirm-body">This cannot be undone.</div>
            <div className="confirm-actions">
              <button className="btn" style={{flex:1,justifyContent:"center"}} onClick={()=>setConfirmDelete(false)}>Cancel</button>
              <button className="btn btn-red" style={{flex:1,justifyContent:"center"}} onClick={deleteSelected}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* LEAD DETAIL DRAWER */}
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
                  {canSeeAll && (
                    <div className="form-group">
                      <label className="form-label">Agent</label>
                      <select className="edit-select" value={editData.agent||""} onChange={e=>setEditData(p=>({...p,agent:e.target.value}))}>
                        <option value="">— None —</option>
                        {teamMembers.filter(m=>m.role==="agent").map(m=><option key={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                  )}
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
                  <button className="btn btn-primary" onClick={saveEdit} disabled={saving} style={{flex:2}}>{saving?"Saving…":"Save Changes"}</button>
                </div>
              </>
            ) : (
              <>
                <div className="drawer-name">{selected.name}{isAging(selected)&&<span className="aging-badge">aging</span>}</div>

                {/* TABS */}
                <div className="detail-tabs">
                  {["info","comments","history","followups"].map(t=>(
                    <button key={t} className={`detail-tab${detailTab===t?" active":""}`} onClick={()=>setDetailTab(t)}>
                      {t==="info"?"Info":t==="comments"?"Comments":t==="history"?"History":"Follow-ups"}
                    </button>
                  ))}
                </div>

                {detailTab === "info" && (
                  <>
                    {[["Phone",selected.phone],["Location",selected.location],["Tier",selected.tier],["Business",selected.business_type],["Income",selected.income],["Score",`${selected.score}/100`],["Source",selected.source],["Status",selected.status],["Agent",selected.agent||"—"],["Notes",selected.notes]].map(([label,value]) => value ? (
                      <div className="drawer-row" key={label}>
                        <span className="drawer-row-label">{label}</span>
                        <span className="drawer-row-value">{value}</span>
                      </div>
                    ) : null)}

                    {canSeeAll && (
                      <div>
                        <div className="section-label" style={{marginBottom:4}}>Assign agent</div>
                        <select className="assign-select" value={assignAgent} onChange={e=>setAssignAgent(e.target.value)}>
                          <option value="">— Select —</option>
                          {teamMembers.filter(m=>m.role==="agent").map(m=><option key={m.id}>{m.name}</option>)}
                        </select>
                      </div>
                    )}
                    {/* Approve/Reject — shown to BM/Admin when lead is pending */}
                    {canSeeAll && selected.status === "Pending Approval" && (
                      <div style={{background:"rgba(249,115,22,0.08)",border:"1px solid rgba(249,115,22,0.25)",borderRadius:8,padding:"12px",display:"flex",flexDirection:"column",gap:8}}>
                        <div style={{fontSize:12,color:"#f97316",fontWeight:600}}>⏳ Awaiting conversion approval</div>
                        <div style={{fontSize:12,color:"#737373"}}>Agent: <strong style={{color:"#a3a3a3"}}>{selected.agent||"—"}</strong></div>
                        <div className="action-row">
                          <button className="btn btn-primary" style={{flex:1,justifyContent:"center",background:"#22c55e",borderColor:"#22c55e",color:"#fff"}} onClick={() => { approveConversion(selected.id); setSelected(null); }}>✓ Approve</button>
                          <button className="btn btn-danger" style={{flex:1,justifyContent:"center"}} onClick={() => { rejectConversion(selected.id); setSelected(null); }}>✕ Reject</button>
                        </div>
                      </div>
                    )}
                    <div className="action-row">
                      {canSeeAll && <button className="btn btn-primary" onClick={assignLead}>Assign</button>}
                      {selected.status !== "Pending Approval" && (
                        <button className="btn" onClick={() => markStatus("Contacted")}>Mark Contacted</button>
                      )}
                      {selected.status !== "Converted" && selected.status !== "Pending Approval" && (
                        <button className="btn" onClick={() => markStatus("Converted")}>
                          {isAgent ? "Request Conversion" : "Mark Converted"}
                        </button>
                      )}
                    </div>
                    <div className="action-row">
                      <button className="btn" onClick={() => { setEditMode(true); setEditData({...selected}); }}>Edit Lead</button>
                      <button className="btn btn-danger" onClick={() => deleteSingleLead(selected.id)}>Delete</button>
                    </div>
                  </>
                )}

                {detailTab === "comments" && (
                  <>
                    <div className="comment-list">
                      {comments.length === 0 && <div style={{fontSize:12,color:"#3a3a3a",textAlign:"center",padding:"20px 0"}}>No comments yet</div>}
                      {comments.map(c => (
                        <div className="comment-item" key={c.id}>
                          <div className="comment-meta">{c.user_name} · {new Date(c.created_at).toLocaleDateString()}</div>
                          <div className="comment-text">{c.comment}</div>
                        </div>
                      ))}
                    </div>
                    <div className="comment-input-row">
                      <input className="edit-input" placeholder="Add a note…" value={newComment} onChange={e=>setNewComment(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addComment()} />
                      <button className="btn btn-primary" onClick={addComment}>Add</button>
                    </div>
                  </>
                )}

                {detailTab === "history" && (
                  <div className="history-list">
                    {leadHistory.length === 0 && <div style={{fontSize:12,color:"#3a3a3a",textAlign:"center",padding:"20px 0"}}>No history yet</div>}
                    {leadHistory.map(h => (
                      <div className="history-item" key={h.id}>
                        <span className="history-field">{h.field_changed}</span>: {h.old_value||"—"} → {h.new_value||"—"}
                        <div style={{fontSize:10,color:"#3a3a3a",marginTop:2}}>{h.user_name} · {new Date(h.created_at).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                )}

                {detailTab === "followups" && (
                  <>
                    <div className="followup-list">
                      {followUps.length === 0 && <div style={{fontSize:12,color:"#3a3a3a",textAlign:"center",padding:"12px 0"}}>No follow-ups set</div>}
                      {followUps.map(f => (
                        <div key={f.id} className={`followup-item${f.done?" done":""}${!f.done&&f.due_date<today?" overdue":""}`}>
                          <div style={{flex:1}}>
                            <div style={{fontSize:12,color:f.done?"#525252":f.due_date<today?"#ef4444":"#d4d4d4",fontWeight:500}}>{f.due_date}</div>
                            {f.note && <div style={{fontSize:11,color:"#525252",marginTop:2}}>{f.note}</div>}
                          </div>
                          {!f.done && <button className="btn" style={{padding:"4px 8px",fontSize:11}} onClick={()=>markFollowUpDone(f.id)}>Done</button>}
                        </div>
                      ))}
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      <input className="edit-input" type="date" value={newFollowUp.due_date} onChange={e=>setNewFollowUp(p=>({...p,due_date:e.target.value}))} />
                      <input className="edit-input" placeholder="Note (optional)" value={newFollowUp.note} onChange={e=>setNewFollowUp(p=>({...p,note:e.target.value}))} />
                      <button className="btn btn-primary" onClick={addFollowUp}>Set Follow-up</button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* FIND LEADS MODAL */}
      {showFindLeads && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&!scrapeJob&&setShowFindLeads(false)}>
          <div className="modal" style={{maxWidth:520}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span className="modal-title">Find Leads</span>
              {!scrapeJob && <button className="btn" onClick={()=>setShowFindLeads(false)}>✕</button>}
            </div>
            {!scrapeJob ? (
              <>
                <div className="form-group">
                  <label className="form-label">States</label>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,maxHeight:110,overflowY:"auto",background:"#0c0c0c",border:"1px solid #1f1f1f",borderRadius:7,padding:8}}>
                    {NIGERIAN_STATES.map(s=>{
                      const checked=scrapeConfig.cities.includes(s);
                      return <label key={s} style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:checked?"#e5e5e5":"#525252",cursor:"pointer",whiteSpace:"nowrap"}}>
                        <input type="checkbox" checked={checked} onChange={()=>setScrapeConfig(c=>({...c,cities:checked?c.cities.filter(x=>x!==s):[...c.cities,s]}))} />{s}
                      </label>;
                    })}
                  </div>
                  <span style={{fontSize:11,color:"#3a3a3a"}}>{scrapeConfig.cities.length} selected</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Business Types</label>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,maxHeight:110,overflowY:"auto",background:"#0c0c0c",border:"1px solid #1f1f1f",borderRadius:7,padding:8}}>
                    {BUSINESS_TYPES.map(b=>{
                      const checked=scrapeConfig.business_types.includes(b);
                      return <label key={b} style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:checked?"#e5e5e5":"#525252",cursor:"pointer",whiteSpace:"nowrap"}}>
                        <input type="checkbox" checked={checked} onChange={()=>setScrapeConfig(c=>{
                          const newTypes=checked?c.business_types.filter(x=>x!==b):[...c.business_types,b];
                          const newKwMap={...c.keywords_map};
                          if(checked)delete newKwMap[b]; else newKwMap[b]=BUSINESS_KEYWORDS[b]||[b];
                          return {...c,business_types:newTypes,keywords_map:newKwMap};
                        })} />{b}
                      </label>;
                    })}
                  </div>
                  <span style={{fontSize:11,color:"#3a3a3a"}}>{scrapeConfig.business_types.length} selected</span>
                </div>
                {scrapeConfig.business_types.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">Keywords</label>
                    <div style={{display:"flex",flexDirection:"column",gap:10,background:"#0c0c0c",border:"1px solid #1f1f1f",borderRadius:7,padding:10}}>
                      {scrapeConfig.business_types.map(btype=>{
                        const allKws=BUSINESS_KEYWORDS[btype]||[btype];
                        const selectedKws=scrapeConfig.keywords_map?.[btype]||allKws;
                        return (
                          <div key={btype}>
                            <div style={{fontSize:11,color:"#a3a3a3",fontWeight:600,marginBottom:5}}>{btype}</div>
                            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                              {allKws.map(kw=>{
                                const on=selectedKws.includes(kw);
                                return <label key={kw} className="kw-pill" style={{background:on?"#1f1f1f":"transparent",borderColor:on?"#2a2a2a":"#1a1a1a",color:on?"#e5e5e5":"#525252"}}>
                                  <input type="checkbox" checked={on} style={{display:"none"}} onChange={()=>setScrapeConfig(c=>{
                                    const cur=c.keywords_map?.[btype]||allKws;
                                    const updated=on?cur.filter(k=>k!==kw):[...cur,kw];
                                    return {...c,keywords_map:{...c.keywords_map,[btype]:updated}};
                                  })} />{kw}
                                </label>;
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Max Total Leads</label>
                  <input type="number" min={1} max={500} className="form-input" value={scrapeConfig.max_total} onChange={e=>setScrapeConfig(c=>({...c,max_total:parseInt(e.target.value)||20}))} />
                  <span style={{fontSize:11,color:"#3a3a3a"}}>Scraper stops once this many leads are added</span>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button className="btn btn-primary" style={{flex:1}} onClick={startScrape}>Start Scraping</button>
                  <button className="btn" onClick={()=>setShowFindLeads(false)}>Cancel</button>
                </div>
              </>
            ) : (
              <div className="scrape-status">
                <div style={{fontSize:13,color:"#a3a3a3"}}>Status: <strong style={{color:"#e5e5e5"}}>{scrapeStatus?.status}</strong></div>
                <div style={{fontSize:13,color:"#a3a3a3"}}>Leads added: <strong style={{color:"#e5e5e5"}}>{scrapeStatus?.added??0}</strong><span style={{color:"#525252"}}> / {scrapeConfig.max_total}</span></div>
                <div className="progress-bar-wrap"><div className="progress-bar-fill" style={{width:`${scrapeStatus?.progress??0}%`}}/></div>
                <div style={{fontSize:11,color:"#525252"}}>{scrapeStatus?.progress??0}% complete</div>
                {scrapeStatus?.status!=="done"&&scrapeStatus?.status!=="cancelled"&&<button className="btn btn-danger" onClick={cancelScrape}>Stop</button>}
                {(scrapeStatus?.status==="done"||scrapeStatus?.status==="cancelled")&&<button className="btn btn-primary" onClick={()=>{setScrapeJob(null);setScrapeStatus(null);setShowFindLeads(false);}}>Done</button>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD LEAD MODAL */}
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

      {/* TEAM MANAGEMENT MODAL */}
      {showUserMgr && canSeeAll && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowUserMgr(false)}>
          <div className="modal" style={{maxWidth:560}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span className="modal-title">Team Management</span>
              <button className="btn" style={{padding:"5px 10px"}} onClick={()=>setShowUserMgr(false)}>✕</button>
            </div>
            <div style={{background:"#0c0c0c",border:"1px solid #1f1f1f",borderRadius:10,padding:14,display:"flex",flexDirection:"column",gap:10}}>
              <div style={{fontSize:12,fontWeight:600,color:"#a3a3a3"}}>Create New User</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" placeholder="e.g. Emeka Obi" value={newUser.name} onChange={e=>setNewUser(p=>({...p,name:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="agent@bank.com" value={newUser.email} onChange={e=>setNewUser(p=>({...p,email:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-input" type="password" placeholder="Min 8 chars" value={newUser.password} onChange={e=>setNewUser(p=>({...p,password:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={newUser.role} onChange={e=>setNewUser(p=>({...p,role:e.target.value}))}>
                    <option value="agent">Agent</option>
                    {isAdmin && <option value="branch_manager">Branch Manager</option>}
                  </select>
                </div>
                {/* Branch field: admin picks for BM/agent; BM sees their own branch pre-filled */}
                {isAdmin ? (
                  <div className="form-group" style={{gridColumn:"1/-1"}}>
                    <label className="form-label">Branch</label>
                    <input className="form-input" placeholder="e.g. Lagos Island, Abuja Central" value={newUser.branch} onChange={e=>setNewUser(p=>({...p,branch:e.target.value}))} />
                    <span style={{fontSize:11,color:"#3a3a3a"}}>Required for Branch Managers. Agents inherit their BM's branch.</span>
                  </div>
                ) : isBM && profile.branch ? (
                  <div className="form-group" style={{gridColumn:"1/-1"}}>
                    <label className="form-label">Branch</label>
                    <input className="form-input" value={profile.branch} disabled style={{opacity:0.5}} />
                    <span style={{fontSize:11,color:"#3a3a3a"}}>Agent will be assigned to your branch automatically.</span>
                  </div>
                ) : null}
              </div>
              {userError && <div style={{fontSize:12,color:"#ef4444",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:6,padding:"8px 10px"}}>{userError}</div>}
              {userSuccess && <div style={{fontSize:12,color:"#34d399",background:"rgba(52,211,153,0.08)",border:"1px solid rgba(52,211,153,0.2)",borderRadius:6,padding:"8px 10px"}}>{userSuccess}</div>}
              <button className="btn btn-primary" onClick={createUser} disabled={creatingUser}>{creatingUser?"Creating…":"Create User"}</button>
            </div>
            <div style={{fontSize:12,fontWeight:600,color:"#a3a3a3",marginTop:4}}>Team Members ({teamMembers.length})</div>
            <div style={{overflowX:"auto"}}>
              <table className="user-table">
                <thead><tr><th>Name</th><th>Role</th><th>Branch</th><th>Joined</th></tr></thead>
                <tbody>
                  {teamMembers.map(m=>(
                    <tr key={m.id}>
                      <td>{m.name}</td>
                      <td><span className="role-badge" style={{background:roleColor(m.role).bg,color:roleColor(m.role).color}}>{m.role.replace("_"," ")}</span></td>
                      <td style={{fontSize:11,color:m.branch?"#a3a3a3":"#3a3a3a"}}>{m.branch||"—"}</td>
                      <td style={{fontSize:11}}>{new Date(m.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* APPROVALS MODAL */}
      {showApprovals && canSeeAll && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowApprovals(false)}>
          <div className="modal" style={{maxWidth:560}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span className="modal-title">Pending Approvals <span style={{fontSize:13,color:"#f97316",fontWeight:700}}>({pendingApprovals.length})</span></span>
              <button className="btn" style={{padding:"5px 10px"}} onClick={()=>setShowApprovals(false)}>✕</button>
            </div>
            {pendingApprovals.length === 0 ? (
              <div style={{fontSize:13,color:"#3a3a3a",textAlign:"center",padding:"32px 0"}}>No pending approvals 🎉</div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {pendingApprovals.map(lead => (
                  <div key={lead.id} style={{background:"#0c0c0c",border:"1px solid #2a2a2a",borderRadius:10,padding:"12px 14px",display:"flex",flexDirection:"column",gap:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:600,color:"#e5e5e5"}}>{lead.name}</div>
                        <div style={{fontSize:11,color:"#525252",marginTop:2}}>{lead.business_type||"—"} · {lead.location} · Agent: <strong style={{color:"#a3a3a3"}}>{lead.agent||"—"}</strong></div>
                      </div>
                      <span style={{fontSize:11,background:"rgba(249,115,22,0.1)",color:"#f97316",border:"1px solid rgba(249,115,22,0.2)",borderRadius:4,padding:"2px 7px",whiteSpace:"nowrap"}}>Pending</span>
                    </div>
                    <div style={{display:"flex",gap:7}}>
                      <button className="btn btn-primary" style={{flex:1,justifyContent:"center",background:"#22c55e",borderColor:"#22c55e",color:"#fff",fontSize:12}} onClick={()=>approveConversion(lead.id)}>✓ Approve</button>
                      <button className="btn btn-danger" style={{flex:1,justifyContent:"center",fontSize:12}} onClick={()=>rejectConversion(lead.id)}>✕ Reject</button>
                      <button className="btn" style={{fontSize:12,padding:"7px 10px"}} onClick={()=>{setShowApprovals(false);openLead(lead);}}>View</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* LEADERBOARD MODAL */}
      {showLeaderboard && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowLeaderboard(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span className="modal-title">Agent Leaderboard</span>
              <button className="btn" style={{padding:"5px 10px"}} onClick={()=>setShowLeaderboard(false)}>✕</button>
            </div>
            {leaderboard.length === 0 ? (
              <div style={{fontSize:13,color:"#3a3a3a",textAlign:"center",padding:"24px 0"}}>No agents yet</div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {leaderboard.map((a,i)=>(
                  <div key={a.name} className="lb-row">
                    <div className="lb-rank">#{i+1}</div>
                    <div className="lb-name">{a.name}</div>
                    <div className="lb-stat">{a.assigned} assigned</div>
                    <div className="lb-converted">{a.converted} converted</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{fontSize:11,color:"#3a3a3a",textAlign:"center"}}>Ranked by conversions</div>
          </div>
        </div>
      )}

      {/* AUDIT LOG MODAL */}
      {showAuditLog && canSeeAll && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowAuditLog(false)}>
          <div className="modal" style={{maxWidth:600}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span className="modal-title">Audit Log</span>
              <button className="btn" style={{padding:"5px 10px"}} onClick={()=>setShowAuditLog(false)}>✕</button>
            </div>
            {auditLoading ? (
              <div style={{fontSize:13,color:"#525252",textAlign:"center",padding:"24px 0"}}>Loading…</div>
            ) : (
              <div className="audit-list">
                {auditLogs.length === 0 && <div style={{fontSize:13,color:"#3a3a3a",textAlign:"center",padding:"24px 0"}}>No activity yet</div>}
                {auditLogs.map(log=>(
                  <div key={log.id} className="audit-item">
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <span style={{color:"#d4d4d4",fontWeight:500}}>{log.action}</span>
                      <span style={{fontSize:10,color:"#3a3a3a",whiteSpace:"nowrap",marginLeft:8}}>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    <div className="audit-meta">{log.user_name} · {log.target_type}{log.details&&Object.keys(log.details).length>0?" · "+JSON.stringify(log.details):""}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className={`toast${toast?" show":""}`}>{toast}</div>
    </>
  );
}
