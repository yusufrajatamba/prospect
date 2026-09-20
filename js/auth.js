// ==========================================================================
// PRUPROSPECT PRO - AGENT AUTHENTICATION & PROFILE MODULE
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

    // Form Register
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleRegister();
      });
    }

    // Toggle between Login and Register tabs
    const tabShowLogin = document.getElementById('tabShowLogin');
    const tabShowRegister = document.getElementById('tabShowRegister');
    if (tabShowLogin && tabShowRegister) {
      tabShowLogin.addEventListener('click', () => {
        tabShowLogin.classList.add('active');
        tabShowRegister.classList.remove('active');
        const lp = document.getElementById('loginPane');
        const rp = document.getElementById('registerPane');
        if (lp) lp.style.display = 'block';
        if (rp) rp.style.display = 'none';
      });

      tabShowRegister.addEventListener('click', () => {
        tabShowRegister.classList.add('active');
        tabShowLogin.classList.remove('active');
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
    const menuBtnDemoBudi = document.getElementById('menuBtnDemoBudi');
    if (menuBtnDemoBudi) {
      menuBtnDemoBudi.addEventListener('click', () => {
        if (dropdownMenu) dropdownMenu.classList.remove('active');
        this.quickLogin('081234567890', 'password123');
      });
    }

    const menuBtnDemoRina = document.getElementById('menuBtnDemoRina');
    if (menuBtnDemoRina) {
      menuBtnDemoRina.addEventListener('click', () => {
        if (dropdownMenu) dropdownMenu.classList.remove('active');
        this.quickLogin('081987654321', 'password123');
      });
    }

    const menuBtnOpenAuth = document.getElementById('menuBtnOpenAuth');
    if (menuBtnOpenAuth) {
      menuBtnOpenAuth.addEventListener('click', () => {
        if (dropdownMenu) dropdownMenu.classList.remove('active');
        this.openAuthModal();
      });
    }

    const menuBtnLogout = document.getElementById('menuBtnLogout');
    if (menuBtnLogout) {
      menuBtnLogout.addEventListener('click', () => {
        if (dropdownMenu) dropdownMenu.classList.remove('active');
        this.logout();
      });
    }

    // Modal quick login buttons if present
    const btnDemoBudi = document.getElementById('btnDemoBudi');
    if (btnDemoBudi) {
      btnDemoBudi.addEventListener('click', () => this.quickLogin('081234567890', 'password123'));
    }

    const btnDemoRina = document.getElementById('btnDemoRina');
    if (btnDemoRina) {
      btnDemoRina.addEventListener('click', () => this.quickLogin('081987654321', 'password123'));
    }

    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => this.logout());
    }

    const btnOpenAuth = document.getElementById('btnOpenAuth');
    if (btnOpenAuth) {
      btnOpenAuth.addEventListener('click', () => this.openAuthModal());
    }
  }

  async checkAuthStatus() {
    const token = api.getToken();
    if (!token) {
      // Default ke demo Budi Pratama (081234567890) saat pertama kali buka
      await this.quickLogin('081234567890', 'password123', true);
      return;
    }

    try {
      const res = await api.getMe();
      this.currentUser = res.user;
      this.renderUserBadge();
      this.app.onUserLoggedIn(this.currentUser);
    } catch {
      api.removeToken();
      this.openAuthModal();
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
      this.app.showToast(`Pendaftaran berhasil! Selamat datang di PruProspect Pro, ${this.currentUser.name}.`);
      this.app.onUserLoggedIn(this.currentUser);
    } catch (err) {
      alert('Pendaftaran gagal: ' + err.message);
    }
  }

  logout() {
    if (confirm('Apakah Anda yakin ingin keluar dari akun agen ini?')) {
      api.removeToken();
      this.currentUser = null;
      this.renderUserBadge();
      this.openAuthModal();
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
      if (menuAgencyEl) menuAgencyEl.textContent = this.currentUser.agency_name || 'Prudential Indonesia';
    } else {
      if (avatarEl) avatarEl.textContent = '?';
      if (nameEl) nameEl.textContent = 'Belum Login';
      if (menuNameEl) menuNameEl.textContent = 'Tamu (Guest)';
      if (menuCodeEl) menuCodeEl.textContent = 'Silakan Login';
      if (menuAgencyEl) menuAgencyEl.textContent = 'Prudential Life Assurance';
    }
  }

  openAuthModal() {
    const modal = document.getElementById('modalAuth');
    if (modal) modal.classList.add('active');
  }

  closeAuthModal() {
    const modal = document.getElementById('modalAuth');
    if (modal) modal.classList.remove('active');
  }
}
