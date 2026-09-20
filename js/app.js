// ==========================================================================
// PRUPROSPECT PRO - MAIN APPLICATION CONTROLLER
// Clean, Proportionate & Fast Life Insurance Sales Suite
// ==========================================================================

import { CORE_PIPELINE_STAGES, SALES_STAGES, RELATIONSHIPS, OBJECTION_PRESETS, WA_TEMPLATES } from './sampleData.js';
import { api } from './api.js';
import { AuthManager } from './auth.js';
import { PolicyManager } from './policies.js';
import { PlaybookManager } from './playbook.js';
import { StageFormsManager } from './stageForms.js';

class PruProspectApp {
  constructor() {
    this.api = api;
    this.prospects = [];
    this.currentView = 'table'; // 'table' (default as requested), 'kanban', 'agenda'
    this.currentSection = 'project100'; // 'project100', 'policies', 'playbook', 'mdrt'
    this.kanbanMode = '5-core'; // '5-core' (fits screen) or '9-detailed'
    this.activeMobileStage = 'all';
    this.activeProspectId = null;
    this.draggedProspectId = null;

    // Filters
    this.searchQuery = '';
    this.selectedTemperature = 'all';
    this.selectedRelation = 'all';

    // Sub-modules
    this.authManager = new AuthManager(this);
    this.policyManager = new PolicyManager(this);
    this.playbook = new PlaybookManager(this);
    this.stageFormsManager = new StageFormsManager(this);

    this.init();
  }

  init() {
    this.populateDropdowns();
    this.setupEventListeners();
    this.initGoogleSheetsConfig();
    this.updateDatabaseStatusBadge();

    window.addEventListener('resize', () => {
      if (this.currentView === 'kanban') {
        this.applyMobileKanbanVisibility();
      }
    });
  }

  async onUserLoggedIn(user) {
    // Update initials in avatar and display names
    const initials = user.name
      ? user.name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
      : 'AG';
    const avatarEl = document.getElementById('agentAvatarInitial');
    if (avatarEl) avatarEl.textContent = initials;

    const nameEl = document.getElementById('agentDisplayName');
    if (nameEl) nameEl.textContent = user.name || 'Budi Pratama, CFP®';

    const codeEl = document.getElementById('agentCodeDisplay');
    if (codeEl) codeEl.textContent = `Kode: ${user.agent_code || 'PRU-001'} • ${user.agency_name || 'Jakarta'}`;

    // Highlight active switcher button
    document.querySelectorAll('.btn-account-switch').forEach(btn => btn.classList.remove('active'));
    if (user.id === 'usr_budi_01') {
      document.getElementById('menuBtnDemoBudi')?.classList.add('active');
    } else if (user.id === 'usr_rina_02') {
      document.getElementById('menuBtnDemoRina')?.classList.add('active');
    }

    const dateEl = document.getElementById('topCurrentDate');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }

