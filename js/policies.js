// ==========================================================================
// PRUPROSPECT PRO - IN-FORCE POLICY & CLIENT PORTFOLIO MODULE
// ==========================================================================

import { api } from './api.js';

export class PolicyManager {
  constructor(app) {
    this.app = app;
    this.policies = [];
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.querySelectorAll('#btnOpenAddPolicy, #btnHeaderOpenAddPolicy, .btn-open-add-policy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openAddPolicyModal();
      });
    });

    const policyForm = document.getElementById('policyForm');
    if (policyForm) {
      policyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handlePolicySubmit();
      });
    }

    const polProspectSelect = document.getElementById('polProspectSelect');
    if (polProspectSelect) {
      polProspectSelect.addEventListener('change', (e) => {
        const prospectId = e.target.value;
        if (!prospectId) return;
        const p = this.app?.prospects.find(item => item.id === prospectId);
        if (p) {
          document.getElementById('polHolderName').value = p.name;
          document.getElementById('polInsuredName').value = p.name;
          document.getElementById('polPhone').value = p.phone || '';
        }
      });
    }
  }

  async loadPolicies() {
    if (!this.app?.authManager?.currentUser) {
      this.policies = [];
      this.render();
      return;
    }
    try {
      const res = await api.getPolicies();
      this.policies = res.policies || [];
      this.render();
    } catch (err) {
      console.error('Failed to load policies:', err);
    }
  }

  render() {
    const container = document.getElementById('policyTableBody');
    const totalApeEl = document.getElementById('policyTotalAPE');
    const totalCountEl = document.getElementById('policyTotalCount');
    const lapseAlertBanner = document.getElementById('policyLapseAlert');

    if (!container) return;
    container.innerHTML = '';

    let totalApe = 0;

    if (this.policies.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2.5rem; color: #94a3b8;">
            Belum ada polis aktif yang tercatat. Saat prospek berhasil Closing, daftarkan nomor polisnya di sini!
          </td>
        </tr>
      `;
    } else {
      this.policies.forEach(p => {
        // Calculate APE
        let ape = p.premium_amount;
        if (p.frequency === 'Bulanan') ape = p.premium_amount * 12;
        else if (p.frequency === 'Kuartalan') ape = p.premium_amount * 4;
        totalApe += ape;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <strong style="color: var(--text-primary);">${p.policy_number}</strong>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${p.product_name}</div>
          </td>
          <td>
            <strong>${p.holder_name}</strong>
            ${p.insured_name && p.insured_name !== p.holder_name ? `<div style="font-size: 0.75rem; color: var(--text-secondary);">TTG: ${p.insured_name}</div>` : ''}
          </td>
          <td>${p.phone || '-'}</td>
          <td>
            <strong>${this.formatRupiah(p.premium_amount)}</strong>
            <span class="badge" style="background: #f1f5f9; font-size: 0.7rem;">${p.frequency}</span>
          </td>
          <td>
            ${p.claim_history ? `
              <div style="font-size: 0.75rem; color: #1e40af; background: #eff6ff; border: 1px solid #bfdbfe; padding: 0.3rem 0.55rem; border-radius: 6px; max-width: 220px; line-height: 1.35;">
                <span style="font-weight: 700;">📋 Riwayat:</span> ${p.claim_history}
              </div>
            ` : `
              <span style="font-size: 0.75rem; color: #94a3b8; font-style: italic;">Belum ada riwayat klaim</span>
            `}
          </td>
          <td>
            <span class="badge" style="background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;">
              ● ${p.status || 'In-Force'}
            </span>
          </td>
          <td>
            <div style="max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.75rem; color: var(--color-slate-500);">
              ${p.notes || '-'}
            </div>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <button class="btn btn-whatsapp btn-sm btn-policy-wa" title="Hubungi Servis Nasabah">
              WhatsApp
            </button>
            <button class="btn btn-outline btn-sm btn-policy-delete" style="color: #dc2626;" title="Hapus Polis">
              Hapus
            </button>
          </td>
        `;

        tr.querySelector('.btn-policy-wa').addEventListener('click', () => this.sendReminderWA(p));
        tr.querySelector('.btn-policy-delete').addEventListener('click', () => this.deletePolicy(p.id, p.policy_number));

        container.appendChild(tr);
      });
    }

    if (totalApeEl) totalApeEl.textContent = this.formatRupiah(totalApe);
    if (totalCountEl) totalCountEl.textContent = this.policies.length;
    if (lapseAlertBanner) lapseAlertBanner.style.display = 'none';
  }

  openAddPolicyModal(prefillData = null) {
    const form = document.getElementById('policyForm');
    if (form) form.reset();

    const polPicker = document.getElementById('polProspectSelect');
    if (polPicker && this.app?.prospects) {
      polPicker.innerHTML = '<option value="">-- Bukan dari Daftar Prospek (Nasabah Baru) --</option>';
      this.app.prospects.forEach(p => {
        polPicker.innerHTML += `<option value="${p.id}">${p.name} (${p.relationship || 'Calon Nasabah'} • ${p.phone || '-'})</option>`;
      });
    }

    if (prefillData) {
      if (prefillData.id && polPicker) polPicker.value = prefillData.id;
      if (prefillData.name) document.getElementById('polHolderName').value = prefillData.name;
      if (prefillData.name) document.getElementById('polInsuredName').value = prefillData.name;
      if (prefillData.phone) document.getElementById('polPhone').value = prefillData.phone;
    }

    const claimEl = document.getElementById('polClaimHistory');
    if (claimEl) claimEl.value = '';

    document.getElementById('polNumber').value = `POL-${Math.floor(1000000 + Math.random() * 9000000)}`;
    document.getElementById('polIssuedDate').value = new Date().toISOString().split('T')[0];

    const modal = document.getElementById('modalPolicyForm');
    if (modal) modal.classList.add('active');
  }

  async handlePolicySubmit() {
    const prospect_id = document.getElementById('polProspectSelect')?.value || null;
    const policy_number = document.getElementById('polNumber').value.trim();
    const holder_name = document.getElementById('polHolderName').value.trim();
    const insured_name = document.getElementById('polInsuredName').value.trim();
    const phone = document.getElementById('polPhone').value.trim();
    const product_name = document.getElementById('polProduct').value;
    const premium_amount = document.getElementById('polPremium').value;
    const frequency = document.getElementById('polFrequency').value;
    const issued_date = document.getElementById('polIssuedDate')?.value || '';
    const claim_history = document.getElementById('polClaimHistory')?.value.trim() || '';
    const notes = document.getElementById('polNotes')?.value.trim() || '';

    try {
      await api.createPolicy({
        prospect_id,
        policy_number,
        holder_name,
        insured_name,
        phone,
        product_name,
        premium_amount,
        frequency,
        issued_date,
        claim_history,
        notes
      });

      document.getElementById('modalPolicyForm').classList.remove('active');
      this.app.showToast(`Polis ${policy_number} berhasil didaftarkan!`);
      await this.loadPolicies();
      await this.app.refreshProspects();
      this.app.refreshDashboardStats();
    } catch (err) {
      alert('Gagal menyimpan polis: ' + err.message);
    }
  }

  async createPolicyFromProspect(policyData) {
    await api.createPolicy(policyData);
    await this.loadPolicies();
    await this.app.refreshDashboardStats();
  }

  async deletePolicy(id, policyNumber) {
    if (confirm(`Apakah Anda yakin ingin menghapus catatan polis ${policyNumber}?`)) {
      try {
        await api.deletePolicy(id);
        this.app.showToast(`Polis ${policyNumber} telah dihapus.`);
        await this.loadPolicies();
        this.app.refreshDashboardStats();
      } catch (err) {
        alert('Gagal menghapus polis: ' + err.message);
      }
    }
  }

  sendReminderWA(policy) {
    const cleaned = (policy.phone || '').replace(/[^0-9]/g, '');
    const phone = cleaned.startsWith('0') ? '62' + cleaned.substring(1) : cleaned;

    if (!phone) {
      alert('Nomor telepon nasabah tidak tersedia.');
      return;
    }

    const message = `Halo Bapak/Ibu ${policy.holder_name}, salam hangat dan semoga sehat selalu sekeluarga.\n\n` +
      `Saya ingin menyapa sekaligus menanyakan kabar kepuasan layanan dan proteksi asuransi Prudential Anda untuk polis No. *${policy.policy_number}* (${policy.product_name}).\n\n` +
      `Apakah ada hal yang dapat saya bantu terkait administrasi, cek manfaat, atau pertanyaan seputar klaim asuransi? Jangan sungkan menghubungi saya kapan pun. Terima kasih! 🙏`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  formatRupiah(val) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  }

  formatShortDate(dateStr) {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }
}
