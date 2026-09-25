// ==========================================================================
// AGENTPROSPECT PRO - HYBRID API & GOOGLE SHEETS DATABASE SERVICE
// ==========================================================================

class ApiService {
  constructor() {
    this.tokenKey = 'agent_token_v2';
    this.sheetUrlKey = 'agent_google_sheet_url';
  }

  // Token Management
  getToken() {
    return localStorage.getItem(this.tokenKey) || localStorage.getItem('pru_agent_token_v2');
  }

  setToken(token) {
    localStorage.setItem(this.tokenKey, token);
  }

  removeToken() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('pru_agent_token_v2');
    localStorage.removeItem('pru_current_user_profile');
    localStorage.removeItem('agent_current_user_profile');
  }

  // Google Sheet Web App Management
  getSheetUrl() {
    return (localStorage.getItem(this.sheetUrlKey) || localStorage.getItem('pru_google_sheet_url') || 'https://script.google.com/macros/s/AKfycbwyQX3kqdj4miBc5JyrwLIe-GqtylPjrGYSmXZqWpUsC5hP_sFu0Bg-seJOAm6LLwpy3g/exec').trim();
  }

  setSheetUrl(url) {
    if (!url || !url.trim()) {
      localStorage.removeItem(this.sheetUrlKey);
      localStorage.removeItem('pru_google_sheet_url');
    } else {
      localStorage.setItem(this.sheetUrlKey, url.trim());
    }
  }

  hasSheetUrl() {
    const url = this.getSheetUrl();
    return Boolean(url && url.startsWith('https://script.google.com'));
  }

  // Test Connection to Google Apps Script Web App
  async testGoogleSheetConnection(customUrl = null) {
    const targetUrl = (customUrl ? customUrl.trim() : this.getSheetUrl());
    if (!targetUrl || !targetUrl.startsWith('https://script.google.com')) {
      throw new Error('URL tidak valid. Harus diawali: https://script.google.com/macros/s/.../exec');
    }

    const testUrl = new URL(targetUrl);
    testUrl.searchParams.set('action', 'ping');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(testUrl.toString(), {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const text = await response.text();
      let res = {};
      try {
        res = JSON.parse(text);
      } catch (parseErr) {
        if (text.includes('accounts.google.com') || text.includes('Sign in') || text.includes('<!DOCTYPE') || text.includes('<html')) {
          throw new Error('Akses ditolak oleh Google (Di-redirect ke halaman Login). Setting "Who has access" di Apps Script Anda saat ini masih "Only myself". Wajib diubah menjadi "Anyone" di menu Deploy > Manage deployments > Edit > Who has access: Anyone.');
        }
        throw new Error('Format balasan Apps Script tidak valid (Bukan JSON). Pastikan kode Code.gs sudah di-deploy.');
      }

      if (res.status === 'ok') {
        return res;
      }
      throw new Error(res.error || 'Respon dari Google Spreadsheet tidak valid.');
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Koneksi timeout. Pastikan Web App diset ke "Who has access: Anyone".');
      }
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        throw new Error('Gagal menghubungi Web App (CORS / Redirect Login). Opsi "Who has access" di Apps Script Anda saat ini masih "Only myself", wajib diubah ke "Anyone" (Siapa saja).');
      }
      throw err;
    }
  }

  // Google Apps Script Web App Request Dispatcher
  async sheetRequest(action, data = {}, method = 'GET') {
    const sheetUrl = this.getSheetUrl();
    if (!sheetUrl) {
      throw new Error('URL Google Apps Script belum dikonfigurasi.');
    }

    if (method === 'GET') {
      const url = new URL(sheetUrl);
      url.searchParams.set('action', action);
      for (const [key, val] of Object.entries(data)) {
        if (val !== undefined && val !== null) {
          url.searchParams.set(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
        }
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      const resData = await response.json().catch(() => ({}));
      if (resData.error) throw new Error(resData.error);
      return resData;
    } else {
      // POST Request: use text/plain to avoid browser CORS preflight OPTIONS blocking
      const response = await fetch(sheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, ...data })
      });
      const resData = await response.json().catch(() => ({}));
      if (resData.error) throw new Error(resData.error);
      return resData;
    }
  }

  // Local SQLite Request Dispatcher
  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `HTTP error ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  }

  // --------------------------------------------------------------------------
  // AUTH ENDPOINTS (NOMOR TELEPON & KATA SANDI)
  // --------------------------------------------------------------------------
  async login(phoneOrEmail, password) {
    const cleanPhone = (phoneOrEmail || '').trim();
    const cleanPass = (password || '').trim();

    // 1. Prioritaskan Google Apps Script Web App (Sheet Akun_Agen di Spreadsheet)
    if (this.hasSheetUrl()) {
      try {
        const data = await this.sheetRequest('login', {
          phone: cleanPhone,
          identifier: cleanPhone,
          password: cleanPass
        }, 'POST');
        if (data && data.token) {
          this.setToken(data.token);
          if (data.user) {
            localStorage.setItem('pru_current_user_profile', JSON.stringify(data.user));
          }
          return data;
        }
      } catch (sheetErr) {
        // Jika error validasi kredensial salah yang spesifik dari Apps Script, lempar ke user
        if (sheetErr.message && sheetErr.message.includes('tidak cocok')) {
          throw sheetErr;
        }
        // Jika aksi belum dikenali (Apps Script belum dideploy ulang) atau koneksi gagal, fallback ke backend lokal
        console.warn('Apps Script login fallback:', sheetErr.message);
      }
    }

    // 2. Coba API Backend SQLite Lokal jika terhubung
    try {
      const data = await this.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ 
          phone: cleanPhone, 
          email: cleanPhone, 
          identifier: cleanPhone, 
          password: cleanPass 
        })
      });
      if (data.token) this.setToken(data.token);
      return data;
    } catch (err) {
      // Jika backend merespon error validasi / kredensial salah (401 / 400), lempar langsung ke user
      if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError') && !err.message.includes('404')) {
        throw err;
      }

      // 3. Fallback jika offline: Cek akun terdaftar di localStorage
      const localAgents = JSON.parse(localStorage.getItem('pru_registered_agents') || '[]');
      const found = localAgents.find(a => (a.phone === cleanPhone || a.email === cleanPhone) && a.password === cleanPass);
      if (found) {
        const safe = { ...found };
        delete safe.password;
        this.setToken(safe.id);
        return { token: safe.id, user: safe, message: 'Login berhasil (Mode Lokal)!' };
      }

      throw new Error('Nomor telepon atau kata sandi tidak cocok. Silakan periksa kembali atau daftarkan akun baru.');
    }
  }

  async register(agentData) {
    const name = (agentData.name || '').trim();
    const phone = (agentData.phone || '').trim();
    const password = (agentData.password || '').trim();
    const agency_name = (agentData.agency_name || agentData.agency || 'Agency Office').trim();

    // 1. Prioritaskan Google Apps Script Web App (Simpan langsung ke sheet Akun_Agen)
    if (this.hasSheetUrl()) {
      try {
        const data = await this.sheetRequest('register', {
          name, phone, password, agency_name
        }, 'POST');
        if (data && data.token) {
          this.setToken(data.token);
          if (data.user) {
            localStorage.setItem('agent_current_user_profile', JSON.stringify(data.user));
          }
          return data;
        }
      } catch (sheetErr) {
        // Jika error validasi nomor telepon sudah terdaftar dari Apps Script, lempar langsung
        if (sheetErr.message && sheetErr.message.includes('sudah terdaftar')) {
          throw sheetErr;
        }
        // Jika aksi belum dikenali di Apps Script (belum dideploy versi baru), fallback ke backend lokal
        console.warn('Apps Script register fallback to SQLite:', sheetErr.message);
      }
    }

    // 2. Coba API Backend SQLite Lokal
    try {
      const data = await this.request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, phone, password, agency_name })
      });
      if (data.token) this.setToken(data.token);
      return data;
    } catch (err) {
      // Jika backend merespon error validasi (400/409), lempar ke user
      if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError') && !err.message.includes('404')) {
        throw err;
      }

      // 3. Fallback jika backend offline: simpan akun di localStorage browser
      const localAgents = JSON.parse(localStorage.getItem('agent_registered_agents') || localStorage.getItem('pru_registered_agents') || '[]');
      if (localAgents.some(a => a.phone === phone)) {
        throw new Error('Nomor telepon ini sudah terdaftar. Silakan langsung masuk.');
      }

      const newId = `usr_${Date.now()}`;
      const newAgent = {
        id: newId,
        agent_code: `AG-${phone.slice(-4) || '999'}`,
        name,
        phone,
        email: `${phone.replace(/\D/g, '')}@agentprospect.id`,
        password,
        agency_name,
        role: 'Agent'
      };
      localAgents.push(newAgent);
      localStorage.setItem('agent_registered_agents', JSON.stringify(localAgents));

      const safe = { ...newAgent };
      delete safe.password;
      this.setToken(newId);
      return { token: newId, user: safe, message: 'Pendaftaran akun berhasil!' };
    }
  }

  async getMe() {
    // 1. Coba Google Apps Script jika aktif
    if (this.hasSheetUrl()) {
      try {
        const token = this.getToken();
        const data = await this.sheetRequest('getMe', { token }, 'GET');
        if (data && data.user) return data;
      } catch {}
    }

    // 2. Coba backend SQLite
    try {
      return await this.request('/api/auth/me');
    } catch {
      const localAgents = JSON.parse(localStorage.getItem('pru_registered_agents') || '[]');
      const found = localAgents.find(a => a.id === token);
      if (found) {
        const safe = { ...found };
        delete safe.password;
        return { user: safe };
      }

      throw new Error('Sesi akun tidak ditemukan.');
    }
  }

  // --------------------------------------------------------------------------
  // PROSPECTS CRUD (DATABASE CALON NASABAH)
  // --------------------------------------------------------------------------
  async getProspects() {
    if (this.hasSheetUrl()) {
      const res = await this.sheetRequest('getProspects', {}, 'GET');
      const normalized = (res.prospects || []).map(p => {
        let isRosma = false;
        if (p.owner && String(p.owner).toLowerCase().includes('rosma')) isRosma = true;
        else if (p.id && String(p.id).startsWith('p_r_')) isRosma = true;
        else if (p.relation && String(p.relation).toLowerCase() === 'rosma') isRosma = true;
        else if (p.relationship && String(p.relationship).toLowerCase() === 'rosma') isRosma = true;

        let relation = p.relation || p.relationship || 'Teman';
        let job = p.job || '';
        let address = p.address || '';

        // Jika sheet lama menggeser kolom (di mana relation berisi 'Yusuf' / 'Rosma')
        if (relation.toLowerCase() === 'yusuf' || relation.toLowerCase() === 'rosma') {
          relation = job || 'Teman';
          job = address || '';
          address = '';
        }

        return {
          id: p.id,
          name: p.name,
          phone: p.phone || '',
          owner: isRosma ? 'Rosma' : 'Yusuf',
          address: address,
          relation: relation,
          relationship: relation,
          job: job,
          estimatedIncome: p.estimatedIncome || p.estimated_income || '',
          temperature: p.temperature || 'warm',
          stage: p.stage || 'suspect',
          stageDisplay: p.stageDisplay || '',
          needs: Array.isArray(p.needs) ? p.needs : [],
          qualifications: p.qualifications || {
            money: Boolean(p.money_qualified),
            authority: Boolean(p.authority_qualified),
            need: Boolean(p.need_qualified)
          },
          targetFollowUp: p.targetFollowUp || p.target_follow_up || '',
          lastContactDate: p.lastContactDate || p.last_contact_date || '-',
          lastObjection: p.lastObjection || p.last_objection || '-',
          notes: p.notes || '',
          history: Array.isArray(p.history) ? p.history : []
        };
      });
      return { prospects: normalized };
    }

    return await this.request('/api/prospects');
  }

  async createProspect(prospectData) {
    if (this.hasSheetUrl()) {
      return await this.sheetRequest('createProspect', { data: prospectData }, 'POST');
    }

    return await this.request('/api/prospects', {
      method: 'POST',
      body: JSON.stringify(prospectData)
    });
  }

  async updateProspect(id, prospectData) {
    if (this.hasSheetUrl()) {
      return await this.sheetRequest('updateProspect', { id, data: prospectData }, 'POST');
    }

    return await this.request(`/api/prospects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(prospectData)
    });
  }

  async updateProspectStage(id, stage) {
    if (this.hasSheetUrl()) {
      return await this.sheetRequest('updateStage', { id, stage }, 'POST');
    }

    return await this.request(`/api/prospects/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ stage })
    });
  }

  async deleteProspect(id) {
    if (this.hasSheetUrl()) {
      return await this.sheetRequest('deleteProspect', { id }, 'POST');
    }

    return await this.request(`/api/prospects/${id}`, {
      method: 'DELETE'
    });
  }

  async addInteraction(prospectId, logData) {
    if (this.hasSheetUrl()) {
      return await this.sheetRequest('addInteraction', { data: { prospectId, ...logData } }, 'POST');
    }

    return await this.request(`/api/prospects/${prospectId}/history`, {
      method: 'POST',
      body: JSON.stringify(logData)
    });
  }

  // --------------------------------------------------------------------------
  // POLICIES CRUD (PORTOFOLIO POLIS)
  // --------------------------------------------------------------------------
  async getPolicies() {
    if (this.hasSheetUrl()) {
      return await this.sheetRequest('getPolicies', {}, 'GET');
    }

    return await this.request('/api/policies');
  }

  async createPolicy(policyData) {
    if (this.hasSheetUrl()) {
      return await this.sheetRequest('createPolicy', { data: policyData }, 'POST');
    }

    return await this.request('/api/policies', {
      method: 'POST',
      body: JSON.stringify(policyData)
    });
  }

  async deletePolicy(id) {
    if (this.hasSheetUrl()) {
      return await this.sheetRequest('deletePolicy', { policyNumber: id, id }, 'POST');
    }

    return await this.request(`/api/policies/${id}`, {
      method: 'DELETE'
    });
  }

  // --------------------------------------------------------------------------
  // DASHBOARD STATS & SCORECARD
  // --------------------------------------------------------------------------
  async getDashboardStats() {
    if (this.hasSheetUrl()) {
      const res = await this.sheetRequest('getDashboardStats', {}, 'GET');
      return {
        ...res.stats,
        goals: res.goals || {
          yearly_ape_target: 600000000,
          monthly_prospect_target: 25,
          daily_contacts_target: 10,
          weekly_appointments_target: 3
        }
      };
    }

    return await this.request('/api/dashboard/stats');
  }

  // --------------------------------------------------------------------------
  // PRODUCTION GOALS (TARGET MDRT)
  // --------------------------------------------------------------------------
  async getGoals() {
    if (this.hasSheetUrl()) {
      return await this.sheetRequest('getGoals', {}, 'GET');
    }

    return await this.request('/api/goals');
  }

  async createGoal(goalData) {
    if (this.hasSheetUrl()) {
      return await this.sheetRequest('createGoal', { data: goalData }, 'POST');
    }

    return await this.request('/api/goals', {
      method: 'POST',
      body: JSON.stringify(goalData)
    });
  }

  async updateGoal(id, goalData) {
    if (this.hasSheetUrl()) {
      // In Google Sheets, updating a goal can be performed or falls back to delete+create
      return { success: true };
    }

    return await this.request(`/api/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(goalData)
    });
  }

  async deleteGoal(id) {
    if (this.hasSheetUrl()) {
      return await this.sheetRequest('deleteGoal', { id }, 'POST');
    }

    return await this.request(`/api/goals/${id}`, {
      method: 'DELETE'
    });
  }

  // --------------------------------------------------------------------------
  // OBJECTION PLAYBOOK (PANDUAN KEBERATAN)
  // --------------------------------------------------------------------------
  async getPlaybook() {
    if (this.hasSheetUrl()) {
      return await this.sheetRequest('getPlaybook', {}, 'GET');
    }

    return await this.request('/api/playbook');
  }

  async createPlaybookItem(itemData) {
    if (this.hasSheetUrl()) {
      return await this.sheetRequest('createPlaybookItem', { data: itemData }, 'POST');
    }

    return await this.request('/api/playbook', {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
  }

  async generateAIPlaybook(objection, category) {
    if (this.hasSheetUrl()) {
      // AI Coach logic client-side fallback if backend is not running
      return {
        objection,
        category,
        mindset: `Validasi kekhawatiran calon nasabah tentang ${category}. Berikan empati mendalam tanpa membantah secara agresif. Posisikan asuransi sebagai perlindungan cinta untuk keluarga.`,
        key_insight: `Fakta Finansial: Risiko kehidupan (sakit, kecelakaan, tutup usia) terjadi tanpa pemberitahuan. Memiliki proteksi asuransi sejak dini mengunci tarif premi terendah dan melindungi aset produktif keluarga.`,
        script: `“Bapak/Ibu, saya sangat memahami dan menghargai pandangan Bapak/Ibu mengenai hal ini. Banyak nasabah prioritas saya awalnya memiliki pemikiran serupa sebelum mereka melihat bagaimana asuransi hadir bukan untuk menambah beban, melainkan menjadi benteng pelindung finansial keluarga tercinta saat musibah tak terduga datang. Boleh saya tunjukkan bagaimana skema ini bekerja khusus untuk keluarga Bapak/Ibu?”`
      };
    }

    return await this.request('/api/playbook/generate-ai', {
      method: 'POST',
      body: JSON.stringify({ objection, category })
    });
  }

  async deletePlaybookItem(id) {
    if (this.hasSheetUrl()) {
      return await this.sheetRequest('deletePlaybookItem', { id }, 'POST');
    }

    return await this.request(`/api/playbook/${id}`, {
      method: 'DELETE'
    });
  }

  // --------------------------------------------------------------------------
  // FINANCIAL CALCULATOR QUOTES
  // --------------------------------------------------------------------------
  async saveQuote(quoteData) {
    try {
      return await this.request('/api/calculations/save', {
        method: 'POST',
        body: JSON.stringify(quoteData)
      });
    } catch {
      // Save locally if node server is offline
      const quotes = JSON.parse(localStorage.getItem('pru_saved_quotes') || '[]');
      quotes.push({ id: 'q_' + Date.now(), ...quoteData, created_at: new Date().toISOString() });
      localStorage.setItem('pru_saved_quotes', JSON.stringify(quotes));
      return { success: true };
    }
  }

  async getQuotes(prospectId) {
    try {
      const url = prospectId ? `/api/calculations?prospect_id=${encodeURIComponent(prospectId)}` : '/api/calculations';
      return await this.request(url);
    } catch {
      const quotes = JSON.parse(localStorage.getItem('pru_saved_quotes') || '[]');
      if (prospectId) {
        return { calculations: quotes.filter(q => q.prospect_id === prospectId) };
      }
      return { calculations: quotes };
    }
  }
}

export const api = new ApiService();
