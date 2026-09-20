// ==========================================================================
// AGENTPROSPECT PRO - AGENT AUTHENTICATION & PROFILE MODULE
// ==========================================================================

import { api } from './api.js';

export class AuthManager {
  constructor(app) {
    this.app = app;
    this.currentUser = null;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.checkAuthStatus();
  }

  setupEventListeners() {
    // Form Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // Tab: "Info" tab (Tentang Akun) - still wired for UX but no form submit
    const tabShowLogin = document.getElementById('tabShowLogin');
    const tabShowRegister = document.getElementById('tabShowRegister');
    if (tabShowLogin) {
      tabShowLogin.addEventListener('click', () => {
        if (tabShowLogin) tabShowLogin.classList.add('active');
        if (tabShowRegister) tabShowRegister.classList.remove('active');
        const lp = document.getElementById('loginPane');
        const rp = document.getElementById('registerPane');
        if (lp) lp.style.display = 'block';
        if (rp) rp.style.display = 'none';
      });
    }
    if (tabShowRegister) {
      tabShowRegister.addEventListener('click', () => {
        if (tabShowRegister) tabShowRegister.classList.add('active');
        if (tabShowLogin) tabShowLogin.classList.remove('active');
        const lp = document.getElementById('loginPane');
        const rp = document.getElementById('registerPane');
        if (lp) lp.style.display = 'none';
        if (rp) rp.style.display = 'block';
      });
    }

    // Profile Dropdown Toggle & Click Outside Handler
    const btnDropdownTrigger = document.getElementById('btnProfileDropdownTrigger');
    const dropdownMenu = document.getElementById('profileDropdownMenu');
    if (btnDropdownTrigger && dropdownMenu) {
      btnDropdownTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('active');
      });

