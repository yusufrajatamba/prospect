// ==========================================================================
// PRUPROSPECT PRO - STAGE SPECIFIC ACTION FORMS MODULE
// Alur Kerja & Form Spesifik Lapangan untuk Setiap Tahap Penjualan Agen
// ==========================================================================

import { SALES_STAGES } from './sampleData.js';
import { OBJECTION_PLAYBOOK_DATA } from './playbook.js';

export class StageFormsManager {
  constructor(app) {
    this.app = app;
    this.currentMode = 'stage-specific'; // 'stage-specific' or 'general-log'
  }

  renderStageActionBox(prospect, containerEl) {
    if (!containerEl) return;
    const stageId = prospect.stage || 'suspect';
    const stageObj = SALES_STAGES.find(s => s.id === stageId) || SALES_STAGES[0];

    const todayStr = new Date().toISOString().split('T')[0];
    const nowLocal = new Date();
    nowLocal.setMinutes(nowLocal.getMinutes() - nowLocal.getTimezoneOffset());
    const nowLocalIso = nowLocal.toISOString().slice(0, 16);

    let specificFormHtml = '';

    switch (stageId) {
      case 'suspect': // 1. Daftar Nama
        specificFormHtml = `
          <form id="stageActionForm">
            <div class="stage-form-header">
              <span class="stage-form-badge">Tahap 1: Daftar Nama</span>
              <h4 class="stage-form-title">Rencana Pendekatan Awal (Ice Breaking)</h4>
              <p class="stage-form-desc">Tentukan rencana sapaan pertama dan jadwal kontak calon nasabah.</p>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="sfChannel">Rencana Metode Kontak *</label>
                <select id="sfChannel" class="form-select" required>
                  <option value="WhatsApp" selected>WhatsApp Personal</option>
                  <option value="Telepon">Panggilan Telepon Langsung</option>
                  <option value="Kopi Darat">Pertemuan Santai / Silaturahmi</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="sfTargetDate">Target Tanggal Sapaan Pertama *</label>
                <input type="date" id="sfTargetDate" class="form-input" value="${prospect.targetFollowUp || todayStr}" required>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="sfIceBreakerTopic">Topik Pembuka Percakapan *</label>
              <input type="text" id="sfIceBreakerTopic" class="form-input" placeholder="Contoh: Menanyakan kabar keluarga / Reuni sekolah / Diskusi aktivitas kerja" required>
            </div>

            <div class="form-group">
              <label class="form-label" for="sfNotes">Catatan Latar Belakang Calon Nasabah</label>
              <textarea id="sfNotes" class="form-textarea" placeholder="Informasi pendukung sebelum menyapa...">${prospect.notes || ''}</textarea>
            </div>

            <div class="stage-form-actions">
              <button type="submit" class="btn btn-primary">
                Simpan & Mulai Pendekatan (Lanjut Tahap 2)
              </button>
            </div>
          </form>
        `;
        break;

      case 'approach': // 2. Pendekatan
        specificFormHtml = `
          <form id="stageActionForm">
            <div class="stage-form-header">
              <span class="stage-form-badge">Tahap 2: Pendekatan</span>
              <h4 class="stage-form-title">Hasil Komunikasi Pendekatan Awal</h4>
              <p class="stage-form-desc">Catat respon sapaan pembuka dan evaluasi kesiapan nasabah untuk bertemu.</p>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="sfChannel">Saluran Komunikasi Digunakan *</label>
                <select id="sfChannel" class="form-select" required>
                  <option value="WhatsApp" selected>WhatsApp Chat</option>
                  <option value="Telepon">Panggilan Telepon</option>
                  <option value="Kopi Darat">Tatap Muka Santai</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="sfResponseSentiment">Respon Sikap Nasabah *</label>
                <select id="sfResponseSentiment" class="form-select" required>
                  <option value="Ramah & Menyambut Baik">Ramah & Menyambut Baik</option>
                  <option value="Sedang Sibuk (Minta Dihubungi Nanti)">Sedang Sibuk (Minta Dihubungi Nanti)</option>
                  <option value="Terbuka Diskusi Finansial">Terbuka Diskusi Finansial</option>
                  <option value="Masih Dingin / Pasif">Masih Dingin / Pasif</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="sfResponseSummary">Ringkasan Obrolan & Respon *</label>
              <textarea id="sfResponseSummary" class="form-textarea" placeholder="Rangkuman hasil sapaan pembuka..." required style="min-height: 60px;"></textarea>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="sfNextStep">Tindak Lanjut Berikutnya *</label>
                <select id="sfNextStep" class="form-select" required>
                  <option value="appointment" selected>Siap Dijadwalkan Temu (Lanjut Tahap 3)</option>
                  <option value="followup">Perlu Sapaan Ulang Beberapa Hari Lagi</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="sfTargetDate">Jadwal Kontak Berikutnya *</label>
                <input type="date" id="sfTargetDate" class="form-input" value="${todayStr}" required>
              </div>
            </div>

            <div class="stage-form-actions">
              <button type="submit" class="btn btn-primary">
                Simpan Hasil Pendekatan
              </button>
            </div>
          </form>
        `;
        break;

      case 'appointment': // 3. Janji Temu
        specificFormHtml = `
          <form id="stageActionForm">
            <div class="stage-form-header">
              <span class="stage-form-badge">Tahap 3: Janji Temu</span>
              <h4 class="stage-form-title">Konfirmasi Jadwal & Lokasi Pertemuan</h4>
              <p class="stage-form-desc">Pastikan detail pertemuan tercatat jelas untuk persiapan materi bedah kebutuhan.</p>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="sfMeetingTime">Tanggal & Waktu Janji Temu *</label>
                <input type="datetime-local" id="sfMeetingTime" class="form-input" value="${nowLocalIso}" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="sfMeetingFormat">Format Pertemuan *</label>
                <select id="sfMeetingFormat" class="form-select" required>
                  <option value="Kopi Darat (Kafe / Resto)">Kopi Darat (Kafe / Resto)</option>
                  <option value="Kunjungan Kantor Nasabah">Kunjungan Kantor Nasabah</option>
                  <option value="Kunjungan Rumah Nasabah">Kunjungan Rumah Nasabah</option>
                  <option value="Video Call (Zoom / Google Meet)">Video Call (Zoom / Google Meet)</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="sfMeetingLocation">Lokasi Spesifik / Tautan Virtual *</label>
              <input type="text" id="sfMeetingLocation" class="form-input" placeholder="Contoh: Starbucks Senayan City atau Link Google Meet" required>
            </div>

            <div class="form-group">
              <label class="form-label" for="sfMeetingAgenda">Agenda Diskusi *</label>
              <select id="sfMeetingAgenda" class="form-select" required>
                <option value="Bedah Kebutuhan Finansial & Proteksi Keluarga" selected>Bedah Kebutuhan Finansial & Proteksi Keluarga</option>
                <option value="Review Polis Lama & Cek Kecukupan Manfaat">Review Polis Lama & Cek Kecukupan Manfaat</option>
                <option value="Konsultasi Perencanaan Dana Pendidikan & Warisan">Konsultasi Perencanaan Dana Pendidikan & Warisan</option>
              </select>
            </div>

            <div class="stage-form-actions">
              <button type="submit" class="btn btn-primary">
                Konfirmasi Janji & Lanjut ke Bedah Kebutuhan (Tahap 4)
              </button>
            </div>
          </form>
        `;
        break;

      case 'fact_finding': { // 4. Bedah Kebutuhan (Multi-Need Assessment)
        const standardNeeds = [
          { id: 'health_bed', label: 'Rawat Inap Kamar 1 Bed Privat (On-Bill Sesuai Tagihan)', defaultTarget: 'On-Bill Kamar 1 Bed Privat (PRUPrime Healthcare Plus Pro)' },
          { id: 'critical_illness', label: 'Proteksi Penghasilan Sakit Kritis (Critical Illness)', defaultTarget: 'UP Sakit Kritis Rp 500 Juta - Rp 1 Miliar (3-5 thn biaya hidup)' },
          { id: 'life_legacy', label: 'Penyediaan Dana Warisan Jiwa & Bebas Hutang', defaultTarget: 'UP Jiwa Rp 1 - 2 Miliar (PRUWarisan / PRUCinta)' },
          { id: 'education', label: 'Kepastian Dana Pendidikan Lanjutan Anak', defaultTarget: 'Dana Kuliah Rp 300 - 500 Juta / Anak (PRUCerah)' },
          { id: 'pension', label: 'Jaminan Kemandirian Dana Pensiun Sejahtera', defaultTarget: 'Dana Pensiun Rp 2 Miliar di Usia 55 Tahun' },
          { id: 'emergency_fund', label: 'Fondasi Likuiditas Dana Darurat Medis & Musibah', defaultTarget: 'Dana Darurat 6 - 12x Pengeluaran Bulanan' },
          { id: 'syariah_wakaf', label: 'Perlindungan Berbasis Syariah & Wakaf Polis', defaultTarget: 'Wakaf Polis 10% - 30% dari Santunan Asuransi' }
        ];

        const existingNeeds = prospect.needs || [];
        const existingNeedIds = new Set(existingNeeds.map(n => n.id));

        let needsItemsHtml = '';
        standardNeeds.forEach(sn => {
          const match = existingNeeds.find(n => n.id === sn.id);
          const isChecked = Boolean(match);
          const priority = match?.priority || 'Utama';
          const targetVal = match?.target !== undefined ? match.target : sn.defaultTarget;

          needsItemsHtml += `
            <div class="need-item-card ${isChecked ? 'selected' : ''}" data-need-id="${sn.id}">
              <div class="need-item-header">
                <label class="need-checkbox-label">
                  <input type="checkbox" class="need-checkbox" value="${sn.id}" ${isChecked ? 'checked' : ''}>
                  <span class="need-title">${sn.label}</span>
                </label>
                <select class="need-priority-select form-select-xs" ${!isChecked ? 'disabled' : ''}>
                  <option value="Utama" ${priority === 'Utama' ? 'selected' : ''}>Prioritas Utama</option>
                  <option value="Sekunder" ${priority === 'Sekunder' ? 'selected' : ''}>Sekunder</option>
                  <option value="Masa Depan" ${priority === 'Masa Depan' ? 'selected' : ''}>Rencana Masa Depan</option>
                </select>
              </div>
              <div class="need-target-wrap" style="${isChecked ? 'display:block;' : 'display:none;'}">
                <input type="text" class="need-target-input form-input form-input-xs" placeholder="Rencana / target perlindungan..." value="${targetVal}">
              </div>
            </div>
          `;
        });

        // Add any custom needs previously saved
        existingNeeds.forEach(en => {
          if (!standardNeeds.some(sn => sn.id === en.id)) {
            needsItemsHtml += `
              <div class="need-item-card selected" data-need-id="${en.id}">
                <div class="need-item-header">
                  <label class="need-checkbox-label">
                    <input type="checkbox" class="need-checkbox" value="${en.id}" checked>
                    <span class="need-title">${en.label}</span>
                  </label>
                  <select class="need-priority-select form-select-xs">
                    <option value="Utama" ${en.priority === 'Utama' ? 'selected' : ''}>Prioritas Utama</option>
                    <option value="Sekunder" ${en.priority === 'Sekunder' ? 'selected' : ''}>Sekunder</option>
                    <option value="Masa Depan" ${en.priority === 'Masa Depan' ? 'selected' : ''}>Rencana Masa Depan</option>
                  </select>
                </div>
                <div class="need-target-wrap" style="display:block;">
                  <input type="text" class="need-target-input form-input form-input-xs" placeholder="Rencana / target..." value="${en.target || ''}">
                </div>
              </div>
            `;
          }
        });

        specificFormHtml = `
          <form id="stageActionForm">
            <div class="stage-form-header">
              <span class="stage-form-badge">Tahap 4: Bedah Kebutuhan (Fact Finding)</span>
              <h4 class="stage-form-title">Analisa & Identifikasi Portofolio Kebutuhan</h4>
              <p class="stage-form-desc">Pilih seluruh kebutuhan proteksi yang teridentifikasi dari diskusi bersama calon nasabah.</p>
            </div>

            <div class="form-group" style="margin-bottom: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                <label class="form-label" style="margin-bottom: 0;"><strong>Daftar Kebutuhan Finansial Teridentifikasi *</strong></label>
                <span style="font-size: 0.72rem; color: var(--pru-red); font-weight: 600;">(Dapat memilih banyak kebutuhan)</span>
              </div>
              <div class="needs-checklist-grid" id="needsChecklistContainer">
                ${needsItemsHtml}
              </div>
              <div style="margin-top: 0.6rem; display: flex; gap: 0.4rem; align-items: center;">
                <input type="text" id="customNeedInput" class="form-input form-input-sm" placeholder="+ Tambah kebutuhan custom (misal: Biaya Haji / Rencana Bisnis)">
                <button type="button" class="btn btn-outline btn-sm" id="btnAddCustomNeed" style="white-space: nowrap;">+ Tambah</button>
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="sfExistingCover">Proteksi yang Sudah Dimiliki Saat Ini *</label>
                <select id="sfExistingCover" class="form-select" required>
                  <option value="Hanya BPJS Kesehatan">Hanya BPJS Kesehatan</option>
                  <option value="Ada Asuransi Kantor (Grup)">Ada Asuransi Kantor (Grup)</option>
                  <option value="Ada Polis Pribadi Lain">Ada Polis Pribadi Lain</option>
                  <option value="Belum Memiliki Asuransi Sama Sekali">Belum Memiliki Asuransi Sama Sekali</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="sfBudgetRange">Alokasi Premi yang Dirasa Nyaman *</label>
                <select id="sfBudgetRange" class="form-select" required>
                  <option value="Rp 500.000 - Rp 1.000.000/bln">Rp 500.000 - Rp 1.000.000 / bulan</option>
                  <option value="Rp 1.000.000 - Rp 2.000.000/bln" selected>Rp 1.000.000 - Rp 2.000.000 / bulan</option>
                  <option value="Rp 2.000.000 - Rp 3.500.000/bln">Rp 2.000.000 - Rp 3.500.000 / bulan</option>
                  <option value="> Rp 3.500.000/bln">&gt; Rp 3.500.000 / bulan</option>
                </select>
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="sfDependents">Jumlah Tanggungan Keluarga</label>
                <input type="text" id="sfDependents" class="form-input" placeholder="Contoh: Pasangan + 2 Anak">
              </div>
              <div class="form-group">
                <label class="form-label" for="sfMedicalNotes">Catatan Medis & Gaya Hidup</label>
                <input type="text" id="sfMedicalNotes" class="form-input" placeholder="Contoh: Sehat prima, tidak merokok, tidak ada riwayat lab buruk">
              </div>
            </div>

            <div class="stage-form-actions">
              <button type="submit" class="btn btn-primary">
                Simpan Hasil & Siapkan Ilustrasi (Lanjut Tahap 5)
              </button>
            </div>
          </form>
        `;
        break;
      }

      case 'presentation': // 5. Presentasi Solusi
        specificFormHtml = `
          <form id="stageActionForm">
            <div class="stage-form-header">
              <span class="stage-form-badge">Tahap 5: Presentasi Solusi</span>
              <h4 class="stage-form-title">Pemaparan Proposal & Ilustrasi Prudential</h4>
              <p class="stage-form-desc">Catat produk yang diajukan beserta nominal premi dan tanggapan calon nasabah.</p>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="sfProduct">Produk yang Diajukan *</label>
                <select id="sfProduct" class="form-select" required>
                  <option value="PRUSolusi Sehat Plus Pro (Kesehatan 1 Bed)" selected>PRUSolusi Sehat Plus Pro (Kesehatan 1 Bed)</option>
                  <option value="PRUCritical Benefit 88 (Sakit Kritis)">PRUCritical Benefit 88 (Sakit Kritis)</option>
                  <option value="PRUWarisan (Dana Warisan Pasti)">PRUWarisan (Dana Warisan Pasti)</option>
                  <option value="PRUCinta Syariah (Jiwa & Kritis)">PRUCinta Syariah (Jiwa & Kritis)</option>
                  <option value="PRUPrime Healthcare Plus">PRUPrime Healthcare Plus</option>
                  <option value="PRULink Generasi Baru">PRULink Generasi Baru</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="sfPlanBenefit">Plan / Manfaat yang Dipilih *</label>
                <input type="text" id="sfPlanBenefit" class="form-input" placeholder="Contoh: Plan Silver B (Kamar 1 Bed) atau UP Rp 1 Miliar" required>
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="sfPremiumProposed">Besaran Premi Ilustrasi (Rp/bulan) *</label>
                <input type="number" id="sfPremiumProposed" class="form-input" placeholder="1500000" step="10000" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="sfPresentationOutcome">Hasil Tanggapan Nasabah *</label>
                <select id="sfPresentationOutcome" class="form-select" required>
                  <option value="agreed" selected>Setuju & Siap Masuk Closing e-SPAJ</option>
                  <option value="objection">Ada Keraguan / Kendala (Perlu Edukasi)</option>
                  <option value="revise_budget">Minta Disesuaikan Nominal Preminya</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="sfPresentationNotes">Catatan Diskusi / Pertanyaan Nasabah</label>
              <textarea id="sfPresentationNotes" class="form-textarea" placeholder="Poin-poin pertanyaan atau ketertarikan nasabah pada manfaat polis..."></textarea>
            </div>

            <div class="stage-form-actions">
              <button type="submit" class="btn btn-primary">
                Simpan Hasil Presentasi
              </button>
            </div>
          </form>
        `;
        break;

      case 'objection': // 6. Tangani Kendala
        let playbookOptions = '<option value="">-- Pilih Rujukan Keberatan Umum --</option>';
        OBJECTION_PLAYBOOK_DATA.forEach(p => {
          playbookOptions += `<option value="${p.id}">${p.title}</option>`;
        });

        specificFormHtml = `
          <form id="stageActionForm">
            <div class="stage-form-header">
              <span class="stage-form-badge">Tahap 6: Tangani Kendala</span>
              <h4 class="stage-form-title">Penanganan Keberatan & Solusi Lapangan</h4>
              <p class="stage-form-desc">Catat kendala yang diutarakan nasabah dan solusi yang disepakati bersama.</p>
            </div>

            <div class="form-group">
              <label class="form-label" for="sfObjectionCategory">Kategori Keberatan Utama *</label>
              <select id="sfObjectionCategory" class="form-select" required>
                ${playbookOptions}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="sfObjectionDetail">Poin Keraguan Spesifik Nasabah *</label>
              <input type="text" id="sfObjectionDetail" class="form-input" placeholder="Contoh: Merasa asuransi kantor sudah cukup / Mau diskusi dengan suami" required>
            </div>

            <div class="form-group">
              <label class="form-label" for="sfObjectionSolution">Edukasi / Jawaban yang Diberikan Agen *</label>
              <textarea id="sfObjectionSolution" class="form-textarea" placeholder="Solusi, sudut pandang, atau penyesuaian yang dijelaskan..." required style="min-height: 60px;"></textarea>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="sfObjectionResult">Kesepakatan Akhir *</label>
                <select id="sfObjectionResult" class="form-select" required>
                  <option value="resolved" selected>Keberatan Tuntas (Lanjut Closing SPAJ)</option>
                  <option value="need_time">Perlu Waktu Diskusi (Jadwalkan Follow-up)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="sfTargetDate">Target Tanggal Kontak Kembali</label>
                <input type="date" id="sfTargetDate" class="form-input" value="${todayStr}">
              </div>
            </div>

            <div class="stage-form-actions">
              <button type="submit" class="btn btn-primary">
                Simpan Penanganan Kendala
              </button>
            </div>
          </form>
        `;
        break;

      case 'closing': // 7. Closing (SPAJ)
        specificFormHtml = `
          <form id="stageActionForm">
            <div class="stage-form-header">
              <span class="stage-form-badge">Tahap 7: Closing (SPAJ)</span>
              <h4 class="stage-form-title">Penyelesaian Formulir e-SPAJ & Pembayaran</h4>
              <p class="stage-form-desc">Pastikan dokumen pengajuan polis lengkap di aplikasi PRUForce sebelum submit ke Underwriting.</p>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="sfSpajNumber">Nomor Draft / e-SPAJ PRUForce *</label>
                <input type="text" id="sfSpajNumber" class="form-input" placeholder="Contoh: SPAJ-2026-9812" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="sfFinalPremium">Nominal Premi Pertama (Rp) *</label>
                <input type="number" id="sfFinalPremium" class="form-input" placeholder="1500000" step="10000" required>
              </div>
            </div>

            <div class="form-group" style="background: var(--color-slate-50); padding: 0.65rem 0.85rem; border-radius: var(--r-xs); border: 1px solid var(--border-subtle);">
              <label class="form-label" style="margin-bottom: 0.35rem;">Checklist Kelengkapan Berkas e-SPAJ:</label>
              <div style="display: flex; flex-direction: column; gap: 0.35rem;">
                <label class="checkbox-label">
                  <input type="checkbox" id="sfCheckKtp" checked>
                  <span>Foto e-KTP Pemegang Polis & Calon Tertanggung</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" id="sfCheckMed" checked>
                  <span>Kuesioner Kesehatan & Riwayat Medis Lengkap</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" id="sfCheckSign" checked>
                  <span>Tanda Tangan Digital Pemegang Polis di PRUForce</span>
                </label>
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="sfPaymentMethod">Metode Pembayaran Premi Pertama *</label>
                <select id="sfPaymentMethod" class="form-select" required>
                  <option value="Virtual Account BCA">Virtual Account BCA</option>
                  <option value="Virtual Account Mandiri">Virtual Account Mandiri</option>
                  <option value="Virtual Account Permata">Virtual Account Permata</option>
                  <option value="Autodebet Kartu Kredit (Visa/Mastercard)">Autodebet Kartu Kredit (Visa/Mastercard)</option>
                  <option value="QRIS PRUForce">QRIS PRUForce</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="sfPaymentStatus">Status Pembayaran Premi *</label>
                <select id="sfPaymentStatus" class="form-select" required>
                  <option value="Sudah Berhasil Dibayar" selected>Sudah Berhasil Dibayar (Lunas)</option>
                  <option value="Menunggu Pembayaran Nasabah">Menunggu Pembayaran Nasabah</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="sfSpajNotes">Catatan Tambahan Pengajuan SPAJ</label>
              <input type="text" id="sfSpajNotes" class="form-input" placeholder="Contoh: Diinfokan proses underwriting 1-3 hari kerja">
            </div>

            <div class="stage-form-actions">
              <button type="submit" class="btn btn-primary">
                Konfirmasi Submit e-SPAJ & Lanjut ke Polis Terbit (Tahap 8)
              </button>
            </div>
          </form>
        `;
        break;

      case 'issued': // 8. Polis Terbit
        specificFormHtml = `
          <form id="stageActionForm">
            <div class="stage-form-header">
              <span class="stage-form-badge">Tahap 8: Polis Terbit</span>
              <h4 class="stage-form-title">Registrasi Polis Terbit & Serah Terima</h4>
              <p class="stage-form-desc">Polis disetujui Underwriting. Daftarkan nomor polis resmi ke portofolio Anda.</p>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="sfPolicyNumber">Nomor Polis Resmi Prudential *</label>
                <input type="text" id="sfPolicyNumber" class="form-input" placeholder="Contoh: 12894562" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="sfEffectiveDate">Tanggal Polis In-Force *</label>
                <input type="date" id="sfEffectiveDate" class="form-input" value="${todayStr}" required>
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="sfPolicyProduct">Produk Polis Resmi *</label>
                <select id="sfPolicyProduct" class="form-select" required>
                  <option value="PRUSolusi Sehat Plus Pro" selected>PRUSolusi Sehat Plus Pro</option>
                  <option value="PRUCritical Benefit 88">PRUCritical Benefit 88</option>
                  <option value="PRUWarisan">PRUWarisan</option>
                  <option value="PRUCinta Syariah">PRUCinta Syariah</option>
                  <option value="PRUPrime Healthcare Plus">PRUPrime Healthcare Plus</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="sfFinalApprovedPremium">Besaran Premi Rutin (Rp) *</label>
                <input type="number" id="sfFinalApprovedPremium" class="form-input" placeholder="1500000" step="10000" required>
              </div>
            </div>

            <div class="form-group" style="background: var(--color-slate-50); padding: 0.65rem 0.85rem; border-radius: var(--r-xs); border: 1px solid var(--border-subtle);">
              <label class="form-label" style="margin-bottom: 0.35rem;">Checklist Edukasi Layanan Nasabah:</label>
              <div style="display: flex; flex-direction: column; gap: 0.35rem;">
                <label class="checkbox-label">
                  <input type="checkbox" id="sfCheckEpolicy" checked>
                  <span>e-Policy & Ringkasan Manfaat telah dikirimkan ke nasabah</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" id="sfCheckPruService" checked>
                  <span>Edukasi aktivasi akun PRUServices & kartu digital RS</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" id="sfCheckAutoAddPolicy" checked>
                  <span><strong>Otomatis masukkan ke menu Portofolio Polis saya</strong></span>
                </label>
              </div>
            </div>

            <div class="stage-form-actions">
              <button type="submit" class="btn btn-primary">
                Simpan Polis & Lanjut ke Minta Referensi (Tahap 9)
              </button>
            </div>
          </form>
        `;
        break;

      case 'referral': // 9. Referensi
        specificFormHtml = `
          <form id="stageActionForm">
            <div class="stage-form-header">
              <span class="stage-form-badge">Tahap 9: Referensi & Servis</span>
              <h4 class="stage-form-title">Input Referensi Nama Baru dari Nasabah</h4>
              <p class="stage-form-desc">Nasabah yang puas adalah sumber calon nasabah terbaik. Nama yang dimasukkan akan otomatis masuk ke Database Calon Nasabah Anda!</p>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="sfRefName">Nama Calon Nasabah Referensi *</label>
                <input type="text" id="sfRefName" class="form-input" placeholder="Contoh: Dimas Aditya" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="sfRefPhone">Nomor WhatsApp Referensi *</label>
                <input type="tel" id="sfRefPhone" class="form-input" placeholder="081234567890" required>
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="sfRefRelation">Hubungan dengan Nasabah *</label>
                <select id="sfRefRelation" class="form-select" required>
                  <option value="Keluarga / Kerabat">Keluarga / Kerabat</option>
                  <option value="Rekan Kerja / Profesi" selected>Rekan Kerja / Kantor</option>
                  <option value="Sahabat Dekat">Sahabat Dekat</option>
                  <option value="Teman Bisnis / Komunitas">Teman Bisnis / Komunitas</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="sfRefJob">Pekerjaan / Jabatan Referensi</label>
                <input type="text" id="sfRefJob" class="form-input" placeholder="Contoh: Operations Lead">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="sfRefNotes">Catatan Rekomendasi dari Nasabah</label>
              <textarea id="sfRefNotes" class="form-textarea" placeholder="Contoh: Rekan satu tim di kantor, baru punya anak pertama, butuh perlindungan rawat inap..."></textarea>
            </div>

            <div class="stage-form-actions">
              <button type="submit" class="btn btn-primary">
                + Tambahkan Referensi ke Database Calon Nasabah
              </button>
            </div>
          </form>
        `;
        break;

      default:
        specificFormHtml = `<p>Tahap tidak dikenali.</p>`;
    }

    // General fallback form
    const generalFormHtml = `
      <form id="generalInteractionForm">
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="genChannel">Metode Kontak *</label>
            <select id="genChannel" class="form-select" required>
              <option value="WhatsApp" selected>WhatsApp</option>
              <option value="Telepon">Panggilan Telepon</option>
              <option value="Kopi Darat">Tatap Muka Langsung</option>
              <option value="Zoom">Video Call / Zoom</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="genDate">Waktu Interaksi *</label>
            <input type="datetime-local" id="genDate" class="form-input" value="${nowLocalIso}" required>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="genResponse">Catatan Percakapan / Respon *</label>
          <textarea id="genResponse" class="form-textarea" placeholder="Tuliskan rangkuman percakapan umum..." required style="min-height: 55px;"></textarea>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="genObjection">Keberatan (Bila Ada)</label>
            <input type="text" id="genObjection" class="form-input" placeholder="Kendala yang disampaikan...">
          </div>
          <div class="form-group">
            <label class="form-label" for="genNextAction">Rencana & Jadwal Kontak Berikutnya</label>
            <input type="text" id="genNextAction" class="form-input" placeholder="Rencana tindak lanjut..." style="margin-bottom: 0.3rem;">
            <input type="date" id="genTargetDate" class="form-input" value="${prospect.targetFollowUp || ''}">
          </div>
        </div>

        <div style="text-align: right; margin-top: 0.4rem;">
          <button type="submit" class="btn btn-primary btn-sm">
            Simpan Catatan Rutin
          </button>
        </div>
      </form>
    `;

    // Render Box Container with Mode Switcher
    containerEl.innerHTML = `
      <div class="stage-action-box">
        <div class="stage-action-mode-bar">
          <div class="mode-tabs">
            <button type="button" class="mode-tab-btn ${this.currentMode === 'stage-specific' ? 'active' : ''}" id="tabModeStageSpecific">
              Aksi Khusus: ${stageObj.label}
            </button>
            <button type="button" class="mode-tab-btn ${this.currentMode === 'general-log' ? 'active' : ''}" id="tabModeGeneralLog">
              Catatan Bebas / Komunikasi Rutin
            </button>
          </div>
        </div>

        <div id="paneStageSpecific" style="display: ${this.currentMode === 'stage-specific' ? 'block' : 'none'};">
          ${specificFormHtml}
        </div>

        <div id="paneGeneralLog" style="display: ${this.currentMode === 'general-log' ? 'block' : 'none'};">
          ${generalFormHtml}
        </div>
      </div>
    `;

    // Bind Mode Tabs
    const tabStage = containerEl.querySelector('#tabModeStageSpecific');
    const tabGen = containerEl.querySelector('#tabModeGeneralLog');
    const paneStage = containerEl.querySelector('#paneStageSpecific');
    const paneGen = containerEl.querySelector('#paneGeneralLog');

    tabStage.addEventListener('click', () => {
      this.currentMode = 'stage-specific';
      tabStage.classList.add('active');
      tabGen.classList.remove('active');
      paneStage.style.display = 'block';
      paneGen.style.display = 'none';
    });

    tabGen.addEventListener('click', () => {
      this.currentMode = 'general-log';
      tabGen.classList.add('active');
      tabStage.classList.remove('active');
      paneStage.style.display = 'none';
      paneGen.style.display = 'block';
    });

    // Auto Fill Playbook Script if on objection stage
    const sfObjectionCategory = containerEl.querySelector('#sfObjectionCategory');
    if (sfObjectionCategory) {
      sfObjectionCategory.addEventListener('change', (e) => {
        const playbookItem = OBJECTION_PLAYBOOK_DATA.find(item => item.id === e.target.value);
        if (playbookItem) {
          const detailInput = containerEl.querySelector('#sfObjectionDetail');
          const solText = containerEl.querySelector('#sfObjectionSolution');
          if (detailInput) detailInput.value = playbookItem.mindset;
          if (solText) solText.value = playbookItem.keyInsight;
        }
      });
    }

    // Dynamic Multi-Need Checklist Listeners (Fact Finding)
    const checklistContainer = containerEl.querySelector('#needsChecklistContainer');
    if (checklistContainer) {
      checklistContainer.addEventListener('change', (e) => {
        if (e.target.classList.contains('need-checkbox')) {
          const card = e.target.closest('.need-item-card');
          if (card) {
            const isChecked = e.target.checked;
            card.classList.toggle('selected', isChecked);
            const prioSelect = card.querySelector('.need-priority-select');
            const targetWrap = card.querySelector('.need-target-wrap');
            if (prioSelect) prioSelect.disabled = !isChecked;
            if (targetWrap) targetWrap.style.display = isChecked ? 'block' : 'none';
          }
        }
      });

      const btnAddCustom = containerEl.querySelector('#btnAddCustomNeed');
      const customInput = containerEl.querySelector('#customNeedInput');
      if (btnAddCustom && customInput) {
        const handleAddCustom = () => {
          const val = customInput.value.trim();
          if (!val) return;
          const customId = `custom_${Date.now()}`;
          const newCard = document.createElement('div');
          newCard.className = 'need-item-card selected';
          newCard.dataset.needId = customId;
          newCard.innerHTML = `
            <div class="need-item-header">
              <label class="need-checkbox-label">
                <input type="checkbox" class="need-checkbox" value="${customId}" checked>
                <span class="need-title">${val}</span>
              </label>
              <select class="need-priority-select form-select-xs">
                <option value="Utama" selected>Prioritas Utama</option>
                <option value="Sekunder">Sekunder</option>
                <option value="Masa Depan">Rencana Masa Depan</option>
              </select>
            </div>
            <div class="need-target-wrap" style="display: block;">
              <input type="text" class="need-target-input form-input form-input-xs" placeholder="Rencana / target proteksi..." value="">
            </div>
          `;
          checklistContainer.appendChild(newCard);
          customInput.value = '';
        };

        btnAddCustom.addEventListener('click', handleAddCustom);
        customInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleAddCustom();
          }
        });
      }
    }

    // Attach form submit handlers
    this.setupFormSubmits(prospect, containerEl, stageId);
  }

  setupFormSubmits(prospect, containerEl, stageId) {
    const stageForm = containerEl.querySelector('#stageActionForm');
    if (stageForm) {
      stageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleStageSpecificSubmit(prospect, stageId, stageForm);
      });
    }

    const genForm = containerEl.querySelector('#generalInteractionForm');
    if (genForm) {
      genForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleGeneralSubmit(prospect, genForm);
      });
    }
  }

  async handleStageSpecificSubmit(prospect, stageId, form) {
    const nowIso = new Date().toISOString();
    let responseText = '';
    let objectionText = '-';
    let nextActionText = '-';
    let nextTargetDate = null;
    let newStage = stageId;

    switch (stageId) {
      case 'suspect': {
        const channel = form.querySelector('#sfChannel').value;
        const topic = form.querySelector('#sfIceBreakerTopic').value.trim();
        const targetDate = form.querySelector('#sfTargetDate').value;
        const notes = form.querySelector('#sfNotes').value.trim();

        responseText = `[Rencana Pendekatan Awal] Jalur: ${channel}. Topik pembuka: "${topic}".`;
        nextActionText = `Sapaan pertama via ${channel} topik ${topic}`;
        nextTargetDate = targetDate;
        newStage = 'approach'; // Advance to Pendekatan
        if (notes) prospect.notes = notes;
        break;
      }

      case 'approach': {
        const channel = form.querySelector('#sfChannel').value;
        const sentiment = form.querySelector('#sfResponseSentiment').value;
        const summary = form.querySelector('#sfResponseSummary').value.trim();
        const nextStep = form.querySelector('#sfNextStep').value;
        const targetDate = form.querySelector('#sfTargetDate').value;

        responseText = `[Hasil Pendekatan] Sikap nasabah: ${sentiment}. Hasil: ${summary}`;
        nextActionText = nextStep === 'appointment' ? 'Menyiapkan materi untuk sesi janji temu' : 'Follow up sapaan berkala';
        nextTargetDate = targetDate;
        if (nextStep === 'appointment') {
          newStage = 'appointment';
        }
        break;
      }

      case 'appointment': {
        const meetingTime = form.querySelector('#sfMeetingTime').value;
        const format = form.querySelector('#sfMeetingFormat').value;
        const location = form.querySelector('#sfMeetingLocation').value.trim();
        const agenda = form.querySelector('#sfMeetingAgenda').value;

        const formattedTime = new Date(meetingTime).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        responseText = `[Janji Temu Dikonfirmasi] Jadwal: ${formattedTime}. Format: ${format} (${location}). Agenda: ${agenda}.`;
        nextActionText = `Pertemuan: ${agenda} di ${location}`;
        nextTargetDate = meetingTime.split('T')[0];
        newStage = 'fact_finding'; // Advance to Bedah Kebutuhan
        break;
      }

      case 'fact_finding': {
        const existingCover = form.querySelector('#sfExistingCover').value;
        const dependents = form.querySelector('#sfDependents').value.trim() || 'Keluarga';
        const budget = form.querySelector('#sfBudgetRange').value;
        const medNotes = form.querySelector('#sfMedicalNotes').value.trim();

        // Collect all checked needs
        const selectedNeeds = [];
        const needCards = form.querySelectorAll('.need-item-card');
        needCards.forEach(card => {
          const chk = card.querySelector('.need-checkbox');
          if (chk && chk.checked) {
            const needId = card.dataset.needId;
            const title = card.querySelector('.need-title')?.textContent.trim() || needId;
            const priority = card.querySelector('.need-priority-select')?.value || 'Utama';
            const target = card.querySelector('.need-target-input')?.value.trim() || '';
            selectedNeeds.push({ id: needId, label: title, priority, target });
          }
        });

        // Persist needs to prospect
        try {
          await this.app.api.updateProspect(prospect.id, {
            ...prospect,
            needs: selectedNeeds
          });
          prospect.needs = selectedNeeds;
        } catch (err) {
          console.error('Failed to update prospect needs:', err);
        }

        const needsCount = selectedNeeds.length;
        const needsSummary = needsCount > 0
          ? selectedNeeds.map(n => `${n.label} (${n.priority}${n.target ? ': ' + n.target : ''})`).join('; ')
          : 'Proteksi Dasar';

        responseText = `[Bedah Kebutuhan Finansial] ${needsCount} Kebutuhan Teridentifikasi: [${needsSummary}]. Proteksi saat ini: ${existingCover}. Tanggungan: ${dependents}. Anggaran premi: ${budget}.${medNotes ? ` Catatan medis: ${medNotes}` : ''}`;
        nextActionText = `Susun ilustrasi proposal komprehensif berdasarkan ${needsCount} kebutuhan teridentifikasi`;
        nextTargetDate = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
        newStage = 'presentation'; // Advance to Presentasi
        break;
      }

      case 'presentation': {
        const product = form.querySelector('#sfProduct').value;
        const plan = form.querySelector('#sfPlanBenefit').value.trim();
        const premium = form.querySelector('#sfPremiumProposed').value;
        const outcome = form.querySelector('#sfPresentationOutcome').value;
        const notes = form.querySelector('#sfPresentationNotes').value.trim();

        const premFormatted = this.app.formatRupiah(premium);
        responseText = `[Presentasi Proposal] Produk: ${product} (${plan}). Premi: ${premFormatted}/bln. Respon: ${outcome === 'agreed' ? 'Setuju' : outcome === 'objection' ? 'Ada Keberatan' : 'Minta Penyesuaian'}.${notes ? ` Catatan: ${notes}` : ''}`;

        if (outcome === 'agreed') {
          newStage = 'closing';
          nextActionText = `Siapkan form e-SPAJ via PRUForce untuk ${product}`;
        } else if (outcome === 'objection') {
          newStage = 'objection';
          nextActionText = `Edukasi penanganan kendala terkait proposal ${product}`;
        } else {
          nextActionText = `Revisi ilustrasi premi proposal ${product}`;
        }
        nextTargetDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        break;
      }

      case 'objection': {
        const categorySelect = form.querySelector('#sfObjectionCategory');
        const catLabel = categorySelect.options[categorySelect.selectedIndex]?.text || 'Keberatan';
        const detail = form.querySelector('#sfObjectionDetail').value.trim();
        const solution = form.querySelector('#sfObjectionSolution').value.trim();
        const result = form.querySelector('#sfObjectionResult').value;
        const targetDate = form.querySelector('#sfTargetDate').value;

        objectionText = detail;
        responseText = `[Penanganan Kendala] Kategori: ${catLabel}. Keraguan: "${detail}". Solusi/Edukasi agen: "${solution}". Hasil: ${result === 'resolved' ? 'Keberatan tuntas' : 'Perlu waktu berpikir'}.`;

        if (result === 'resolved') {
          newStage = 'closing';
          nextActionText = 'Keberatan tuntas, lanjutkan pengajuan formulir e-SPAJ';
        } else {
          nextActionText = `Follow up ulang nasabah terkait ${catLabel}`;
        }
        nextTargetDate = targetDate;
        break;
      }

      case 'closing': {
        const spajNum = form.querySelector('#sfSpajNumber').value.trim();
        const premium = form.querySelector('#sfFinalPremium').value;
        const paymentMethod = form.querySelector('#sfPaymentMethod').value;
        const paymentStatus = form.querySelector('#sfPaymentStatus').value;
        const spajNotes = form.querySelector('#sfSpajNotes').value.trim();

        const premFormatted = this.app.formatRupiah(premium);
        responseText = `[Pengajuan e-SPAJ] No. e-SPAJ: ${spajNum}. Premi: ${premFormatted}. Pembayaran: ${paymentMethod} (${paymentStatus}). Berkas KTP & TTD Digital lengkap.${spajNotes ? ` Catatan: ${spajNotes}` : ''}`;
        nextActionText = `Monitor verifikasi underwriting e-SPAJ ${spajNum}`;
        nextTargetDate = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];
        newStage = 'issued'; // Advance to Polis Terbit
        break;
      }

      case 'issued': {
        const polNum = form.querySelector('#sfPolicyNumber').value.trim();
        const effDate = form.querySelector('#sfEffectiveDate').value;
        const product = form.querySelector('#sfPolicyProduct').value;
        const premium = form.querySelector('#sfFinalApprovedPremium').value;
        const autoAdd = form.querySelector('#sfCheckAutoAddPolicy').checked;

        const premFormatted = this.app.formatRupiah(premium);
        responseText = `[Polis Terbit & In-Force] No. Polis Resmi: ${polNum}. Produk: ${product}. In-Force: ${effDate}. Premi: ${premFormatted}. e-Policy & Panduan RS Cashless telah diserahkan.`;
        nextActionText = 'Kunjungan servis perdana & minta referensi nasabah baru';
        nextTargetDate = new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];
        newStage = 'referral'; // Advance to Referensi

        // Auto add to policies table in database
        if (autoAdd) {
          try {
            await this.app.policyManager.createPolicyFromProspect({
              policy_number: polNum,
              holder_name: prospect.name,
              insured_name: prospect.name,
              phone: prospect.phone,
              product_name: product,
              premium_amount: Number(premium) || 1500000,
              frequency: 'Bulanan',
              issued_date: effDate,
              status: 'In-Force',
              notes: `Polis hasil closing via e-SPAJ`
            });
            this.app.showToast(`Polis ${polNum} otomatis masuk ke Portofolio Polis!`);
          } catch (err) {
            console.error('Failed to auto create policy:', err);
          }
        }
        break;
      }

      case 'referral': {
        const refName = form.querySelector('#sfRefName').value.trim();
        const refPhone = form.querySelector('#sfRefPhone').value.trim();
        const refRelation = form.querySelector('#sfRefRelation').value;
        const refJob = form.querySelector('#sfRefJob').value.trim();
        const refNotes = form.querySelector('#sfRefNotes').value.trim();

        responseText = `[Referensi Baru Diterima] Nasabah memberikan referensi: ${refName} (${refPhone}) - ${refRelation}, Pekerjaan: ${refJob || '-'}.${refNotes ? ` Catatan: ${refNotes}` : ''}`;
        nextActionText = `Hubungi calon nasabah referensi: ${refName} (${refPhone})`;
        nextTargetDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

        // Auto add to Database Calon Nasabah
        try {
          await this.app.createReferralProspect({
            name: refName,
            phone: refPhone,
            relation: 'Referensi Nasabah',
            job: refJob || 'Karyawan',
            address: `Referensi dari ${prospect.name}`,
            temperature: 'warm',
            stage: 'suspect',
            targetFollowUp: nextTargetDate,
            notes: `Direferensikan oleh ${prospect.name} (${prospect.phone}). Hubungan: ${refRelation}. ${refNotes}`
          });
          this.app.showToast(`Referensi ${refName} berhasil masuk ke Database Calon Nasabah!`);
        } catch (err) {
          console.error('Failed to auto create referral prospect:', err);
        }
        break;
      }
    }

    try {
      // 1. Record interaction history
      await this.app.api.addInteraction(prospect.id, {
        channel: 'Aktivitas Tahap',
        date: nowIso,
        response: responseText,
        objection: objectionText,
        nextAction: nextActionText,
        targetDate: nextTargetDate
      });

      // 2. Update stage if advanced
      if (newStage !== stageId) {
        await this.app.api.updateProspectStage(prospect.id, newStage);
        this.app.showToast(`Tahap diperbarui: ${newStage}`);
      }

      // 3. Refresh app state
      await this.app.refreshProspects();
      await this.app.refreshDashboardStats();

      // 4. Update the open modal
      const updatedP = this.app.prospects.find(item => item.id === prospect.id);
      if (updatedP) {
        this.app.renderTimeline(updatedP);
        document.getElementById('currentStageLabel').textContent = (SALES_STAGES.find(s => s.id === updatedP.stage) || SALES_STAGES[0]).label;
        document.getElementById('selectUpdateStage').value = updatedP.stage;
        this.renderStageActionBox(updatedP, containerEl);
      }
    } catch (err) {
      alert('Gagal menyimpan aktivitas tahap: ' + err.message);
    }
  }

  async handleGeneralSubmit(prospect, form) {
    const channel = form.querySelector('#genChannel').value;
    const date = form.querySelector('#genDate').value;
    const response = form.querySelector('#genResponse').value.trim();
    const objection = form.querySelector('#genObjection').value.trim() || '-';
    const nextAction = form.querySelector('#genNextAction').value.trim() || '-';
    const targetDate = form.querySelector('#genTargetDate').value;

    try {
      await this.app.api.addInteraction(prospect.id, {
        channel,
        date: new Date(date).toISOString(),
        response,
        objection,
        nextAction,
        targetDate
      });

      this.app.showToast('Catatan komunikasi tersimpan!');
      await this.app.refreshProspects();
      await this.app.refreshDashboardStats();

      const updatedP = this.app.prospects.find(item => item.id === prospect.id);
      if (updatedP) {
        this.app.renderTimeline(updatedP);
        form.reset();
      }
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    }
  }
}
