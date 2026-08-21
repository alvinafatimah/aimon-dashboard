// ============================================
// AIMON - Main Application (v4)
// ============================================
(function () {
  'use strict';

  const ThemeManager = {
    init() { const s = localStorage.getItem('aimon-theme'); this.set(s || (window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light')); },
    set(t) { document.documentElement.setAttribute('data-theme', t); localStorage.setItem('aimon-theme', t); },
    toggle() { this.set(this.isDark() ? 'light' : 'dark'); this.updateIcon(); },
    isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; },
    updateIcon() { const b = document.getElementById('themeToggleBtn'); if (b) b.innerHTML = this.isDark() ? '☀️' : '🌙'; }
  };

  const Router = {
    routes: {}, register(h, fn) { this.routes[h] = fn; }, navigate(h) { window.location.hash = h; },
    init() { window.addEventListener('hashchange', () => this.resolve()); this.resolve(); },
    resolve() {
      const h = window.location.hash || '#/login', p = h.split('/');
      if (h !== '#/login' && h !== '#/register' && !AppStore.currentUser) { window.location.hash = '#/login'; return; }
      if (h === '#/login' || h === '#/register') this.routes['#/login']?.(h === '#/register');
      else if (h === '#/dashboard') this.routes['#/dashboard']?.();
      else if (h === '#/projects') this.routes['#/projects']?.();
      else if (p[1] === 'project' && p[2]) this.routes['#/project']?.(p[2]);
      else if (h === '#/approvals') this.routes['#/approvals']?.();
      else if (h === '#/reports') this.routes['#/reports']?.();
      else if (h === '#/admin') this.routes['#/admin']?.();
      else if (h === '#/account') this.routes['#/account']?.();
      else window.location.hash = AppStore.currentUser ? '#/dashboard' : '#/login';
    }
  };

  const Toast = { show(msg, type = 'info') {
    let c = document.getElementById('toastContainer');
    if (!c) { c = document.createElement('div'); c.id = 'toastContainer'; c.className = 'toast-container'; document.body.appendChild(c); }
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const t = document.createElement('div'); t.className = `toast ${type}`;
    t.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-message">${msg}</span><span class="toast-close" onclick="this.parentElement.remove()">✕</span>`;
    c.appendChild(t); setTimeout(() => { t.classList.add('toast-dismiss'); setTimeout(() => t.remove(), 300); }, 4000);
  }};
  window.Toast = Toast;

  // Helpers
  function statusBadge(s) { return `<span class="status-badge ${AppStore.getStatusClass(s)}"><span class="status-dot"></span>${AppStore.getStatusLabel(s)}</span>`; }
  function progressBar(p, sz = '') { const col = p >= 40 ? 'blue' : 'orange'; return `<div class="progress-bar-container ${sz}"><div class="progress-bar"><div class="progress-bar-fill ${col}" style="width:${p}%"></div></div><span class="progress-value font-mono ${col}">${p.toFixed(1)}%</span></div>`; }
  // === UI Helpers ===
  window._renderSkeleton = function() {
    return `<div class="skeleton-container animate-fade-in-up">
      <div class="skeleton" style="height:140px"></div>
      <div class="skeleton" style="height:220px"></div>
    </div>`;
  };

  window._renderEmptyState = function(icon, text, cta = '') {
    return `<div class="empty-state animate-fade-in-up" style="padding:var(--space-12) var(--space-6)">
      <div class="empty-state-icon" style="font-size:48px;margin-bottom:var(--space-4)">${icon}</div>
      <div class="empty-state-text" style="font-size:var(--fs-md);margin-bottom:var(--space-2);font-weight:600">${text}</div>
      ${cta ? `<div style="margin-top:var(--space-4)">${cta}</div>` : ''}
    </div>`;
  };

  function avatar(ini, sz = 32, photo = '') { return photo ? `<img src="${photo}" style="width:${sz}px;height:${sz}px;border-radius:50%;object-fit:cover" />` : `<div class="sidebar-user-avatar" style="width:${sz}px;height:${sz}px;font-size:${sz * 0.35}px">${ini}</div>`; }
  function closeModal() { document.getElementById('modalContainer')?.remove(); }

  // Logout confirmation dialog
  function showLogoutConfirm() {
    closeModal();
    const c = document.createElement('div'); c.id = 'modalContainer';
    c.innerHTML = `<div class="modal-overlay" onclick="if(event.target===this)document.getElementById('modalContainer')?.remove()">
      <div class="modal" style="max-width:420px;text-align:center">
        <div class="modal-body" style="padding:32px 24px">
          <div style="width:64px;height:64px;margin:0 auto 16px;background:var(--color-danger-bg);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px">🚪</div>
          <h3 style="margin-bottom:8px;font-size:var(--fs-lg)">Keluar dari AIMON?</h3>
          <p style="color:var(--color-text-secondary);font-size:var(--fs-sm);margin-bottom:20px">Apakah Anda yakin ingin keluar dari sistem AIMON? Anda perlu login kembali untuk mengakses dashboard.</p>
          <div style="display:flex;gap:12px;justify-content:center">
            <button class="btn btn-outline" onclick="document.getElementById('modalContainer')?.remove()">Batal</button>
            <button class="btn btn-danger" id="confirmLogoutBtn">Ya, Keluar</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.appendChild(c);
    document.getElementById('confirmLogoutBtn').addEventListener('click', () => { AppStore.currentUser = null; localStorage.removeItem('aimon-user'); localStorage.removeItem('aimon-token'); closeModal(); Router.navigate('#/login'); });
  }

  // ============================================
  // LOGIN
  // ============================================
  function renderLogin(isReg = false) {
    document.getElementById('app').innerHTML = `
      <div class="login-page"><div class="login-card animate-fade-in-up">
        <div class="login-logo"><div style="width:56px;height:56px;margin:0 auto;background:linear-gradient(135deg,#1B2559,#2D3A7C);border-radius:12px;display:flex;align-items:center;justify-content:center">
          <svg width="34" height="34" viewBox="0 0 40 40" fill="none"><path d="M8 28L14 12L20 22L26 8L32 20" stroke="#D946C7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="32" cy="20" r="3" fill="#D946C7"/></svg>
        </div></div>
        <h1 class="login-title">AIMON</h1>
        <p class="login-subtitle">Research Currency and Security Printing Department</p>
        ${isReg ? `
        <form class="login-form" id="regForm">
          <div class="login-field"><label>Nama Lengkap</label><input type="text" id="regName" placeholder="Nama lengkap" required /></div>
          <div class="login-field"><label>Username</label><input type="text" id="regUser" placeholder="Username" required /></div>
          <div class="login-field"><label>Password</label><input type="password" id="regPass" placeholder="Password" required /></div>
          <div class="login-field"><label>Role</label><select id="regRole" required><option value="">-- Pilih --</option><option value="Kepala Divisi">Kepala Divisi</option><option value="Kepala Departemen">Kepala Departemen</option><option value="Kepala Seksi">Kepala Seksi</option><option value="Kepala Unit">Kepala Unit</option><option value="Staff">Staff</option><option value="Researcher">Researcher</option><option value="Guest">Guest</option></select></div>
          <div class="login-field"><label>Seksi</label>
            <select id="regSeksi" onchange="if(this.value==='Lainnya') document.getElementById('regSeksiLainnya').style.display='block'; else document.getElementById('regSeksiLainnya').style.display='none';">
              <option value="">-- Pilih --</option>
              <option value="Security Printing">Security Printing</option>
              <option value="Material & Security Feature">Material & Security Feature</option>
              <option value="Lainnya">Lainnya (Ketik Manual)</option>
            </select>
            <input type="text" id="regSeksiLainnya" placeholder="Ketik nama seksi" style="display:none; margin-top: 8px; width:100%; padding: 8px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: var(--fs-sm); background:var(--color-bg-input); color:var(--color-text-primary);" />
          </div>
          <button type="submit" class="login-btn">📝 Daftar Akun</button>
          <p class="login-register-link">Sudah punya akun? <a id="goLogin">Masuk</a></p>
        </form>` : `
        <form class="login-form" id="loginForm">
          <div class="login-field"><label>Username</label><input type="text" id="loginUser" placeholder="Masukkan username" required /></div>
          <div class="login-field"><label>Password</label><input type="password" id="loginPass" placeholder="Masukkan password" required /></div>
          <button type="submit" class="login-btn">🔑 Masuk ke Dashboard</button>
          <p class="login-register-link">Belum punya akun? <a id="goReg">Daftar</a></p>
        </form>`}
        <p class="login-footer">© 2026 Perum Peruri · Dept. Research Currency & Security Printing</p>
      </div></div>`;
    if (isReg) {
      document.getElementById('regForm').onsubmit = e => { e.preventDefault(); const n = document.getElementById('regName').value.trim(), u = document.getElementById('regUser').value.trim(), r = document.getElementById('regRole').value; let s = document.getElementById('regSeksi').value; if(s === 'Lainnya') s = document.getElementById('regSeksiLainnya').value.trim(); if (!n || !u || !r) return; AppStore.pendingRegistrations.push({ id: 'r' + Date.now(), username: u, name: n, role: r, seksi: s, registeredAt: new Date().toISOString(), status: 'pending' }); Toast.show('Pendaftaran berhasil! Menunggu approval Admin.', 'success'); setTimeout(() => Router.navigate('#/login'), 1500); };
      document.getElementById('goLogin')?.addEventListener('click', () => Router.navigate('#/login'));
    } else {
      document.getElementById('loginForm').onsubmit = async e => {
        e.preventDefault();
        const u = document.getElementById('loginUser').value.trim();
        const p = document.getElementById('loginPass').value;
        const btn = document.querySelector('.login-btn');
        btn.innerHTML = 'Memproses...';
        btn.disabled = true;
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: u, password: p })
          });
          if (res.ok) {
            const data = await res.json();
            localStorage.setItem('aimon-token', data.token);
            localStorage.setItem('aimon-user', JSON.stringify(data.user));
            AppStore.currentUser = data.user;
            await AppStore.fetchInitialData(data.token);
            if (window.initSocket) window.initSocket();
            Toast.show(`Selamat datang, ${data.user.name}!`, 'success');
            Router.navigate('#/dashboard');
          } else {
            Toast.show('Username atau password salah!', 'error');
            btn.innerHTML = '🔑 Masuk ke Dashboard';
            btn.disabled = false;
          }
        } catch (error) {
          Toast.show('Gagal terhubung ke server', 'error');
          btn.innerHTML = '🔑 Masuk ke Dashboard';
          btn.disabled = false;
        }
      };
      document.getElementById('goReg')?.addEventListener('click', () => Router.navigate('#/register'));
    }
  }

  // ============================================
  // APP SHELL
  // ============================================
  function renderAppShell() {
    const u = AppStore.currentUser, isPIC = u.role === 'Kepala Unit', isAdmin = u.role === 'Admin';
    const pc = AppStore.getPendingCount();
    document.getElementById('app').innerHTML = `<div class="app-shell">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo"><div style="width:32px;height:32px;background:linear-gradient(135deg,#1B2559,#2D3A7C);border-radius:7px;display:flex;align-items:center;justify-content:center"><svg width="18" height="18" viewBox="0 0 40 40" fill="none"><path d="M8 28L14 12L20 22L26 8L32 20" stroke="#D946C7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="32" cy="20" r="3" fill="#D946C7"/></svg></div></div>
          <div class="sidebar-brand"><span class="sidebar-brand-name">AIMON</span><span class="sidebar-brand-sub">Research Currency & Security Printing</span></div>
        </div>
        <div class="sidebar-filter"><div class="sidebar-filter-label">Program</div>
          <div class="sidebar-filter-group" id="filterProgram">
            <span class="filter-chip active" data-filter="Semua">Semua</span>
            <span class="filter-chip" data-filter="OMTI">OMTI</span>
            <span class="filter-chip" data-filter="Non-OMTI">Non-OMTI</span>
          </div>
        </div>
        <nav class="sidebar-nav">
          <div class="nav-section-title">Area</div>
          <div class="nav-item nav-sub-item" data-seksi="Semua" id="navSemuaArea"><span class="nav-item-icon">🏢</span><span class="nav-item-text">Semua Area</span></div>
          <div class="nav-item nav-sub-item" data-seksi="Security Printing" id="navSP"><span class="nav-item-icon">🔐</span><span class="nav-item-text">Security Printing</span></div>
          <div class="nav-item nav-sub-item" data-seksi="Material & Security Feature" id="navMSF"><span class="nav-item-icon">🧪</span><span class="nav-item-text">Material & Security Feature</span></div>
          <div class="nav-section-title">Dashboard</div>
          <div class="nav-item active" data-page="dashboard" id="navDashboard"><span class="nav-item-icon">📊</span><span class="nav-item-text">Overview</span></div>
          <div class="nav-item" data-page="projects" id="navProjects"><span class="nav-item-icon">📁</span><span class="nav-item-text">Daftar Proyek</span></div>
          <div class="nav-item" data-page="document" id="navDocument"><span class="nav-item-icon">📄</span><span class="nav-item-text">Document</span></div>
          <div class="nav-section-title">Manajemen</div>
          ${(isPIC || isAdmin) ? `<div class="nav-item" data-page="approvals" id="navApprovals"><span class="nav-item-icon">📋</span><span class="nav-item-text">Approval Queue</span>${pc > 0 ? `<span class="nav-item-badge">${pc}</span>` : ''}</div>` : ''}
          <div class="nav-item" data-page="reports" id="navReports"><span class="nav-item-icon">📈</span><span class="nav-item-text">Reports & Export</span></div>
          ${isAdmin ? `<div class="nav-item" data-page="admin" id="navAdmin"><span class="nav-item-icon">🛡️</span><span class="nav-item-text">Admin Panel</span></div>` : ''}
          <div class="nav-section-title">Settings</div>
          <div class="nav-item" data-page="account" id="navAccount"><span class="nav-item-icon">⚙️</span><span class="nav-item-text">Account</span></div>
          <div class="nav-item nav-logout" id="navLogout"><span class="nav-item-icon">🚪</span><span class="nav-item-text">Logout</span></div>
        </nav>
        <div class="sidebar-footer"><div class="sidebar-user" id="sidebarUser">${avatar(u.initials, 32, u.photo)}<div class="sidebar-user-info"><div class="sidebar-user-name">${u.name}</div><div class="sidebar-user-role">${u.role}</div></div></div></div>
      </aside>
      <header class="header" id="header">
        <button class="header-action-btn" id="menuToggle" style="display:none">☰</button>
        <div class="header-breadcrumb" id="breadcrumb"><span class="breadcrumb-item current">Dashboard</span></div>
        <div class="header-search"><span class="header-search-icon">🔍</span><input type="text" placeholder="Cari proyek..." id="globalSearch" /></div>
        <div class="header-actions">
          <button class="header-action-btn" id="notifBtn" title="Notifications">🔔${pc > 0 ? '<span class="badge-dot"></span>' : ''}</button>
          <button class="theme-toggle" id="themeToggleBtn" title="Toggle Theme">${ThemeManager.isDark() ? '☀️' : '🌙'}</button>
          <div class="header-avatar" id="headerAvatar" title="${u.name}" style="cursor:pointer">${u.photo ? `<img src="${u.photo}" style="width:100%;height:100%;border-radius:50%;object-fit:cover"/>` : u.initials}</div>
        </div>
      </header>
      <div class="main-wrapper">
        <main class="main-content" id="mainContent"></main>
        <aside class="right-panel" id="rightPanel">
          <div class="right-panel-section"><div class="right-panel-title">Notifications</div>
            ${AppStore.notifications.map(n => `<div class="notification-item"><div class="notification-dot ${n.type}"></div><div class="notification-content"><div class="notification-text">${n.text}</div><div class="notification-time">${n.time}</div></div></div>`).join('')}
          </div>
          <div class="right-panel-section"><div class="right-panel-title">Activity Log</div>
            ${AppStore.activityLog.map(l => `<div class="activity-item"><div class="activity-avatar">${l.user}</div><div class="notification-content"><div class="activity-text"><strong>${l.name}</strong> ${l.action}</div><div class="activity-time">${l.time}</div></div></div>`).join('')}
          </div>
        </aside>
      </div>
    </div>
    <button class="chat-fab" id="chatFab" title="Chat">💬</button>
    <div class="chat-panel" id="chatPanel"></div>`;
    bindShellEvents();
  }

  function bindShellEvents() {
    document.getElementById('themeToggleBtn')?.addEventListener('click', () => ThemeManager.toggle());
    document.querySelectorAll('.nav-item[data-page]').forEach(i => i.addEventListener('click', () => { const p = i.dataset.page; if (p === 'dashboard') Router.navigate('#/dashboard'); else if (p === 'projects') Router.navigate('#/projects'); else if (p === 'document') Router.navigate('#/reports'); else Router.navigate('#/' + p); }));
    document.querySelectorAll('.nav-item[data-seksi]').forEach(i => i.addEventListener('click', () => { AppStore.filters.seksi = i.dataset.seksi; setActiveNav(i); if (window.location.hash === '#/projects') renderProjects(); else { Router.navigate('#/dashboard'); renderDashboard(); } }));
    document.getElementById('filterProgram')?.addEventListener('click', e => { const c = e.target.closest('.filter-chip'); if (!c) return; document.querySelectorAll('#filterProgram .filter-chip').forEach(x => x.classList.remove('active')); c.classList.add('active'); AppStore.filters.kategori = c.dataset.filter; const h = window.location.hash; if (h === '#/dashboard') renderDashboard(); else if (h === '#/projects') renderProjects(); });
    document.getElementById('headerAvatar')?.addEventListener('click', () => Router.navigate('#/account'));
    document.getElementById('sidebarUser')?.addEventListener('click', () => Router.navigate('#/account'));
    document.getElementById('navLogout')?.addEventListener('click', () => showLogoutConfirm());
    document.getElementById('globalSearch')?.addEventListener('input', e => { const h = window.location.hash; if (h === '#/dashboard') renderDashboard(); else if (h === '#/projects') renderProjects(); });
    const mt = document.getElementById('menuToggle'), sb = document.getElementById('sidebar');
    if (mt) { const mq = window.matchMedia('(max-width:1023px)'); if (mq.matches) mt.style.display = 'flex'; mq.addEventListener('change', e => { mt.style.display = e.matches ? 'flex' : 'none'; if (!e.matches) sb.classList.remove('mobile-open'); }); mt.addEventListener('click', () => sb.classList.toggle('mobile-open')); }
    document.getElementById('chatFab')?.addEventListener('click', () => { const p = document.getElementById('chatPanel'); p.classList.toggle('open'); if (p.classList.contains('open')) renderChatContacts(); });
    if (window.updateChatBadge) window.updateChatBadge();
  }

  function setActiveNav(item) { document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active')); item.classList.add('active'); }
  function updateBreadcrumb(items) { const bc = document.getElementById('breadcrumb'); if (!bc) return; bc.innerHTML = items.map((it, i) => { const last = i === items.length - 1; const sep = i < items.length - 1 ? '<span class="breadcrumb-separator">›</span>' : ''; return it.link ? `<span class="breadcrumb-item" onclick="window.location.hash='${it.link}'">${it.text}</span>${sep}` : `<span class="breadcrumb-item ${last ? 'current' : ''}">${it.text}</span>${sep}`; }).join(''); }

  // ============================================
  // DASHBOARD OVERVIEW
  // ============================================
  function renderDashboard() {
    if (!document.getElementById('mainContent')) renderAppShell();
    setActiveNav(document.getElementById('navDashboard'));
    updateBreadcrumb([{ text: 'Dashboard' }, { text: 'Overview' }]);
    const main = document.getElementById('mainContent');
    const omti = AppStore.getDashboardStats('OMTI'), nonOmti = AppStore.getDashboardStats('Non-OMTI'), all = AppStore.getDashboardStats();
    const canCreate = ['Researcher', 'Kepala Unit', 'Admin', 'Kepala Seksi'].includes(AppStore.currentUser.role);

    main.innerHTML = `<div class="page animate-fade-in-up">
      <div class="action-bar">
        <div><h1 class="page-title" style="font-size:var(--fs-lg);margin-bottom:2px">Dashboard Overview</h1><p class="page-subtitle" style="font-size:var(--fs-xs);margin-bottom:2px">Departemen Research Currency and Security Printing</p><div style="font-size:10px;color:var(--color-text-tertiary)">Update terakhir: ${new Date().toLocaleString('id-ID', {day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})} WIB</div></div>
        ${canCreate ? `<button class="btn btn-accent btn-sm" id="btnCreateProject">✚ Buat Proyek Baru</button>` : ''}
      </div>

      <div class="program-cards-row">
        <div class="program-card clickable" id="cardOMTI">
          <div class="program-card-badge"><span class="badge-dot"></span> OMTI <span>PROGRAM KERJA</span></div>
          <div class="program-card-body"><div><div class="program-card-value">${omti.totalProjects}</div><div class="program-card-sub">proyek OMTI</div></div><div class="program-card-progress"><div class="program-card-pct">${omti.avgProgress}%</div><div class="program-card-pct-label">rata-rata progress</div></div></div>
        </div>
        <div class="program-card non-omti clickable" id="cardNonOMTI">
          <div class="program-card-badge"><span class="badge-dot"></span> Non-OMTI <span>PROGRAM KERJA</span></div>
          <div class="program-card-body"><div><div class="program-card-value">${nonOmti.totalProjects}</div><div class="program-card-sub">proyek Non-OMTI</div></div><div class="program-card-progress"><div class="program-card-pct">${nonOmti.avgProgress}%</div><div class="program-card-pct-label">rata-rata progress</div></div></div>
        </div>
      </div>

      <div class="stat-cards-row">
        <div class="stat-card total clickable" data-stat="total"><div class="stat-card-label">Total Progress</div><div class="stat-card-value">${all.totalProjects > 0 ? (all.totalRealization / all.totalProjects).toFixed(1) : 0}%</div><div class="stat-card-desc">${all.totalProjects} proyek aktif</div><div class="stat-card-bar"><div class="stat-card-bar-fill" style="width:${all.totalProjects > 0 ? all.totalRealization / all.totalProjects : 0}%"></div></div><div style="font-size:10px;margin-top:4px;color:var(--color-success)">▲ +2.1% dari minggu lalu</div></div>
        <div class="stat-card selesai clickable" data-stat="done"><div class="stat-card-label">Selesai</div><div class="stat-card-value">${all.doneActivities}</div><div class="stat-card-desc">dari ${all.totalActivities} total aktivitas</div><div class="stat-card-bar"><div class="stat-card-bar-fill" style="width:${all.totalActivities > 0 ? (all.doneActivities / all.totalActivities) * 100 : 0}%"></div></div><div style="font-size:10px;margin-top:4px;color:var(--color-success)">▲ +2 dari minggu lalu</div></div>
        <div class="stat-card on-progress clickable" data-stat="progress"><div class="stat-card-label">On Progress</div><div class="stat-card-value">${all.progressActivities}</div><div class="stat-card-desc">${all.openActivities} aktivitas belum mulai</div><div class="stat-card-bar"><div class="stat-card-bar-fill" style="width:${all.totalActivities > 0 ? (all.progressActivities / all.totalActivities) * 100 : 0}%"></div></div><div style="font-size:10px;margin-top:4px;color:var(--color-text-secondary)">▶ Stabil dari minggu lalu</div></div>
        <div class="stat-card terlambat clickable" data-stat="delayed"><div class="stat-card-label">Terlambat</div><div class="stat-card-value">${all.delayedActivities}</div><div class="stat-card-desc">melewati target deadline</div><div class="stat-card-bar"><div class="stat-card-bar-fill" style="width:${all.totalActivities > 0 ? (all.delayedActivities / all.totalActivities) * 100 : 0}%"></div></div><div style="font-size:10px;margin-top:4px;color:var(--color-danger)">▲ +1 dari minggu lalu</div></div>
        <div class="stat-card pending clickable" data-stat="pending"><div class="stat-card-label">Menunggu Approval</div><div class="stat-card-value">${all.pendingApprovals}</div><div class="stat-card-desc">${all.pendingApprovals} planning pending</div><div class="stat-card-bar"><div class="stat-card-bar-fill" style="width:${all.pendingApprovals > 0 ? 50 : 0}%"></div></div><div style="font-size:10px;margin-top:4px;color:var(--color-warning)">▼ -2 dari minggu lalu</div></div>
      </div>

      <div id="drilldownContainer"></div>

      <div class="chart-container" style="margin-bottom:var(--space-4)">
        <div class="chart-header">
          <span class="chart-title">Kurva S — Overview Departemen</span>
          <div style="display:flex;align-items:center;gap:16px">
            <div class="chart-legend"><span class="chart-legend-item"><span class="chart-legend-dot plan" style="background:var(--chart-plan)"></span> Plan</span><span class="chart-legend-item"><span class="chart-legend-dot actual" style="background:var(--chart-actual)"></span> Actual</span></div>
            <div class="radio-group" style="margin:0;padding:2px"><label class="radio-option"><input type="radio" name="ovMode" value="monthly" checked onchange="window._renderOverviewSCurve('monthly')" /> Bulanan</label><label class="radio-option"><input type="radio" name="ovMode" value="weekly" onchange="window._renderOverviewSCurve('weekly')" /> Mingguan</label></div>
          </div>
        </div>
        <div class="chart-canvas-wrapper"><canvas id="overviewSCurve"></canvas></div>
      </div>
      <div id="stageBreakdownWrapper"></div>
    </div>`;

    // Clickable program cards
    document.getElementById('cardOMTI')?.addEventListener('click', () => showDrilldown('OMTI'));
    document.getElementById('cardNonOMTI')?.addEventListener('click', () => showDrilldown('Non-OMTI'));
    // Clickable stat cards
    document.querySelectorAll('.stat-card[data-stat]').forEach(c => c.addEventListener('click', () => {
      document.querySelectorAll('.stat-card').forEach(n => n.classList.remove('active'));
      c.classList.add('active');
      window._renderStageBreakdown(c.dataset.stat);
      document.getElementById('stageBreakdownWrapper').scrollIntoView({ behavior: 'smooth' });
    }));
    document.getElementById('btnCreateProject')?.addEventListener('click', () => showCreateProjectModal());
    window._renderOverviewSCurve('monthly');
    window._renderStageBreakdown();
  }

  function showDrilldown(kat) {
    const c = document.getElementById('drilldownContainer'); if (!c) return;
    const pjs = AppStore.getFilteredProjects().filter(p => p.kategori === kat);
    c.innerHTML = `<div class="card animate-fade-in-up" style="margin-bottom:var(--space-4)"><div class="card-header"><span class="card-title">Proyek ${kat}</span><button class="btn btn-outline btn-sm" onclick="document.getElementById('drilldownContainer').innerHTML=''">✕ Tutup</button></div>
      <div class="data-table-wrapper"><table class="data-table compact"><thead><tr><th>Kode</th><th>Nama Proyek</th><th>PIC</th><th>Progress</th><th>Status</th></tr></thead><tbody>
      ${pjs.map(p => { const r = AppStore.calculateRealization(p); return `<tr class="clickable" onclick="window.location.hash='#/project/${p.id}'"><td class="col-code"><strong>${p.code}</strong></td><td>${p.name}</td><td>${p.picName}</td><td style="min-width:120px">${progressBar(r)}</td><td>${statusBadge(p.status)}</td></tr>`; }).join('')}
      ${pjs.length === 0 ? '<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--color-text-tertiary)">Tidak ada proyek</td></tr>' : ''}
      </tbody></table></div></div>`;
  }

  window._renderStageBreakdown = function(filterStat = null) {
    const w = document.getElementById('stageBreakdownWrapper'); if (!w) return;
    const projects = AppStore.getFilteredProjects();
    const rows = [];
    const today = new Date().toISOString().split('T')[0];
    
    projects.forEach(p => {
      p.phases.forEach((ph, i) => {
        const c = AppStore.getPhaseActivityCounts(ph);
        let shouldShow = true;
        
        if (filterStat === 'done' && c.done === 0) shouldShow = false;
        if (filterStat === 'progress' && c.progress === 0) shouldShow = false;
        if (filterStat === 'delayed' && !ph.activities.some(a => a.status !== 'done' && a.endDate && a.endDate < today)) shouldShow = false;
        if (filterStat === 'pending' && !AppStore.approvals.some(a => a.projectId === p.id && a.status === 'pending')) shouldShow = false;
        if (filterStat === 'total' || !filterStat) shouldShow = true;

        if (shouldShow) {
           const barHtml = `<div style="display:flex;height:12px;width:100%;background:var(--color-bg-input);border-radius:6px;overflow:hidden;margin-top:4px">
               ${c.done > 0 ? `<div style="width:${(c.done/c.total)*100}%;background:var(--color-status-done)" title="Done: ${c.done}"></div>` : ''}
               ${c.progress > 0 ? `<div style="width:${(c.progress/c.total)*100}%;background:var(--color-status-progress)" title="On Progress: ${c.progress}"></div>` : ''}
               ${c.open > 0 ? `<div style="width:${(c.open/c.total)*100}%;background:var(--color-border)" title="Open: ${c.open}"></div>` : ''}
            </div>`;
           rows.push(`<tr><td class="col-code">${p.code}</td><td><strong>${ph.name}</strong></td><td class="col-number font-mono">${ph.bobot}%</td><td style="min-width:180px"><div style="font-size:10px;display:flex;justify-content:space-between"><span>Open: ${c.open}</span><span>Prog: ${c.progress}</span><span>Done: ${c.done}</span></div>${barHtml}</td><td class="col-number font-mono">${AppStore.calculatePhaseProgress(ph)}%</td></tr>`);
        }
      });
    });

    const filterLabel = filterStat && filterStat !== 'total' ? ` <span style="font-size:var(--fs-xs);font-weight:400;color:var(--color-text-secondary);background:var(--color-bg-filter-bar);padding:2px 8px;border-radius:12px;margin-left:8px">Filter: ${filterStat.toUpperCase()}</span> <button class="btn btn-outline btn-xs" style="margin-left:8px" onclick="window._renderStageBreakdown()">✕ Clear</button>` : '';

    w.innerHTML = `<div class="card animate-fade-in-up" id="stageBreakdownCard" style="margin-bottom:var(--space-4)">
      <div class="card-header"><span class="card-title">Progress per Tahapan ${filterLabel}</span></div>
      <div class="data-table-wrapper"><table class="data-table compact"><thead><tr><th>Proyek</th><th>Tahapan</th><th>Bobot</th><th>Aktivitas</th><th>Progress (%)</th></tr></thead><tbody>
      ${rows.length > 0 ? rows.join('') : '<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--color-text-tertiary)">Tidak ada data tahapan sesuai filter</td></tr>'}
      </tbody></table></div>
    </div>`;
  };



  const todayLinePlugin = {
    id: 'todayLine',
    afterDraw: (chart) => {
      if (!chart.options.plugins.todayLine?.display) return;
      const ctx = chart.ctx;
      const x = chart.scales.x;
      const y = chart.scales.y;
      
      const todayIndex = chart.options.plugins.todayLine.index;
      if (todayIndex < 0 || todayIndex >= x.ticks.length) return;
      
      const xPos = x.getPixelForValue(todayIndex);
      
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.moveTo(xPos, y.top);
      ctx.lineTo(xPos, y.bottom);
      ctx.lineWidth = 1;
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-text-tertiary') || '#9CA3AF';
      ctx.stroke();
      
      ctx.fillStyle = ctx.strokeStyle;
      ctx.textAlign = 'center';
      ctx.font = '10px Inter';
      ctx.fillText('Hari ini', xPos, y.top - 5);
      ctx.restore();
    }
  };

  window._renderOverviewSCurve = function(mode = 'monthly') {
    const canvas = document.getElementById('overviewSCurve'); if (!canvas) return;
    const projects = AppStore.getFilteredProjects(), count = projects.length || 1;
    const len = mode === 'monthly' ? 12 : 40;
    const planAvg = new Array(len).fill(0), actualAvg = new Array(len).fill(null);
    projects.forEach(p => { 
      if (p.planCurve && p.planCurve[mode]) p.planCurve[mode].forEach((v, i) => planAvg[i] += (v || 0)); 
      if (p.actualCurve && p.actualCurve[mode]) p.actualCurve[mode].forEach((v, i) => { if (v !== null) { if (actualAvg[i] === null) actualAvg[i] = 0; actualAvg[i] += v; } }); 
    });
    planAvg.forEach((v, i) => planAvg[i] = Math.round(v / count * 10) / 10);
    actualAvg.forEach((v, i) => { if (v !== null) actualAvg[i] = Math.round(v / count * 10) / 10; });
    const s = getComputedStyle(document.documentElement);
    if (window._ovChart) window._ovChart.destroy();
    
    // Simulate 'today' index depending on mode
    const todayIndex = mode === 'monthly' ? new Date().getMonth() : 18; 
    
    window._ovChart = new Chart(canvas.getContext('2d'), { 
      type: 'line', 
      data: { labels: mode === 'monthly' ? AppStore.months : AppStore.weeks, datasets: [
        { label: 'Plan', data: planAvg, borderColor: s.getPropertyValue('--chart-plan').trim() || '#1B2559', backgroundColor: s.getPropertyValue('--chart-plan-fill').trim(), borderWidth: 2, tension: 0.3, fill: true, pointRadius: mode === 'monthly' ? 3 : 1 },
        { label: 'Actual', data: actualAvg, borderColor: s.getPropertyValue('--chart-actual').trim() || '#D946C7', backgroundColor: s.getPropertyValue('--chart-actual-fill').trim(), borderWidth: 2, tension: 0.3, fill: true, pointRadius: mode === 'monthly' ? 3 : 1, spanGaps: false }
      ]}, 
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, todayLine: { display: true, index: todayIndex } }, scales: { x: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } }, y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } } } },
      plugins: [todayLinePlugin]
    });
  };

  // ============================================
  // DAFTAR PROYEK (Project List Page)
  // ============================================
  function renderProjects() {
    if (!document.getElementById('mainContent')) renderAppShell();
    setActiveNav(document.getElementById('navProjects'));
    updateBreadcrumb([{ text: 'Dashboard', link: '#/dashboard' }, { text: 'Daftar Proyek' }]);
    const main = document.getElementById('mainContent');
    const canCreate = ['Researcher', 'Kepala Unit', 'Admin', 'Kepala Seksi'].includes(AppStore.currentUser.role);
    const canEdit = ['Researcher', 'Kepala Unit', 'Admin', 'Kepala Seksi'].includes(AppStore.currentUser.role);
    let pjs = AppStore.getFilteredProjects();
    const q = document.getElementById('globalSearch')?.value?.toLowerCase() || '';
    if (q) pjs = pjs.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));

    main.innerHTML = `<div class="page animate-fade-in-up">
      <div class="action-bar"><div><h1 class="page-title" style="font-size:var(--fs-lg);margin-bottom:2px">Daftar Proyek</h1><p class="page-subtitle" style="font-size:var(--fs-xs)">Semua proyek R&D dalam sistem</p></div>
        ${canCreate ? `<button class="btn btn-accent btn-sm" id="btnCreateProject2">✚ Buat Proyek Baru</button>` : ''}
      </div>
      <div class="card"><div class="data-table-wrapper"><table class="data-table compact"><thead><tr><th>Kode</th><th>Nama Proyek</th><th>Program</th><th>Area</th><th>PIC</th><th>Periode</th><th>Progress</th><th>Status</th></tr></thead><tbody>
      ${pjs.map(p => { 
        const r = AppStore.calculateRealization(p); 
        const rag = AppStore.calculateRAG(p);
        const ragColor = rag === 'green' ? 'var(--color-status-done)' : (rag === 'yellow' ? 'var(--color-status-progress)' : 'var(--color-status-late)');
        return `<tr><td class="col-code"><strong>${p.code}</strong></td><td><div style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background-color:${ragColor}"></span><a class="link-project" data-pid="${p.id}" style="cursor:pointer;color:var(--color-text-link);font-weight:500">${p.name}</a></div></td><td><span class="badge-pill ${p.kategori === 'OMTI' ? 'purple' : 'blue'}">${p.kategori}</span></td><td style="font-size:var(--fs-xs)">${p.seksi}</td><td style="font-size:var(--fs-xs)">${p.picName}</td><td style="font-size:var(--fs-xs);white-space:nowrap">${AppStore.formatDate(p.startDate)} – ${AppStore.formatDate(p.endDate)}</td><td style="min-width:110px">${progressBar(r)}</td><td><div style="display:flex;gap:8px;align-items:center">${statusBadge(p.status)}${canEdit ? `<button class="btn btn-outline btn-xs edit-project-btn" data-pid="${p.id}">✏️ Edit</button>` : ''}</div></td></tr>`; 
      }).join('')}
      ${pjs.length === 0 ? '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--color-text-tertiary)">Tidak ada proyek ditemukan</td></tr>' : ''}
      </tbody></table></div></div>
    </div>`;
    document.querySelectorAll('.link-project').forEach(l => l.addEventListener('click', () => showProjectDetailModal(l.dataset.pid)));
    document.getElementById('btnCreateProject2')?.addEventListener('click', () => showCreateProjectModal());
    document.querySelectorAll('.edit-project-btn').forEach(btn => btn.addEventListener('click', () => {
      const p = AppStore.projects.find(x => x.id === btn.dataset.pid);
      if (p) showCreateProjectModal(p);
    }));
  }

  // ============================================
  // PROJECT DETAIL MODAL
  // ============================================
  function showProjectDetailModal(projectId) {
    const project = AppStore.projects.find(p => p.id === projectId); if (!project) return;
    const realization = AppStore.calculateRealization(project);
    const user = AppStore.currentUser;
    const canEdit = ['Researcher', 'Kepala Unit', 'Admin'].includes(user.role);
    const canEditDelete = ['Kepala Seksi', 'Admin'].includes(user.role);
    const isLeader = ['Kepala Departemen', 'Kepala Seksi', 'Admin'].includes(user.role);

    closeModal();
    const c = document.createElement('div'); c.id = 'modalContainer';
    c.innerHTML = `<div class="modal-overlay" onclick="if(event.target===this)document.getElementById('modalContainer')?.remove()">
      <div class="modal modal-lg" style="max-height:90vh">
        <div class="modal-header" style="flex-direction:column;align-items:flex-start;gap:8px;padding:16px 20px">
          <div style="display:flex;justify-content:space-between;width:100%;align-items:flex-start">
            <div>
              <div style="font-size:var(--fs-xs);color:var(--color-info);font-weight:600;text-transform:uppercase;margin-bottom:4px">${project.code}</div>
              <div class="modal-title" style="font-size:var(--fs-md)">${project.name}</div>
            </div>
            <button class="modal-close" onclick="document.getElementById('modalContainer')?.remove()">✕</button>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <span class="badge-pill ${project.kategori === 'OMTI' ? 'purple' : 'blue'}">${project.kategori}</span>
            ${statusBadge(project.status)}
          </div>
          <div style="font-size:var(--fs-xs);color:var(--color-text-secondary)">PIC: ${project.picName} · ${project.seksi} · ${AppStore.formatDate(project.startDate)} – ${AppStore.formatDate(project.endDate)}</div>
          <div style="display:flex;align-items:center;gap:8px;width:100%;margin-top:4px">
            ${statusBadge(project.status)}
            <div style="flex:1">${progressBar(realization)}</div>
          </div>
        </div>
        <div class="modal-body" style="padding:16px 20px">
          ${project.phases.map((ph, pi) => {
            const phReal = AppStore.calculatePhaseRealization(ph);
            const phProg = AppStore.calculatePhaseProgress(ph);
            return `<div class="phase-group-card">
              <div class="phase-group-header">
                <div style="display:flex;align-items:center;gap:8px"><span class="phase-badge">${ph.code}</span><span style="font-weight:600;font-size:var(--fs-sm)">${ph.name}</span></div>
                <div style="display:flex;gap:12px;font-size:var(--fs-xs);font-family:var(--font-mono)"><span style="color:var(--color-text-secondary)">${ph.bobot}%</span><span style="color:${phProg >= 100 ? 'var(--color-success)' : 'var(--color-warning)'};font-weight:700">${phProg}%</span></div>
              </div>
              <table class="data-table compact inner-table"><thead><tr><th>Aktivitas</th><th>Target Selesai</th><th>Progress</th><th>Status</th><th>Dokumen</th>${canEdit || canEditDelete ? '<th>Aksi</th>' : ''}</tr></thead><tbody>
              ${ph.activities.map(a => `<tr><td style="font-size:var(--fs-xs)">${a.name}</td><td class="col-code" style="font-size:var(--fs-xs)">${AppStore.formatDate(a.endDate)}</td><td style="min-width:90px">${progressBar(a.nilai)}</td><td>${statusBadge(a.status)}</td><td class="col-code">${a.docs?.length ? `<span class="badge-pill blue" style="cursor:pointer" onclick="window._viewDocs('${project.id}', '${a.id}')" title="Lihat/Unduh Dokumen">📎 ${a.docs.length}</span>` : '—'}</td>${canEdit || canEditDelete ? `<td><button class="btn btn-primary btn-xs update-act-btn" data-pid="${project.id}" data-aid="${a.id}" data-pname="${ph.name}">Update</button></td>` : ''}</tr>`).join('')}
              </tbody></table>
            </div>`;
          }).join('')}
        </div>
        <div class="modal-footer" style="padding:12px 20px;justify-content:space-between">
          <div style="display:flex;gap:8px">
            <button class="btn btn-outline btn-sm">📎 Dokumen Proyek</button>
            ${project.status === 'draft' ? `<button class="btn btn-primary btn-sm" id="btnLanjutkanDraftModal" data-pid="${project.id}">✍️ Lanjutkan Draft</button>` : ''}
            ${canEdit && project.status !== 'draft' ? `<button class="btn btn-outline btn-sm" style="border-color:var(--color-success);color:var(--color-success)">✎ Revisi Planning</button>` : ''}
            ${['Admin', 'Kepala Seksi', 'Kepala Departemen'].includes(user.role) ? `<button class="btn btn-danger btn-sm" id="btnDeleteProjectModal" data-pid="${project.id}">🗑️ Hapus Proyek</button>` : ''}
          </div>
          <button class="btn btn-primary btn-sm" onclick="document.getElementById('modalContainer')?.remove()">Tutup</button>
        </div>
      </div>
    </div>`;
    document.body.appendChild(c);
    c.querySelectorAll('.update-act-btn').forEach(btn => btn.addEventListener('click', () => {
      closeModal();
      const proj = AppStore.projects.find(p => p.id === btn.dataset.pid);
      if (proj) showUpdateActivityModal(proj, btn.dataset.aid);
    }));

    document.getElementById('btnLanjutkanDraftModal')?.addEventListener('click', (e) => {
      const proj = AppStore.projects.find(p => p.id === e.target.dataset.pid);
      if (proj) {
        closeModal();
        showCreateProjectModal(proj);
      }
    });

    document.getElementById('btnDeleteProjectModal')?.addEventListener('click', async (e) => {
      if (confirm('Apakah Anda yakin ingin menghapus proyek ini? Seluruh data proyek akan terhapus permanen.')) {
        const btn = e.target;
        const pid = btn.dataset.pid;
        btn.innerHTML = 'Menghapus...'; btn.disabled = true;
        try {
          const res = await fetch(`/api/projects/${pid}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('aimon-token')}` }
          });
          if (res.ok) {
            Toast.show('Proyek berhasil dihapus!', 'success');
            await AppStore.fetchInitialData(localStorage.getItem('aimon-token'));
            closeModal();
            if (window.location.hash === '#/projects') renderProjects();
            else Router.navigate('#/projects');
          } else {
            Toast.show('Gagal menghapus proyek', 'error');
            btn.innerHTML = '🗑️ Hapus Proyek'; btn.disabled = false;
          }
        } catch (err) {
          Toast.show('Terjadi kesalahan jaringan', 'error');
          btn.innerHTML = '🗑️ Hapus Proyek'; btn.disabled = false;
        }
      }
    });
  }

  // ============================================
  // PROJECT DETAIL PAGE (direct route)
  // ============================================
  function renderProjectDetail(projectId) {
    if (!document.getElementById('mainContent')) renderAppShell();
    const project = AppStore.projects.find(p => p.id === projectId);
    if (!project) { document.getElementById('mainContent').innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">Proyek tidak ditemukan</div></div>'; return; }
    const realization = AppStore.calculateRealization(project);
    const user = AppStore.currentUser, isPIC = user.role === 'Kepala Unit', isResearcher = user.role === 'Researcher';
    updateBreadcrumb([{ text: 'Dashboard', link: '#/dashboard' }, { text: project.code }]);
    const main = document.getElementById('mainContent');

    let totalRealisasi = 0;
    const phaseRows = project.phases.map((ph, i) => { const c = AppStore.getPhaseActivityCounts(ph); const r = AppStore.calculatePhaseRealization(ph); const p = AppStore.calculatePhaseProgress(ph); totalRealisasi += r; return `<tr><td class="col-code">${i + 1}</td><td><strong>${ph.name}</strong></td><td class="col-number font-mono">${ph.bobot}%</td><td class="col-number">${c.total}</td><td class="col-number font-mono">${r.toFixed(1)}%</td><td class="col-number font-mono">${p}%</td><td class="col-number">${c.open}</td><td class="col-number">${c.progress}</td><td class="col-number">${c.done}</td></tr>`; }).join('');

    main.innerHTML = `<div class="page animate-fade-in-up">
      <div class="back-link" onclick="window.location.hash='#/dashboard'">← Kembali</div>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--space-4)">
        <div><h2 style="font-size:var(--fs-lg);margin-bottom:4px">${project.name}</h2><div style="display:flex;gap:8px;flex-wrap:wrap;font-size:var(--fs-xs);color:var(--color-text-secondary)"><span>🏢 ${project.seksi}</span><span>📋 ${project.kategori}</span><span>👤 ${project.picName}</span><span>📅 ${project.startDate} — ${project.endDate}</span></div></div>
        <div>${statusBadge(project.status)} ${project.status === 'draft' ? `<button class="btn btn-primary btn-sm" id="btnLanjutkanDraft" style="margin-left:8px">✍️ Lanjutkan Draft</button>` : `<button class="btn btn-primary btn-sm" id="btnEditProject" style="margin-left:8px">✏️ Edit Proyek</button>`} ${['Admin', 'Kepala Seksi', 'Kepala Departemen'].includes(user.role) ? `<button class="btn btn-danger btn-sm" id="btnDeleteProject" style="margin-left: 8px;">🗑️ Hapus Proyek</button>` : ''}</div>
      </div>
      <div style="margin-bottom:var(--space-4)">${progressBar(realization, 'progress-bar-lg')}</div>

      <div style="display:flex;gap:8px;border-bottom:1px solid var(--color-border);margin-bottom:var(--space-4)">
        <button class="btn btn-outline" style="border:none;border-bottom:2px solid var(--color-primary);border-radius:0;background:none" id="tabRingkasan" onclick="window._switchPjTab('ringkasan')">Ringkasan & Aktivitas</button>
        <button class="btn btn-outline" style="border:none;border-bottom:2px solid transparent;border-radius:0;background:none" id="tabTimeline" onclick="window._switchPjTab('timeline')">Timeline Mingguan</button>
      </div>

      <div id="pjTabRingkasan">
        <div class="chart-container" style="margin-bottom:var(--space-4)">
          <div class="chart-header">
            <span class="chart-title" style="font-size:var(--fs-sm)">Kurva S</span>
            <div class="radio-group" style="margin:0;padding:2px"><label class="radio-option"><input type="radio" name="pjScurveMode" value="monthly" checked onchange="window._renderProjectSCurve('${project.id}', 'monthly')" /> Bulanan</label><label class="radio-option"><input type="radio" name="pjScurveMode" value="weekly" onchange="window._renderProjectSCurve('${project.id}', 'weekly')" /> Mingguan</label></div>
          </div>
          <div class="chart-canvas-wrapper"><canvas id="projectSCurve"></canvas></div>
        </div>

        <div class="card" style="margin-bottom:var(--space-4)"><div class="card-header"><span class="card-title" style="font-size:var(--fs-sm)">Ringkasan Tahapan</span></div>
          <div class="data-table-wrapper"><table class="data-table compact"><thead><tr><th>No</th><th>Tahapan</th><th>Bobot</th><th>Jml</th><th>Realisasi</th><th>Progress</th><th>Open</th><th>Prog</th><th>Done</th></tr></thead><tbody>${phaseRows}</tbody>
          <tfoot><tr style="font-weight:700;background:var(--color-bg-filter-bar)"><td colspan="4" style="text-align:right">Total:</td><td class="col-number font-mono">${totalRealisasi.toFixed(1)}%</td><td colspan="4"></td></tr></tfoot></table></div>
        </div>

        ${(isResearcher || isPIC || user.role === 'Admin') ? `<div style="text-align:right;margin-bottom:var(--space-4)"><button class="btn btn-accent btn-sm" id="btnUpdateAct">✏️ Update Aktivitas</button></div>` : ''}
      </div>

      <div id="pjTabTimeline" style="display:none">
        <div class="card">
          <div class="card-header"><span class="card-title">Gantt Chart (Mingguan)</span></div>
          <div class="gantt-wrapper" style="overflow-x:auto">
            <table class="data-table compact" style="table-layout:fixed;width:max-content;border-collapse:collapse">
              <thead>
                <tr>
                  <th style="position:sticky;left:0;background:var(--color-bg-panel);z-index:2;width:250px;box-shadow:2px 0 5px rgba(0,0,0,0.05)">Aktivitas</th>
                  ${AppStore.weeks.map(w => `<th style="width:30px;min-width:30px;text-align:center;font-size:9px;padding:4px">${w.replace('W','')}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${project.phases.flatMap(ph => ph.activities.map(a => {
                  const s = new Date(a.startDate), e = new Date(a.endDate);
                  // Approximate weekly conversion for visualization (assuming W1 = Jan week 1)
                  const startW = Math.max(1, Math.floor((s - new Date(s.getFullYear(), 0, 1))/(24*60*60*1000)/7) + 1);
                  const endW = Math.max(1, Math.floor((e - new Date(e.getFullYear(), 0, 1))/(24*60*60*1000)/7) + 1);
                  
                  return `<tr>
                    <td style="position:sticky;left:0;background:var(--color-bg-panel);z-index:2;font-size:var(--fs-xs);white-space:normal;box-shadow:2px 0 5px rgba(0,0,0,0.05)" title="${a.name}">${a.name.substring(0, 35)}${a.name.length > 35 ? '...' : ''}</td>
                    ${AppStore.weeks.map((w, wi) => {
                       const currW = wi + 5; // W5 is index 0
                       let isActive = currW >= startW && currW <= endW;
                       let color = 'transparent';
                       if (isActive) {
                         if (a.status === 'done') color = 'var(--color-status-done)';
                         else if (a.status === 'on-progress') color = 'var(--color-status-progress)';
                         else color = 'var(--color-status-late)'; // or open (gray)
                         if (a.status === 'open') color = 'var(--color-border)';
                       }
                       return `<td style="width:30px;min-width:30px;padding:1px"><div style="height:12px;background:${color};border-radius:2px;width:100%"></div></td>`;
                    }).join('')}
                  </tr>`;
                })).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>`;

    window._switchPjTab = function(tabId) {
      document.getElementById('pjTabRingkasan').style.display = tabId === 'ringkasan' ? 'block' : 'none';
      document.getElementById('pjTabTimeline').style.display = tabId === 'timeline' ? 'block' : 'none';
      document.getElementById('tabRingkasan').style.borderBottomColor = tabId === 'ringkasan' ? 'var(--color-primary)' : 'transparent';
      document.getElementById('tabTimeline').style.borderBottomColor = tabId === 'timeline' ? 'var(--color-primary)' : 'transparent';
    };

    window._renderProjectSCurve(project.id, 'monthly');
    document.getElementById('btnUpdateAct')?.addEventListener('click', () => showUpdateActivityModal(project));
    document.getElementById('btnLanjutkanDraft')?.addEventListener('click', () => {
      showCreateProjectModal(project);
    });
    document.getElementById('btnEditProject')?.addEventListener('click', () => {
      showCreateProjectModal(project);
    });

    document.getElementById('btnDeleteProject')?.addEventListener('click', async () => {
      if (confirm('Apakah Anda yakin ingin menghapus proyek ini? Seluruh data proyek akan terhapus permanen.')) {
        const btn = document.getElementById('btnDeleteProject');
        btn.innerHTML = 'Menghapus...'; btn.disabled = true;
        try {
          const res = await fetch(`/api/projects/${project.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('aimon-token')}` }
          });
          if (res.ok) {
            Toast.show('Proyek berhasil dihapus!', 'success');
            await AppStore.fetchInitialData(localStorage.getItem('aimon-token'));
            Router.navigate('#/projects');
          } else {
            Toast.show('Gagal menghapus proyek', 'error');
            btn.innerHTML = '🗑️ Hapus Proyek'; btn.disabled = false;
          }
        } catch (e) {
          Toast.show('Terjadi kesalahan jaringan', 'error');
          btn.innerHTML = '🗑️ Hapus Proyek'; btn.disabled = false;
        }
      }
    });
  }

  window._renderProjectSCurve = function(projectId, mode = 'monthly') {
    const project = AppStore.projects.find(p => p.id === projectId);
    const canvas = document.getElementById('projectSCurve'); if (!canvas || !project || !project.planCurve) return;
    const s = getComputedStyle(document.documentElement);
    if (window._pjChart) window._pjChart.destroy();
    
    // Simulate 'today' index depending on mode
    const todayIndex = mode === 'monthly' ? new Date().getMonth() : 18;
    
    window._pjChart = new Chart(canvas.getContext('2d'), { 
      type: 'line', 
      data: { labels: mode === 'monthly' ? AppStore.months : AppStore.weeks, datasets: [
        { label: 'Plan', data: project.planCurve[mode] || [], borderColor: s.getPropertyValue('--chart-plan').trim() || '#1B2559', backgroundColor: s.getPropertyValue('--chart-plan-fill').trim(), borderWidth: 2, tension: 0.3, fill: true, pointRadius: mode === 'monthly' ? 3 : 1 },
        { label: 'Actual', data: project.actualCurve[mode] || [], borderColor: s.getPropertyValue('--chart-actual').trim() || '#D946C7', backgroundColor: s.getPropertyValue('--chart-actual-fill').trim(), borderWidth: 2, tension: 0.3, fill: true, pointRadius: mode === 'monthly' ? 3 : 1, spanGaps: false }
      ]}, 
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, todayLine: { display: true, index: todayIndex } }, scales: { x: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } }, y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } } } },
      plugins: [todayLinePlugin]
    });
  };

  // ============================================
  // CREATE PROJECT MODAL
  // ============================================
  function showCreateProjectModal(draftData = null) {
    let phases = draftData ? draftData.phases.map(ph => ({
      name: ph.name, bobot: Number(ph.bobot), status: ph.status || 'open',
      activities: ph.activities.map(a => ({ name: a.name, pic: a.pic_id || '', startDate: a.start_date ? a.start_date.split('T')[0] : '', endDate: a.end_date ? a.end_date.split('T')[0] : '', nilai_aktual: a.nilai_aktual || 0, status: a.status || 'open' }))
    })) : [{ name: '', bobot: 15, activities: [{ name: '', pic: '', startDate: '', endDate: '' }] }];
    
    renderProjectForm(phases, draftData);
  }

  function renderProjectForm(phases, draftData = null) {
    closeModal();
    const totalBobot = phases.reduce((s, p) => s + (parseInt(p.bobot) || 0), 0);
    const c = document.createElement('div'); c.id = 'modalContainer';
    c.innerHTML = `<div class="modal-overlay" onclick="if(event.target===this)document.getElementById('modalContainer')?.remove()">
      <div class="modal modal-lg">
        <div class="modal-header"><span class="modal-title">✚ Buat Proyek Baru</span><button class="modal-close" onclick="document.getElementById('modalContainer')?.remove()">✕</button></div>
        <div class="modal-body">
          <div class="form-grid-2">
            <div class="form-group"><label class="form-label">Kode Proyek</label><input class="form-input" id="mpCode" placeholder="Contoh: SNI, Packaging" value="${draftData ? draftData.code : ''}" /></div>
            <div class="form-group"><label class="form-label">Nama Proyek</label><input class="form-input" id="mpName" placeholder="Nama lengkap proyek" value="${draftData ? draftData.name : ''}" /></div>
          </div>
          <div class="form-grid-2">
            <div class="form-group"><label class="form-label">Seksi/Area</label><select class="form-select" id="mpSeksi"><option value="Security Printing" ${draftData && draftData.seksi === 'Security Printing' ? 'selected' : ''}>Security Printing</option><option value="Material & Security Feature" ${draftData && draftData.seksi === 'Material & Security Feature' ? 'selected' : ''}>Material & Security Feature</option></select></div>
            <div class="form-group"><label class="form-label">Kategori</label><div class="radio-group" style="margin-top:6px"><label class="radio-option"><input type="radio" name="mpKat" value="OMTI" ${!draftData || draftData.kategori === 'OMTI' ? 'checked' : ''} /> OMTI</label><label class="radio-option"><input type="radio" name="mpKat" value="Non-OMTI" ${draftData && draftData.kategori === 'Non-OMTI' ? 'checked' : ''} /> Non-OMTI</label></div></div>
          </div>
          <div class="form-grid-2"><div class="form-group"><label class="form-label">Start Date</label><input type="date" class="form-input" id="mpStart" value="${draftData && draftData.start_date ? draftData.start_date.split('T')[0] : ''}" /></div><div class="form-group"><label class="form-label">End Date</label><input type="date" class="form-input" id="mpEnd" value="${draftData && draftData.end_date ? draftData.end_date.split('T')[0] : ''}" /></div></div>
          <h3 style="margin:var(--space-4) 0 var(--space-3);font-size:var(--fs-sm)">Tahapan & Aktivitas</h3>
          <div id="phasesContainer">${phases.map((ph, pi) => `<div class="phase-block"><div class="phase-block-header"><span class="phase-block-title">Tahapan ${pi + 1}</span><div style="display:flex;gap:6px;align-items:center"><span class="form-label" style="margin:0;font-size:var(--fs-xs)">Bobot:</span><input type="number" class="form-input" style="width:60px;padding:4px 8px" value="${ph.bobot}" min="0" max="100" data-phase="${pi}" data-field="bobot" /><span style="font-size:var(--fs-xs)">%</span></div><button class="phase-remove-btn" data-phase="${pi}">🗑</button></div>
            <div class="form-group" style="margin-bottom:8px"><input class="form-input" placeholder="Nama tahapan" value="${ph.name}" data-phase="${pi}" data-field="name" style="padding:6px 10px" /></div>
            ${ph.activities.map((a, ai) => `<div class="activity-row"><input placeholder="Nama aktivitas" value="${a.name}" data-phase="${pi}" data-act="${ai}" data-field="name" /><input placeholder="Nama PIC" value="${a.pic || ''}" data-phase="${pi}" data-act="${ai}" data-field="pic" style="width:120px" /><input type="date" value="${a.startDate}" data-phase="${pi}" data-act="${ai}" data-field="startDate" /><input type="date" value="${a.endDate}" data-phase="${pi}" data-act="${ai}" data-field="endDate" /><button class="act-remove-btn phase-remove-btn" data-phase="${pi}" data-act="${ai}" style="font-size:12px">✕</button></div>`).join('')}
            <button class="add-btn add-activity-btn" data-phase="${pi}" style="margin-top:4px;font-size:var(--fs-xs)">＋ Aktivitas</button>
          </div>`).join('')}</div>
          <button class="add-btn" id="addPhaseBtn" style="margin-top:8px;font-size:var(--fs-xs)">＋ Tambah Tahapan</button>
          <div class="bobot-total ${totalBobot === 100 ? 'valid' : 'invalid'}"><span>Total Bobot:</span><span class="font-mono">${totalBobot}% ${totalBobot === 100 ? '✅' : '⚠️ harus 100%'}</span></div>
        </div>
        <div class="modal-footer"><button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('modalContainer')?.remove()">Batal</button><div><button type="button" class="btn btn-outline btn-sm" id="saveDraftBtn" style="margin-right:8px">💾 Simpan Draft</button><button class="btn btn-accent btn-sm" id="submitProjectBtn">📤 Submit for Approval</button></div></div>
      </div>
    </div>`;
    document.body.appendChild(c);

    document.getElementById('addPhaseBtn').addEventListener('click', () => { 
      const mc = document.querySelector('#modalContainer > .modal'); const s = mc ? mc.scrollTop : 0;
      const draft = readProjectFormState(phases); 
      phases.push({ name: '', bobot: 10, activities: [{ name: '', pic: '', startDate: '', endDate: '' }] }); 
      renderProjectForm(phases, draft); 
      setTimeout(() => { const nm = document.querySelector('#modalContainer > .modal'); if (nm) nm.scrollTop = Math.min(s + 150, nm.scrollHeight); }, 0);
    });
    c.querySelectorAll('.add-activity-btn').forEach(btn => btn.addEventListener('click', () => { 
      const mc = document.querySelector('#modalContainer > .modal'); const s = mc ? mc.scrollTop : 0;
      const draft = readProjectFormState(phases); 
      phases[parseInt(btn.dataset.phase)].activities.push({ name: '', pic: '', startDate: '', endDate: '' }); 
      renderProjectForm(phases, draft); 
      setTimeout(() => { const nm = document.querySelector('#modalContainer > .modal'); if (nm) nm.scrollTop = Math.min(s + 80, nm.scrollHeight); }, 0);
    }));
    c.querySelectorAll('.phase-remove-btn:not(.act-remove-btn)').forEach(btn => btn.addEventListener('click', () => { 
      const mc = document.querySelector('#modalContainer > .modal'); const s = mc ? mc.scrollTop : 0;
      const draft = readProjectFormState(phases); 
      if (phases.length > 1) phases.splice(parseInt(btn.dataset.phase), 1); 
      renderProjectForm(phases, draft); 
      setTimeout(() => { const nm = document.querySelector('#modalContainer > .modal'); if (nm) nm.scrollTop = s; }, 0);
    }));
    c.querySelectorAll('.act-remove-btn').forEach(btn => btn.addEventListener('click', () => { 
      const mc = document.querySelector('#modalContainer > .modal'); const s = mc ? mc.scrollTop : 0;
      const draft = readProjectFormState(phases); 
      const pi = parseInt(btn.dataset.phase); 
      if (phases[pi].activities.length > 1) phases[pi].activities.splice(parseInt(btn.dataset.act), 1); 
      renderProjectForm(phases, draft); 
      setTimeout(() => { const nm = document.querySelector('#modalContainer > .modal'); if (nm) nm.scrollTop = s; }, 0);
    }));

    document.getElementById('saveDraftBtn').addEventListener('click', async () => {
      readProjectFormState(phases);
      const code = document.getElementById('mpCode').value.trim() || 'DRAFT-' + Date.now().toString().slice(-4), name = document.getElementById('mpName').value.trim() || 'Proyek Tanpa Nama';
      const u = AppStore.currentUser;
      const btn = document.getElementById('saveDraftBtn');
      btn.innerHTML = 'Menyimpan...'; btn.disabled = true;

      const newP = { 
        code, name, seksi: document.getElementById('mpSeksi').value, kategori: document.querySelector('input[name="mpKat"]:checked').value, pic_id: u.id, start_date: document.getElementById('mpStart').value || '2026-01-01', end_date: document.getElementById('mpEnd').value || '2026-12-31', status: 'draft',
        phases: phases.map((ph, pi) => ({ code: `T${pi + 1}`, name: ph.name || `Tahapan ${pi+1}`, bobot: ph.bobot, status: 'open', order_index: pi, activities: ph.activities.map((a, ai) => ({ code: `T${pi + 1}.${ai + 1}`, name: a.name || `Aktivitas ${ai+1}`, target: 100, nilai_aktual: 0, status: 'open', start_date: a.startDate || '2026-01-01', end_date: a.endDate || '2026-12-31', order_index: ai })) }))
      };
      
      try {
        if (draftData && draftData.id) {
          await fetch(`/api/projects/${draftData.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('aimon-token')}` } });
        }
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('aimon-token')}` },
          body: JSON.stringify(newP)
        });
        if (res.ok) {
          await AppStore.fetchInitialData(localStorage.getItem('aimon-token'));
          Toast.show('Draft proyek berhasil disimpan!', 'success');
          closeModal();
          if (window.location.hash === '#/projects') renderProjects();
        } else {
          Toast.show('Gagal menyimpan draft', 'error');
          btn.innerHTML = '💾 Simpan Draft'; btn.disabled = false;
        }
      } catch (err) {
        Toast.show('Terjadi kesalahan jaringan', 'error');
        btn.innerHTML = '💾 Simpan Draft'; btn.disabled = false;
      }
    });

    document.getElementById('submitProjectBtn').addEventListener('click', async () => {
      readProjectFormState(phases);
      const code = document.getElementById('mpCode').value.trim(), name = document.getElementById('mpName').value.trim();
      const totalB = phases.reduce((s, p) => s + (parseInt(p.bobot) || 0), 0);
      if (!code || !name) { Toast.show('Kode dan Nama proyek harus diisi!', 'error'); return; }
      if (totalB !== 100) { Toast.show('Total bobot harus 100%!', 'error'); return; }
      const u = AppStore.currentUser;
      const btn = document.getElementById('submitProjectBtn');
      btn.innerHTML = 'Memproses...'; btn.disabled = true;

      const newP = { 
        code, name, seksi: document.getElementById('mpSeksi').value, kategori: document.querySelector('input[name="mpKat"]:checked').value, pic_id: u.id, start_date: document.getElementById('mpStart').value || '2026-01-01', end_date: document.getElementById('mpEnd').value || '2026-12-31', status: 'pending',
        phases: phases.map((ph, pi) => ({ code: `T${pi + 1}`, name: ph.name || `Tahapan ${pi+1}`, bobot: ph.bobot, status: ph.status || 'open', order_index: pi, activities: ph.activities.map((a, ai) => ({ code: `T${pi + 1}.${ai + 1}`, name: a.name || `Aktivitas ${ai+1}`, target: 100, nilai_aktual: a.nilai_aktual || 0, status: a.status || 'open', start_date: a.startDate || '2026-01-01', end_date: a.endDate || '2026-12-31', order_index: ai, pic_id: a.pic })) }))
      };
      
      try {
        let res;
        if (draftData && draftData.id && draftData.status !== 'draft') {
          res = await fetch(`/api/projects/${draftData.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('aimon-token')}` },
            body: JSON.stringify(newP)
          });
        } else {
          if (draftData && draftData.id) {
            await fetch(`/api/projects/${draftData.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('aimon-token')}` } });
          }
          res = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('aimon-token')}` },
            body: JSON.stringify(newP)
          });
        }
        
        if (res.ok) {
          await AppStore.fetchInitialData(localStorage.getItem('aimon-token'));
          Toast.show('Proyek berhasil diupdate!', 'success');
          closeModal();
          if (window.location.hash.startsWith('#/project/')) {
            renderProjectDetail(draftData.id);
          } else if (window.location.hash === '#/projects') {
            renderProjects();
          }

        } else {
          Toast.show('Gagal menyimpan ke database', 'error');
          btn.innerHTML = 'Simpan Proyek'; btn.disabled = false;
        }
      } catch (err) {
        Toast.show('Terjadi kesalahan jaringan', 'error');
        btn.innerHTML = 'Simpan Proyek'; btn.disabled = false;
      }
    });
  }

  function readProjectFormState(phases) {
    phases.forEach((ph, pi) => {
      const n = document.querySelector(`[data-phase="${pi}"][data-field="name"]:not([data-act])`);
      const b = document.querySelector(`[data-phase="${pi}"][data-field="bobot"]`);
      if (n) ph.name = n.value; if (b) ph.bobot = parseInt(b.value) || 0;
      ph.activities.forEach((a, ai) => {
        const an = document.querySelector(`[data-phase="${pi}"][data-act="${ai}"][data-field="name"]`);
        const ap = document.querySelector(`[data-phase="${pi}"][data-act="${ai}"][data-field="pic"]`);
        const sd = document.querySelector(`[data-phase="${pi}"][data-act="${ai}"][data-field="startDate"]`);
        const ed = document.querySelector(`[data-phase="${pi}"][data-act="${ai}"][data-field="endDate"]`);
        if (an) a.name = an.value; if (ap) a.pic = ap.value; if (sd) a.startDate = sd.value; if (ed) a.endDate = ed.value;
      });
    });
    
    return {
      code: document.getElementById('mpCode')?.value || '',
      name: document.getElementById('mpName')?.value || '',
      seksi: document.getElementById('mpSeksi')?.value || 'Security Printing',
      kategori: document.querySelector('input[name="mpKat"]:checked')?.value || 'OMTI',
      start_date: document.getElementById('mpStart')?.value || '',
      end_date: document.getElementById('mpEnd')?.value || ''
    };
  }

  // ============================================
  // UPDATE ACTIVITY MODAL
  // ============================================
  function showUpdateActivityModal(project, preselectedId) {
    const acts = []; project.phases.forEach(ph => ph.activities.forEach(a => { if (a.status !== 'done') acts.push({ ...a, phaseName: ph.name }); }));
    if (acts.length === 0) { Toast.show('Semua aktivitas sudah selesai!', 'info'); return; }
    closeModal();
    const c = document.createElement('div'); c.id = 'modalContainer';
    c.innerHTML = `<div class="modal-overlay" onclick="if(event.target===this)document.getElementById('modalContainer')?.remove()">
      <div class="modal">
        <div class="modal-header"><span class="modal-title">✏️ Update Aktivitas</span><button class="modal-close" onclick="document.getElementById('modalContainer')?.remove()">✕</button></div>
        <div class="modal-body">
          <div class="form-group"><label class="form-label">Aktivitas</label><select class="form-select" id="updActivity">${acts.map(a => `<option value="${a.id}" ${a.id === preselectedId ? 'selected' : ''}>${a.phaseName} → ${a.name} (${a.nilai}%)</option>`).join('')}</select></div>
          <div class="form-grid-2">
            <div class="form-group"><label class="form-label">Status</label><select class="form-select" id="updStatus"><option value="open">Open</option><option value="on-progress" selected>On Progress</option><option value="done">Done</option></select></div>
            <div class="form-group"><label class="form-label">Nilai (%)</label><input type="number" class="form-input" id="updNilai" min="0" max="100" placeholder="0-100" /></div>
          </div>
          <div class="form-group"><label class="form-label">Catatan</label><textarea class="form-textarea" id="updNote" placeholder="Jelaskan progress..."></textarea></div>
          <div class="form-group"><label class="form-label">Lampiran</label><div class="file-upload-area" id="fileUploadArea">📎 Pilih dokumen dari komputer...</div><input type="file" id="docFileInput" multiple style="display:none" /><div class="file-list" id="fileList"></div></div>
        </div>
        <div class="modal-footer"><button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('modalContainer')?.remove()">Batal</button><button class="btn btn-accent btn-sm" id="submitUpdateBtn">📤 Submit</button></div>
      </div>
    </div>`;
    document.body.appendChild(c);
    let files = [];
    document.getElementById('fileUploadArea').addEventListener('click', () => { document.getElementById('docFileInput')?.click(); });
    document.getElementById('docFileInput')?.addEventListener('change', async e => {
      const selectedFiles = Array.from(e.target.files);
      if (!selectedFiles.length) return;
      
      const formData = new FormData();
      selectedFiles.forEach(f => formData.append('files', f));
      
      Toast.show('Mengunggah dokumen...', 'info');
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('aimon-token')}` },
          body: formData
        });
        if (res.ok) {
          const uploaded = await res.json();
          files = [...files, ...uploaded.map(u => ({ name: u.originalName, url: u.url }))];
          renderFiles();
          Toast.show('Dokumen berhasil diunggah', 'success');
        } else {
          Toast.show('Gagal mengunggah dokumen', 'error');
        }
      } catch (err) {
        Toast.show('Error upload dokumen', 'error');
      }
    });
    
    function renderFiles() {
      document.getElementById('fileList').innerHTML = files.map((x, i) => `<div class="file-item" style="display:flex;justify-content:space-between;align-items:center;width:100%"><div><span>📄</span><span class="file-item-name">${x.name}</span></div><div style="display:flex;gap:4px"><button type="button" class="btn btn-outline btn-xs" style="padding:2px 6px;font-size:10px" onclick="window._viewFile('${x.url}')">Lihat</button><button type="button" class="btn btn-accent btn-xs" style="padding:2px 6px;font-size:10px" onclick="window._downloadFile('${x.url}', '${x.name}')">Unduh</button><button type="button" class="btn btn-danger btn-xs" style="padding:2px 6px;font-size:10px" onclick="window._removeFile(${i})">🗑</button></div></div>`).join('');
    }
    
    window._removeFile = function(index) {
       files.splice(index, 1);
       renderFiles();
    };
    document.getElementById('submitUpdateBtn').addEventListener('click', async () => {
      const actId = document.getElementById('updActivity').value, newVal = parseInt(document.getElementById('updNilai').value) || 0, note = document.getElementById('updNote').value;
      const act = acts.find(a => a.id === actId); if (!act) return;
      
      const token = localStorage.getItem('aimon-token');
      try {
        const res = await fetch('/api/approvals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ activity_id: actId, new_nilai: newVal, note, docs: files })
        });
        if (res.ok) {
          Toast.show('Update diajukan! Menunggu approval.', 'success'); closeModal();
        } else {
          Toast.show('Gagal mengajukan update.', 'error');
        }
      } catch (e) { console.error(e); Toast.show('Error jaringan', 'error'); }
    });
  }

  // ============================================
  // APPROVALS / REPORTS / ADMIN / ACCOUNT
  // ============================================
  function renderApprovals() {
    if (!document.getElementById('mainContent')) renderAppShell();
    document.getElementById('navApprovals') && setActiveNav(document.getElementById('navApprovals'));
    updateBreadcrumb([{ text: 'Dashboard', link: '#/dashboard' }, { text: 'Approval Queue' }]);
    const pending = AppStore.approvals.filter(a => a.status === 'pending');
    document.getElementById('mainContent').innerHTML = `<div class="page animate-fade-in-up">
      <div class="page-header"><h1 class="page-title" style="font-size:var(--fs-lg)">Approval Queue</h1><p class="page-subtitle" style="font-size:var(--fs-xs)">Review dan setujui draft update progress dari Researcher</p></div>
      ${pending.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">✅</div><div class="empty-state-text">Tidak ada draft menunggu</div></div>' :
        pending.map(a => { const proj = AppStore.projects.find(p => p.id === a.projectId);
        return `<div class="approval-card animate-fade-in-up"><div class="approval-card-header"><div class="approval-card-user"><div class="approval-card-avatar">${a.submitterName.split(' ').map(w => w[0]).join('').substring(0, 2)}</div><div><div class="approval-card-name">${a.submitterName}</div><div class="approval-card-task">${proj?.name || ''} → ${a.activityName}</div></div></div></div>
        <div class="approval-card-body"><div class="approval-diff"><span>Nilai:</span><span class="approval-diff-old">${a.oldValue}%</span><span class="approval-diff-arrow"> ➔ </span><span class="approval-diff-new">${a.newValue}%</span></div><div class="approval-card-note">"${a.note}"</div>${a.docs?.length ? `<div class="file-list">${a.docs.map(d => `<div class="file-item" style="display:flex;justify-content:space-between;align-items:center;width:100%"><div><span>📄</span><span class="file-item-name">${d.name || d}</span></div><div style="display:flex;gap:4px"><button type="button" class="btn btn-outline btn-xs" style="padding:2px 6px;font-size:10px" onclick="window._viewFile('${d.url || d}')">Lihat</button><button type="button" class="btn btn-accent btn-xs" style="padding:2px 6px;font-size:10px" onclick="window._downloadFile('${d.url || d}', '${d.name || d}')">Unduh</button></div></div>`).join('')}</div>` : ''}</div>
        <div class="approval-card-actions"><button class="btn btn-success btn-sm" onclick="window._approve('${a.id}')">✅ Approve</button><button class="btn btn-danger btn-sm" onclick="window._reject('${a.id}')">❌ Reject</button></div></div>`; }).join('')}
    </div>`;
  }

  function renderReports() {
    if (!document.getElementById('mainContent')) renderAppShell();
    document.getElementById('navReports') && setActiveNav(document.getElementById('navReports'));
    updateBreadcrumb([{ text: 'Dashboard', link: '#/dashboard' }, { text: 'Reports' }]);
    
    const main = document.getElementById('mainContent');
    main.innerHTML = `<div class="page"><div class="page-header"><h1 class="page-title" style="font-size:var(--fs-lg)">Reports & Export</h1></div>${window._renderSkeleton()}</div>`;
    
    setTimeout(() => {
      main.innerHTML = `<div class="page animate-fade-in-up">
        <div class="page-header"><h1 class="page-title" style="font-size:var(--fs-lg)">Reports & Export</h1></div>
        ${window._renderEmptyState('📊', 'Belum ada laporan terbaru', '<button class="btn btn-accent btn-sm" onclick="Toast.show(\'Laporan sedang di-generate...\',\'info\')">Generate Laporan Baru</button>')}
      </div>`;
    }, 600);
  }

  function renderAdmin() {
    if (!document.getElementById('mainContent')) renderAppShell();
    document.getElementById('navAdmin') && setActiveNav(document.getElementById('navAdmin'));
    updateBreadcrumb([{ text: 'Dashboard', link: '#/dashboard' }, { text: 'Admin' }]);
    
    document.getElementById('mainContent').innerHTML = `<div class="page animate-fade-in-up">
      <div class="page-header"><h1 class="page-title" style="font-size:var(--fs-lg)">Admin Panel</h1><p class="page-subtitle" style="font-size:var(--fs-xs)">Kelola sistem, role, dan user</p></div>
      <div class="card"><div class="card-header"><span class="card-title" style="font-size:var(--fs-sm)">User Aktif</span></div>
        <div class="data-table-wrapper"><table class="data-table compact"><thead><tr><th>Nama</th><th>Username</th><th>Role</th><th>Seksi</th></tr></thead><tbody>
        ${AppStore.users.filter(u => u.approved).map(u => `<tr><td>${u.name}</td><td class="col-code">${u.username}</td><td>${u.role}</td><td>${u.seksi || '—'}</td></tr>`).join('')}
        </tbody></table></div>
      </div>
    </div>`;
  }

  function renderAccount() {
    if (!document.getElementById('mainContent')) renderAppShell();
    document.getElementById('navAccount') && setActiveNav(document.getElementById('navAccount'));
    updateBreadcrumb([{ text: 'Dashboard', link: '#/dashboard' }, { text: 'Account' }]);
    const u = AppStore.currentUser;
    document.getElementById('mainContent').innerHTML = `<div class="page animate-fade-in-up">
      <div class="page-header"><h1 class="page-title" style="font-size:var(--fs-lg)">Account Settings</h1><p class="page-subtitle" style="font-size:var(--fs-xs)">Kelola profil dan preferensi akun</p></div>
      <div class="grid-2">
        <div class="card"><div class="card-header"><span class="card-title" style="font-size:var(--fs-sm)">👤 Profil</span></div>
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
            <div style="position:relative;cursor:pointer" id="avatarUploadWrap">
              ${u.photo ? `<img src="${u.photo}" style="width:64px;height:64px;border-radius:50%;object-fit:cover" />` : avatar(u.initials, 64)}
              <div style="position:absolute;bottom:0;right:0;width:22px;height:22px;background:var(--color-primary);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;border:2px solid var(--color-bg-card)">📷</div>
              <input type="file" id="avatarFileInput" accept="image/*" style="display:none" />
            </div>
            <div>
              <h3 style="font-size:var(--fs-md);margin-bottom:4px" id="displayName">${u.name}</h3>
              <span style="font-size:var(--fs-xs);color:var(--color-text-secondary);display:block;margin-bottom:8px">${u.role} • ${u.seksi || 'All Areas'}</span>
              ${u.photo ? `<button class="btn btn-outline btn-xs" id="deletePhotoBtn" style="color:var(--color-danger);border-color:var(--color-danger)">Hapus Foto</button>` : ''}
            </div>
          </div>
          <div class="form-group"><label class="form-label">Ubah Nama</label><input class="form-input" id="editName" value="${u.name}" /></div>
          <button class="btn btn-primary btn-sm" id="saveNameBtn" style="width:100%">💾 Simpan Nama</button>
        </div>
        <div class="card"><div class="card-header"><span class="card-title" style="font-size:var(--fs-sm)">🔒 Keamanan</span></div>
          <form id="pwdForm"><div class="form-group"><label class="form-label">Password Saat Ini</label><input type="password" class="form-input" id="curPwd" required /></div>
          <div class="form-group"><label class="form-label">Password Baru</label><input type="password" class="form-input" id="newPwd" required /></div>
          <div class="form-group"><label class="form-label">Konfirmasi</label><input type="password" class="form-input" id="cfmPwd" required /></div>
          <button type="submit" class="btn btn-primary btn-sm" style="width:100%">💾 Simpan Password</button></form>
        </div>
      </div>
      <div class="card" style="margin-top:var(--space-4)"><div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0"><div><div style="font-weight:500;font-size:var(--fs-sm)">Logout</div><div style="font-size:var(--fs-xs);color:var(--color-text-secondary)">Keluar dari AIMON</div></div>
        <button class="btn btn-danger btn-sm" id="logoutFromAccount">🚪 Logout</button></div></div>
    </div>`;
    // Avatar upload
    document.getElementById('avatarUploadWrap')?.addEventListener('click', () => document.getElementById('avatarFileInput')?.click());
    document.getElementById('avatarFileInput')?.addEventListener('change', e => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => { u.photo = ev.target.result; const dbU = AppStore.users.find(x => x.id === u.id); if (dbU) dbU.photo = u.photo; localStorage.setItem('aimon-user', JSON.stringify(u)); Toast.show('Foto profil diperbarui!', 'success'); renderAccount(); renderAppShell(); renderAccount(); };
      reader.readAsDataURL(file);
    });
    // Delete photo
    document.getElementById('deletePhotoBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      u.photo = ''; const dbU = AppStore.users.find(x => x.id === u.id); if (dbU) dbU.photo = ''; localStorage.setItem('aimon-user', JSON.stringify(u)); Toast.show('Foto profil dihapus!', 'info'); renderAccount(); renderAppShell(); renderAccount();
    });
    // Save name
    document.getElementById('saveNameBtn')?.addEventListener('click', () => {
      const newName = document.getElementById('editName').value.trim(); if (!newName) return;
      u.name = newName; const dbU = AppStore.users.find(x => x.id === u.id); if (dbU) dbU.name = newName;
      localStorage.setItem('aimon-user', JSON.stringify(u)); Toast.show('Nama berhasil diubah!', 'success');
    });
    // Password
    document.getElementById('pwdForm')?.addEventListener('submit', e => { e.preventDefault();
      if (document.getElementById('curPwd').value !== u.password) { Toast.show('Password salah!', 'error'); return; }
      if (document.getElementById('newPwd').value !== document.getElementById('cfmPwd').value) { Toast.show('Konfirmasi tidak cocok!', 'error'); return; }
      const dbU = AppStore.users.find(x => x.id === u.id); if (dbU) dbU.password = document.getElementById('newPwd').value;
      u.password = document.getElementById('newPwd').value; Toast.show('Password berhasil diubah!', 'success'); document.getElementById('pwdForm').reset();
    });
    document.getElementById('logoutFromAccount')?.addEventListener('click', () => showLogoutConfirm());
  }

  // ============================================
  // CHAT
  // ============================================
  window._currentChatPartner = null;
  window.updateChatBadge = function() {
    const fab = document.getElementById('chatFab'); if (!fab) return;
    const u = AppStore.currentUser; if (!u) return;
    const unreadCount = AppStore.chatMessages.filter(m => m.to === u.id && !m.read).length;
    if (unreadCount > 0) {
      fab.innerHTML = `💬<div style="position:absolute;top:-2px;right:-2px;background:var(--color-danger);color:#fff;font-size:11px;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-weight:bold">${unreadCount}</div>`;
    } else {
      fab.innerHTML = '💬';
    }
  };
  
  window.addEventListener('storage', (e) => {
    if (e.key === 'aimon-chats') {
      AppStore.chatMessages = JSON.parse(e.newValue || '[]');
      window.updateChatBadge();
      const panel = document.getElementById('chatPanel');
      if (panel && panel.classList.contains('open')) {
        if (window._currentChatPartner) renderChatConv(window._currentChatPartner);
        else renderChatContacts();
      }
    }
  });

  function renderChatContacts() {
    window._currentChatPartner = null;
    const panel = document.getElementById('chatPanel'); if (!panel) return;
    const u = AppStore.currentUser, partners = AppStore.getChatPartners(u.id);
    panel.innerHTML = `<div class="chat-panel-header"><span class="chat-panel-title">💬 Chat</span><button class="chat-close-btn" onclick="document.getElementById('chatPanel').classList.remove('open')">✕</button></div>
      <div class="chat-contacts">${partners.map(p => { 
        const last = AppStore.getConversation(u.id, p.id).slice(-1)[0]; 
        const unreadCount = AppStore.chatMessages.filter(m => m.from === p.id && m.to === u.id && !m.read).length;
        const nameColor = unreadCount > 0 ? 'var(--color-primary)' : 'inherit';
        return `<div class="chat-contact" data-uid="${p.id}"><div class="chat-contact-avatar" style="position:relative">${p.initials}<span class="${p.online ? 'online-dot' : 'offline-dot'}"></span>${unreadCount > 0 ? `<div style="position:absolute;top:-4px;right:-4px;background:var(--color-danger);color:#fff;font-size:10px;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-weight:bold">${unreadCount}</div>` : ''}</div><div class="chat-contact-info"><div class="chat-contact-name" style="color:${nameColor};font-weight:${unreadCount > 0 ? '600' : '500'}">${p.name}</div><div class="chat-contact-role">${p.role}${last ? ' • ' + last.text.substring(0, 20) + (last.text.length > 20 ? '...' : '') : ''}</div></div></div>`; 
      }).join('')}</div>`;
    panel.querySelectorAll('.chat-contact').forEach(c => c.addEventListener('click', () => {
      const partnerId = c.dataset.uid;
      let changed = false;
      AppStore.chatMessages.forEach(m => { if (m.from === partnerId && m.to === AppStore.currentUser.id && !m.read) { m.read = true; changed = true; } });
      if (changed) {
        const t = localStorage.getItem('aimon-token');
        if (t) {
          fetch('/api/chat/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
            body: JSON.stringify({ partnerId })
          }).catch(e => console.error(e));
        }
        localStorage.setItem('aimon-chats', JSON.stringify(AppStore.chatMessages));
      }
      renderChatConv(partnerId);
    }));
  }

  function renderChatConv(partnerId) {
    window._currentChatPartner = partnerId;
    const panel = document.getElementById('chatPanel'); if (!panel) return;
    const u = AppStore.currentUser, partner = AppStore.users.find(x => x.id === partnerId); if (!partner) return;
    
    let changed = false;
    AppStore.chatMessages.forEach(m => { if (m.from === partnerId && m.to === u.id && !m.read) { m.read = true; changed = true; } });
    if (changed) {
      const t = localStorage.getItem('aimon-token');
      if (t) {
        fetch('/api/chat/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
          body: JSON.stringify({ partnerId })
        }).catch(e => console.error(e));
      }
    }

    const msgs = AppStore.getConversation(u.id, partnerId);
    panel.innerHTML = `<div class="chat-panel-header"><div style="display:flex;align-items:center;gap:6px"><button class="chat-back-btn" id="chatBack">‹</button><span class="chat-panel-title" style="font-size:var(--fs-sm)">${partner.name}</span></div><button class="chat-close-btn" onclick="document.getElementById('chatPanel').classList.remove('open')">✕</button></div>
      <div class="chat-messages" id="chatMsgs">${msgs.map(m => `<div class="chat-msg ${m.from === u.id ? 'sent' : 'received'}"><div>${m.text}</div><div class="chat-msg-time">${new Date(m.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div></div>`).join('')}${msgs.length === 0 ? '<div style="text-align:center;color:var(--color-text-tertiary);padding:24px;font-size:var(--fs-xs)">Belum ada pesan</div>' : ''}</div>
      <div class="chat-input-area"><input class="chat-input" id="chatInput" placeholder="Ketik pesan..." autocomplete="off" /><button class="chat-send-btn" id="chatSendBtn">➤</button></div>`;
    
    document.getElementById('chatMsgs').scrollTop = document.getElementById('chatMsgs').scrollHeight;
    document.getElementById('chatBack').addEventListener('click', () => renderChatContacts());
    const send = async () => { 
      const inp = document.getElementById('chatInput'); const t = inp.value.trim(); if (!t) return; 
      const tempId = 'temp-' + Date.now();
      const msg = { id: tempId, from: u.id, to: partnerId, text: t, time: new Date().toISOString(), read: false, temp: true };
      AppStore.chatMessages.push(msg);
      
      const msgsDiv = document.getElementById('chatMsgs');
      if (msgsDiv) {
        const emptyMsg = msgsDiv.querySelector('div[style*="text-align:center"]');
        if (emptyMsg) emptyMsg.remove();
        const mHtml = `<div class="chat-msg sent" id="msg-${tempId}"><div>${t}</div><div class="chat-msg-time">${new Date(msg.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div></div>`;
        msgsDiv.innerHTML += mHtml;
        msgsDiv.scrollTop = msgsDiv.scrollHeight;
      }
      inp.value = '';

      const token = localStorage.getItem('aimon-token');
      if (token) {
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ to: partnerId, text: t, clientId: tempId })
          });
          if (res.ok) {
             const serverMsg = await res.json();
             const tempIdx = AppStore.chatMessages.findIndex(m => m.id === tempId);
             if (tempIdx !== -1) AppStore.chatMessages[tempIdx] = serverMsg;
             const dom = document.getElementById(`msg-${tempId}`);
             if (dom) dom.id = `msg-${serverMsg.id}`;
          }
        } catch(e) { console.error('Error sending message', e); }
      }
    };
    document.getElementById('chatSendBtn').addEventListener('click', send);
    document.getElementById('chatInput').addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  }

  // ============================================
  // GLOBAL ACTIONS
  // ============================================
  window._approve = async function (id) {
    const token = localStorage.getItem('aimon-token');
    try {
      const res = await fetch(`/api/approvals/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'approved' })
      });
      if (res.ok) {
        Toast.show('Approved!', 'success');
      } else Toast.show('Gagal approve.', 'error');
    } catch(e) { console.error(e); Toast.show('Error', 'error'); }
  };
  
  window._reject = function (id) {
    const c = document.createElement('div'); c.id = 'rejectModalContainer';
    c.innerHTML = `<div class="modal-overlay" style="z-index:9990" onclick="if(event.target===this)document.getElementById('rejectModalContainer')?.remove()">
      <div class="modal animate-fade-in-up" style="max-width:400px;width:100%">
        <div class="modal-header"><span class="modal-title" style="font-size:var(--fs-sm)">❌ Tolak Update</span><button class="modal-close" onclick="document.getElementById('rejectModalContainer')?.remove()">✕</button></div>
        <div class="modal-body" style="padding:20px">
          <div class="form-group"><label class="form-label">Catatan Penolakan</label>
          <textarea class="form-input" id="rejectNote" rows="3" placeholder="Masukkan alasan penolakan..."></textarea></div>
          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">
            <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('rejectModalContainer')?.remove()">Batal</button>
            <button class="btn btn-danger btn-sm" id="confirmRejectBtn">Tolak</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.appendChild(c);
    document.getElementById('confirmRejectBtn').addEventListener('click', async () => {
      const n = document.getElementById('rejectNote').value;
      const token = localStorage.getItem('aimon-token');
      try {
        const res = await fetch(`/api/approvals/${id}/review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ status: 'rejected', note: n })
        });
        if (res.ok) {
          Toast.show('Update berhasil ditolak.', 'warning');
        } else Toast.show('Gagal reject.', 'error');
      } catch(e) { console.error(e); Toast.show('Error', 'error'); }
      document.getElementById('rejectModalContainer')?.remove();
    });
  };
  window._approveReg = function (id) { const r = AppStore.pendingRegistrations.find(x => x.id === id); if (!r) return; r.status = 'approved'; AppStore.users.push({ id: 'u' + Date.now(), username: r.username, password: 'admin123', name: r.name, role: r.role, seksi: r.seksi, initials: r.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase(), approved: true, online: false, photo: '' }); Toast.show(`Akun ${r.name} disetujui!`, 'success'); renderAdmin(); };
  window._rejectReg = function (id) { const r = AppStore.pendingRegistrations.find(x => x.id === id); if (!r) return; r.status = 'rejected'; Toast.show('Ditolak.', 'warning'); renderAdmin(); };

  window._viewFile = function(filename) {
    if (filename && filename.startsWith('/uploads/')) {
      Toast.show('Membuka file...', 'info');
      window.open('http://localhost:3001' + filename, '_blank');
      return;
    }
    Toast.show(`Membuka file ${filename} untuk dilihat...`, 'info');
    setTimeout(() => {
        const text = "Ini adalah simulasi isi dokumen dari file: " + filename;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        URL.revokeObjectURL(url);
    }, 500);
  };
  
  window._downloadFile = function(filename, originalName) {
    if (filename && filename.startsWith('/uploads/')) {
      Toast.show('Mengunduh file...', 'info');
      const a = document.createElement('a');
      a.href = 'http://localhost:3001' + filename;
      a.download = originalName || filename.split('-').slice(1).join('-');
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    Toast.show(`Mengunduh file ${filename}...`, 'info');
    setTimeout(() => {
        const text = "Ini adalah simulasi isi dokumen dari file: " + filename;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 500);
  };
  window._viewDocs = function(projectId, activityId) {
    const project = AppStore.projects.find(p => p.id === projectId); if (!project) return;
    let act = null; project.phases.forEach(ph => ph.activities.forEach(a => { if (a.id === activityId) act = a; }));
    if (!act || !act.docs || act.docs.length === 0) return;
    const c = document.createElement('div'); c.id = 'docsModalContainer';
    c.innerHTML = `<div class="modal-overlay" style="z-index:9990" onclick="if(event.target===this)document.getElementById('docsModalContainer')?.remove()">
      <div class="modal" style="max-width:450px;width:100%">
        <div class="modal-header"><span class="modal-title" style="font-size:var(--fs-sm)">📎 Dokumen Lampiran</span><button class="modal-close" onclick="document.getElementById('docsModalContainer')?.remove()">✕</button></div>
        <div class="modal-body" style="padding:16px 20px">
          <div style="font-size:var(--fs-xs);color:var(--color-text-secondary);margin-bottom:12px">${act.name}</div>
          <div class="file-list" style="margin-top:0">
            ${act.docs.map(d => `
              <div class="file-item" style="display:flex;justify-content:space-between;align-items:center;background:var(--color-bg-filter-bar)">
                <div style="display:flex;align-items:center;gap:8px"><span>📄</span><span class="file-item-name">${d.name || d}</span></div>
                <div style="display:flex;gap:4px">
                  <button class="btn btn-outline btn-xs" onclick="window._viewFile('${d.url || d}')">Lihat</button>
                  <button class="btn btn-primary btn-xs" onclick="window._downloadFile('${d.url || d}', '${d.name || d}')">Unduh</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>`;
    document.body.appendChild(c);
  };

  // Routes
  Router.register('#/login', renderLogin);
  Router.register('#/dashboard', renderDashboard);
  Router.register('#/projects', renderProjects);
  Router.register('#/project', renderProjectDetail);
  Router.register('#/approvals', renderApprovals);
  Router.register('#/reports', renderReports);
  Router.register('#/admin', renderAdmin);
  Router.register('#/account', renderAccount);

  window.startPolling = function() {
    if (window._pollInterval) clearInterval(window._pollInterval);
    window._pollInterval = setInterval(async () => {
      const t = localStorage.getItem('aimon-token');
      if (!t) return;
      
      try {
        const oldChatCount = AppStore.chatMessages.length;
        await AppStore.fetchInitialData(t);
        const newChatCount = AppStore.chatMessages.length;
        
        if (newChatCount > oldChatCount || AppStore.chatMessages.some(m => !m.read && m.to === AppStore.currentUser.id)) {
          const panel = document.getElementById('chatPanel');
          if (panel && panel.classList.contains('open')) {
            if (window._currentChatPartner) renderChatPanel(window._currentChatPartner);
            else renderChatContacts();
          }
          
          const unreadCount = AppStore.chatMessages.filter(m => m.to === AppStore.currentUser.id && !m.read).length;
          const btn = document.querySelector('.chat-btn');
          if (btn) {
            if (unreadCount > 0) {
              if (!document.getElementById('chatBadge')) btn.innerHTML += `<span id="chatBadge" style="position:absolute;top:-5px;right:-5px;background:var(--color-danger);color:#fff;font-size:12px;font-weight:bold;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center">${unreadCount}</span>`;
              else document.getElementById('chatBadge').innerText = unreadCount;
            } else {
              const badge = document.getElementById('chatBadge');
              if (badge) badge.remove();
            }
          }
        }
        
        if (window.location.hash === '#/approvals') renderApprovals();
        else if (window.location.hash === '#/dashboard') renderDashboard();
      } catch(e) {
        console.error('Polling error', e);
      }
    }, 5000);
  };

  async function init() { 
    ThemeManager.init(); 
    const s = localStorage.getItem('aimon-user'); 
    const t = localStorage.getItem('aimon-token');
    if (s && t) {
      try { 
        AppStore.currentUser = JSON.parse(s); 
        await AppStore.fetchInitialData(t);
        window.startPolling();
      } catch (e) { 
        localStorage.removeItem('aimon-user'); 
        localStorage.removeItem('aimon-token');
      } 
    }
    Router.init(); 
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