      document.addEventListener('click', (e) => {
        if (!dropdownMenu.contains(e.target) && !btnDropdownTrigger.contains(e.target)) {
          dropdownMenu.classList.remove('active');
        }
      });
    }

    // Dropdown Action Items
    const menuBtnOpenAuth = document.getElementById('menuBtnOpenAuth');
    if (menuBtnOpenAuth) {
      menuBtnOpenAuth.addEventListener('click', () => {
        if (dropdownMenu) dropdownMenu.classList.remove('active');
        this.logout(false);
      });
    }

    const menuBtnLogout = document.getElementById('menuBtnLogout');
    if (menuBtnLogout) {
      menuBtnLogout.addEventListener('click', () => {
        if (dropdownMenu) dropdownMenu.classList.remove('active');
        this.logout();
      });
    }

    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => this.logout());
    }

    const btnOpenAuth = document.getElementById('btnOpenAuth');
    if (btnOpenAuth) {
      btnOpenAuth.addEventListener('click', () => this.showAuthScreen());
    }
  }

  async checkAuthStatus() {
    const token = api.getToken();
    if (!token) {
      this.renderUserBadge();
      this.showAuthScreen();
      return;
    }

    try {
      const res = await api.getMe();
      this.currentUser = res.user;
      this.renderUserBadge();
      this.hideAuthScreen();
      this.app.onUserLoggedIn(this.currentUser);
    } catch {
      api.removeToken();
      this.currentUser = null;
      this.renderUserBadge();
      this.showAuthScreen();
    }
  }

  async quickLogin(phoneOrEmail, password, silent = false) {
    try {
      const res = await api.login(phoneOrEmail, password);
      this.currentUser = res.user;
      this.renderUserBadge();
      this.closeAuthModal();
      if (!silent) this.app.showToast(`Selamat datang, ${this.currentUser.name}!`);
      this.app.onUserLoggedIn(this.currentUser);
    } catch (err) {
      if (!silent) alert('Gagal masuk akun: ' + err.message);
    }
  }

  async handleLogin() {
    const phoneInput = document.getElementById('loginPhone') || document.getElementById('loginEmail');
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const password = (document.getElementById('loginPassword')?.value || '').trim();

    if (!phone || !password) {
      alert('Silakan isi nomor telepon / WhatsApp dan kata sandi.');
      return;
    }

    try {
      const res = await api.login(phone, password);
      this.currentUser = res.user;
      this.renderUserBadge();
      this.closeAuthModal();
      this.app.showToast(`Login berhasil! Selamat bertugas, ${this.currentUser.name}.`);
      this.app.onUserLoggedIn(this.currentUser);
    } catch (err) {
      alert('Gagal masuk: ' + err.message);
    }
  }

  async handleRegister() {
    const name = (document.getElementById('regName')?.value || '').trim();
    const phone = (document.getElementById('regPhone')?.value || '').trim();
    const password = (document.getElementById('regPassword')?.value || '').trim();
    const agencyEl = document.getElementById('regAgency');
    const agency_name = agencyEl ? agencyEl.value.trim() : '';

    if (!name || !phone || !password) {
      alert('Nama lengkap, nomor telepon / WhatsApp, dan kata sandi wajib diisi.');
      return;
    }

    try {
      const res = await api.register({ name, phone, password, agency_name });
      this.currentUser = res.user;
      this.renderUserBadge();
      this.closeAuthModal();
      this.app.showToast(`Pendaftaran berhasil! Selamat datang di AgentProspect Pro, ${this.currentUser.name}.`);
      this.app.onUserLoggedIn(this.currentUser);
    } catch (err) {
      alert('Pendaftaran gagal: ' + err.message);
    }
  }

  logout(askConfirm = true) {
    if (!askConfirm || confirm('Apakah Anda yakin ingin keluar dari akun agen ini?')) {
      api.removeToken();
      this.currentUser = null;
      this.renderUserBadge();
      this.showAuthScreen();
      if (this.app && typeof this.app.onUserLoggedOut === 'function') {
        this.app.onUserLoggedOut();
      }
      this.app.showToast('Anda telah keluar.');
    }
  }

  renderUserBadge() {
    const avatarEl = document.getElementById('agentAvatarInitial');
    const nameEl = document.getElementById('agentDisplayName');
    const menuNameEl = document.getElementById('menuAgentName');
    const menuCodeEl = document.getElementById('menuAgentCode');
    const menuAgencyEl = document.getElementById('menuAgentAgency');

    if (this.currentUser) {
      const initials = this.currentUser.name
        ? this.currentUser.name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
        : 'AG';
      
      if (avatarEl) avatarEl.textContent = initials;
      if (nameEl) nameEl.textContent = this.currentUser.name;
      if (menuNameEl) menuNameEl.textContent = this.currentUser.name;
      if (menuCodeEl) {
        menuCodeEl.textContent = this.currentUser.phone ? `No. HP: ${this.currentUser.phone}` : `Kode: ${this.currentUser.agent_code || '-'}`;
      }
      if (menuAgencyEl) menuAgencyEl.textContent = this.currentUser.agency_name || 'Agency Indonesia';
    } else {
      if (avatarEl) avatarEl.textContent = '?';
      if (nameEl) nameEl.textContent = 'Belum Login';
      if (menuNameEl) menuNameEl.textContent = 'Tamu (Guest)';
      if (menuCodeEl) menuCodeEl.textContent = 'Silakan Login';
      if (menuAgencyEl) menuAgencyEl.textContent = 'Agency Office';
    }
  }

  showAuthScreen() {
    const screen = document.getElementById('authScreen');
    const app = document.getElementById('appContainer');
    if (screen) screen.style.display = 'flex';
    if (app) app.style.display = 'none';
    // Close any leftover active modals
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
  }

  hideAuthScreen() {
    const screen = document.getElementById('authScreen');
    const app = document.getElementById('appContainer');
    if (screen) screen.style.display = 'none';
    if (app) app.style.display = 'block';
  }

  openAuthModal() {
    this.showAuthScreen();
  }

  closeAuthModal() {
    this.hideAuthScreen();
  }
}