    await this.refreshProspects();
    await this.policyManager.loadPolicies();
    await this.refreshDashboardStats();
  }

  async refreshProspects() {
    try {
      const res = await api.getProspects();
      this.prospects = res.prospects || [];
      this.render();
      this.populateProspectDropdowns();
      this.updateSidebarBadges();
    } catch (err) {
      console.error('Failed to load prospects:', err);
    }
  }

  async refreshDashboardStats() {
    try {
      const stats = await api.getDashboardStats();
      this.renderKPIs(stats);
      this.renderMDRT(stats);
      this.updateSidebarBadges(stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }

  populateProspectDropdowns() {
    // Policy Prospect Selector
    const polPicker = document.getElementById('polProspectSelect');
    if (polPicker) {
      const currentVal = polPicker.value;
      polPicker.innerHTML = '<option value="">-- Bukan dari Daftar Prospek (Nasabah Baru) --</option>';
      this.prospects.forEach(p => {
        polPicker.innerHTML += `<option value="${p.id}">${p.name} (${p.relationship || 'Prospek'} • ${p.phone || '-'})</option>`;
      });
      if (currentVal) polPicker.value = currentVal;
    }
  }

  updateSidebarBadges(stats = null) {
    const pCount = this.prospects.length;
    const badgeProspects = document.getElementById('badgeNavProspects');
    if (badgeProspects) badgeProspects.textContent = `${pCount}`;

    const step1Status = document.getElementById('step1Status');
    if (step1Status) step1Status.textContent = `${pCount} Calon Nasabah`;

    if (stats) {
      const badgePolicies = document.getElementById('badgeNavPolicies');
      if (badgePolicies) badgePolicies.textContent = `${stats.inForcePolicyCount || 0} Polis`;

      const badgeMDRT = document.getElementById('badgeNavMDRT');
      const target = stats.goals?.yearly_ape_target || 600000000;
      const percent = Math.min(100, Math.round(((stats.totalAPE || 0) / target) * 100));
      if (badgeMDRT) badgeMDRT.textContent = `${percent}%`;

      const step2Status = document.getElementById('step2Status');
      if (step2Status) step2Status.textContent = `${stats.activePipelines || stats.activeApproaches || 0} Agenda Temu`;

      const step4Status = document.getElementById('step4Status');
      if (step4Status) step4Status.textContent = `${stats.inForcePolicyCount || 0} Polis (${this.formatRupiah(stats.totalAPE || 0)})`;
    }

    const badgePlaybook = document.getElementById('badgeNavPlaybook');
    if (badgePlaybook && this.playbook?.playbookItems) {
      badgePlaybook.textContent = this.playbook.playbookItems.length;
      const step3Status = document.getElementById('step3Status');
      if (step3Status) step3Status.textContent = `${this.playbook.playbookItems.length} Panduan`;
    }
  }

  // --------------------------------------------------------------------------
  // Dropdowns & Selects
  // --------------------------------------------------------------------------
  populateDropdowns() {
    const formRelation = document.getElementById('formRelation');
    const filterRelation = document.getElementById('filterRelation');
    if (formRelation) {
      formRelation.innerHTML = '<option value="" disabled selected>-- Pilih Hubungan --</option>';
      RELATIONSHIPS.forEach(rel => {
        formRelation.innerHTML += `<option value="${rel}">${rel}</option>`;
        if (filterRelation) filterRelation.innerHTML += `<option value="${rel}">${rel}</option>`;
      });
    }

    const formStage = document.getElementById('formStage');
    const selectUpdateStage = document.getElementById('selectUpdateStage');
    if (formStage && selectUpdateStage) {
      formStage.innerHTML = '';
      selectUpdateStage.innerHTML = '';
      SALES_STAGES.forEach(stg => {
        formStage.innerHTML += `<option value="${stg.id}">${stg.label} (${stg.desc})</option>`;
        selectUpdateStage.innerHTML += `<option value="${stg.id}">${stg.label}</option>`;
      });
    }

    const logObjectionPreset = document.getElementById('logObjectionPreset');
    if (logObjectionPreset) {
      OBJECTION_PRESETS.forEach(obj => {
        logObjectionPreset.innerHTML += `<option value="${obj}">${obj}</option>`;
      });
    }

    const waTemplateSelect = document.getElementById('waTemplateSelect');
    if (waTemplateSelect) {
      waTemplateSelect.innerHTML = '';
      WA_TEMPLATES.forEach(tmpl => {
        waTemplateSelect.innerHTML += `<option value="${tmpl.id}">${tmpl.title}</option>`;
      });
    }
  }

  // --------------------------------------------------------------------------
  // Event Listeners
  // --------------------------------------------------------------------------
  setupEventListeners() {
    // Navigation Tabs & Sidebar Nav Items
    document.querySelectorAll('.nav-tab-btn, .sidebar-nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const sec = btn.dataset.section;
        document.querySelectorAll('.nav-tab-btn, .sidebar-nav-item').forEach(b => b.classList.remove('active'));
        document.querySelectorAll(`[data-section="${sec}"]`).forEach(b => b.classList.add('active'));
        this.switchSection(sec);
        const sidebar = document.getElementById('appSidebar');
        if (sidebar && window.innerWidth <= 768) {
          sidebar.classList.remove('active');
        }
      });
    });

    // Mobile Sidebar Toggle
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    if (sidebarToggleBtn) {
      sidebarToggleBtn.addEventListener('click', () => {
        const sidebar = document.getElementById('appSidebar');
        if (sidebar) sidebar.classList.toggle('active');
      });
    }

    // Header & Quick Action Policy Button
    const btnOpenPolicy = document.getElementById('btnHeaderOpenAddPolicy') || document.getElementById('btnSidebarOpenAddPolicy');
    if (btnOpenPolicy) {
      btnOpenPolicy.addEventListener('click', () => {
        this.policyManager.openAddPolicyModal();
      });
    }

    // Segmented Tabs in Prospect Detail Modal
    document.querySelectorAll('[data-detail-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-detail-tab');
        this.switchDetailTab(tab);
      });
    });

    // Sub-view Tabs (Kanban, Table, Agenda)
    document.querySelectorAll('.view-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentView = tab.dataset.view;
        this.renderView();
      });
    });

    // Pipeline Mode Toggle (5 Core vs 9 Detailed)
    const btnMode5 = document.getElementById('btnMode5Core');
    const btnMode9 = document.getElementById('btnMode9Detailed');
    if (btnMode5 && btnMode9) {
      btnMode5.addEventListener('click', () => {
        this.kanbanMode = '5-core';
        btnMode5.classList.add('active');
        btnMode9.classList.remove('active');
        const board = document.getElementById('kanbanBoard');
        if (board) {
          board.className = 'kanban-board mode-5-core';
        }
        this.renderKanban();
      });

      btnMode9.addEventListener('click', () => {
        this.kanbanMode = '9-detailed';
        btnMode9.classList.add('active');
        btnMode5.classList.remove('active');
        const board = document.getElementById('kanbanBoard');
        if (board) {
          board.className = 'kanban-board mode-9-detailed';
        }
        this.renderKanban();
      });
    }

    // Search & Filters
    document.getElementById('searchInput').addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.renderView();
    });

    document.getElementById('filterTemperature').addEventListener('change', (e) => {
      this.selectedTemperature = e.target.value;
      this.renderView();
    });

    document.getElementById('filterRelation').addEventListener('change', (e) => {
      this.selectedRelation = e.target.value;
      this.renderView();
    });

    document.getElementById('btnResetFilters').addEventListener('click', () => {
      document.getElementById('searchInput').value = '';
      document.getElementById('filterTemperature').value = 'all';
      document.getElementById('filterRelation').value = 'all';
      this.searchQuery = '';
      this.selectedTemperature = 'all';
      this.selectedRelation = 'all';
      this.renderView();
    });

    document.getElementById('btnFilterDueToday').addEventListener('click', () => {
      document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
      const agendaTab = document.querySelector('[data-view="agenda"]');
      if (agendaTab) agendaTab.classList.add('active');
      this.currentView = 'agenda';
      this.renderView();
    });

    // Modal Events - Support all buttons that open Add Prospect Modal
    document.querySelectorAll('#btnOpenAddModal, #btnHeaderOpenAddProspect, #btnRibbonOpenAddProspect, .btn-open-add-prospect').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openAddProspectModal();
      });
    });

    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = e.currentTarget.getAttribute('data-close');
        this.closeModal(modalId);
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
      });
    });

    // Form Submits
    document.getElementById('prospectForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleProspectFormSubmit();
    });

    document.getElementById('selectUpdateStage').addEventListener('change', async (e) => {
      if (this.activeProspectId) {
        await this.updateProspectStage(this.activeProspectId, e.target.value);
        const updatedP = this.prospects.find(item => item.id === this.activeProspectId);
        if (updatedP) {
          const container = document.getElementById('stageActionContainer');
          if (container) this.stageFormsManager.renderStageActionBox(updatedP, container);
        }
      }
    });

    document.getElementById('btnHeroWA').addEventListener('click', () => {
      if (this.activeProspectId) this.openWhatsAppModal(this.activeProspectId);
    });

    const btnHeroObj = document.getElementById('btnHeroObjectionAI');
    if (btnHeroObj) {
      btnHeroObj.addEventListener('click', () => {
        if (this.activeProspectId) {
          const prospect = this.prospects.find(p => p.id === this.activeProspectId);
          this.closeModal('modalProspectDetail');
          this.switchSection('playbook');
          if (this.playbook) this.playbook.openAddModalWithPrefill(prospect);
        }
      });
    }

    document.getElementById('btnHeroEdit').addEventListener('click', () => {
      if (this.activeProspectId) {
        this.closeModal('modalProspectDetail');
        this.openEditProspectModal(this.activeProspectId);
      }
    });

    document.getElementById('btnHeroDelete').addEventListener('click', () => {
      if (this.activeProspectId) this.deleteProspect(this.activeProspectId);
    });

    document.getElementById('btnHeroConvertToPolicy').addEventListener('click', () => {
      if (this.activeProspectId) {
        const p = this.prospects.find(item => item.id === this.activeProspectId);
        this.closeModal('modalProspectDetail');
        this.policyManager.openAddPolicyModal(p);
      }
    });

    // WhatsApp Launcher
    document.getElementById('waTemplateSelect').addEventListener('change', (e) => {
      this.updateWAMessagePreview(e.target.value);
    });

    document.getElementById('waCustomText').addEventListener('input', (e) => {
      document.getElementById('waMessagePreview').textContent = e.target.value;
    });

    document.getElementById('btnLaunchWA').addEventListener('click', () => {
      this.launchWhatsApp();
    });

    // Target Penjualan Listeners
    const btnOpenEditTargets = document.getElementById('btnOpenEditTargets');
    if (btnOpenEditTargets) {
      btnOpenEditTargets.addEventListener('click', () => this.openEditTargetsModal());
    }

    const btnRefreshTarget = document.getElementById('btnRefreshTargetProgress');
    if (btnRefreshTarget) {
      btnRefreshTarget.addEventListener('click', () => this.refreshTargetProgress());
    }

    const formEditTargets = document.getElementById('formEditTargets');
    if (formEditTargets) {
      formEditTargets.addEventListener('submit', (e) => {
        e.preventDefault();
        const prospectTarget = parseInt(document.getElementById('inputTargetProspect')?.value, 10) || 100;
        const apeTarget = parseFloat(document.getElementById('inputTargetApe')?.value) || 600000000;
        const casesTarget = parseInt(document.getElementById('inputTargetCases')?.value, 10) || 30;
        this.saveTargets({ prospectTarget, apeTarget, casesTarget });
        this.closeModal('modalEditTarget');
      });
    }
  }

  // --------------------------------------------------------------------------
  // Google Sheets Cloud Database Integration
  // --------------------------------------------------------------------------
  initGoogleSheetsConfig() {
    const btnOpen = document.getElementById('btnOpenSheetConfig');
    const menuBtnOpen = document.getElementById('menuBtnOpenSheetConfig');
    
    if (btnOpen) {
      btnOpen.addEventListener('click', () => this.openGoogleSheetsModal());
    }
    if (menuBtnOpen) {
      menuBtnOpen.addEventListener('click', () => {
        const menu = document.getElementById('profileDropdownMenu');
        if (menu) menu.classList.remove('active');
        this.openGoogleSheetsModal();
      });
    }

    const btnTest = document.getElementById('btnTestSheetConn');
    if (btnTest) {
      btnTest.addEventListener('click', () => this.handleTestSheetConnection());
    }

    const btnSave = document.getElementById('btnSaveSheetUrl');
    if (btnSave) {
      btnSave.addEventListener('click', () => this.handleSaveSheetUrl());
    }

    const btnDisconnect = document.getElementById('btnDisconnectSheet');
    if (btnDisconnect) {
      btnDisconnect.addEventListener('click', () => this.handleDisconnectSheet());
    }
  }

  openGoogleSheetsModal() {
    const input = document.getElementById('inputSheetUrl');
    if (input) input.value = api.getSheetUrl();
    const feedback = document.getElementById('sheetTestFeedback');
    if (feedback) feedback.style.display = 'none';
    this.openModal('modalGoogleSheetConfig');
  }

  async handleTestSheetConnection() {
    const input = document.getElementById('inputSheetUrl');
    const feedback = document.getElementById('sheetTestFeedback');
    const url = (input ? input.value : '').trim();

    if (!url) {
      feedback.style.display = 'block';
      feedback.style.background = '#fef2f2';
      feedback.style.border = '1px solid #fecaca';
      feedback.style.color = '#991b1b';
      feedback.innerHTML = '⚠️ Silakan masukkan URL Web App Google Apps Script terlebih dahulu.';
      return;
    }

    feedback.style.display = 'block';
    feedback.style.background = '#f0f9ff';
    feedback.style.border = '1px solid #bae6fd';
    feedback.style.color = '#0369a1';
    feedback.innerHTML = '⏳ Sedang menguji koneksi ke Google Spreadsheet... Harap tunggu.';

    try {
      const res = await api.testGoogleSheetConnection(url);
      feedback.style.background = '#ecfdf5';
      feedback.style.border = '1px solid #a7f3d0';
      feedback.style.color = '#065f46';
      feedback.innerHTML = `
        <strong>✅ KONEKSI BERHASIL!</strong><br>
        Spreadsheet: <strong>${res.spreadsheetName || 'Prudential Suite'}</strong><br>
        <span style="font-size: 0.72rem; color: #047857;">Endpoint merespons dengan status 200 OK. Klik "Simpan & Aktifkan" untuk mulai sinkronisasi data.</span>
      `;
    } catch (err) {
      feedback.style.background = '#fef2f2';
      feedback.style.border = '1px solid #fecaca';
      feedback.style.color = '#991b1b';
      feedback.innerHTML = `
        <strong>❌ GAGAL MENGHUBUNGI SPREADSHEET:</strong><br>
        ${err.message}<br>
        <div style="margin-top: 0.35rem; font-size: 0.72rem; color: #b91c1c;">
          💡 <strong>Tips Solusi:</strong><br>
          1. Di editor Apps Script, klik <strong>Deploy &gt; Manage deployments</strong>.<br>
          2. Pastikan setting <strong>Who has access</strong> diset ke <strong>Anyone</strong> (Bukan "Only myself").<br>
          3. Jika ada perubahan kode di Code.gs, klik Deploy &gt; New deployment &gt; pilih versi New.
        </div>
      `;
    }
  }

  async handleSaveSheetUrl() {
    const input = document.getElementById('inputSheetUrl');
    const url = (input ? input.value : '').trim();

    if (!url) {
      alert('Masukkan URL Web App terlebih dahulu, atau klik "Putuskan" jika ingin menggunakan SQLite lokal.');
      return;
    }

    api.setSheetUrl(url);
    this.updateDatabaseStatusBadge();
    this.closeModal('modalGoogleSheetConfig');
    this.showToast('✅ Google Spreadsheet terhubung! Memuat data...');

    await this.refreshProspects();
    await this.policyManager.loadPolicies();
    await this.refreshDashboardStats();
    if (this.playbook) await this.playbook.loadPlaybook();
    if (this.currentSection === 'mdrt') await this.loadDynamicGoals();
  }

  async handleDisconnectSheet() {
    if (confirm('Putuskan koneksi ke Google Spreadsheet dan beralih kembali ke SQLite lokal?')) {
      api.setSheetUrl('');
      const input = document.getElementById('inputSheetUrl');
      if (input) input.value = '';
      this.updateDatabaseStatusBadge();
      this.closeModal('modalGoogleSheetConfig');
      this.showToast('Beralih ke database SQLite lokal.');

      await this.refreshProspects();
      await this.policyManager.loadPolicies();
      await this.refreshDashboardStats();
      if (this.playbook) await this.playbook.loadPlaybook();
    }
  }

  updateDatabaseStatusBadge() {
    const isConnected = api.hasSheetUrl();
    const btn = document.getElementById('btnOpenSheetConfig');
    const dot = document.getElementById('sheetSyncDot');
    const text = document.getElementById('sheetSyncText');
    const menuStatus = document.getElementById('menuDbStatusText');
    const menuDot = document.getElementById('menuStatusDot');

    if (isConnected) {
      if (btn) {
        btn.classList.add('connected');
        btn.classList.remove('local', 'disconnected');
        btn.title = 'Database: Google Spreadsheet Cloud Terhubung (Klik untuk ubah)';
      }
      if (dot) {
        dot.classList.add('connected');
        dot.classList.remove('local', 'disconnected');
      }
      if (text) {
        text.style.display = 'none';
        text.textContent = '';
      }
      if (menuStatus) menuStatus.textContent = 'Google Sheets Cloud DB';
      if (menuDot) menuDot.style.background = '#10b981';
    } else {
      if (btn) {
        btn.classList.add('local');
        btn.classList.remove('connected', 'disconnected');
        btn.title = 'Database: SQLite Lokal (Klik untuk tautkan Google Spreadsheet)';
      }
      if (dot) {
        dot.classList.add('local');
        dot.classList.remove('connected', 'disconnected');
      }
      if (text) {
        text.style.display = 'none';
        text.textContent = '';
      }
      if (menuStatus) menuStatus.textContent = 'SQLite Database Aktif';
      if (menuDot) menuDot.style.background = '#3b82f6';
    }
  }

  // --------------------------------------------------------------------------
  // Navigation Section Switching
  // --------------------------------------------------------------------------
  switchSection(sectionId) {
    this.currentSection = sectionId;
    
    const secP100 = document.getElementById('project100Section');
    const secPol = document.getElementById('policiesSection');
    const secPlaybook = document.getElementById('playbookSection');
    const secTarget = document.getElementById('targetSection') || document.getElementById('mdrtSection');

    if (secP100) secP100.style.display = 'none';
    if (secPol) secPol.style.display = 'none';
    if (secPlaybook) secPlaybook.style.display = 'none';
    if (secTarget) secTarget.style.display = 'none';

    // Update active state on tabs and sidebar items
    document.querySelectorAll('.nav-tab-btn, .sidebar-nav-item').forEach(b => {
      const match = (b.dataset.section === sectionId) || 
                    ((sectionId === 'target' || sectionId === 'mdrt') && (b.dataset.section === 'target' || b.dataset.section === 'mdrt'));
      if (match) b.classList.add('active');
      else b.classList.remove('active');
    });

    // Update breadcrumb
    const breadcrumbMap = {
      project100: 'Database Calon Nasabah',
      policies: 'Portofolio Polis In-Force & Servis',
      playbook: 'Panduan Penanganan Keberatan AI',
      target: 'Target & Progres Penjualan (Google Spreadsheet)',
      mdrt: 'Target & Progres Penjualan (Google Spreadsheet)'
    };
    const breadcrumbEl = document.getElementById('topBreadcrumb');
    if (breadcrumbEl && breadcrumbMap[sectionId]) {
      breadcrumbEl.textContent = breadcrumbMap[sectionId];
    }

    if (sectionId === 'project100' && secP100) {
      secP100.style.display = 'block';
      this.render();
    } else if (sectionId === 'policies' && secPol) {
      secPol.style.display = 'block';
      this.policyManager.loadPolicies();
    } else if (sectionId === 'playbook' && secPlaybook) {
      secPlaybook.style.display = 'block';
      this.playbook.loadPlaybook();
    } else if ((sectionId === 'target' || sectionId === 'mdrt') && secTarget) {
      secTarget.style.display = 'block';
      this.renderTargetPage();
    }
  }

  // --------------------------------------------------------------------------
  // Target & Progres Penjualan (Google Spreadsheet Sync)
  // --------------------------------------------------------------------------
  getTargets() {
    try {
      const saved = localStorage.getItem('pru_agent_targets');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      prospectTarget: 100,
      apeTarget: 600000000,
      casesTarget: 30
    };
  }

  saveTargets(targets) {
    localStorage.setItem('pru_agent_targets', JSON.stringify(targets));
    this.renderTargetPage();
    this.showToast('Target penjualan berhasil diperbarui!');
  }

  openEditTargetsModal() {
    const targets = this.getTargets();
    const elProspect = document.getElementById('inputTargetProspect');
    const elApe = document.getElementById('inputTargetApe');
    const elCases = document.getElementById('inputTargetCases');

    if (elProspect) elProspect.value = targets.prospectTarget || 100;
    if (elApe) elApe.value = targets.apeTarget || 600000000;
    if (elCases) elCases.value = targets.casesTarget || 30;

    this.openModal('modalEditTarget');
  }

  async refreshTargetProgress() {
    this.showToast('Memperbarui data dari Google Spreadsheet...');
    await this.refreshProspects();
    if (this.policyManager) await this.policyManager.loadPolicies();
    this.renderTargetPage();
    this.showToast('Data progres berhasil disegarkan!');
  }

  renderTargetPage() {
    const targets = this.getTargets();

    // 1. Hitung Calon Nasabah dari this.prospects (Real dari Google Spreadsheet)
    const currentProspects = this.prospects ? this.prospects.length : 0;
    const goalProspects = Number(targets.prospectTarget) || 100;
    const prospectPercent = Math.min(100, Math.round((currentProspects / goalProspects) * 100));

    // 2. Hitung Polis & Premi APE dari this.policyManager.policies (Real dari Google Spreadsheet)
    let currentPolicies = 0;
    let currentAPE = 0;
    if (this.policyManager && Array.isArray(this.policyManager.policies)) {
      currentPolicies = this.policyManager.policies.length;
      currentAPE = this.policyManager.policies.reduce((sum, pol) => {
        return sum + (Number(pol.ape_amount || pol.apeAmount) || 0);
      }, 0);
    }
    const goalApe = Number(targets.apeTarget) || 600000000;
    const apePercent = Math.min(100, Math.round((currentAPE / goalApe) * 100));

    const goalCases = Number(targets.casesTarget) || 30;
    const casesPercent = Math.min(100, Math.round((currentPolicies / goalCases) * 100));

    // DOM Target Calon Nasabah
    const elProspectCur = document.getElementById('targetProspectCurrent');
    if (elProspectCur) elProspectCur.textContent = currentProspects;
    const elProspectGoal = document.getElementById('targetProspectGoal');
    if (elProspectGoal) elProspectGoal.textContent = goalProspects;
    const elProspectPct = document.getElementById('targetProspectPercent');
    if (elProspectPct) elProspectPct.textContent = `${prospectPercent}%`;
    const elProspectBar = document.getElementById('targetProspectBar');
    if (elProspectBar) elProspectBar.style.width = `${prospectPercent}%`;
    const elProspectStatus = document.getElementById('targetProspectStatus');
    if (elProspectStatus) {
      elProspectStatus.textContent = currentProspects >= goalProspects 
        ? '🎉 Target tercapai!' 
        : `Kurang ${goalProspects - currentProspects} calon nasabah`;
    }

    // DOM Target Premi APE
    const elApeCur = document.getElementById('targetApeCurrent');
    if (elApeCur) elApeCur.textContent = this.formatRupiah(currentAPE);
    const elApeGoal = document.getElementById('targetApeGoal');
    if (elApeGoal) elApeGoal.textContent = this.formatRupiah(goalApe);
    const elApePct = document.getElementById('targetApePercent');
    if (elApePct) elApePct.textContent = `${apePercent}%`;
    const elApeBar = document.getElementById('targetApeBar');
    if (elApeBar) elApeBar.style.width = `${apePercent}%`;
    const elApeStatus = document.getElementById('targetApeStatus');
    if (elApeStatus) {
      elApeStatus.textContent = currentAPE >= goalApe 
        ? '🏆 Kualifikasi MDRT Tercapai!' 
        : `Kurang ${this.formatRupiah(Math.max(0, goalApe - currentAPE))}`;
    }

    // DOM Target Polis Terbit (Cases)
    const elCasesCur = document.getElementById('targetCasesCurrent');
    if (elCasesCur) elCasesCur.textContent = currentPolicies;
    const elCasesGoal = document.getElementById('targetCasesGoal');
    if (elCasesGoal) elCasesGoal.textContent = goalCases;
    const elCasesPct = document.getElementById('targetCasesPercent');
    if (elCasesPct) elCasesPct.textContent = `${casesPercent}%`;
    const elCasesBar = document.getElementById('targetCasesBar');
    if (elCasesBar) elCasesBar.style.width = `${casesPercent}%`;
    const elCasesStatus = document.getElementById('targetCasesStatus');
    if (elCasesStatus) {
      elCasesStatus.textContent = currentPolicies >= goalCases 
        ? '🎉 Target tercapai!' 
        : `Kurang ${goalCases - currentPolicies} polis`;
    }

    // Badge Nav Tab
    const badgeNavTarget = document.getElementById('badgeNavTarget') || document.getElementById('badgeNavMDRT');
    if (badgeNavTarget) badgeNavTarget.textContent = `${apePercent}%`;

    // Pipeline funnel breakdown
    let suspectCount = 0;
    let approachCount = 0;
    let apptCount = 0;
    let presentCount = 0;
    let closingCount = 0;

    (this.prospects || []).forEach(p => {
      const st = (p.stage || '').toLowerCase();
      if (st.includes('suspect') || st.includes('bank')) suspectCount++;
      else if (st.includes('approach') || st.includes('pendekatan')) approachCount++;
      else if (st.includes('appointment') || st.includes('temu') || st.includes('janji')) apptCount++;
      else if (st.includes('fact') || st.includes('present') || st.includes('kebutuhan') || st.includes('solusi') || st.includes('objection')) presentCount++;
      else if (st.includes('closing') || st.includes('agreement') || st.includes('spaj') || st.includes('in-force') || st.includes('terbit')) closingCount++;
      else suspectCount++;
    });

    const elP1 = document.getElementById('pipeSuspectCount');
    if (elP1) elP1.textContent = suspectCount;
    const elP2 = document.getElementById('pipeApproachCount');
    if (elP2) elP2.textContent = approachCount;
    const elP3 = document.getElementById('pipeApptCount');
    if (elP3) elP3.textContent = apptCount;
    const elP4 = document.getElementById('pipePresentCount');
    if (elP4) elP4.textContent = presentCount;
    const elP5 = document.getElementById('pipeClosingCount');
    if (elP5) elP5.textContent = closingCount;
  }

  // --------------------------------------------------------------------------
  // Filters & Metrics Rendering
  // --------------------------------------------------------------------------
  getFilteredProspects() {
    return this.prospects.filter(p => {
      const query = this.searchQuery.trim();
      if (query) {
        const matchName = (p.name || '').toLowerCase().includes(query);
        const matchJob = (p.job || '').toLowerCase().includes(query);
        const matchAddress = (p.address || '').toLowerCase().includes(query);
        const matchPhone = (p.phone || '').includes(query);
        const matchRelation = (p.relation || '').toLowerCase().includes(query);
        const matchObjection = (p.lastObjection || '').toLowerCase().includes(query);
        if (!matchName && !matchJob && !matchAddress && !matchPhone && !matchRelation && !matchObjection) {
          return false;
        }
      }

      if (this.selectedTemperature !== 'all' && p.temperature !== this.selectedTemperature) return false;
      if (this.selectedRelation !== 'all' && p.relation !== this.selectedRelation) return false;

      return true;
    });
  }

  render() {
    this.renderAlertBanner();
    this.renderView();
  }

  renderKPIs(stats) {
    if (!stats) return;
    document.getElementById('kpiTotalProspects').textContent = stats.totalProspects || 0;
    document.getElementById('kpiHotCount').textContent = stats.hotCount || 0;
    document.getElementById('kpiActiveApproaches').textContent = stats.activePipelines || 0;
    document.getElementById('kpiClosingCount').textContent = stats.closingCount || 0;

    const metricApeEl = document.getElementById('metricTotalAPE');
    if (metricApeEl) metricApeEl.textContent = this.formatRupiah(stats.totalAPE || 0);

    const percent = Math.min(100, Math.round(((stats.totalProspects || 0) / 100) * 100));
    document.getElementById('kpiProgressBar').style.width = `${percent}%`;
  }

  renderMDRT(stats) {
    if (!stats) return;
    const targetAPE = stats.goals?.yearly_ape_target || 600000000;
    const currentAPE = stats.totalAPE || 0;
    const percent = Math.min(100, Math.round((currentAPE / targetAPE) * 100));

    const targetEl = document.getElementById('mdrtTargetVal');
    const percentEl = document.getElementById('mdrtCurrentPercent');
    const barEl = document.getElementById('mdrtProgressBar');

    if (targetEl) targetEl.textContent = this.formatRupiah(targetAPE);
    if (percentEl) percentEl.textContent = `${percent}% (${this.formatRupiah(currentAPE)} APE)`;
    if (barEl) barEl.style.width = `${percent}%`;

    this.loadDynamicGoals();
  }

  renderAlertBanner() {
    const todayStr = new Date().toISOString().split('T')[0];
    let dueToday = 0;
    let overdue = 0;

    this.prospects.forEach(p => {
      if (p.targetFollowUp) {
        if (p.targetFollowUp === todayStr) dueToday++;
        else if (p.targetFollowUp < todayStr) overdue++;
      }
    });

    const banner = document.getElementById('followupAlertBanner');
    if (dueToday > 0 || overdue > 0) {
      banner.style.display = 'flex';
      document.getElementById('alertBannerTitle').textContent = `Perhatian: Ada ${dueToday + overdue} Jadwal Follow-Up Memerlukan Tindakan!`;
      document.getElementById('alertBannerSubtitle').textContent = `${dueToday} prospek hari ini, ${overdue} prospek telah terlewat.`;
    } else {
      banner.style.display = 'none';
    }
  }

  renderView() {
    const kanbanContainer = document.getElementById('kanbanViewContainer');
    const tableContainer = document.getElementById('tableViewContainer');
    const agendaContainer = document.getElementById('agendaViewContainer');
    const toggleWrapper = document.getElementById('pipelineModeToggleWrapper');

    kanbanContainer.style.display = 'none';
    tableContainer.style.display = 'none';
    agendaContainer.style.display = 'none';
    if (toggleWrapper) toggleWrapper.style.display = 'none';

    if (this.currentView === 'kanban') {
      kanbanContainer.style.display = 'block';
      if (toggleWrapper) toggleWrapper.style.display = 'flex';
      this.renderKanban();
    } else if (this.currentView === 'table') {
      tableContainer.style.display = 'block';
      this.renderTable();
    } else if (this.currentView === 'agenda') {
      agendaContainer.style.display = 'block';
      this.renderAgenda();
    }
  }

  // --------------------------------------------------------------------------
  // KANBAN PIPELINE (PROPORTIONATE 5 CORE FASES OR 9 DETAILED)
  // --------------------------------------------------------------------------
  renderKanban() {
    const board = document.getElementById('kanbanBoard');
    board.innerHTML = '';

    const filtered = this.getFilteredProspects();

    if (this.kanbanMode === '5-core') {
      // 5 FASE UTAMA (Fits naturally on standard screens)
      CORE_PIPELINE_STAGES.forEach(coreStage => {
        const columnProspects = filtered.filter(p => {
          const currentStage = p.stage || 'suspect';
          return coreStage.subStages.includes(currentStage);
        });

        const colEl = document.createElement('div');
        colEl.className = 'kanban-column';
        colEl.dataset.stageGroup = coreStage.id;

        colEl.innerHTML = `
          <div class="kanban-header">
            <div class="col-title-group">
              <span class="col-title">${coreStage.label}</span>
            </div>
            <span class="col-count">${columnProspects.length}</span>
          </div>
          <div class="kanban-cards-area"></div>
        `;

        const cardsArea = colEl.querySelector('.kanban-cards-area');

        colEl.addEventListener('dragover', (e) => {
          e.preventDefault();
          if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
          colEl.classList.add('drag-over');
        });

        colEl.addEventListener('dragleave', () => colEl.classList.remove('drag-over'));

        colEl.addEventListener('drop', async (e) => {
          e.preventDefault();
          colEl.classList.remove('drag-over');
          const pId = (e.dataTransfer && e.dataTransfer.getData('text/plain')) || this.draggedProspectId;
          if (pId) {
            // Assign to the primary stage of this group
            const defaultTargetStage = coreStage.subStages[0];
            await this.updateProspectStage(pId, defaultTargetStage);
          }
        });

        if (columnProspects.length === 0) {
          cardsArea.innerHTML = `<div style="text-align: center; padding: 1.5rem 0.5rem; color: #94a3b8; font-size: 0.75rem;">Kosong</div>`;
        } else {
          columnProspects.forEach(p => {
            cardsArea.appendChild(this.createKanbanCard(p, true));
          });
        }

        board.appendChild(colEl);
      });
    } else {
      // 9 TAHAP DETAIL
      SALES_STAGES.forEach(stage => {
        const columnProspects = filtered.filter(p => (p.stage || 'suspect') === stage.id);

        const colEl = document.createElement('div');
        colEl.className = 'kanban-column';
        colEl.dataset.stageId = stage.id;

        colEl.innerHTML = `
          <div class="kanban-header">
            <div class="col-title-group">
              <span class="col-title">${stage.label}</span>
            </div>
            <span class="col-count">${columnProspects.length}</span>
          </div>
          <div class="kanban-cards-area"></div>
        `;

        const cardsArea = colEl.querySelector('.kanban-cards-area');

        colEl.addEventListener('dragover', (e) => {
          e.preventDefault();
          if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
          colEl.classList.add('drag-over');
        });

        colEl.addEventListener('dragleave', () => colEl.classList.remove('drag-over'));

        colEl.addEventListener('drop', async (e) => {
          e.preventDefault();
          colEl.classList.remove('drag-over');
          const pId = (e.dataTransfer && e.dataTransfer.getData('text/plain')) || this.draggedProspectId;
          if (pId) {
            await this.updateProspectStage(pId, stage.id);
          }
        });

        if (columnProspects.length === 0) {
          cardsArea.innerHTML = `<div style="text-align: center; padding: 1.5rem 0.5rem; color: #94a3b8; font-size: 0.75rem;">Kosong</div>`;
        } else {
          columnProspects.forEach(p => {
            cardsArea.appendChild(this.createKanbanCard(p, false));
          });
        }

        board.appendChild(colEl);
      });
    }

    this.renderMobileKanbanStageTabs(filtered);
    this.applyMobileKanbanVisibility();
  }

  renderMobileKanbanStageTabs(filtered = []) {
    const tabsContainer = document.getElementById('mobileKanbanStageTabs');
    if (!tabsContainer) return;
    tabsContainer.innerHTML = '';

    const stagesList = [];
    if (this.kanbanMode === '5-core') {
      stagesList.push({ id: 'all', label: 'Semua', count: filtered.length });
      CORE_PIPELINE_STAGES.forEach(cs => {
        const count = filtered.filter(p => cs.subStages.includes(p.stage || 'suspect')).length;
        stagesList.push({ id: cs.id, label: cs.label, count });
      });
    } else {
      stagesList.push({ id: 'all', label: 'Semua', count: filtered.length });
      SALES_STAGES.forEach(s => {
        const count = filtered.filter(p => (p.stage || 'suspect') === s.id).length;
        stagesList.push({ id: s.id, label: s.label, count });
      });
    }

    stagesList.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `mobile-stage-pill ${this.activeMobileStage === item.id ? 'active' : ''}`;
      btn.dataset.stageId = item.id;
      btn.innerHTML = `<span>${item.label}</span><span class="pill-count">${item.count}</span>`;
      btn.addEventListener('click', () => {
        this.activeMobileStage = item.id;
        tabsContainer.querySelectorAll('.mobile-stage-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.applyMobileKanbanVisibility();
      });
      tabsContainer.appendChild(btn);
    });
  }

  applyMobileKanbanVisibility() {
    const isMobile = window.innerWidth <= 768;
    const columns = document.querySelectorAll('.kanban-column');
    if (!isMobile) {
      columns.forEach(col => col.style.display = '');
      return;
    }

    columns.forEach(col => {
      const stageKey = this.kanbanMode === '5-core' ? col.dataset.stageGroup : col.dataset.stageId;
      if (this.activeMobileStage === 'all' || stageKey === this.activeMobileStage) {
        col.style.display = 'flex';
      } else {
        col.style.display = 'none';
      }
    });
  }

  createKanbanCard(prospect, showSubStageTag = false) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;
    card.dataset.id = prospect.id;
    card.dataset.temperature = prospect.temperature || 'cold';

    let tempBadge = '';
    if (prospect.temperature === 'hot') tempBadge = `<span class="badge badge-hot">Pasar Dekat</span>`;
    else if (prospect.temperature === 'warm') tempBadge = `<span class="badge badge-warm">Pasar Menengah</span>`;
    else tempBadge = `<span class="badge badge-cold">Pasar Baru</span>`;

    const manM = prospect.qualifications?.money ? 'active' : '';
    const manA = prospect.qualifications?.authority ? 'active' : '';
    const manN = prospect.qualifications?.need ? 'active' : '';

    const todayStr = new Date().toISOString().split('T')[0];
    let targetClass = '';
    let targetLabel = '';
    if (prospect.targetFollowUp) {
      if (prospect.targetFollowUp < todayStr) {
        targetClass = 'overdue';
        targetLabel = `Lewat: ${this.formatShortDate(prospect.targetFollowUp)}`;
      } else if (prospect.targetFollowUp === todayStr) {
        targetClass = 'today';
        targetLabel = `Hari Ini`;
      } else {
        targetLabel = `Target: ${this.formatShortDate(prospect.targetFollowUp)}`;
      }
    }

    let objectionHtml = '';
    if (prospect.lastObjection && prospect.lastObjection !== '-') {
      objectionHtml = `
        <div class="card-objection-pill" title="${prospect.lastObjection}">
          <span style="font-weight: 700; color: #b91c1c;">Kendala:</span>
          <span>${prospect.lastObjection}</span>
        </div>
      `;
    }

    const stageObj = SALES_STAGES.find(s => s.id === prospect.stage) || SALES_STAGES[0];
    const subStageHtml = showSubStageTag
      ? `<span class="badge-stage-tag">${stageObj.label}</span>`
      : '';

    // Multi-needs badge pills
    let needsHtml = '';
    if (prospect.needs && Array.isArray(prospect.needs) && prospect.needs.length > 0) {
      needsHtml = `
        <div class="card-needs-row" title="Kebutuhan Teridentifikasi">
          ${prospect.needs.map(n => `<span class="badge-need-pill">${n.label || n.id}</span>`).join('')}
        </div>
      `;
    }

    // Quick stage selector options
    let stageSelectOptions = '';
    SALES_STAGES.forEach(s => {
      stageSelectOptions += `<option value="${s.id}" ${s.id === (prospect.stage || 'suspect') ? 'selected' : ''}>${s.label}</option>`;
    });

    card.innerHTML = `
      <div class="card-top-row">
        <span class="card-name">${prospect.name}</span>
        ${tempBadge}
      </div>

      <div class="card-meta">
        <div class="meta-row">
          <span class="badge badge-relation">${prospect.relation || 'Relasi Umum'}</span>
        </div>
        <div class="meta-row">
          <span>${prospect.job || '-'}</span>
          <span style="margin: 0 0.2rem; color: #cbd5e1;">•</span>
          <span>${prospect.address || '-'}</span>
        </div>
        ${subStageHtml ? `<div class="meta-row" style="margin-top: 0.15rem;">${subStageHtml}</div>` : ''}
      </div>

      ${needsHtml}
      ${objectionHtml}
      ${prospect.targetFollowUp ? `<div class="card-target-date ${targetClass}">${targetLabel}</div>` : ''}

      <div style="margin-top: 0.35rem; display: flex; align-items: center; justify-content: space-between; gap: 0.3rem;">
        <span style="font-size: 0.68rem; color: #64748b; font-weight: 500;">Tahap:</span>
        <select class="card-stage-dropdown form-select-xs" style="flex: 1; font-size: 0.72rem; padding: 0.15rem 0.3rem;" title="Ubah Tahap Cepat">
          ${stageSelectOptions}
        </select>
      </div>

      <div class="card-actions">
        <div class="card-actions-left">
          <button class="btn btn-whatsapp btn-sm btn-open-wa" title="WhatsApp">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            <span>WA</span>
          </button>
          <button class="btn btn-outline btn-sm btn-add-log" title="Catat Aktivitas">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            <span>Log</span>
          </button>
        </div>
        <button class="btn btn-outline btn-sm btn-view-detail" title="Detail">
          <span>Detail</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    `;

    let isDragging = false;

    card.addEventListener('dragstart', (e) => {
      isDragging = true;
      this.draggedProspectId = prospect.id;
      card.classList.add('dragging');
      if (e.dataTransfer) {
        e.dataTransfer.setData('text/plain', prospect.id);
        e.dataTransfer.effectAllowed = 'move';
      }
    });

    card.addEventListener('dragend', () => {
      this.draggedProspectId = null;
      card.classList.remove('dragging');
      setTimeout(() => { isDragging = false; }, 150);
    });

    // Quick stage change listener
    const stageSelect = card.querySelector('.card-stage-dropdown');
    if (stageSelect) {
      stageSelect.addEventListener('change', async (e) => {
        e.stopPropagation();
        await this.updateProspectStage(prospect.id, e.target.value);
      });
      stageSelect.addEventListener('click', (e) => e.stopPropagation());
    }

    card.querySelector('.btn-open-wa').addEventListener('click', (e) => {
      e.stopPropagation();
      this.openWhatsAppModal(prospect.id);
    });

    card.querySelector('.btn-add-log').addEventListener('click', (e) => {
      e.stopPropagation();
      this.openDetailModal(prospect.id, true);
    });

    card.querySelector('.btn-view-detail').addEventListener('click', (e) => {
      e.stopPropagation();
      this.openDetailModal(prospect.id);
    });

    card.addEventListener('click', () => {
      if (isDragging) return;
      this.openDetailModal(prospect.id);
    });

    return card;
  }

  // --------------------------------------------------------------------------
  // TABLE & AGENDA VIEWS
  // --------------------------------------------------------------------------
  renderTable() {
    const tbody = document.getElementById('prospectTableBody');
    tbody.innerHTML = '';

    const filtered = this.getFilteredProspects();
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 2rem; color: #94a3b8;">Tidak ada data prospek.</td></tr>`;
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    filtered.forEach(p => {
      const tr = document.createElement('tr');
      const stageObj = SALES_STAGES.find(s => s.id === p.stage) || SALES_STAGES[0];

      let tempBadge = '';
      if (p.temperature === 'hot') tempBadge = `<span class="badge badge-hot">Pasar Dekat</span>`;
      else if (p.temperature === 'warm') tempBadge = `<span class="badge badge-warm">Pasar Menengah</span>`;
      else tempBadge = `<span class="badge badge-cold">Pasar Baru</span>`;

      let targetHtml = '-';
      if (p.targetFollowUp) {
        if (p.targetFollowUp < todayStr) {
          targetHtml = `<span style="color: #dc2626; font-weight: 700;">Lewat: ${this.formatShortDate(p.targetFollowUp)}</span>`;
        } else if (p.targetFollowUp === todayStr) {
          targetHtml = `<span style="color: #d97706; font-weight: 700;">Hari Ini</span>`;
        } else {
          targetHtml = this.formatShortDate(p.targetFollowUp);
        }
      }

      tr.innerHTML = `
        <td>
          <strong style="color: var(--color-slate-900);">${p.name}</strong>
          <div><span class="badge badge-relation" style="font-size: 0.65rem;">${p.relation || '-'}</span></div>
        </td>
        <td>
          <div>${p.phone}</div>
          <span style="font-size: 0.725rem; color: var(--color-slate-500);">${p.address || '-'}</span>
        </td>
        <td>
          <div>${p.job || '-'}</div>
        </td>
        <td>
          <span style="font-size: 0.775rem; font-weight: 600;">${stageObj.label}</span>
        </td>
        <td>${tempBadge}</td>
        <td style="font-size: 0.75rem; color: var(--color-slate-500);">${p.lastContactDate ? this.formatShortDate(p.lastContactDate) : '-'}</td>
        <td style="font-size: 0.75rem;">${targetHtml}</td>
        <td style="max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.75rem;">
          ${p.lastObjection && p.lastObjection !== '-' ? `<span style="color: #b91c1c; font-weight: 600;">${p.lastObjection}</span>` : '-'}
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <button class="btn btn-whatsapp btn-sm btn-table-wa" title="Kirim WhatsApp" style="display: inline-flex; align-items: center; gap: 0.35rem;">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <span>WhatsApp</span>
          </button>
          <button class="btn btn-outline btn-sm btn-table-detail" title="Lihat Detail" style="display: inline-flex; align-items: center; gap: 0.35rem;">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span>Detail</span>
          </button>
        </td>
      `;

      tr.querySelector('.btn-table-wa').addEventListener('click', () => this.openWhatsAppModal(p.id));
      tr.querySelector('.btn-table-detail').addEventListener('click', () => this.openDetailModal(p.id));

      tbody.appendChild(tr);
    });
  }

  renderAgenda() {
    const overdueList = document.getElementById('agendaOverdueList');
    const todayList = document.getElementById('agendaTodayList');
    const upcomingList = document.getElementById('agendaUpcomingList');

    overdueList.innerHTML = '';
    todayList.innerHTML = '';
    upcomingList.innerHTML = '';

    const todayStr = new Date().toISOString().split('T')[0];

    const overdueArr = [];
    const todayArr = [];
    const upcomingArr = [];

    this.prospects.forEach(p => {
      if (p.targetFollowUp) {
        if (p.targetFollowUp < todayStr) overdueArr.push(p);
        else if (p.targetFollowUp === todayStr) todayArr.push(p);
        else upcomingArr.push(p);
      }
    });

    document.getElementById('badgeOverdueCount').textContent = overdueArr.length;
    document.getElementById('badgeTodayCount').textContent = todayArr.length;
    document.getElementById('badgeUpcomingCount').textContent = upcomingArr.length;

    const renderCard = (p, isOverdue = false) => {
      const card = document.createElement('div');
      card.style = "background: var(--color-slate-50); border: 1px solid var(--border-subtle); border-radius: var(--r-sm); padding: 0.75rem; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;";
      card.innerHTML = `
        <div>
          <div style="font-weight: 700; font-size: 0.85rem; color: var(--color-slate-900);">${p.name}</div>
          <div style="font-size: 0.725rem; color: var(--color-slate-500);">${p.relation} • ${p.job || '-'}</div>
          <div style="font-size: 0.7rem; color: ${isOverdue ? '#dc2626' : 'var(--pru-red)'}; font-weight: 600; margin-top: 0.15rem;">
            Target: ${this.formatShortDate(p.targetFollowUp)}
          </div>
        </div>
        <div style="display: flex; gap: 0.3rem;">
          <button class="btn btn-whatsapp btn-sm btn-agenda-wa">WhatsApp</button>
          <button class="btn btn-outline btn-sm btn-agenda-log">Log</button>
        </div>
      `;
      card.querySelector('.btn-agenda-wa').addEventListener('click', () => this.openWhatsAppModal(p.id));
      card.querySelector('.btn-agenda-log').addEventListener('click', () => this.openDetailModal(p.id, true));
      return card;
    };

    if (overdueArr.length === 0) overdueList.innerHTML = `<p style="font-size: 0.75rem; color: #94a3b8; text-align: center; padding: 0.75rem;">Tidak ada jadwal terlewat.</p>`;
    else overdueArr.forEach(p => overdueList.appendChild(renderCard(p, true)));

    if (todayArr.length === 0) todayList.innerHTML = `<p style="font-size: 0.75rem; color: #94a3b8; text-align: center; padding: 0.75rem;">Tidak ada target follow-up hari ini.</p>`;
    else todayArr.forEach(p => todayList.appendChild(renderCard(p, false)));

    if (upcomingArr.length === 0) upcomingList.innerHTML = `<p style="font-size: 0.75rem; color: #94a3b8; text-align: center; padding: 0.75rem;">Belum ada jadwal mendatang.</p>`;
    else upcomingArr.forEach(p => upcomingList.appendChild(renderCard(p, false)));
  }

  // --------------------------------------------------------------------------
  // Prospect CRUD
  // --------------------------------------------------------------------------
  openAddProspectModal() {
    document.getElementById('formModalTitle').textContent = 'Tambah Calon Nasabah Baru';
    document.getElementById('prospectForm').reset();
    document.getElementById('formProspectId').value = '';
    
    // Default tahap penjualan ke "1. Daftar Nama" (suspect)
    const formStage = document.getElementById('formStage');
    if (formStage) formStage.value = 'suspect';

    const targetFollowUpEl = document.getElementById('formTargetFollowUp');
    if (targetFollowUpEl) {
      targetFollowUpEl.value = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    }

    this.openModal('modalProspectForm');
  }

  openEditProspectModal(prospectId) {
    const p = this.prospects.find(item => item.id === prospectId);
    if (!p) return;

    document.getElementById('formModalTitle').textContent = 'Edit Data Calon Nasabah';
    document.getElementById('formProspectId').value = p.id;
    document.getElementById('formName').value = p.name || '';
    document.getElementById('formPhone').value = p.phone || '';
    if (document.getElementById('formRelation')) document.getElementById('formRelation').value = p.relation || 'Teman';
    if (document.getElementById('formTemperature')) document.getElementById('formTemperature').value = p.temperature || 'warm';
    if (document.getElementById('formJob')) document.getElementById('formJob').value = p.job || '';
    if (document.getElementById('formAddress')) document.getElementById('formAddress').value = p.address || '';
    if (document.getElementById('formStage')) document.getElementById('formStage').value = p.stage || 'suspect';
    if (document.getElementById('formTargetFollowUp')) document.getElementById('formTargetFollowUp').value = p.targetFollowUp || '';
    if (document.getElementById('formNotes')) document.getElementById('formNotes').value = p.notes || '';

    this.openModal('modalProspectForm');
  }

  async handleProspectFormSubmit() {
    const idInput = document.getElementById('formProspectId').value;
    const name = document.getElementById('formName').value.trim();
    const phone = document.getElementById('formPhone').value.trim();
    const relation = document.getElementById('formRelation')?.value || 'Teman';
    const temperature = document.getElementById('formTemperature')?.value || 'warm';
    const job = document.getElementById('formJob')?.value.trim() || '';
    const address = document.getElementById('formAddress')?.value.trim() || '';
    const stage = document.getElementById('formStage')?.value || 'suspect'; // Default: suspect (1. Daftar Nama)
    const targetFollowUp = document.getElementById('formTargetFollowUp')?.value || '';
    const notes = document.getElementById('formNotes')?.value.trim() || '';

    const qualifications = {
      money: true,
      authority: true,
      need: true
    };

    try {
      if (idInput) {
        await api.updateProspect(idInput, {
          name, phone, relation, temperature, job,
          address, stage, targetFollowUp, notes, qualifications
        });
        this.showToast(`Data ${name} berhasil diperbarui.`);
      } else {
        await api.createProspect({
          name, phone, relation, temperature, job,
          address, stage, targetFollowUp, notes, qualifications
        });
        this.showToast(`Calon nasabah ${name} berhasil ditambahkan!`);
      }

      this.closeModal('modalProspectForm');
      await this.refreshProspects();
      await this.refreshDashboardStats();
    } catch (err) {
      alert('Gagal menyimpan prospek: ' + err.message);
    }
  }

  async deleteProspect(prospectId) {
    const p = this.prospects.find(item => item.id === prospectId);
    if (!p) return;

    if (confirm(`Hapus prospek "${p.name}"?`)) {
      try {
        await api.deleteProspect(prospectId);
        this.closeModal('modalProspectDetail');
        this.showToast(`Prospek ${p.name} telah dihapus.`);
        await this.refreshProspects();
        await this.refreshDashboardStats();
      } catch (err) {
        alert('Gagal menghapus: ' + err.message);
      }
    }
  }

  async updateProspectStage(prospectId, newStageId) {
    try {
      await api.updateProspectStage(prospectId, newStageId);
      const stageObj = SALES_STAGES.find(s => s.id === newStageId);
      this.showToast(`Tahap diubah: ${stageObj ? stageObj.label : newStageId}`);
      await this.refreshProspects();
      await this.refreshDashboardStats();
    } catch (err) {
      alert('Gagal memperbarui tahap: ' + err.message);
    }
  }

  switchDetailTab(tabName) {
    const tabs = ['tabProfile', 'tabAction', 'tabHistory'];
    tabs.forEach(t => {
      const btn = document.querySelector(`[data-detail-tab="${t}"]`);
      const pane = document.getElementById(
        t === 'tabProfile' ? 'paneDetailProfile' :
        t === 'tabAction' ? 'paneDetailAction' : 'paneDetailHistory'
      );
      if (btn) btn.classList.toggle('active', t === tabName);
      if (pane) pane.style.display = (t === tabName) ? 'block' : 'none';
    });
  }

  // --------------------------------------------------------------------------
  // Detail Modal & History
  // --------------------------------------------------------------------------
  openDetailModal(prospectId, focusAddLog = false) {
    const p = this.prospects.find(item => item.id === prospectId);
    if (!p) return;

    this.activeProspectId = prospectId;

    // Header & Meta
    document.getElementById('heroName').textContent = p.name;
    document.getElementById('heroPhone').textContent = p.phone;
    document.getElementById('heroJobLocation').textContent = `${p.job || '-'} (${p.address || 'Domisili -'})`;
    document.getElementById('heroNotes').textContent = p.notes || '-';

    const tempBadge = document.getElementById('heroTempBadge');
    if (tempBadge) {
      if (p.temperature === 'hot') {
        tempBadge.className = 'badge badge-hot';
        tempBadge.textContent = 'Pasar Dekat';
      } else if (p.temperature === 'warm') {
        tempBadge.className = 'badge badge-warm';
        tempBadge.textContent = 'Pasar Menengah';
      } else {
        tempBadge.className = 'badge badge-cold';
        tempBadge.textContent = 'Pasar Baru';
      }
    }

    const heroRelation = document.getElementById('heroRelationBadge');
    if (heroRelation) heroRelation.textContent = p.relation || 'Relasi';

    // Stage Status
    const stageObj = SALES_STAGES.find(s => s.id === p.stage) || SALES_STAGES[0];
    const currentStageLabel = document.getElementById('currentStageLabel');
    if (currentStageLabel) currentStageLabel.textContent = stageObj.label;
    const selectUpdateStage = document.getElementById('selectUpdateStage');
    if (selectUpdateStage) selectUpdateStage.value = p.stage || 'suspect';

    // Detailed Info Card Values
    const phoneVal = document.getElementById('detailPhoneVal');
    if (phoneVal) phoneVal.textContent = p.phone || '-';
    const jobVal = document.getElementById('detailJobVal');
    if (jobVal) jobVal.textContent = p.job || '-';
    const addrVal = document.getElementById('detailAddressVal');
    if (addrVal) addrVal.textContent = p.address || '-';
    const incVal = document.getElementById('detailIncomeVal');
    if (incVal) incVal.textContent = p.estimatedIncome || p.estimated_income || '-';
    const targetVal = document.getElementById('detailTargetFollowUpVal');
    if (targetVal) targetVal.textContent = p.targetFollowUp || p.target_follow_up || '-';
    const lastContactVal = document.getElementById('detailLastContactVal');
    if (lastContactVal) lastContactVal.textContent = p.lastContactDate || p.last_contact_date || '-';

    // M.A.N Pills
    const q = p.qualifications || {};
    const manM = document.getElementById('detailManMoney');
    const manA = document.getElementById('detailManAuth');
    const manN = document.getElementById('detailManNeed');
    if (manM) manM.className = `detail-man-pill ${q.money || p.money_qualified ? 'qualified' : ''}`;
    if (manA) manA.className = `detail-man-pill ${q.authority || p.authority_qualified ? 'qualified' : ''}`;
    if (manN) manN.className = `detail-man-pill ${q.need || p.need_qualified ? 'qualified' : ''}`;

    // History Counter Badge
    const historyBadge = document.getElementById('detailHistoryBadge');
    if (historyBadge) historyBadge.textContent = (p.history || []).length;

    // Render Timeline & Stage Forms
    this.renderTimeline(p);

    const actionContainer = document.getElementById('stageActionContainer');
    if (actionContainer) {
      this.stageFormsManager.renderStageActionBox(p, actionContainer);
    }

    // Set Active Tab (If clicked from log button, go directly to tabAction)
    this.switchDetailTab(focusAddLog ? 'tabAction' : 'tabProfile');

    this.openModal('modalProspectDetail');
  }

  async createReferralProspect(data) {
    await api.createProspect(data);
    await this.refreshProspects();
    await this.refreshDashboardStats();
  }

  renderTimeline(prospect) {
    const container = document.getElementById('timelineContainer');
    if (!container) return;
    container.innerHTML = '';

    const history = prospect.history || [];
    if (history.length === 0) {
      container.innerHTML = `<div style="padding: 1rem 0; color: #94a3b8; font-size: 0.8rem;">Belum ada catatan riwayat interaksi.</div>`;
      return;
    }

    history.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'timeline-item';

      let objectionHtml = '';
      if (item.objection && item.objection !== '-') {
        objectionHtml = `<div class="timeline-objection-box"><strong>Kendala:</strong> ${item.objection}</div>`;
      }

      let nextActionHtml = '';
      if (item.next_action && item.next_action !== '-') {
        nextActionHtml = `<div class="timeline-next-action"><strong>Rencana:</strong> ${item.next_action}</div>`;
      }

      itemEl.innerHTML = `
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <div class="timeline-header">
            <span class="timeline-channel">${item.channel}</span>
            <span class="timeline-date">${this.formatFullDateTime(item.date)}</span>
          </div>
          <div class="timeline-body">
            <p>${item.response}</p>
            ${objectionHtml}
            ${nextActionHtml}
          </div>
        </div>
      `;

      container.appendChild(itemEl);
    });
  }

  async handleInteractionSubmit() {
    if (!this.activeProspectId) return;

    const channel = document.getElementById('logChannel').value;
    const date = document.getElementById('logDate').value;
    const response = document.getElementById('logResponse').value.trim();
    const objection = document.getElementById('logObjectionCustom').value.trim() || '-';
    const nextAction = document.getElementById('logNextAction').value.trim() || '-';
    const targetDate = document.getElementById('logTargetDate').value;

    try {
      await api.addInteraction(this.activeProspectId, {
        channel,
        date: new Date(date).toISOString(),
        response,
        objection,
        nextAction,
        targetDate
      });

      this.showToast('Catatan interaksi disimpan!');
      await this.refreshProspects();
      
      const updatedP = this.prospects.find(item => item.id === this.activeProspectId);
      if (updatedP) this.renderTimeline(updatedP);
      
      document.getElementById('newInteractionForm').reset();
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    }
  }

  // --------------------------------------------------------------------------
  // WhatsApp Launcher
  // --------------------------------------------------------------------------
  openWhatsAppModal(prospectId) {
    const p = this.prospects.find(item => item.id === prospectId);
    if (!p) return;

    this.activeProspectId = prospectId;
    document.getElementById('waProspectSubtitle').textContent = `Tujuan: ${p.name} (${p.phone})`;

    let defaultTmplId = 'ice_breaking';
    if (p.stage === 'appointment') defaultTmplId = 'appointment_casual';
    else if (p.stage === 'fact_finding' || p.stage === 'presentation') defaultTmplId = 'after_fact_finding';
    else if (p.stage === 'objection') defaultTmplId = 'handling_objection';
    else if (p.stage === 'issued' || p.stage === 'referral') defaultTmplId = 'ask_referral';

    document.getElementById('waTemplateSelect').value = defaultTmplId;
    this.updateWAMessagePreview(defaultTmplId);

    this.openModal('modalWhatsApp');
  }

  updateWAMessagePreview(templateId) {
    const p = this.prospects.find(item => item.id === this.activeProspectId);
    const tmpl = WA_TEMPLATES.find(t => t.id === templateId) || WA_TEMPLATES[0];

    const firstName = p ? p.name.split(' ')[0] : 'Kak';
    let text = tmpl.text
      .replace(/{nama}/g, firstName)
      .replace(/{hari}/g, 'Kamis / Jumat')
      .replace(/{jam}/g, '15:00 WIB')
      .replace(/{lokasi}/g, 'tempat santai atau via Zoom');

    document.getElementById('waMessagePreview').textContent = text;
    document.getElementById('waCustomText').value = text;
  }

  launchWhatsApp() {
    const p = this.prospects.find(item => item.id === this.activeProspectId);
    if (!p) return;

    const message = document.getElementById('waCustomText').value.trim();
    const sanitized = (p.phone || '').replace(/[^0-9]/g, '');
    const formatted = sanitized.startsWith('0') ? '62' + sanitized.substring(1) : sanitized;

    if (!formatted) {
      alert('Nomor telepon tidak valid.');
      return;
    }

    const waUrl = `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');

    setTimeout(() => {
      if (confirm(`Pesan WhatsApp telah dibuka untuk ${p.name}. Apakah Anda ingin langsung mencatat interaksi ini?`)) {
        this.closeModal('modalWhatsApp');
        this.openDetailModal(p.id, true);
      }
    }, 1000);
  }

  // --------------------------------------------------------------------------
  // Utility & Formatters
  // --------------------------------------------------------------------------
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  formatShortDate(dateStr) {
    if (!dateStr || dateStr === '-') return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  }

  formatFullDateTime(dateStr) {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  formatRupiah(val) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  }

  showToast(message) {
    let toast = document.getElementById('appToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'appToast';
      toast.style = "position: fixed; bottom: 20px; right: 20px; background: #0f172a; color: white; padding: 0.65rem 1rem; border-radius: var(--r-md); box-shadow: var(--shadow-modal); font-size: 0.8rem; font-weight: 600; z-index: 999; display: flex; align-items: center; gap: 0.4rem; transition: all 0.3s ease; transform: translateY(80px); opacity: 0; border-left: 3px solid var(--pru-red);";
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span style="color: var(--pru-red); font-weight: bold;">•</span> ${message}`;
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';

    setTimeout(() => {
      toast.style.transform = 'translateY(80px)';
      toast.style.opacity = '0';
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.pruApp = new PruProspectApp();
});
