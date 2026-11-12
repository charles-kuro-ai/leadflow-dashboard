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
  if (s === "Converted")        return "#c9a84c";
  if (s === "Pending Approval") return "#f97316";
  if (s === "Contacted")        return "#60a5fa";
  if (s === "In Progress")      return "#a78bfa";
  if (s === "Assigned")         return "#94a3b8";
  return "#475569";
}

function statusBg(s) {
  if (s === "Converted")        return "rgba(201,168,76,0.12)";
  if (s === "Pending Approval") return "rgba(249,115,22,0.12)";
  if (s === "Contacted")        return "rgba(96,165,250,0.12)";
  if (s === "In Progress")      return "rgba(167,139,250,0.12)";
  if (s === "Assigned")         return "rgba(148,163,184,0.12)";
  return "rgba(71,85,105,0.12)";
}

function tierColor(t) {
  if (t === "Corporate") return { bg: "rgba(201,168,76,0.15)", color: "#c9a84c" };
  if (t === "SME")       return { bg: "rgba(96,165,250,0.1)", color: "#60a5fa" };
  return { bg: "rgba(148,163,184,0.08)", color: "#94a3b8" };
}

function roleColor(r) {
  if (r === "admin")          return { bg: "rgba(239,68,68,0.1)", color: "#ef4444" };
  if (r === "branch_manager") return { bg: "rgba(201,168,76,0.15)", color: "#c9a84c" };
  return { bg: "rgba(52,211,153,0.1)", color: "#34d399" };
}

const EMPTY_LEAD = { name:"", phone:"", location:"", tier:"SME", score:50, source:"Manual", status:"New", agent:"", income:"", business_type:"", notes:"" };

