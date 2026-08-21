// ============================================
// AIMON - Mock Data Store (v4)
// ============================================

const AppStore = {
  currentUser: null,

  users: [],
  pendingRegistrations: [],
  projectProposals: [],
  projects: [],
  approvals: [],
  chatMessages: JSON.parse(localStorage.getItem('aimon-chats') || '[]'),
  notifications: [],
  activityLog: [],

  filters: { seksi: 'Semua', kategori: 'Semua', tahun: '2026' },
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'],
  weeks: Array.from({length: 40}, (_, i) => `W${i + 5}`),

  getInitials(name) {
    if (!name) return '??';
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  },

  async fetchInitialData(token) {
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const [usersRes, projectsRes, approvalsRes, chatRes] = await Promise.all([
        fetch('/api/users', { headers }),
        fetch('/api/projects', { headers }),
        fetch('/api/approvals', { headers }),
        fetch('/api/chat', { headers })
      ]);
      if (usersRes.ok) {
        const udata = await usersRes.json();
        this.users = udata.map(u => ({ ...u, initials: this.getInitials(u.name) }));
        if (this.currentUser) {
          const c = this.users.find(x => x.id === this.currentUser.id);
          if (c) this.currentUser.initials = c.initials;
        }
      }
      if (projectsRes.ok) {
        const pjs = await projectsRes.json();
        this.projects = pjs.map(p => ({
          id: p.id, code: p.code, name: p.name, seksi: p.seksi, kategori: p.kategori,
          picId: p.pic_id, picName: p.pic?.name || 'Unknown', startDate: p.start_date, endDate: p.end_date, status: p.status,
          phases: (p.phases || []).map(ph => ({
            id: ph.id, code: ph.code, name: ph.name, bobot: parseFloat(ph.bobot), status: ph.status,
            activities: (ph.activities || []).map(a => ({
              id: a.id, code: a.code, name: a.name, target: a.target, nilai: a.nilai_aktual, status: a.status,
              startDate: a.start_date, endDate: a.end_date, docs: a.documents || []
            }))
          })),
          planCurve: { monthly: [0, 5, 10, 18, 28, 38, 50, 65, 80, 95, 100, 100], weekly: Array.from({length: 40}, (_, i) => Math.min(100, Math.pow((i/39), 1.5) * 100)) },
          actualCurve: { monthly: [0, 6, 12, 20, 30, 37, 37.8, null, null, null, null, null], weekly: Array.from({length: 40}, (_, i) => i <= 20 ? Math.min(100, Math.pow((i/39), 1.5) * 90) : null) }
        }));
      }
      if (approvalsRes.ok) {
        const apvs = await approvalsRes.json();
        this.approvals = apvs.map(a => ({
          id: a.id, type: 'update', projectId: a.activity?.phase?.project?.id,
          activityId: a.activity_id, submittedBy: a.submitted_by, submitterName: a.submitter?.name,
          activityName: a.activity?.name, phaseName: a.activity?.phase?.name,
          oldValue: a.old_nilai, newValue: a.new_nilai, note: a.note, docs: a.documents || [],
          submittedAt: a.submitted_at, status: a.status, rejectNote: a.note
        }));
      }
      if (chatRes.ok) {
        const chats = await chatRes.json();
        this.chatMessages = chats.map(c => ({
          id: c.id, from: c.sender_id, to: c.receiver_id, text: c.text, time: c.sent_at, read: c.is_read
        }));
      }
    } catch(e) {
      console.error('Failed to fetch data:', e);
    }
  },

  calculateRealization(project) { let t = 0; project.phases.forEach(ph => { t += this.calculatePhaseRealization(ph); }); return Math.round(t * 10) / 10; },
  calculatePhaseRealization(phase) { const n = phase.activities.length; if (!n) return 0; const s = phase.activities.reduce((a, b) => a + b.nilai, 0); return Math.round(phase.bobot * (s / (n * 100)) * 10) / 10; },
  calculatePhaseProgress(phase) { const n = phase.activities.length; if (!n) return 0; const d = phase.activities.filter(a => a.status === 'done').length; return Math.round((d / n) * 100); },
  getPhaseActivityCounts(phase) { return { open: phase.activities.filter(a => a.status === 'open').length, progress: phase.activities.filter(a => a.status === 'on-progress').length, done: phase.activities.filter(a => a.status === 'done').length, total: phase.activities.length }; },

  calculateRAG(project) {
    const todayMonth = new Date().getMonth();
    const plan = project.planCurve.monthly[todayMonth] || 0;
    const actual = this.calculateRealization(project);
    if (actual >= plan) return 'green';
    if (plan - actual <= 5) return 'yellow';
    return 'red';
  },

  getDashboardStats(kategori = 'Semua') {
    let pjs = this.projects.filter(p => { const sk = this.filters.seksi === 'Semua' || p.seksi === this.filters.seksi; const kk = kategori === 'Semua' || p.kategori === kategori; return sk && kk; });
    let total = 0, done = 0, prog = 0, delayed = 0, totalReal = 0; const today = new Date().toISOString().split('T')[0];
    pjs.forEach(p => { totalReal += this.calculateRealization(p); p.phases.forEach(ph => ph.activities.forEach(a => { total++; if (a.status === 'done') done++; else if (a.status === 'on-progress') prog++; if (a.status !== 'done' && a.endDate && a.endDate < today) delayed++; })); });
    return { totalProjects: pjs.length, avgProgress: pjs.length ? Math.round(totalReal / pjs.length * 10) / 10 : 0, totalRealization: totalReal, totalActivities: total, doneActivities: done, progressActivities: prog, openActivities: total - done - prog, delayedActivities: delayed, pendingApprovals: this.approvals.filter(a => a.status === 'pending').length };
  },

  getStatusClass(s) { 
    if (!s) return 'open';
    const l = s.toLowerCase();
    if (['completed', 'done', 'approved'].includes(l)) return 'done';
    if (['progress', 'in progress', 'on-progress', 'in_progress'].includes(l)) return 'on-progress';
    if (['late', 'delayed', 'rejected'].includes(l)) return 'delayed';
    return 'open';
  },
  getStatusLabel(s) { 
    if (!s) return 'Open';
    const l = s.toLowerCase();
    if (['completed', 'done', 'approved'].includes(l)) return 'Done';
    if (['progress', 'in progress', 'on-progress', 'in_progress'].includes(l)) return 'Progress';
    if (['late', 'delayed', 'rejected'].includes(l)) return 'Terlambat';
    if (['open', 'draft', 'pending'].includes(l)) return 'Open';
    return s.charAt(0).toUpperCase() + s.slice(1);
  },
  getProgressColor(p) { if (p >= 80) return 'green'; if (p >= 50) return 'blue'; if (p >= 25) return 'yellow'; return 'red'; },
  getFilteredProjects() { return this.projects.filter(p => { const s = this.filters.seksi === 'Semua' || p.seksi === this.filters.seksi; const k = this.filters.kategori === 'Semua' || p.kategori === this.filters.kategori; return s && k; }); },
  getPendingCount() { return this.approvals.filter(a => a.status === 'pending').length; },
  getChatPartners(uid) { 
    const p = new Set(); this.users.forEach(u => { if (u.id !== uid) p.add(u.id); }); 
    const partners = [...p].map(id => { 
      const u = this.users.find(u => u.id === id); 
      if (u && !u.initials) u.initials = u.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase(); 
      return u; 
    }).filter(Boolean); 
    
    return partners.sort((a, b) => {
      const convA = this.getConversation(uid, a.id);
      const convB = this.getConversation(uid, b.id);
      const timeA = convA.length ? new Date(convA[convA.length-1].time).getTime() : 0;
      const timeB = convB.length ? new Date(convB[convB.length-1].time).getTime() : 0;
      return timeB - timeA;
    });
  },
  getConversation(u1, u2) { return this.chatMessages.filter(m => (m.from === u1 && m.to === u2) || (m.from === u2 && m.to === u1)).sort((a, b) => new Date(a.time) - new Date(b.time)); },
  formatDate(d) { if (!d) return '—'; const dt = new Date(d); const m = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des']; return `${dt.getDate().toString().padStart(2,'0')} ${m[dt.getMonth()]} ${dt.getFullYear()}`; },
};
