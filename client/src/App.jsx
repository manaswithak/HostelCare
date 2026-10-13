import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, ClipboardList, LogOut, Plus, ShieldCheck, Wrench } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const categories = ['Maintenance', 'Cleanliness', 'Water', 'Electricity', 'Food', 'Internet', 'Security', 'Other'];
const statuses = ['Submitted', 'In Progress', 'Resolved', 'Rejected'];
const date = value => value ? new Date(value).toLocaleString() : '—';


async function request(path, token, options = {}) {
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong.');
  }

  return data;
}


function App() {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hostelcare-session') || 'null'); } catch { return null; }
  });
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', hostel: '' });
  const [complaints, setComplaints] = useState([]);
  const [newComplaint, setNewComplaint] = useState({ title: '', category: 'Maintenance', description: '', hostel: '', room: '' });
  const [evidence, setEvidence] = useState(null);
  const [rectorForm, setRectorForm] = useState({ name: '', email: '', password: '', hostel: '' });
  const [updates, setUpdates] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('All');

  const user = session?.user;
  const isStaff = user && ['rector', 'admin'].includes(user.role);
  const stats = useMemo(() => ({
    total: complaints.length,
    pending: complaints.filter(c => ['Submitted', 'In Progress'].includes(c.status)).length,
    resolved: complaints.filter(c => c.status === 'Resolved').length,
  }), [complaints]);

  const loadComplaints = async current => {
    try {
      const data = await request('/complaints', current.token);
      setComplaints(data.complaints || []);
    } catch (e) { setError(e.message); }
  };
  useEffect(() => {
    if (session?.token) loadComplaints(session);
  }, [session?.token]);

  const changeForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const signOut = () => {
    localStorage.removeItem('hostelcare-session');
    setSession(null); setComplaints([]); setError(''); setNotice(''); setMode('login');
  };

  async function authenticate(e) {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
      const data = await request(endpoint, null, { method: 'POST', body: JSON.stringify(form) });
      const next = { token: data.token, user: data.user };
      localStorage.setItem('hostelcare-session', JSON.stringify(next));
      setSession(next); setForm({ name: '', email: '', password: '', hostel: '' });
      setNotice('Welcome to HostelCare.');
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

 
async function submitComplaint(e) {
  e.preventDefault();
  setBusy(true);
  setError('');
  setNotice('');

  try {
  if (evidence && evidence.size > 5 * 1024 * 1024) {
  setError('Image must be 5 MB or smaller.');
  setBusy(false);
  return;
}
  const formData = new FormData();

    formData.append('title', newComplaint.title);
    formData.append('category', newComplaint.category);
    formData.append('description', newComplaint.description);
    formData.append('room', newComplaint.room);

    if (evidence) {
      formData.append('evidence', evidence);
    }

    await request('/complaints', session.token, {
      method: 'POST',
      body: formData,
      headers: {}
    });

    setNewComplaint({
      title: '',
      category: 'Maintenance',
      description: '',
      hostel: '',
      room: ''
    });
    setEvidence(null);
    e.target.reset();

    await loadComplaints(session);
    setNotice('Complaint submitted successfully.');
  } catch (e) {
    setError(e.message);
  } finally {
    setBusy(false);
  }
}


  async function saveUpdate(id) {
    const value = updates[id] || {};
    setBusy(true); setError(''); setNotice('');
    try {
      await request(`/complaints/${id}`, session.token, { method: 'PATCH', body: JSON.stringify(value) });
      await loadComplaints(session); setNotice('Complaint update saved and visible to the student.');
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function createRector(e) {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      await request('/users/rectors', session.token, { method: 'POST', body: JSON.stringify(rectorForm) });
      setRectorForm({ name: '', email: '', password: '', hostel: '' });
      setNotice('Rector account created. Share the login details securely.');
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  const visibleComplaints = filter === 'All' ? complaints : complaints.filter(c => c.status === filter);

  if (!session) return <main className="auth-layout">
    <section className="auth-visual">
      <div className="brand brand-light"><span className="brand-mark"><ShieldCheck size={23}/></span><span>HostelCare</span></div>
      <div className="hero-copy"><span className="eyebrow">A better hostel experience</span><h1>Your concern.<br/>Our responsibility.</h1><p>One transparent place to report hostel issues, track progress, and see what has been done.</p></div>
      <div className="visual-foot"><span><CheckCircle2 size={16}/> Track every complaint</span><span><ShieldCheck size={16}/> Role-based access</span></div>
      <div className="orb orb-one"/><div className="orb orb-two"/>
    </section>
    <section className="auth-side">
      <div className="mobile-brand brand"><span className="brand-mark"><ShieldCheck size={23}/></span><span>HostelCare</span></div>
      <div className="auth-card">
        <span className="eyebrow">{mode === 'register' ? 'Create your student account' : 'Welcome back'}</span>
        <h2>{mode === 'register' ? 'Get started' : 'Sign in to your portal'}</h2>
        <p className="muted">{mode === 'register' ? 'Register to raise and follow up on hostel complaints.' : 'Use the account provided to you by your hostel.'}</p>
        {error && <div className="alert error"><AlertCircle size={17}/>{error}</div>}
        <form onSubmit={authenticate} className="stack">
          {mode === 'register' && <><label>Full name<input required value={form.name} onChange={e=>changeForm('name',e.target.value)} placeholder="Your full name"/></label><label>Hostel / residence<input value={form.hostel} onChange={e=>changeForm('hostel',e.target.value)} placeholder="e.g. Block A"/></label></>}
          <label>Email address<input required type="email" value={form.email} onChange={e=>changeForm('email',e.target.value)} placeholder="you@college.edu"/></label>
          <label>Password<input required type="password" minLength={mode==='register'?8:undefined} value={form.password} onChange={e=>changeForm('password',e.target.value)} placeholder={mode==='register'?'At least 8 characters':'Enter your password'}/></label>
          <button className="btn primary full" disabled={busy}>{busy?'Please wait…':mode==='register'?'Create student account':'Sign in'}<ArrowRight size={17}/></button>
        </form>
        <div className="switch-mode">{mode==='register'?'Already have an account?':'New student?'} <button onClick={()=>{setMode(mode==='register'?'login':'register');setError('');}}>{mode==='register'?'Sign in':'Create an account'}</button></div>
        <p className="security-note"><ShieldCheck size={15}/> Rector and department accounts are created by the hostel admin.</p>
      </div>
      <span className="copyright">HostelCare · Hostel complaint and resolution portal</span>
    </section>
  </main>;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><ShieldCheck size={23}/></span><span>HostelCare</span></div>
      <div className="nav-caption">WORKSPACE</div>
      <div className="nav-item active"><ClipboardList size={18}/> Complaint dashboard</div>
      <div className="sidebar-bottom"><div className="profile"><div className="avatar">{user.name?.slice(0,1).toUpperCase()}</div><div className="profile-text"><strong>{user.name}</strong><span>{user.role==='admin'?'Hostel Department':user.role==='rector'?'Rector':'Student'}{user.hostel?` · ${user.hostel}`:''}</span></div></div><button className="logout" onClick={signOut}><LogOut size={17}/> Sign out</button></div>
    </aside>
    <main className="main-panel">
      <header className="topbar"><div><div className="breadcrumb">Workspace <span>/</span> Dashboard</div><h1>{isStaff?'Complaint overview':'My complaints'}</h1></div><div className="top-user"><span className="online-dot"/><span>{user.role==='admin'?'Department Admin':user.role==='rector'?'Rector Portal':'Student Portal'}</span></div></header>
      <div className="content">
        {error && <div className="alert error"><AlertCircle size={17}/>{error}<button className="dismiss" onClick={()=>setError('')}>×</button></div>}
        {notice && <div className="alert success"><CheckCircle2 size={17}/>{notice}<button className="dismiss" onClick={()=>setNotice('')}>×</button></div>}
        <section className="welcome-row"><div><span className="eyebrow">{isStaff?'HOSTEL OPERATIONS':'STUDENT SERVICES'}</span><h2>{isStaff?'Every issue deserves follow-through.':'How can we help today?'}</h2><p>{isStaff?'Review reports, keep students informed, and record the resolution.':'Submit an issue and check here for progress and the final resolution.'}</p></div><div className="welcome-icon"><Wrench size={28}/></div></section>
        <section className="stats-grid">
          <div className="stat-card"><div className="stat-icon purple"><ClipboardList size={19}/></div><span>Total complaints</span><strong>{stats.total}</strong><small>All recorded reports</small></div>
          <div className="stat-card"><div className="stat-icon amber"><AlertCircle size={19}/></div><span>Awaiting resolution</span><strong>{stats.pending}</strong><small>Submitted or in progress</small></div>
          <div className="stat-card"><div className="stat-icon green"><CheckCircle2 size={19}/></div><span>Resolved</span><strong>{stats.resolved}</strong><small>Resolution recorded</small></div>
        </section>

        {user.role==='student' && <section className="panel new-panel"><div className="panel-heading"><div><h3><Plus size={19}/> Raise a complaint</h3><p>Give enough detail so the hostel team can investigate.</p></div><span className="mini-tag">NEW REPORT</span></div>
          <form className="complaint-form" onSubmit={submitComplaint}>
            <label className="wide">Complaint title<input required maxLength={120} value={newComplaint.title} onChange={e=>setNewComplaint({...newComplaint,title:e.target.value})} placeholder="e.g. Water leakage in bathroom"/></label>
            <label>Category<select value={newComplaint.category} onChange={e=>setNewComplaint({...newComplaint,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
            <label>Hostel / block<input value={newComplaint.hostel} onChange={e=>setNewComplaint({...newComplaint,hostel:e.target.value})} placeholder={user.hostel||'Hostel name or block'}/></label>
            <label>Room number <span className="optional">(optional)</span><input value={newComplaint.room} onChange={e=>setNewComplaint({...newComplaint,room:e.target.value})} placeholder="e.g. A-204"/></label>
            <label className="wide">Description<textarea required maxLength={3000} rows="3" value={newComplaint.description} onChange={e=>setNewComplaint({...newComplaint,description:e.target.value})} placeholder="Describe the issue, when it started, and where it occurs…"/></label>
            <label className="wide">Evidence photo (optional)
  <input
    type="file"
    accept="image/*"
    onChange={e => setEvidence(e.target.files?.[0] || null)}
  />
  <span className="muted tiny">
    Upload a photo of the issue. Maximum size: 5 MB.
  </span>
</label>
            <div className="form-actions"><span className="muted tiny">Your report will be visible to hostel staff.</span><button className="btn primary" disabled={busy}>Submit complaint <ArrowRight size={16}/></button></div>
          </form>
        </section>}

        {user.role==='admin' && <section className="panel new-panel"><div className="panel-heading"><div><h3><Plus size={19}/> Create rector account</h3><p>Only the hostel department can create staff accounts.</p></div><span className="mini-tag">ADMIN TOOL</span></div>
          <form className="complaint-form" onSubmit={createRector}>
            <label>Rector name<input required value={rectorForm.name} onChange={e=>setRectorForm({...rectorForm,name:e.target.value})} placeholder="Full name"/></label>
            <label>Work email<input required type="email" value={rectorForm.email} onChange={e=>setRectorForm({...rectorForm,email:e.target.value})} placeholder="rector@college.edu"/></label>
            <label>Temporary password<input required minLength="8" value={rectorForm.password} onChange={e=>setRectorForm({...rectorForm,password:e.target.value})} placeholder="At least 8 characters"/></label>
            <label>Assigned hostel<input value={rectorForm.hostel} onChange={e=>setRectorForm({...rectorForm,hostel:e.target.value})} placeholder="e.g. Block A"/></label>
            <div className="form-actions wide"><span className="muted tiny">Share credentials privately; ask the rector to change their password.</span><button className="btn primary" disabled={busy}>Create rector <ArrowRight size={16}/></button></div>
          </form>
        </section>}

        <section className="panel complaints-panel"><div className="panel-heading list-heading"><div><h3><ClipboardList size={19}/>{isStaff?'All hostel complaints':'Complaint history'}</h3><p>{isStaff?'Update progress and post a clear resolution note.':'Status and updates from your hostel team appear below.'}</p></div><button className="btn secondary small" onClick={()=>loadComplaints(session)}>Refresh</button></div>
          <div className="filter-row"><span>FILTER BY STATUS</span><div className="filter-pills">{['All',...statuses].map(s=><button key={s} className={filter===s?'filter-pill selected':'filter-pill'} onClick={()=>setFilter(s)}>{s}</button>)}</div></div>
          {visibleComplaints.length===0 ? <div className="empty"><div className="empty-icon"><ClipboardList size={25}/></div><strong>No complaints found</strong><p>{filter==='All'?'New complaints will appear here once submitted.':`There are no complaints with status “${filter}”.`}</p></div> :
            <div className="complaint-list">{visibleComplaints.map(c=>{
              const edit = updates[c._id] || { status:c.status, resolutionNote:c.resolutionNote || '' };
              return <article
  className={`complaint-item ${c.evidenceUrl ? 'has-evidence' : ''}`}
  key={c._id}
>
                <div className="complaint-content">
                <div className="complaint-top"><div className="complaint-title-wrap"><span className="category-tag">{c.category}</span><h4>{c.title}</h4><span className="complaint-meta">#{String(c._id).slice(-6).toUpperCase()} · Submitted {date(c.createdAt)}</span></div><span className={`status status-${c.status.toLowerCase().replaceAll(' ','-')}`}>{c.status}</span></div>
                <p className="description">{c.description}</p>
                </div>

{c.evidenceUrl && (
  <a
    href={c.evidenceUrl}
    target="_blank"
    rel="noreferrer"
    className="evidence-link"
  >
    <img
      src={c.evidenceUrl}
      alt="Complaint evidence"
      style={{
        maxWidth: '100%',
        maxHeight: '280px',
        objectFit: 'contain',
        borderRadius: '8px',
        marginTop: '10px'
      }}
    />
  </a>
)}
                <div className="detail-chips"><span>Hostel: {c.hostel||'Not specified'}</span>{c.room&&<span>Room: {c.room}</span>}{isStaff&&<span>Student: {c.student?.name||'Unknown'}</span>}</div>
                {c.status==='Resolved' && <div className="resolution-box"><CheckCircle2 size={18}/><div><strong>Resolution / action taken</strong><p>{c.resolutionNote||'Marked resolved.'}</p><small>{c.resolvedBy?.name?`Updated by ${c.resolvedBy.name} · `:''}{date(c.resolvedAt)}</small></div></div>}
                {c.status!=='Resolved' && c.resolutionNote && <div className="update-box"><strong>Latest staff update</strong><p>{c.resolutionNote}</p></div>}
                {isStaff && c.status !== 'Resolved' && <div className="staff-editor"><div className="editor-label">STAFF UPDATE</div><div className="editor-grid"><label>Status<select value={edit.status} onChange={e=>setUpdates({...updates,[c._id]:{...edit,status:e.target.value}})}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label><label className="note-field">Action taken / update<textarea rows="2" maxLength={2000} value={edit.resolutionNote} onChange={e=>setUpdates({...updates,[c._id]:{...edit,resolutionNote:e.target.value}})} placeholder="Explain what was checked, fixed, or what happens next…"/></label></div><div className="editor-footer"><span className="muted tiny">Visible to the student after saving.</span><button className="btn primary small" disabled={busy} onClick={()=>saveUpdate(c._id)}>Save update</button></div></div>}
              </article>;
            })}</div>}
        </section>
        <footer className="page-footer">HostelCare <span>·</span> A transparent complaint-to-resolution workflow</footer>
      </div>
    </main>
  </div>;
}
export default App;