// ── LOGIN ─────────────────────────────────────────────────────────────────────
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
    <div style={{minHeight:"100vh",background:"#060d1f",display:"flex",fontFamily:"'DM Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      {/* Left panel */}
      <div style={{display:"none",flex:1,background:"linear-gradient(135deg,#0d1b3e 0%,#0a1628 100%)",alignItems:"center",justifyContent:"center",padding:48,flexDirection:"column",gap:32,borderRight:"1px solid rgba(201,168,76,0.1)"}} className="login-left">
        <div>
          <div style={{fontWeight:800,fontSize:36,color:"#e2e8f0",letterSpacing:"-0.03em",marginBottom:8}}>Lead<span style={{color:"#c9a84c"}}>Flow</span></div>
          <div style={{fontSize:15,color:"#64748b",lineHeight:1.7,maxWidth:320}}>Enterprise lead management for Nigerian banking. Find, track, and convert business prospects at scale.</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:16,width:"100%",maxWidth:320}}>
          {["Scrape thousands of leads from Google Maps","Role-based access for your whole team","Track every lead from prospect to conversion"].map(f=>(
            <div key={f} style={{display:"flex",alignItems:"center",gap:10,fontSize:13,color:"#94a3b8"}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:"#c9a84c",flexShrink:0}}/>
              {f}
            </div>
          ))}
        </div>
      </div>
      {/* Right panel */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
        <div style={{width:"100%",maxWidth:380}}>
          <div style={{marginBottom:36}}>
            <div style={{fontWeight:800,fontSize:28,color:"#e2e8f0",letterSpacing:"-0.03em",marginBottom:6}}>Lead<span style={{color:"#c9a84c"}}>Flow</span></div>
            <div style={{fontSize:14,color:"#475569"}}>Sign in to your workspace</div>
          </div>
          <form onSubmit={handleLogin} style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{fontSize:11,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>Email address</label>
              <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@bank.com" style={{background:"#0d1b3e",border:"1px solid #1e3a5f",borderRadius:8,color:"#e2e8f0",fontSize:14,fontFamily:"inherit",padding:"12px 14px",outline:"none",width:"100%"}} />
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{fontSize:11,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>Password</label>
              <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" style={{background:"#0d1b3e",border:"1px solid #1e3a5f",borderRadius:8,color:"#e2e8f0",fontSize:14,fontFamily:"inherit",padding:"12px 14px",outline:"none",width:"100%"}} />
            </div>
            {error && <div style={{fontSize:12,color:"#ef4444",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:7,padding:"9px 12px"}}>{error}</div>}
            <button type="submit" disabled={loading} style={{marginTop:4,background:"#c9a84c",border:"none",borderRadius:8,color:"#060d1f",fontWeight:700,fontSize:14,fontFamily:"inherit",padding:"13px",cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1,letterSpacing:"0.01em"}}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <div style={{textAlign:"center",marginTop:28,fontSize:12,color:"#1e3a5f"}}>LeadFlow Nigeria · Secure access only</div>
        </div>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession]       = useState(undefined);
  const [profile, setProfile]       = useState(null);
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
    <div style={{minHeight:"100vh",background:"#060d1f",display:"flex",alignItems:"center",justifyContent:"center",color:"#475569",fontFamily:"DM Sans,sans-serif",fontSize:13}}>
      Loading…
    </div>
  );

  if (!session) return <LoginScreen />;

  if (!profile) return (
    <div style={{minHeight:"100vh",background:"#060d1f",display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"DM Sans,sans-serif"}}>
      <div style={{textAlign:"center",maxWidth:360}}>
        <div style={{fontWeight:800,fontSize:28,color:"#e2e8f0",letterSpacing:"-0.02em",marginBottom:4}}>Lead<span style={{color:"#c9a84c"}}>Flow</span></div>
        <div style={{fontWeight:700,fontSize:18,color:"#e2e8f0",marginBottom:12,marginTop:24}}>Access Pending</div>
        <div style={{fontSize:13,color:"#475569",lineHeight:1.7,marginBottom:20}}>Your account has been created but no role has been assigned. Contact your branch manager or administrator.</div>
        <div style={{fontSize:12,color:"#1e3a5f",marginBottom:20,background:"#0d1b3e",border:"1px solid #1e3a5f",borderRadius:7,padding:"8px 12px"}}>{session.user.email}</div>
        <button style={{background:"transparent",border:"1px solid #1e3a5f",borderRadius:8,color:"#64748b",fontSize:13,fontFamily:"inherit",padding:"10px 20px",cursor:"pointer"}} onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
    </div>
  );

  return <Dashboard session={session} profile={profile} onLogout={() => supabase.auth.signOut()} />;
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard({ session, profile, onLogout }) {
  const userId  = session.user.id;
  const role    = profile.role;
  const isAdmin = role === "admin";
  const isBM    = role === "branch_manager";
  const isAgent = role === "agent";
  const canSeeAll = isAdmin || isBM;

  const [activePage, setActivePage]   = useState("leads");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [leads, setLeads]             = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);
  const [editMode, setEditMode]       = useState(false);
  const [editData, setEditData]       = useState({});
  const [assignAgent, setAssignAgent] = useState("");
  const [toast, setToast]             = useState("");
  const [toastType, setToastType]     = useState("info");
  const [page, setPage]               = useState(1);
  const perPage = 10;

  const [selectedIds, setSelectedIds]       = useState(new Set());
  const [confirmDelete, setConfirmDelete]   = useState(false);

  const [search, setSearch]               = useState("");
  const [tierFilter, setTierFilter]       = useState("");
  const [statusFilter, setStatusFilter]   = useState("");
  const [stateFilter, setStateFilter]     = useState("");
  const [btypeFilter, setBtypeFilter]     = useState("");
  const [dateFilter, setDateFilter]       = useState("");
  const [statClick, setStatClick]         = useState("");

  const [teamMembers, setTeamMembers]     = useState([]);
  const [showUserMgr, setShowUserMgr]     = useState(false);
  const [newUser, setNewUser]             = useState({ name:"", email:"", password:"", role:"agent", branch:"" });
  const [creatingUser, setCreatingUser]   = useState(false);
  const [userError, setUserError]         = useState("");
  const [userSuccess, setUserSuccess]     = useState("");

  const [showAddLead, setShowAddLead]     = useState(false);
  const [newLead, setNewLead]             = useState(EMPTY_LEAD);
  const [saving, setSaving]               = useState(false);

  const [showFindLeads, setShowFindLeads] = useState(false);
  const [scrapeConfig, setScrapeConfig]   = useState({ cities:[], business_types:[], keywords_map:{}, max_total:20 });
  const [scrapeJob, setScrapeJob]         = useState(null);
  const [scrapeStatus, setScrapeStatus]   = useState(null);
  const pollRef = useRef(null);

  const [showAuditLog, setShowAuditLog]   = useState(false);
  const [auditLogs, setAuditLogs]         = useState([]);
  const [auditLoading, setAuditLoading]   = useState(false);

  const [showApprovals, setShowApprovals] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showTargets, setShowTargets]         = useState(false);
  const [targets, setTargets]                 = useState([]);
  const [targetsLoading, setTargetsLoading]   = useState(false);
  const [newTarget, setNewTarget]             = useState({ branch:"", agent_name:"", target_count:"" });
  const [savingTarget, setSavingTarget]       = useState(false);
  const currentMonth = new Date().toISOString().slice(0,7); // "2026-11"

  const [detailTab, setDetailTab]         = useState("info");
  const [comments, setComments]           = useState([]);
  const [newComment, setNewComment]       = useState("");
  const [leadHistory, setLeadHistory]     = useState([]);
  const [followUps, setFollowUps]         = useState([]);
  const [newFollowUp, setNewFollowUp]     = useState({ due_date:"", note:"" });

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
    const days = (Date.now() - new Date(lead.created_at).getTime()) / (1000*60*60*24);
    return days > AGING_DAYS;
  }

  async function fetchLeads() {
    setLoading(true);
    let query = supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (isAgent) query = query.eq("agent", profile.name);
    const { data, error } = await query;
    if (!error) setLeads(data || []);
    setLoading(false);
  }

  async function fetchTeamMembers() {
    if (!canSeeAll) return;
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
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
    await supabase.from("lead_comments").insert([{ lead_id:selected.id, user_id:userId, user_name:profile.name, comment:newComment.trim() }]);
    await logAudit("Added comment","lead",selected.id,{comment:newComment.trim()});
    setNewComment(""); fetchComments(selected.id);
  }
  async function addFollowUp() {
    if (!newFollowUp.due_date || !selected) return;
    await supabase.from("follow_ups").insert([{ lead_id:selected.id, user_id:userId, due_date:newFollowUp.due_date, note:newFollowUp.note }]);
    setNewFollowUp({ due_date:"", note:"" }); fetchFollowUps(selected.id);
  }
  async function markFollowUpDone(id) {
    await supabase.from("follow_ups").update({ done:true }).eq("id",id);
    fetchFollowUps(selected.id);
  }

  async function logAudit(action, targetType, targetId, details) {
    await supabase.from("audit_logs").insert([{ user_id:userId, user_name:profile.name, action, target_type:targetType, target_id:String(targetId), details }]);
  }
  async function logHistory(leadId, field, oldVal, newVal) {
    await supabase.from("lead_history").insert([{ lead_id:leadId, user_id:userId, user_name:profile.name, field_changed:field, old_value:String(oldVal||""), new_value:String(newVal||"") }]);
  }

  async function assignLead() {
    if (!assignAgent || !selected) return showToast("Select a team member first","error");
    const oldAgent = selected.agent;
    const { error } = await supabase.from("leads").update({ agent:assignAgent, status:selected.status==="New"?"Assigned":selected.status }).eq("id",selected.id);
    if (!error) {
      await logAudit("Assigned lead","lead",selected.id,{from:oldAgent,to:assignAgent});
      await logHistory(selected.id,"agent",oldAgent,assignAgent);
      showToast("Assigned to "+assignAgent,"success");
      setSelected(null); fetchLeads();
    }
  }

  async function markStatus(newStatus) {
    if (!selected) return;
    const old = selected.status;
    const actualStatus = (isAgent && newStatus === "Converted") ? "Pending Approval" : newStatus;
    const { error } = await supabase.from("leads").update({ status:actualStatus }).eq("id",selected.id);
    if (!error) {
      await logAudit(`Marked as ${actualStatus}`,"lead",selected.id,{from:old,to:actualStatus});
      await logHistory(selected.id,"status",old,actualStatus);
      showToast(actualStatus==="Pending Approval"?"Sent for manager approval":`Marked as ${actualStatus}`,"success");
      setSelected(null); fetchLeads();
    }
  }

  async function approveConversion(leadId) {
    const { error } = await supabase.from("leads").update({ status:"Converted" }).eq("id",leadId);
    if (!error) {
      await logHistory(leadId,"status","Pending Approval","Converted");
      await logAudit("Approved conversion","lead",leadId,{});
      showToast("Conversion approved","success"); fetchLeads();
    }
  }
  async function rejectConversion(leadId) {
    const { error } = await supabase.from("leads").update({ status:"In Progress" }).eq("id",leadId);
    if (!error) {
      await logHistory(leadId,"status","Pending Approval","In Progress");
      await logAudit("Rejected conversion","lead",leadId,{});
      showToast("Sent back to In Progress","info"); fetchLeads();
    }
  }

  async function saveEdit() {
    if (!editData.name?.trim()) return showToast("Name is required","error");
    setSaving(true);
    const changes = {};
    ["name","phone","location","tier","status","agent","income","business_type","notes","score"].forEach(k=>{
      if (String(editData[k]||"") !== String(selected[k]||"")) changes[k]=editData[k];
    });
    const { error } = await supabase.from("leads").update({
      name:editData.name, phone:editData.phone, location:editData.location,
      tier:editData.tier, status:editData.status, agent:editData.agent,
      income:editData.income, business_type:editData.business_type,
      notes:editData.notes, score:Number(editData.score),
    }).eq("id",selected.id);
    setSaving(false);
    if (!error) {
      for (const [k,v] of Object.entries(changes)) await logHistory(selected.id,k,selected[k],v);
      await logAudit("Edited lead","lead",selected.id,changes);
      showToast("Lead updated","success");
      setEditMode(false); setSelected(null); fetchLeads();
    } else showToast("Error saving","error");
  }

  async function deleteSingleLead(id) {
    await supabase.from("leads").delete().eq("id",id);
    await logAudit("Deleted lead","lead",id,{});
    showToast("Lead deleted","info");
    setSelected(null); fetchLeads();
  }

  async function deleteSelected() {
    const ids = [...selectedIds];
    for (const id of ids) { await supabase.from("leads").delete().eq("id",id); await logAudit("Deleted lead","lead",id,{}); }
    showToast(`Deleted ${ids.length} lead${ids.length>1?"s":""}`, "info");
    setSelectedIds(new Set()); setConfirmDelete(false); fetchLeads();
  }

  async function saveLead() {
    if (!newLead.name.trim()) return showToast("Name is required","error");
    setSaving(true);
    const { error } = await supabase.from("leads").insert([{ ...newLead, score:Number(newLead.score), user_id:userId }]);
    setSaving(false);
    if (!error) {
      await logAudit("Added lead manually","lead",newLead.name,{});
      showToast("Lead added","success");
      setNewLead(EMPTY_LEAD); setShowAddLead(false); fetchLeads();
    } else showToast("Error saving lead","error");
  }

  async function createUser() {
    setUserError(""); setUserSuccess("");
    if (!newUser.name||!newUser.email||!newUser.password) return setUserError("All fields are required");
    if (newUser.password.length < 8) return setUserError("Password must be at least 8 characters");
    setCreatingUser(true);
    const { data:{ session:s } } = await supabase.auth.getSession();
    const r = await fetch(`${API_URL}/create-user`,{ method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${s.access_token}`}, body:JSON.stringify(newUser) });
    const data = await r.json();
    setCreatingUser(false);
    if (data.error) return setUserError(data.error);
    setUserSuccess(`"${newUser.name}" created successfully`);
    setNewUser({ name:"", email:"", password:"", role:"agent", branch:"" });
    fetchTeamMembers();
  }

  async function startScrape() {
    if (!scrapeConfig.cities.length) return showToast("Select at least one state","error");
    if (!scrapeConfig.business_types.length) return showToast("Select at least one business type","error");
    try {
      const { data:{ session:s } } = await supabase.auth.getSession();
      const r = await fetch(`${API_URL}/scrape`,{ method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${s.access_token}`}, body:JSON.stringify({...scrapeConfig}) });
      const data = await r.json();
      if (data.job_id) {
        setScrapeJob(data.job_id);
        setScrapeStatus({ status:"starting", added:0, progress:0 });
        pollRef.current = setInterval(()=>pollJob(data.job_id),2000);
        await logAudit("Started scraper","scraper",data.job_id,{cities:scrapeConfig.cities,types:scrapeConfig.business_types});
      } else showToast("Failed to start scraper","error");
    } catch { showToast("Cannot reach API","error"); }
  }

  async function pollJob(jobId) {
    try {
      const r = await fetch(`${API_URL}/status/${jobId}`);
      const data = await r.json();
      setScrapeStatus(data);
      if (data.status==="done") { clearInterval(pollRef.current); showToast(`Done! ${data.added} leads added`,"success"); fetchLeads(); }
      else if (data.status==="cancelled") { clearInterval(pollRef.current); showToast(`Cancelled — ${data.added} leads saved`,"info"); fetchLeads(); }
    } catch {}
  }

  function cancelScrape() {
    if (scrapeJob) fetch(`${API_URL}/cancel/${scrapeJob}`,{ method:"POST" });
    clearInterval(pollRef.current); setScrapeJob(null); setScrapeStatus(null);
  }

  async function fetchTargets() {
    setTargetsLoading(true);
    let query = supabase.from("targets").select("*").eq("month", currentMonth).order("created_at", { ascending: false });
    if (isBM && profile.branch) query = query.eq("branch", profile.branch);
    const { data } = await query;
    setTargets(data || []);
    setTargetsLoading(false);
  }

  async function saveTarget() {
    if (!newTarget.target_count || Number(newTarget.target_count) <= 0) return showToast("Enter a valid target number","error");
    setSavingTarget(true);
    const row = {
      month: currentMonth,
      target_count: Number(newTarget.target_count),
      created_by: userId,
      branch: isBM ? profile.branch : (newTarget.branch || null),
      agent_name: newTarget.agent_name || null,
    };
    const { error } = await supabase.from("targets").insert([row]);
    setSavingTarget(false);
    if (!error) {
      showToast("Target saved","success");
      setNewTarget({ branch:"", agent_name:"", target_count:"" });
      fetchTargets();
    } else showToast("Error saving target","error");
  }

  async function deleteTarget(id) {
    await supabase.from("targets").delete().eq("id", id);
    showToast("Target removed","info");
    fetchTargets();
  }

  async function fetchAuditLogs() {
    setAuditLoading(true);
    const { data:{ session:s } } = await supabase.auth.getSession();
    const r = await fetch(`${API_URL}/audit-logs`,{ headers:{"Authorization":`Bearer ${s.access_token}`} });
    const data = await r.json();
    setAuditLogs(Array.isArray(data)?data:[]); setAuditLoading(false);
  }

  function showToast(msg, type="info") {
    setToast(msg); setToastType(type);
    setTimeout(()=>setToast(""),3500);
  }

  function exportCSV() {
    const cols = ["name","phone","location","tier","score","source","status","agent","income","business_type","notes"];
    const rows = [cols.join(","), ...filtered.map(l=>cols.map(c=>`"${(l[c]||"").toString().replace(/"/g,'""')}"`).join(","))];
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8,"+encodeURIComponent(rows.join("\n"));
    a.download = "leadflow.csv"; a.click();
    showToast("CSV downloaded","success");
    logAudit("Exported CSV","leads","bulk",{count:filtered.length});
  }

  function handleStatClick(key) {
    setStatClick(prev=>prev===key?"":key);
    setTierFilter(""); setStatusFilter(""); setSearch("");
  }

  function clearAllFilters() {
    setSearch(""); setTierFilter(""); setStatusFilter("");
    setStateFilter(""); setBtypeFilter(""); setDateFilter(""); setStatClick("");
  }

  function toggleSelect(id,e) {
    e.stopPropagation();
    setSelectedIds(prev=>{ const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  }

  function toggleSelectAll() {
    if (selectedIds.size===pageLeads.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(pageLeads.map(l=>l.id)));
  }

  function openLead(l) {
    setSelected(l); setAssignAgent(l.agent||""); setEditMode(false); setDetailTab("info");
    fetchComments(l.id); fetchHistory(l.id); fetchFollowUps(l.id);
  }

  const totalPages       = Math.ceil(filtered.length/perPage);
  const pageLeads        = filtered.slice((page-1)*perPage, page*perPage);
  const agingCount       = leads.filter(isAging).length;
  const pendingApprovals = leads.filter(l=>l.status==="Pending Approval");
  const stats = {
    total:    leads.length,
    newLeads: leads.filter(l=>l.status==="New").length,
    assigned: leads.filter(l=>l.status==="Assigned").length,
    converted:leads.filter(l=>l.status==="Converted").length,
    pending:  pendingApprovals.length,
  };
  const hasActiveFilters = search||tierFilter||statusFilter||stateFilter||btypeFilter||dateFilter||statClick;
  const leaderboard = teamMembers.filter(m=>m.role==="agent").map(m=>({
    name:m.name,
    assigned:leads.filter(l=>l.agent===m.name).length,
    converted:leads.filter(l=>l.agent===m.name&&l.status==="Converted").length,
  })).sort((a,b)=>b.converted-a.converted);
  const today = new Date().toISOString().split("T")[0];

  const NAV = [
    { id:"leads",   icon:"◈", label:"Leads" },
    { id:"scrape",  icon:"⊕", label:"Find Leads" },
    ...(canSeeAll ? [{ id:"approvals", icon:"⏳", label:"Approvals", badge:stats.pending }] : []),
    ...(canSeeAll ? [{ id:"team",      icon:"◉", label:"Team" }] : []),
    ...(canSeeAll ? [{ id:"leaderboard",icon:"▲", label:"Leaderboard" }] : []),
    ...(canSeeAll ? [{ id:"targets",   icon:"◎", label:"Targets" }] : []),
    ...(canSeeAll ? [{ id:"audit",     icon:"≡", label:"Audit Log" }] : []),
  ];

  function navClick(id) {
    if (id==="scrape") { setShowFindLeads(true); setSidebarOpen(false); return; }
    if (id==="approvals") { setShowApprovals(true); setSidebarOpen(false); return; }
    if (id==="team") { setShowUserMgr(true); setUserError(""); setUserSuccess(""); setSidebarOpen(false); return; }
    if (id==="leaderboard") { setShowLeaderboard(true); setSidebarOpen(false); return; }
    if (id==="targets") { setShowTargets(true); fetchTargets(); setSidebarOpen(false); return; }
    if (id==="audit") { setShowAuditLog(true); fetchAuditLogs(); setSidebarOpen(false); return; }
    setActivePage(id); setSidebarOpen(false);
  }

  const Sidebar = () => (
    <div style={{display:"flex",flexDirection:"column",height:"100%",padding:"24px 0"}}>
      {/* Logo */}
      <div style={{padding:"0 20px 28px",borderBottom:"1px solid rgba(201,168,76,0.1)"}}>
        <div style={{fontWeight:800,fontSize:22,color:"#e2e8f0",letterSpacing:"-0.03em"}}>Lead<span style={{color:"#c9a84c"}}>Flow</span></div>
        <div style={{fontSize:10,color:"#334155",marginTop:3,textTransform:"uppercase",letterSpacing:"0.1em"}}>Nigeria CRM</div>
      </div>
      {/* Nav */}
      <div style={{flex:1,padding:"16px 12px",display:"flex",flexDirection:"column",gap:2}}>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>navClick(n.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,border:"none",background:activePage===n.id?"rgba(201,168,76,0.1)":"transparent",color:activePage===n.id?"#c9a84c":"#64748b",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:500,textAlign:"left",width:"100%",transition:"all 0.15s",position:"relative"}}>
            <span style={{fontSize:14,width:16,textAlign:"center"}}>{n.icon}</span>
            {n.label}
            {n.badge>0&&<span style={{marginLeft:"auto",background:"#f97316",color:"#fff",borderRadius:99,padding:"1px 7px",fontSize:10,fontWeight:700}}>{n.badge}</span>}
          </button>
        ))}
      </div>
      {/* User info */}
      <div style={{padding:"16px 20px",borderTop:"1px solid rgba(255,255,255,0.04)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(201,168,76,0.15)",border:"1px solid rgba(201,168,76,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#c9a84c",flexShrink:0}}>
            {(profile.name||"U")[0].toUpperCase()}
          </div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:12,fontWeight:600,color:"#cbd5e1",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{profile.name||"User"}</div>
            <div style={{fontSize:10,color:"#334155",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{session.user.email}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:4,textTransform:"uppercase",letterSpacing:"0.05em",background:roleColor(role).bg,color:roleColor(role).color}}>{role.replace("_"," ")}</span>
          <button onClick={onLogout} style={{background:"none",border:"none",color:"#334155",fontSize:11,cursor:"pointer",fontFamily:"inherit",padding:"4px 8px",borderRadius:5,transition:"color 0.15s"}} onMouseOver={e=>e.target.style.color="#ef4444"} onMouseOut={e=>e.target.style.color="#334155"}>Sign out</button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #060d1f; color: #e2e8f0; font-family: 'DM Sans', sans-serif; min-height: 100vh; }

        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 2px; }

        .app-layout { display: flex; min-height: 100vh; }

        .sidebar { width: 220px; background: #080f24; border-right: 1px solid rgba(255,255,255,0.04); flex-shrink: 0; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
        @media(max-width:768px){ .sidebar { display: none; } }

        .sidebar-mobile-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 300; }
        .sidebar-mobile { display: none; position: fixed; top: 0; left: 0; bottom: 0; width: 240px; background: #080f24; border-right: 1px solid rgba(255,255,255,0.04); z-index: 301; overflow-y: auto; }
        @media(max-width:768px){
          .sidebar-mobile-overlay.open { display: block; }
          .sidebar-mobile.open { display: block; }
        }

        .mobile-topbar { display: none; position: sticky; top: 0; z-index: 100; background: rgba(8,15,36,0.97); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.04); padding: 12px 16px; align-items: center; justify-content: space-between; }
        @media(max-width:768px){ .mobile-topbar { display: flex; } }

        .main-content { flex: 1; min-width: 0; overflow-x: hidden; }
        .page-inner { padding: 24px; max-width: 1200px; margin: 0 auto; }
        @media(max-width:768px){ .page-inner { padding: 16px; } }

        .page-header { margin-bottom: 24px; display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .page-title { font-size: 20px; font-weight: 800; color: #e2e8f0; letter-spacing: -0.02em; }
        .page-sub { font-size: 12px; color: #334155; margin-top: 3px; }

        .btn { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; padding: 8px 14px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); color: #94a3b8; cursor: pointer; transition: all 0.15s; white-space: nowrap; font-family: inherit; letter-spacing: 0.01em; }
        .btn:hover { background: rgba(255,255,255,0.08); color: #cbd5e1; border-color: rgba(255,255,255,0.12); }
        .btn-gold { background: #c9a84c; border-color: #c9a84c; color: #060d1f; font-weight: 700; }
        .btn-gold:hover { background: #d4b55e; border-color: #d4b55e; color: #060d1f; }
        .btn-danger { border-color: rgba(239,68,68,0.2); color: #ef4444; }
        .btn-danger:hover { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.3); }
        .btn-success { background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.2); color: #22c55e; }
        .btn-success:hover { background: rgba(34,197,94,0.15); }

        .card { background: #0d1b3e; border: 1px solid rgba(255,255,255,0.04); border-radius: 12px; }

        .stat-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; margin-bottom: 20px; }
        @media(min-width:600px){ .stat-grid { grid-template-columns: repeat(3,1fr); } }
        @media(min-width:900px){ .stat-grid { grid-template-columns: repeat(5,1fr); } }
        .stat-card { background: #0d1b3e; border: 1px solid rgba(255,255,255,0.04); border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.15s; user-select: none; }
        .stat-card:hover { border-color: rgba(201,168,76,0.2); background: #0f1f47; }
        .stat-card.active { border-color: rgba(201,168,76,0.4); background: #0f1f47; }
        .stat-card.pending-card { border-color: rgba(249,115,22,0.15); }
        .stat-card.pending-card.active { border-color: rgba(249,115,22,0.4); }
        .stat-card.aging-card { border-color: rgba(239,68,68,0.1); }
        .stat-card.aging-card.active { border-color: rgba(239,68,68,0.3); }
        .stat-num { font-weight: 800; font-size: 28px; letter-spacing: -0.04em; color: #e2e8f0; line-height: 1; }
        .stat-lbl { font-size: 11px; color: #334155; margin-top: 6px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; }
        .stat-accent { color: #c9a84c; }

        .filters-card { background: #0d1b3e; border: 1px solid rgba(255,255,255,0.04); border-radius: 12px; padding: 14px; margin-bottom: 14px; }
        .filters-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .filters-label { font-size: 10px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.08em; }
        .filters-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
        @media(min-width:700px){ .filters-grid { grid-template-columns: repeat(3,1fr); } }
        @media(min-width:1000px){ .filters-grid { grid-template-columns: repeat(6,1fr); } }
        .fi { background: #060d1f; border: 1px solid rgba(255,255,255,0.05); border-radius: 7px; color: #94a3b8; font-size: 12px; font-family: inherit; padding: 7px 10px; outline: none; width: 100%; transition: border-color 0.15s; }
        .fi:focus { border-color: rgba(201,168,76,0.3); }
        .fi::placeholder { color: #1e3a5f; }
        .fi option { background: #0d1b3e; }
        .search-full { grid-column: 1 / -1; }
        @media(min-width:1000px){ .search-full { grid-column: auto; } }
        .clear-link { font-size: 11px; color: #334155; background: none; border: none; cursor: pointer; font-family: inherit; padding: 0; transition: color 0.15s; }
        .clear-link:hover { color: #ef4444; }

        .bulk-bar { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: rgba(201,168,76,0.05); border: 1px solid rgba(201,168,76,0.15); border-radius: 10px; margin-bottom: 12px; flex-wrap: wrap; }
        .bulk-bar span { font-size: 12px; color: #c9a84c; font-weight: 600; flex: 1; }

        .table-card { background: #0d1b3e; border: 1px solid rgba(255,255,255,0.04); border-radius: 12px; overflow: hidden; }
        .table-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); flex-wrap: wrap; gap: 8px; }
        .table-title { font-size: 13px; font-weight: 700; color: #e2e8f0; }
        .lead-badge { font-size: 10px; color: #334155; background: #060d1f; border: 1px solid rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 20px; margin-left: 8px; font-weight: 600; }
        .tbl-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; min-width: 640px; }
        thead th { text-align: left; padding: 10px 14px; font-size: 10px; font-weight: 700; color: #1e3a5f; letter-spacing: 0.08em; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.04); background: #080f24; white-space: nowrap; }
        tbody tr { border-bottom: 1px solid rgba(255,255,255,0.03); cursor: pointer; transition: background 0.1s; }
        tbody tr:last-child { border-bottom: none; }
        tbody tr:hover { background: rgba(255,255,255,0.02); }
        tbody tr.row-sel { background: rgba(201,168,76,0.04); }
        tbody tr.row-aging { border-left: 2px solid #ef4444; }
        tbody tr.row-pending { border-left: 2px solid #f97316; }
        td { padding: 11px 14px; color: #475569; vertical-align: middle; }
        td.td-name { color: #cbd5e1; font-weight: 600; white-space: nowrap; }
        td.td-chk { width: 36px; }
        input[type="checkbox"] { width: 14px; height: 14px; accent-color: #c9a84c; cursor: pointer; }

        .pill { display: inline-flex; align-items: center; font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 4px; white-space: nowrap; letter-spacing: 0.03em; }
        .status-pill { display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; font-size: 11px; font-weight: 500; padding: 3px 9px; border-radius: 20px; }
        .score-wrap { display: flex; align-items: center; gap: 7px; min-width: 70px; }
        .score-bar { flex: 1; height: 3px; background: #0a1628; border-radius: 2px; overflow: hidden; min-width: 36px; }
        .score-fill { height: 100%; border-radius: 2px; background: #c9a84c; }

        .pagination { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.04); flex-wrap: wrap; gap: 8px; }
        .pg-info { font-size: 11px; color: #334155; }
        .pg-btns { display: flex; gap: 4px; flex-wrap: wrap; }
        .pg-btn { background: #060d1f; border: 1px solid rgba(255,255,255,0.05); color: #334155; font-size: 11px; font-family: inherit; padding: 4px 10px; border-radius: 5px; cursor: pointer; transition: all 0.15s; }
        .pg-btn:hover { color: #94a3b8; border-color: rgba(255,255,255,0.1); }
        .pg-btn.pg-active { background: #c9a84c; border-color: #c9a84c; color: #060d1f; font-weight: 700; }
        .pg-btn:disabled { opacity: 0.2; pointer-events: none; }

        /* Lead cards for mobile */
        .lead-cards { display: none; flex-direction: column; gap: 8px; padding: 12px; }
        @media(max-width:640px){ .tbl-scroll { display: none; } .lead-cards { display: flex; } }
        .lead-card { background: #080f24; border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 14px; cursor: pointer; transition: all 0.15s; }
        .lead-card:hover { border-color: rgba(201,168,76,0.2); }
        .lead-card.lc-aging { border-left: 2px solid #ef4444; }
        .lead-card.lc-pending { border-left: 2px solid #f97316; }
        .lc-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px; }
        .lc-name { font-size: 14px; font-weight: 700; color: #e2e8f0; }
        .lc-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
        .lc-tag { font-size: 10px; color: #475569; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 4px; padding: 2px 6px; }
        .lc-bottom { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }

        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 200; backdrop-filter: blur(2px); }
        .drawer { position: fixed; top: 0; right: 0; bottom: 0; width: min(420px,100vw); background: #080f24; border-left: 1px solid rgba(255,255,255,0.06); z-index: 201; overflow-y: auto; display: flex; flex-direction: column; }
        .drawer-header { padding: 18px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; background: #080f24; z-index: 1; }
        .drawer-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; flex: 1; }
        .drawer-name { font-weight: 800; font-size: 18px; color: #e2e8f0; letter-spacing: -0.02em; }
        .drawer-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 9px 0; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 12px; gap: 12px; }
        .dr-label { color: #334155; flex-shrink: 0; font-weight: 500; }
        .dr-value { color: #94a3b8; font-weight: 500; text-align: right; }

        .detail-tabs { display: flex; gap: 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .dtab { background: none; border: none; border-bottom: 2px solid transparent; color: #334155; font-family: inherit; font-size: 12px; font-weight: 600; padding: 8px 14px; cursor: pointer; margin-bottom: -1px; transition: all 0.15s; letter-spacing: 0.02em; }
        .dtab.active { color: #c9a84c; border-bottom-color: #c9a84c; }

        .comment-list { display: flex; flex-direction: column; gap: 8px; max-height: 220px; overflow-y: auto; }
        .comment-item { background: #060d1f; border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 10px 12px; }
        .comment-meta { font-size: 10px; color: #334155; margin-bottom: 4px; font-weight: 500; }
        .comment-text { font-size: 12px; color: #94a3b8; line-height: 1.5; }

        .history-list { display: flex; flex-direction: column; gap: 8px; max-height: 260px; overflow-y: auto; }
        .history-item { font-size: 11px; color: #475569; border-left: 2px solid #1e3a5f; padding: 4px 10px; }

        .followup-item { background: #060d1f; border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 10px 12px; display: flex; align-items: center; gap: 8px; }
        .followup-item.overdue { border-color: rgba(239,68,68,0.2); }
        .followup-item.fu-done { opacity: 0.35; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 300; display: flex; align-items: flex-end; justify-content: center; backdrop-filter: blur(4px); }
        @media(min-width:600px){ .modal-overlay { align-items: center; } }
        .modal { background: #080f24; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px 16px 0 0; width: 100%; max-width: 540px; max-height: 92vh; overflow-y: auto; display: flex; flex-direction: column; }
        @media(min-width:600px){ .modal { border-radius: 16px; } }
        .modal-header { padding: 18px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; background: #080f24; }
        .modal-title { font-size: 15px; font-weight: 800; color: #e2e8f0; letter-spacing: -0.02em; }
        .modal-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }

        .form-group { display: flex; flex-direction: column; gap: 5px; }
        .form-label { font-size: 10px; color: #334155; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; }
        .form-input, .form-select, .form-textarea { background: #060d1f; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; color: #94a3b8; font-size: 13px; font-family: inherit; padding: 10px 12px; outline: none; width: 100%; transition: border-color 0.15s; }
        .form-input:focus, .form-select:focus { border-color: rgba(201,168,76,0.3); color: #cbd5e1; }
        .form-input::placeholder { color: #1e3a5f; }
        .form-textarea { resize: vertical; min-height: 70px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .form-hint { font-size: 10px; color: #1e3a5f; margin-top: 2px; }

        .user-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .user-table th { text-align: left; padding: 8px 10px; font-size: 10px; color: #1e3a5f; letter-spacing: 0.08em; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.04); font-weight: 700; }
        .user-table td { padding: 10px 10px; border-bottom: 1px solid rgba(255,255,255,0.03); color: #475569; }
        .user-table td:first-child { color: #94a3b8; font-weight: 600; }

        .audit-item { background: #060d1f; border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 10px 12px; }
        .audit-action { color: #94a3b8; font-weight: 600; font-size: 12px; }
        .audit-meta { font-size: 10px; color: #334155; margin-top: 3px; }

        .lb-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: #060d1f; border: 1px solid rgba(255,255,255,0.04); border-radius: 10px; }
        .lb-rank { font-size: 11px; font-weight: 800; color: #1e3a5f; width: 24px; text-align: center; }
        .lb-rank.top { color: #c9a84c; }
        .lb-name { flex: 1; font-size: 13px; color: #cbd5e1; font-weight: 600; }
        .lb-stat { font-size: 11px; color: #334155; }
        .lb-converted { font-size: 14px; font-weight: 800; color: #c9a84c; min-width: 30px; text-align: right; }

        .progress-wrap { background: #060d1f; border-radius: 6px; height: 6px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg,#c9a84c,#d4b55e); border-radius: 6px; transition: width 0.4s; }

        .kw-pill { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 4px 10px; border-radius: 20px; border: 1px solid; cursor: pointer; transition: all 0.1s; font-family: inherit; }

        .confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 400; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(4px); }
        .confirm-box { background: #080f24; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 24px; max-width: 340px; width: 100%; display: flex; flex-direction: column; gap: 16px; }
        .confirm-title { font-size: 15px; font-weight: 800; color: #e2e8f0; }
        .confirm-body { font-size: 13px; color: #475569; line-height: 1.6; }

        .role-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.06em; }
        .aging-tag { font-size: 9px; background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); border-radius: 4px; padding: 1px 5px; margin-left: 6px; font-weight: 700; letter-spacing: 0.03em; }

        .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(80px); border-radius: 10px; padding: 11px 20px; font-size: 12px; font-weight: 600; z-index: 500; transition: transform 0.3s; white-space: nowrap; font-family: inherit; border: 1px solid; }
        .toast.show { transform: translateX(-50%) translateY(0); }
        .toast-success { background: rgba(201,168,76,0.1); border-color: rgba(201,168,76,0.3); color: #c9a84c; }
        .toast-error   { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: #ef4444; }
        .toast-info    { background: rgba(96,165,250,0.1); border-color: rgba(96,165,250,0.2); color: #60a5fa; }

        .empty-state { text-align: center; padding: 60px 24px; color: #1e3a5f; font-size: 13px; }
        .empty-icon { font-size: 32px; margin-bottom: 12px; opacity: 0.3; }
      `}</style>

      <div className="app-layout">
        {/* Desktop Sidebar */}
        <div className="sidebar"><Sidebar /></div>

        {/* Mobile sidebar overlay */}
        <div className={`sidebar-mobile-overlay${sidebarOpen?" open":""}`} onClick={()=>setSidebarOpen(false)} />
        <div className={`sidebar-mobile${sidebarOpen?" open":""}`}><Sidebar /></div>

        {/* Main */}
        <div className="main-content">
          {/* Mobile top bar */}
          <div className="mobile-topbar">
            <button onClick={()=>setSidebarOpen(true)} style={{background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:18,padding:"4px",fontFamily:"inherit"}}>☰</button>
            <div style={{fontWeight:800,fontSize:18,color:"#e2e8f0",letterSpacing:"-0.02em"}}>Lead<span style={{color:"#c9a84c"}}>Flow</span></div>
            <button className="btn-gold btn" style={{padding:"6px 12px",fontSize:11}} onClick={()=>setShowAddLead(true)}>+ Add</button>
          </div>

          <div className="page-inner">
            {/* Page header */}
            <div className="page-header">
              <div>
                <div className="page-title">Leads</div>
                <div className="page-sub">{hasActiveFilters?`Showing ${filtered.length} of ${leads.length} leads`:`${leads.length} total leads`}</div>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {canSeeAll && stats.pending>0 && (
                  <button className="btn" style={{borderColor:"rgba(249,115,22,0.3)",color:"#f97316"}} onClick={()=>setShowApprovals(true)}>
                    ⏳ Approvals <span style={{background:"#f97316",color:"#fff",borderRadius:99,padding:"1px 7px",fontSize:10,marginLeft:4}}>{stats.pending}</span>
                  </button>
                )}
                <button className="btn" onClick={exportCSV}>↓ Export</button>
                <button className="btn" onClick={fetchLeads}>↻</button>
                <button className="btn btn-gold" onClick={()=>setShowAddLead(true)}>+ Add Lead</button>
              </div>
            </div>

            {/* Stats */}
            <div className="stat-grid">
              <div className={`stat-card${!statClick&&!hasActiveFilters?" active":""}`} onClick={clearAllFilters}>
                <div className="stat-num">{leads.length}</div>
                <div className="stat-lbl">Total Leads</div>
              </div>
              <div className={`stat-card${statClick==="new"?" active":""}`} onClick={()=>handleStatClick("new")}>
                <div className="stat-num">{stats.newLeads}</div>
                <div className="stat-lbl">New</div>
              </div>
              <div className={`stat-card${statClick==="assigned"?" active":""}`} onClick={()=>handleStatClick("assigned")}>
                <div className="stat-num">{stats.assigned}</div>
                <div className="stat-lbl">Assigned</div>
              </div>
              {canSeeAll && (
                <div className={`stat-card pending-card${statClick==="pending"?" active":""}`} onClick={()=>handleStatClick("pending")}>
                  <div className="stat-num" style={stats.pending>0?{color:"#f97316"}:{}}>{stats.pending}</div>
                  <div className="stat-lbl">Pending Approval</div>
                </div>
              )}
              <div className={`stat-card${statClick==="converted"?" active":""}`} onClick={()=>handleStatClick("converted")}>
                <div className="stat-num stat-accent">{stats.converted}</div>
                <div className="stat-lbl">Converted</div>
              </div>
              <div className={`stat-card aging-card${statClick==="aging"?" active":""}`} onClick={()=>handleStatClick("aging")}>
                <div className="stat-num" style={agingCount>0?{color:"#ef4444"}:{}}>{agingCount}</div>
                <div className="stat-lbl">Aging {AGING_DAYS}d+</div>
              </div>
            </div>

            {/* Filters */}
            <div className="filters-card">
              <div className="filters-top">
                <span className="filters-label">Filters</span>
                {hasActiveFilters && <button className="clear-link" onClick={clearAllFilters}>Clear all</button>}
              </div>
              <div className="filters-grid">
                <input className="fi search-full" placeholder="Search name, phone, location…" value={search} onChange={e=>setSearch(e.target.value)} />
                <select className="fi" value={stateFilter} onChange={e=>setStateFilter(e.target.value)}>
                  <option value="">All states</option>
                  {NIGERIAN_STATES.map(s=><option key={s}>{s}</option>)}
                </select>
                <select className="fi" value={btypeFilter} onChange={e=>setBtypeFilter(e.target.value)}>
                  <option value="">All business types</option>
                  {BUSINESS_TYPES.map(b=><option key={b}>{b}</option>)}
                </select>
                <select className="fi" value={tierFilter} onChange={e=>setTierFilter(e.target.value)}>
                  <option value="">All tiers</option>
                  <option>Corporate</option><option>SME</option><option>Mass Market</option>
                </select>
                <select className="fi" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
                  <option value="">All statuses</option>
                  <option>New</option><option>Assigned</option><option>Contacted</option><option>In Progress</option><option>Pending Approval</option><option>Converted</option>
                </select>
                <select className="fi" value={dateFilter} onChange={e=>setDateFilter(e.target.value)}>
                  {DATE_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* Bulk bar */}
            {selectedIds.size>0&&(
              <div className="bulk-bar">
                <span>{selectedIds.size} selected</span>
                {canSeeAll&&(
                  <select className="fi" style={{maxWidth:180}} onChange={async e=>{
                    const agent=e.target.value; if(!agent) return;
                    const ids=[...selectedIds];
                    for(const id of ids){ await supabase.from("leads").update({agent,status:"Assigned"}).eq("id",id); }
                    await logAudit("Bulk assigned","leads","bulk",{agent,count:ids.length});
                    showToast(`${ids.length} leads assigned to ${agent}`,"success");
                    setSelectedIds(new Set()); fetchLeads(); e.target.value="";
                  }}>
                    <option value="">Bulk assign to…</option>
                    {teamMembers.filter(m=>m.role==="agent").map(m=><option key={m.id}>{m.name}</option>)}
                  </select>
                )}
                <button className="btn btn-danger" onClick={()=>setConfirmDelete(true)}>Delete</button>
                <button className="btn" onClick={()=>setSelectedIds(new Set())}>Clear</button>
              </div>
            )}

            {/* Table */}
            <div className="table-card">
              <div className="table-head">
                <div style={{display:"flex",alignItems:"center"}}>
                  <span className="table-title">Lead Database</span>
                  <span className="lead-badge">{filtered.length}</span>
                </div>
                <span style={{fontSize:11,color:"#1e3a5f"}}>Tap a row to view details</span>
              </div>

              {/* Desktop table */}
              <div className="tbl-scroll">
                {loading ? <div className="empty-state"><div className="empty-icon">⊙</div>Loading…</div>
                : filtered.length===0 ? <div className="empty-state"><div className="empty-icon">◈</div>No leads found</div>
                : (
                  <table>
                    <thead>
                      <tr>
                        <th className="td-chk"><input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.size===pageLeads.length&&pageLeads.length>0} /></th>
                        <th>Name</th><th>Phone</th><th>Location</th><th>Tier</th><th>Score</th><th>Business</th><th>Status</th><th>Agent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageLeads.map(l=>{
                        const tc=tierColor(l.tier);
                        const aging=isAging(l);
                        const isPending=l.status==="Pending Approval";
                        return (
                          <tr key={l.id} className={`${selectedIds.has(l.id)?"row-sel":""} ${aging?"row-aging":""} ${isPending?"row-pending":""}`} onClick={()=>openLead(l)}>
                            <td className="td-chk" onClick={e=>toggleSelect(l.id,e)}><input type="checkbox" checked={selectedIds.has(l.id)} onChange={()=>{}} /></td>
                            <td className="td-name">{l.name}{aging&&<span className="aging-tag">AGING</span>}</td>
                            <td style={{fontSize:11,whiteSpace:"nowrap"}}>{l.phone||"—"}</td>
                            <td style={{whiteSpace:"nowrap",fontSize:11}}>{l.location}</td>
                            <td><span className="pill" style={{background:tc.bg,color:tc.color}}>{l.tier}</span></td>
                            <td><div className="score-wrap"><div className="score-bar"><div className="score-fill" style={{width:`${l.score}%`}}/></div><span style={{fontSize:11,color:"#334155",minWidth:22,textAlign:"right"}}>{l.score}</span></div></td>
                            <td style={{fontSize:11,whiteSpace:"nowrap",color:"#475569"}}>{l.business_type||"—"}</td>
                            <td><span className="status-pill" style={{background:statusBg(l.status),color:statusColor(l.status)}}>{l.status}</span></td>
                            <td style={{fontSize:11,color:l.agent?"#64748b":"#1e3a5f",whiteSpace:"nowrap"}}>{l.agent||"—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Mobile cards */}
              <div className="lead-cards">
                {loading ? <div className="empty-state">Loading…</div>
                : filtered.length===0 ? <div className="empty-state">No leads found</div>
                : pageLeads.map(l=>{
                  const tc=tierColor(l.tier);
                  const aging=isAging(l);
                  const isPending=l.status==="Pending Approval";
                  return (
                    <div key={l.id} className={`lead-card${aging?" lc-aging":""}${isPending?" lc-pending":""}`} onClick={()=>openLead(l)}>
                      <div className="lc-top">
                        <div>
                          <div className="lc-name">{l.name}{aging&&<span className="aging-tag">AGING</span>}</div>
                          <div className="lc-meta">
                            <span className="lc-tag">{l.location||"—"}</span>
                            {l.business_type&&<span className="lc-tag">{l.business_type}</span>}
                          </div>
                        </div>
                        <span className="status-pill" style={{background:statusBg(l.status),color:statusColor(l.status),flexShrink:0}}>{l.status}</span>
                      </div>
                      <div className="lc-bottom">
                        <span className="pill" style={{background:tc.bg,color:tc.color}}>{l.tier}</span>
                        <div className="score-wrap" style={{maxWidth:100}}>
                          <div className="score-bar"><div className="score-fill" style={{width:`${l.score}%`}}/></div>
                          <span style={{fontSize:11,color:"#334155"}}>{l.score}</span>
                        </div>
                        <span style={{fontSize:11,color:"#334155"}}>{l.agent||"Unassigned"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pagination">
                <span className="pg-info">Showing {Math.min((page-1)*perPage+1,filtered.length)}–{Math.min(page*perPage,filtered.length)} of {filtered.length}</span>
                <div className="pg-btns">
                  <button className="pg-btn" disabled={page===1} onClick={()=>setPage(p=>p-1)}>←</button>
                  {Array.from({length:Math.min(totalPages,7)},(_,i)=>(
                    <button key={i} className={`pg-btn${page===i+1?" pg-active":""}`} onClick={()=>setPage(i+1)}>{i+1}</button>
                  ))}
                  {totalPages>7&&<span style={{color:"#1e3a5f",fontSize:11,padding:"0 4px"}}>…{totalPages}</span>}
                  <button className="pg-btn" disabled={page===totalPages||totalPages===0} onClick={()=>setPage(p=>p+1)}>→</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRM DELETE */}
      {confirmDelete&&(
        <div className="confirm-overlay" onClick={e=>e.target===e.currentTarget&&setConfirmDelete(false)}>
          <div className="confirm-box">
            <div className="confirm-title">Delete {selectedIds.size} lead{selectedIds.size>1?"s":""}?</div>
            <div className="confirm-body">This action cannot be undone. These leads will be permanently removed from the database.</div>
            <div style={{display:"flex",gap:8}}>
              <button className="btn" style={{flex:1,justifyContent:"center"}} onClick={()=>setConfirmDelete(false)}>Cancel</button>
              <button className="btn btn-danger" style={{flex:1,justifyContent:"center",background:"rgba(239,68,68,0.1)"}} onClick={deleteSelected}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* LEAD DETAIL DRAWER */}
      {selected&&(
        <>
          <div className="overlay" onClick={()=>{setSelected(null);setEditMode(false);}} />
          <div className="drawer">
            <div className="drawer-header">
              <span style={{fontSize:11,fontWeight:700,color:"#334155",textTransform:"uppercase",letterSpacing:"0.08em"}}>{editMode?"Edit Lead":"Lead Detail"}</span>
              <button className="btn" style={{padding:"5px 10px"}} onClick={()=>{setSelected(null);setEditMode(false);}}>✕</button>
            </div>
            <div className="drawer-body">
              {editMode?(
                <>
                  <div className="form-grid">
                    {[["Name","name"],["Phone","phone"],["Location","location"],["Income","income"],["Business Type","business_type"]].map(([label,key])=>(
                      <div className="form-group" key={key} style={key==="name"||key==="business_type"?{gridColumn:"1/-1"}:{}}>
                        <label className="form-label">{label}</label>
                        <input className="form-input" value={editData[key]||""} onChange={e=>setEditData(p=>({...p,[key]:e.target.value}))} />
                      </div>
                    ))}
                    <div className="form-group">
                      <label className="form-label">Tier</label>
                      <select className="form-select" value={editData.tier||"SME"} onChange={e=>setEditData(p=>({...p,tier:e.target.value}))}>
                        <option>Corporate</option><option>SME</option><option>Mass Market</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select className="form-select" value={editData.status||"New"} onChange={e=>setEditData(p=>({...p,status:e.target.value}))}>
                        <option>New</option><option>Assigned</option><option>Contacted</option><option>In Progress</option><option>Pending Approval</option><option>Converted</option>
                      </select>
                    </div>
                    {canSeeAll&&(
                      <div className="form-group">
                        <label className="form-label">Agent</label>
                        <select className="form-select" value={editData.agent||""} onChange={e=>setEditData(p=>({...p,agent:e.target.value}))}>
                          <option value="">— None —</option>
                          {teamMembers.filter(m=>m.role==="agent").map(m=><option key={m.id}>{m.name}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label">Score</label>
                      <input className="form-input" type="number" min="0" max="100" value={editData.score||50} onChange={e=>setEditData(p=>({...p,score:e.target.value}))} />
                    </div>
                    <div className="form-group" style={{gridColumn:"1/-1"}}>
                      <label className="form-label">Notes</label>
                      <textarea className="form-textarea" value={editData.notes||""} onChange={e=>setEditData(p=>({...p,notes:e.target.value}))} />
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button className="btn" onClick={()=>setEditMode(false)}>Cancel</button>
                    <button className="btn btn-gold" onClick={saveEdit} disabled={saving} style={{flex:2,justifyContent:"center"}}>{saving?"Saving…":"Save Changes"}</button>
                  </div>
                </>
              ):(
                <>
                  <div>
                    <div className="drawer-name">{selected.name}{isAging(selected)&&<span className="aging-tag">AGING</span>}</div>
                    <span className="status-pill" style={{background:statusBg(selected.status),color:statusColor(selected.status),marginTop:8,display:"inline-flex"}}>{selected.status}</span>
                  </div>
                  <div className="detail-tabs">
                    {["info","comments","history","followups"].map(t=>(
                      <button key={t} className={`dtab${detailTab===t?" active":""}`} onClick={()=>setDetailTab(t)}>
                        {t==="info"?"Info":t==="comments"?"Notes":t==="history"?"History":"Follow-ups"}
                      </button>
                    ))}
                  </div>

                  {detailTab==="info"&&(
                    <>
                      {[["Phone",selected.phone],["Location",selected.location],["Tier",selected.tier],["Business",selected.business_type],["Income",selected.income],["Score",`${selected.score}/100`],["Source",selected.source],["Agent",selected.agent||"—"],["Notes",selected.notes]].map(([label,value])=>value?(
                        <div className="drawer-row" key={label}>
                          <span className="dr-label">{label}</span>
                          <span className="dr-value">{value}</span>
                        </div>
                      ):null)}
                      {canSeeAll&&(
                        <div>
                          <div style={{fontSize:10,fontWeight:700,color:"#334155",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Assign Agent</div>
                          <select className="form-select" value={assignAgent} onChange={e=>setAssignAgent(e.target.value)}>
                            <option value="">— Select agent —</option>
                            {teamMembers.filter(m=>m.role==="agent").map(m=><option key={m.id}>{m.name}</option>)}
                          </select>
                        </div>
                      )}
                      <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                        {canSeeAll&&<button className="btn btn-gold" onClick={assignLead} style={{flex:1,justifyContent:"center"}}>Assign</button>}
                        <button className="btn" onClick={()=>markStatus("Contacted")} style={{flex:1,justifyContent:"center"}}>Contacted</button>
                        <button className="btn btn-success" onClick={()=>markStatus("Converted")} style={{flex:1,justifyContent:"center"}}>Convert</button>
                      </div>
                      {canSeeAll&&selected.status==="Pending Approval"&&(
                        <div style={{display:"flex",gap:7}}>
                          <button className="btn btn-success" onClick={()=>approveConversion(selected.id)} style={{flex:1,justifyContent:"center"}}>✓ Approve</button>
                          <button className="btn btn-danger" onClick={()=>rejectConversion(selected.id)} style={{flex:1,justifyContent:"center"}}>✕ Reject</button>
                        </div>
                      )}
                      <div style={{display:"flex",gap:7}}>
                        <button className="btn" onClick={()=>{setEditMode(true);setEditData({...selected});}} style={{flex:1,justifyContent:"center"}}>Edit</button>
                        <button className="btn btn-danger" onClick={()=>deleteSingleLead(selected.id)} style={{flex:1,justifyContent:"center"}}>Delete</button>
                      </div>
                    </>
                  )}

                  {detailTab==="comments"&&(
                    <>
                      <div className="comment-list">
                        {comments.length===0&&<div style={{fontSize:12,color:"#1e3a5f",textAlign:"center",padding:"20px 0"}}>No notes yet</div>}
                        {comments.map(c=>(
                          <div className="comment-item" key={c.id}>
                            <div className="comment-meta">{c.user_name} · {new Date(c.created_at).toLocaleDateString()}</div>
                            <div className="comment-text">{c.comment}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{display:"flex",gap:7}}>
                        <input className="form-input" placeholder="Add a note…" value={newComment} onChange={e=>setNewComment(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addComment()} />
                        <button className="btn btn-gold" onClick={addComment}>Add</button>
                      </div>
                    </>
                  )}

                  {detailTab==="history"&&(
                    <div className="history-list">
                      {leadHistory.length===0&&<div style={{fontSize:12,color:"#1e3a5f",textAlign:"center",padding:"20px 0"}}>No history yet</div>}
                      {leadHistory.map(h=>(
                        <div className="history-item" key={h.id}>
                          <span style={{color:"#64748b",fontWeight:600}}>{h.field_changed}</span>: <span style={{color:"#334155"}}>{h.old_value||"—"}</span> → <span style={{color:"#c9a84c"}}>{h.new_value||"—"}</span>
                          <div style={{fontSize:10,color:"#1e3a5f",marginTop:3}}>{h.user_name} · {new Date(h.created_at).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {detailTab==="followups"&&(
                    <>
                      <div style={{display:"flex",flexDirection:"column",gap:6}}>
                        {followUps.length===0&&<div style={{fontSize:12,color:"#1e3a5f",textAlign:"center",padding:"12px 0"}}>No follow-ups set</div>}
                        {followUps.map(f=>(
                          <div key={f.id} className={`followup-item${f.done?" fu-done":""}${!f.done&&f.due_date<today?" overdue":""}`}>
                            <div style={{flex:1}}>
                              <div style={{fontSize:12,color:f.done?"#334155":f.due_date<today?"#ef4444":"#94a3b8",fontWeight:600}}>{f.due_date}</div>
                              {f.note&&<div style={{fontSize:11,color:"#334155",marginTop:2}}>{f.note}</div>}
                            </div>
                            {!f.done&&<button className="btn" style={{padding:"4px 8px",fontSize:11}} onClick={()=>markFollowUpDone(f.id)}>Done</button>}
                          </div>
                        ))}
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:7}}>
                        <input className="form-input" type="date" value={newFollowUp.due_date} onChange={e=>setNewFollowUp(p=>({...p,due_date:e.target.value}))} />
                        <input className="form-input" placeholder="Note (optional)" value={newFollowUp.note} onChange={e=>setNewFollowUp(p=>({...p,note:e.target.value}))} />
                        <button className="btn btn-gold" onClick={addFollowUp}>Set Follow-up</button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* FIND LEADS MODAL */}
      {showFindLeads&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&!scrapeJob&&setShowFindLeads(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Find Leads</span>
              {!scrapeJob&&<button className="btn" style={{padding:"5px 10px"}} onClick={()=>setShowFindLeads(false)}>✕</button>}
            </div>
            <div className="modal-body">
              {!scrapeJob?(
                <>
                  <div className="form-group">
                    <label className="form-label">States</label>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6,maxHeight:110,overflowY:"auto",background:"#060d1f",border:"1px solid rgba(255,255,255,0.05)",borderRadius:8,padding:10}}>
                      {NIGERIAN_STATES.map(s=>{
                        const checked=scrapeConfig.cities.includes(s);
                        return <label key={s} style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:checked?"#c9a84c":"#334155",cursor:"pointer",whiteSpace:"nowrap",fontWeight:checked?600:400}}>
                          <input type="checkbox" checked={checked} onChange={()=>setScrapeConfig(c=>({...c,cities:checked?c.cities.filter(x=>x!==s):[...c.cities,s]}))} />{s}
                        </label>;
                      })}
                    </div>
                    <span className="form-hint">{scrapeConfig.cities.length} state{scrapeConfig.cities.length!==1?"s":""} selected</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Business Types</label>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6,maxHeight:110,overflowY:"auto",background:"#060d1f",border:"1px solid rgba(255,255,255,0.05)",borderRadius:8,padding:10}}>
                      {BUSINESS_TYPES.map(b=>{
                        const checked=scrapeConfig.business_types.includes(b);
                        return <label key={b} style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:checked?"#c9a84c":"#334155",cursor:"pointer",whiteSpace:"nowrap",fontWeight:checked?600:400}}>
                          <input type="checkbox" checked={checked} onChange={()=>setScrapeConfig(c=>{
                            const newTypes=checked?c.business_types.filter(x=>x!==b):[...c.business_types,b];
                            const newKwMap={...c.keywords_map};
                            if(checked)delete newKwMap[b]; else newKwMap[b]=BUSINESS_KEYWORDS[b]||[b];
                            return {...c,business_types:newTypes,keywords_map:newKwMap};
                          })} />{b}
                        </label>;
                      })}
                    </div>
                    <span className="form-hint">{scrapeConfig.business_types.length} type{scrapeConfig.business_types.length!==1?"s":""} selected</span>
                  </div>
                  {scrapeConfig.business_types.length>0&&(
                    <div className="form-group">
                      <label className="form-label">Keywords</label>
                      <div style={{display:"flex",flexDirection:"column",gap:10,background:"#060d1f",border:"1px solid rgba(255,255,255,0.05)",borderRadius:8,padding:12}}>
                        {scrapeConfig.business_types.map(btype=>{
                          const allKws=BUSINESS_KEYWORDS[btype]||[btype];
                          const selectedKws=scrapeConfig.keywords_map?.[btype]||allKws;
                          return (
                            <div key={btype}>
                              <div style={{fontSize:10,color:"#64748b",fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>{btype}</div>
                              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                                {allKws.map(kw=>{
                                  const on=selectedKws.includes(kw);
                                  return <button key={kw} className="kw-pill" style={{background:on?"rgba(201,168,76,0.1)":"transparent",borderColor:on?"rgba(201,168,76,0.3)":"rgba(255,255,255,0.06)",color:on?"#c9a84c":"#334155"}} onClick={()=>setScrapeConfig(c=>{
                                    const cur=c.keywords_map?.[btype]||allKws;
                                    const updated=on?cur.filter(k=>k!==kw):[...cur,kw];
                                    return {...c,keywords_map:{...c.keywords_map,[btype]:updated}};
                                  })}>{kw}</button>;
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
                    <span className="form-hint">Scraper stops once this many leads are added to the database</span>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button className="btn btn-gold" style={{flex:1,justifyContent:"center"}} onClick={startScrape}>Start Scraping</button>
                    <button className="btn" onClick={()=>setShowFindLeads(false)}>Cancel</button>
                  </div>
                </>
              ):(
                <div style={{background:"#060d1f",border:"1px solid rgba(255,255,255,0.05)",borderRadius:12,padding:20,display:"flex",flexDirection:"column",gap:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontWeight:700,color:"#e2e8f0",fontSize:14}}>{scrapeStatus?.status==="done"?"Complete":"Scraping…"}</span>
                    <span style={{fontSize:13,color:"#c9a84c",fontWeight:700}}>{scrapeStatus?.added??0} <span style={{color:"#334155",fontWeight:400}}>/ {scrapeConfig.max_total}</span></span>
                  </div>
                  <div className="progress-wrap"><div className="progress-fill" style={{width:`${scrapeStatus?.progress??0}%`}}/></div>
                  <div style={{fontSize:11,color:"#334155"}}>{scrapeStatus?.progress??0}% complete</div>
                  {scrapeStatus?.status!=="done"&&scrapeStatus?.status!=="cancelled"&&<button className="btn btn-danger" onClick={cancelScrape}>Stop Scraping</button>}
                  {(scrapeStatus?.status==="done"||scrapeStatus?.status==="cancelled")&&<button className="btn btn-gold" onClick={()=>{setScrapeJob(null);setScrapeStatus(null);setShowFindLeads(false);}}>Done</button>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD LEAD MODAL */}
      {showAddLead&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowAddLead(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Add New Lead</span>
              <button className="btn" style={{padding:"5px 10px"}} onClick={()=>setShowAddLead(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group" style={{gridColumn:"1/-1"}}>
                  <label className="form-label">Business Name *</label>
                  <input className="form-input" placeholder="e.g. Chukwuemeka & Sons Supermarket" value={newLead.name} onChange={e=>setNewLead(p=>({...p,name:e.target.value}))} />
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
                  <label className="form-label">Est. Income</label>
                  <input className="form-input" placeholder="e.g. ₦500k/month" value={newLead.income} onChange={e=>setNewLead(p=>({...p,income:e.target.value}))} />
                </div>
                <div className="form-group" style={{gridColumn:"1/-1"}}>
                  <label className="form-label">Business Type</label>
                  <input className="form-input" placeholder="e.g. Pharmacy" value={newLead.business_type} onChange={e=>setNewLead(p=>({...p,business_type:e.target.value}))} />
                </div>
                <div className="form-group" style={{gridColumn:"1/-1"}}>
                  <label className="form-label">Notes / Address</label>
                  <textarea className="form-textarea" value={newLead.notes} onChange={e=>setNewLead(p=>({...p,notes:e.target.value}))} />
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn" onClick={()=>setShowAddLead(false)}>Cancel</button>
                <button className="btn btn-gold" onClick={saveLead} disabled={saving} style={{flex:2,justifyContent:"center"}}>{saving?"Saving…":"Save Lead"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEAM MODAL */}
      {showUserMgr&&canSeeAll&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowUserMgr(false)}>
          <div className="modal" style={{maxWidth:580}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Team Management</span>
              <button className="btn" style={{padding:"5px 10px"}} onClick={()=>setShowUserMgr(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{background:"#060d1f",border:"1px solid rgba(255,255,255,0.05)",borderRadius:10,padding:16,display:"flex",flexDirection:"column",gap:12}}>
                <div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.08em"}}>Create New User</div>
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
                    <input className="form-input" type="password" placeholder="Min 8 characters" value={newUser.password} onChange={e=>setNewUser(p=>({...p,password:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-select" value={newUser.role} onChange={e=>setNewUser(p=>({...p,role:e.target.value}))}>
                      <option value="agent">Agent</option>
                      {isAdmin&&<option value="branch_manager">Branch Manager</option>}
                    </select>
                  </div>
                  {isAdmin?(
                    <div className="form-group" style={{gridColumn:"1/-1"}}>
                      <label className="form-label">Branch</label>
                      <input className="form-input" placeholder="e.g. Lagos Island, Abuja Central" value={newUser.branch} onChange={e=>setNewUser(p=>({...p,branch:e.target.value}))} />
                      <span className="form-hint">Required for Branch Managers. Agents inherit their BM's branch.</span>
                    </div>
                  ):isBM&&profile.branch?(
                    <div className="form-group" style={{gridColumn:"1/-1"}}>
                      <label className="form-label">Branch</label>
                      <input className="form-input" value={profile.branch} disabled style={{opacity:0.4}} />
                      <span className="form-hint">Agent will be assigned to your branch automatically.</span>
                    </div>
                  ):null}
                </div>
                {userError&&<div style={{fontSize:12,color:"#ef4444",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:7,padding:"9px 12px"}}>{userError}</div>}
                {userSuccess&&<div style={{fontSize:12,color:"#c9a84c",background:"rgba(201,168,76,0.08)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:7,padding:"9px 12px"}}>{userSuccess}</div>}
                <button className="btn btn-gold" onClick={createUser} disabled={creatingUser}>{creatingUser?"Creating…":"Create User"}</button>
              </div>
              <div style={{fontSize:11,fontWeight:700,color:"#334155",textTransform:"uppercase",letterSpacing:"0.08em"}}>Team Members ({teamMembers.length})</div>
              <div style={{overflowX:"auto"}}>
                <table className="user-table">
                  <thead><tr><th>Name</th><th>Role</th><th>Branch</th><th>Joined</th></tr></thead>
                  <tbody>
                    {teamMembers.map(m=>(
                      <tr key={m.id}>
                        <td>{m.name}</td>
                        <td><span className="role-badge" style={{background:roleColor(m.role).bg,color:roleColor(m.role).color}}>{m.role.replace("_"," ")}</span></td>
                        <td style={{color:m.branch?"#64748b":"#1e3a5f"}}>{m.branch||"—"}</td>
                        <td style={{fontSize:11}}>{new Date(m.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPROVALS MODAL */}
      {showApprovals&&canSeeAll&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowApprovals(false)}>
          <div className="modal" style={{maxWidth:560}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Pending Approvals <span style={{fontSize:13,color:"#f97316"}}>({pendingApprovals.length})</span></span>
              <button className="btn" style={{padding:"5px 10px"}} onClick={()=>setShowApprovals(false)}>✕</button>
            </div>
            <div className="modal-body">
              {pendingApprovals.length===0?(
                <div style={{fontSize:13,color:"#334155",textAlign:"center",padding:"32px 0"}}>No pending approvals</div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {pendingApprovals.map(lead=>(
                    <div key={lead.id} style={{background:"#060d1f",border:"1px solid rgba(249,115,22,0.15)",borderRadius:10,padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                        <div>
                          <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{lead.name}</div>
                          <div style={{fontSize:11,color:"#475569",marginTop:3}}>{lead.business_type||"—"} · {lead.location} · <span style={{color:"#64748b"}}>Agent: {lead.agent||"—"}</span></div>
                        </div>
                        <span style={{fontSize:10,background:"rgba(249,115,22,0.1)",color:"#f97316",border:"1px solid rgba(249,115,22,0.2)",borderRadius:4,padding:"3px 8px",whiteSpace:"nowrap",fontWeight:700}}>PENDING</span>
                      </div>
                      <div style={{display:"flex",gap:7}}>
                        <button className="btn btn-success" style={{flex:1,justifyContent:"center"}} onClick={()=>approveConversion(lead.id)}>✓ Approve</button>
                        <button className="btn btn-danger" style={{flex:1,justifyContent:"center"}} onClick={()=>rejectConversion(lead.id)}>✕ Reject</button>
                        <button className="btn" style={{padding:"8px 12px"}} onClick={()=>{setShowApprovals(false);openLead(lead);}}>View</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LEADERBOARD MODAL */}
      {showLeaderboard&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowLeaderboard(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Agent Leaderboard</span>
              <button className="btn" style={{padding:"5px 10px"}} onClick={()=>setShowLeaderboard(false)}>✕</button>
            </div>
            <div className="modal-body">
              {leaderboard.length===0?(
                <div style={{fontSize:13,color:"#334155",textAlign:"center",padding:"24px 0"}}>No agents yet</div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {leaderboard.map((a,i)=>(
                    <div key={a.name} className="lb-row">
                      <div className={`lb-rank${i<3?" top":""}`}>#{i+1}</div>
                      <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(201,168,76,0.1)",border:"1px solid rgba(201,168,76,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#c9a84c",flexShrink:0}}>{a.name[0].toUpperCase()}</div>
                      <div className="lb-name">{a.name}</div>
                      <div className="lb-stat">{a.assigned} assigned</div>
                      <div className="lb-converted">{a.converted}</div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{fontSize:11,color:"#1e3a5f",textAlign:"center"}}>Ranked by number of conversions</div>
            </div>
          </div>
        </div>
      )}

      {/* TARGETS MODAL */}
      {showTargets&&canSeeAll&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowTargets(false)}>
          <div className="modal" style={{maxWidth:640}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Performance Targets — {currentMonth}</span>
              <button className="btn" style={{padding:"5px 10px"}} onClick={()=>setShowTargets(false)}>✕</button>
            </div>
            <div className="modal-body">

              {/* SET NEW TARGET */}
              <div style={{background:"#060d1f",border:"1px solid rgba(255,255,255,0.05)",borderRadius:10,padding:16,marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:"#334155",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>Set Target</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:8,alignItems:"end"}}>
                  {isAdmin&&(
                    <div>
                      <div style={{fontSize:10,color:"#475569",marginBottom:4}}>Branch</div>
                      <input className="fi" placeholder="e.g. Lagos Island" value={newTarget.branch} onChange={e=>setNewTarget(p=>({...p,branch:e.target.value}))} />
                    </div>
                  )}
                  <div>
                    <div style={{fontSize:10,color:"#475569",marginBottom:4}}>Agent (optional)</div>
                    <select className="fi" value={newTarget.agent_name} onChange={e=>setNewTarget(p=>({...p,agent_name:e.target.value}))}>
                      <option value="">Whole branch</option>
                      {teamMembers.filter(m=>m.role==="agent"&&(!isBM||m.branch===profile.branch)).map(m=>(
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:"#475569",marginBottom:4}}>Target conversions</div>
                    <input className="fi" type="number" min="1" placeholder="e.g. 20" value={newTarget.target_count} onChange={e=>setNewTarget(p=>({...p,target_count:e.target.value}))} />
                  </div>
                  <button className="btn btn-gold" onClick={saveTarget} disabled={savingTarget} style={{whiteSpace:"nowrap"}}>
                    {savingTarget?"Saving…":"Set Target"}
                  </button>
                </div>
              </div>

              {/* TARGETS LIST WITH PROGRESS */}
              {targetsLoading?(
                <div style={{fontSize:13,color:"#334155",textAlign:"center",padding:"24px 0"}}>Loading…</div>
              ):targets.length===0?(
                <div style={{fontSize:13,color:"#334155",textAlign:"center",padding:"24px 0"}}>No targets set for {currentMonth} yet.</div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {targets.map(t=>{
                    const scope = t.agent_name || t.branch || "All";
                    const actual = t.agent_name
                      ? leads.filter(l=>l.agent===t.agent_name&&l.status==="Converted").length
                      : leads.filter(l=>(!t.branch||l.branch===t.branch)&&l.status==="Converted").length;
                    const pct = Math.min(Math.round((actual/t.target_count)*100),100);
                    const color = pct>=100?"#22c55e":pct>=60?"#c9a84c":"#ef4444";
                    return (
                      <div key={t.id} style={{background:"#060d1f",border:"1px solid rgba(255,255,255,0.05)",borderRadius:10,padding:14}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                          <div>
                            <span style={{fontSize:13,fontWeight:700,color:"#cbd5e1"}}>{scope}</span>
                            {t.agent_name&&<span style={{marginLeft:6,fontSize:10,color:"#475569",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:4,padding:"1px 6px"}}>agent</span>}
                            {!t.agent_name&&t.branch&&<span style={{marginLeft:6,fontSize:10,color:"#475569",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:4,padding:"1px 6px"}}>branch</span>}
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <span style={{fontSize:12,fontWeight:700,color}}>{actual}/{t.target_count}</span>
                            <span style={{fontSize:11,color,fontWeight:600}}>{pct}%</span>
                            {isAdmin&&<button onClick={()=>deleteTarget(t.id)} style={{background:"none",border:"none",color:"#334155",fontSize:14,cursor:"pointer",padding:"0 2px"}} title="Remove">✕</button>}
                          </div>
                        </div>
                        <div style={{height:6,background:"rgba(255,255,255,0.05)",borderRadius:3,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:3,transition:"width 0.4s"}} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AUDIT LOG MODAL */}
      {showAuditLog&&canSeeAll&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowAuditLog(false)}>
          <div className="modal" style={{maxWidth:600}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Audit Log</span>
              <button className="btn" style={{padding:"5px 10px"}} onClick={()=>setShowAuditLog(false)}>✕</button>
            </div>
            <div className="modal-body">
              {auditLoading?(
                <div style={{fontSize:13,color:"#334155",textAlign:"center",padding:"24px 0"}}>Loading…</div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:500,overflowY:"auto"}}>
                  {auditLogs.length===0&&<div style={{fontSize:13,color:"#334155",textAlign:"center",padding:"24px 0"}}>No activity yet</div>}
                  {auditLogs.map(log=>(
                    <div key={log.id} className="audit-item">
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <span className="audit-action">{log.action}</span>
                        <span style={{fontSize:10,color:"#1e3a5f",whiteSpace:"nowrap",marginLeft:8}}>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      <div className="audit-meta">{log.user_name} · {log.target_type}{log.details&&Object.keys(log.details).length>0?" · "+JSON.stringify(log.details):""}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`toast${toast?" show":""} toast-${toastType}`}>{toast}</div>
    </>
  );
}
