// ==========================================================================
// AGENTPROSPECT PRO - OBJECTION HANDLING PLAYBOOK MODULE
// Standar Panduan Penanganan Keberatan Lapangan + AI Response Coach
// ==========================================================================

import { api } from './api.js';

export const OBJECTION_PLAYBOOK_DATA = [
  {
    id: 'bpjs_kantor',
    title: '"Saya sudah punya BPJS dan asuransi dari kantor"',
    category: 'Double Protection',
    mindset: 'Nasabah merasa sudah aman karena setiap bulan sudah dipotong BPJS dan ada fasilitas asuransi grup dari kantor.',
    keyInsight: 'Asuransi kantor terikat pada status karyawan (hilang jika resign/PHK/pensiun). BPJS sangat bagus namun memiliki sistem rujukan berjenjang dan kamar perawatan sesuai kelas, bukan 1 bed privat.',
    script: `“Wah mantap sekali, itu artinya perusahaan tempat Bapak/Ibu bekerja sangat peduli dan bertanggung jawab terhadap kesejahteraan karyawannya!

Boleh saya tanya sedikit Bapak/Ibu, fasilitas asuransi kantor tersebut berlaku selama kita masih aktif bekerja di sana, betul ya? Kira-kira kalau suatu saat kita pensiun atau memutuskan buka usaha sendiri di usia 50 tahun ke atas, apakah perlindungan itu masih ikut bersama kita?

Di asuransi, semakin bertambah usia dan ada riwayat sakit, kita sudah tidak bisa lagi mendaftar baru. Nah, fungsi kartu asuransi swasta ini bukan untuk menyaingi asuransi kantor, melainkan sebagai backup permanen pribadi yang dimiliki seumur hidup, plus memberikan kenyamanan kamar 1 pasien 1 bed (privat) bebas antre rujukan jika terjadi kondisi darurat.”`
  },
  {
    id: 'no_budget',
    title: '"Belum ada alokasi budget / uangnya lagi dipakai kebutuhan lain"',
    category: 'Prioritas Finansial',
    mindset: 'Nasabah menganggap asuransi sebagai pengeluaran tambahan (beban), bukan sebagai pos penyelamat aset.',
    keyInsight: 'Jika untuk membayar premi 500rb - 1jt/bulan saja terasa berat, bayangkan bagaimana jika tiba-tiba divonis sakit kritis yang membutuhkan dana ratusan juta tunai sekaligus.',
    script: `“Saya sangat mengerti Bapak/Ibu, di kondisi sekarang kita memang harus bijak mengatur pos pengeluaran keluarga.

Boleh saya izin bertanya satu hal yang menggelitik? Kira-kira jika saat ini kita menyisihkan 5-10% dari penghasilan bulanan terasa agak ketat, bagaimana jika amit-amit terjadi risiko kesehatan yang mengharuskan kita mengeluarkan 100-300 juta rupiah dalam tempo 3 hari ke depan? Mana yang kira-kira jauh lebih memberatkan keuangan keluarga?

Di sistem proteksi kami, kita tidak perlu langsung mengambil plan yang mahal. Kita bisa mulai dari fondasi dasar yang sangat terjangkau, yang penting pintu darurat keuangan keluarga sudah terkunci dari risiko kebangkrutan medis.”`
  },
  {
    id: 'discuss_spouse',
    title: '"Mau diskusi dulu dengan suami / istri / pasangan"',
    category: 'Otoritas Keputusan',
    mindset: 'Bisa jadi keberatan yang tulus karena keputusan keuangan diambil bersama, atau alasan sopan untuk menunda.',
    keyInsight: 'Dukung niat baiknya karena proteksi keluarga memang harus diketahui pasangan. Namun, tawarkan untuk menjelaskan langsung kepada pasangan agar informasinya tidak bias.',
    script: `“Luar biasa Bapak/Ibu, saya sangat setuju! Keputusan besar demi perlindungan masa depan keluarga memang wajib dibicarakan berdua dengan pasangan tercinta.

Agar Bapak/Ibu tidak repot menjelaskan ulang detail teknis angka-angka dan manfaatnya ke suami/istri (yang seringkali bikin pusing kalau bukan agennya yang bicara), bagaimana kalau besok malam atau weekend ini saya sempatkan mampir ngopi 15 menit, atau kita Zoom singkat bertiga santai?

Dengan begitu, jika suami/istri ada pertanyaan atau keraguan, saya bisa langsung bantu jawabkan dengan jelas tanpa membebani Bapak/Ibu. Kira-kira hari Sabtu sore atau Minggu pagi yang lebih santai?”`
  },
  {
    id: 'young_healthy',
    title: '"Saya masih muda dan sehat, belum butuh asuransi"',
    category: 'Waktu & Kesehatan',
    mindset: 'Merasa tubuh bugar, jarang ke dokter, sehingga menganggap asuransi baru diperlukan saat tua.',
    keyInsight: 'Asuransi adalah satu-satunya produk di dunia yang harus dibeli saat kita BELUM membutuhkannya. Saat kita sudah butuh (sudah sakit/masuk RS), asuransi sudah tidak bisa dibeli lagi berapa pun uang yang kita punya.',
    script: `“Alhamdulillah, justru saat kondisi Bapak/Ibu sedang sehat prima dan muda seperti inilah waktu yang paling tepat dan paling hemat untuk memiliki proteksi!

Tahukah Bapak/Ibu, di asuransi ada prinsip sederhana: Kita membeli asuransi bukan dengan uang, melainkan dengan KESEHATAN kita. Uang hanya alat pembayar preminya saja. Begitu seseorang divonis kolesterol tinggi, diabetes, atau kista, perusahaan asuransi bisa menolak atau mengecualikan penyakit tersebut seumur hidup.

Selain itu, karena Bapak/Ibu masih muda, preminya saat ini adalah premi terendah yang pernah ada. Kalau kita tunggu 5 atau 10 tahun lagi, preminya akan jauh lebih tinggi untuk manfaat yang sama persis.”`
  },
  {
    id: 'syariah_halal',
    title: '"Apakah asuransi tidak riba / bagaimana hukum syariahnya?"',
    category: 'Kepatuhan Syariah',
    mindset: 'Nasabah memiliki prinsip keagamaan yang kuat dan khawatir dengan unsur ketidakpastian (gharar), judi (maysir), atau bunga (riba).',
    keyInsight: 'Asuransi Syariah diawasi langsung oleh Dewan Syariah Nasional (DSN - MUI) dengan prinsip tolong-menolong (Ta\'awun).',
    script: `“Pertanyaan yang sangat mulia Bapak/Ibu! Ini bukti kehati-hatian kita dalam menjaga keberkahan nafkah keluarga.

Kabar baiknya, entitas asuransi syariah diawasi langsung oleh Dewan Pengawas Syariah dari DSN-MUI (Majelis Ulama Indonesia).

Di Asuransi Syariah, konsepnya bukan jual-beli risiko, melainkan Ta'awun (Tolong Menolong). Dana premi para peserta dikumpulkan ke dalam rekening Dana Tabarru'. Jika ada peserta yang mengalami musibah sakit atau meninggal, dana tersebut digunakan bersama untuk saling menolong sesama peserta secara adil, transparan, dan bebas dari unsur riba, gharar, maupun maysir.”`
  },
  {
    id: 'claim_trauma',
    title: '"Pernah dengar cerita asuransi susah klaim / agennya menghilang"',
    category: 'Reputasi & Layanan',
    mindset: 'Pernah membaca berita viral di media sosial atau punya kerabat yang klaimnya ditolak karena ketidaktahuan prosedur.',
    keyInsight: '99% klaim ditolak terjadi karena 2 hal: Pre-existing condition (penyakit sudah ada sebelum daftar tapi disembunyikan/tidak jujur saat SPAJ), atau penyakit terjadi dalam masa tunggu (waiting period). Jelaskan komitmen pendampingan Anda.',
    script: `“Saya sangat memahami kekhawatiran Bapak/Ibu. Wajar sekali jika Bapak/Ibu bersikap waspada dan ingin memastikan uang yang disetorkan aman.

Namun faktanya Bapak/Ibu, setiap tahunnya industri asuransi jiwa membayarkan klaim puluhan triliun rupiah di Indonesia secara tertib. Klaim yang bermasalah biasanya terjadi karena 2 hal: riwayat penyakit masa lalu yang tidak diisi jujur saat awal daftar, atau masih dalam masa tunggu (waiting period).

Itulah mengapa peran saya sebagai Tenaga Pemasar resmi berlisensi hadir di sini: tugas saya adalah memastikan sejak hari pertama semua data riwayat medis diisi secara transparan agar di kemudian hari klaim berjalan lancar tanpa celah. Dan saat ini proses klaim Rumah Sakit Rekanan sudah berbasis sistem Cashless digital via portal layanan nasabah.”`
  },
  {
    id: 'too_expensive',
    title: '"Preminya kemahalan per bulan"',
    category: 'Penyesuaian Anggaran',
    mindset: 'Melihat nominal premi sebagai pengeluaran hangus yang tinggi.',
    keyInsight: 'Bandingkan dengan biaya gaya hidup harian atau tawarkan opsi plan dengan fitur deductible.',
    script: `“Terima kasih masukannya Bapak/Ibu. Boleh tahu, nominal yang menurut Bapak/Ibu paling nyaman di kantong setiap bulannya kira-kira di angka berapa?

Seringkali premi terasa besar jika dilihat sebagai angka akumulasi tahunan. Namun jika kita cermati, premi Rp 30.000 - Rp 50.000 per hari sebenarnya setara dengan alokasi harian yang biasa kita keluarkan tanpa terasa.

Bedanya, di program proteksi kami alokasi tersebut mengamankan keuangan keluarga hingga miliaran rupiah jika terjadi musibah rawat inap. Dan yang terpenting, proposal ini sangat fleksibel dan dapat kami sesuaikan tepat sesuai ketersediaan anggaran Bapak/Ibu.”`
  },
  {
    id: 'agent_resigns',
    title: '"Nanti kalau agennya berhenti / resign, polis saya bagaimana?"',
    category: 'Kontinuitas Polis',
    mindset: 'Khawatir tidak ada yang mengurus jika agen yang mengajaknya berganti profesi.',
    keyInsight: 'Kontrak polis adalah antara Pemegang Polis dengan perusahaan asuransi jiwa berizin OJK, bukan dengan pribadi agen. Kantor cabang agensi dan Customer Care selalu siap, plus sistem transfer servicing agent.',
    script: `“Pertanyaan yang sangat penting dan bijak Bapak/Ibu!

Perlu kami sampaikan bahwa kontrak asuransi yang sah dibuat antara Bapak/Ibu dengan perusahaan asuransi jiwa resmi yang berizin dan diawasi OJK. Hak manfaat perlindungan Bapak/Ibu dijamin secara hukum oleh korporasi.

Secara profesional, saya mendedikasikan karier ini untuk jangka panjang dan agensi kami memiliki tim operasional yang lengkap. Selain itu, perusahaan asuransi memiliki mekanisme penunjukan Servicing Agent resmi serta layanan Customer Line dan kantor agensi di seluruh kota besar di Indonesia.”`
  }
];

export class PlaybookManager {
  constructor(app = null) {
    this.app = app;
    this.container = document.getElementById('playbookContainer');
    this.playbookItems = [];
    this.searchQuery = '';
    this.selectedCategory = 'all';
    this.init();
  }

  init() {
    this.setupListeners();
    this.loadPlaybook();
  }

  setupListeners() {
    // Search & Category Filter
    const searchInput = document.getElementById('playbookSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.render();
      });
    }

    const catFilter = document.getElementById('playbookCategoryFilter');
    if (catFilter) {
      catFilter.addEventListener('change', (e) => {
        this.selectedCategory = e.target.value;
        this.render();
      });
    }

    // Modal Add Playbook
    const btnOpenAdd = document.getElementById('btnOpenAddPlaybook');
    if (btnOpenAdd) {
      btnOpenAdd.addEventListener('click', () => this.openAddModal());
    }

    // AI Generate button inside modal
    const btnAi = document.getElementById('btnGeneratePlaybookAI');
    if (btnAi) {
      btnAi.addEventListener('click', () => this.handleAIGenerate());
    }

    // Form Submit
    const form = document.getElementById('playbookForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }
  }

  async loadPlaybook() {
    try {
      const res = await api.getPlaybook();
      if (res.playbook && res.playbook.length > 0) {
        this.playbookItems = res.playbook.map(p => ({
          id: p.id,
          title: p.title,
          category: p.category,
          mindset: p.mindset,
          keyInsight: p.key_insight,
          script: p.script,
          isCustom: Boolean(p.is_custom)
        }));
      } else {
        this.playbookItems = [...OBJECTION_PLAYBOOK_DATA];
      }
      this.populateCategoryFilter();
      this.render();
    } catch (err) {
      console.error('Failed to load playbook from API, using defaults:', err);
      this.playbookItems = [...OBJECTION_PLAYBOOK_DATA];
      this.populateCategoryFilter();
      this.render();
    }
  }

  populateCategoryFilter() {
    const catFilter = document.getElementById('playbookCategoryFilter');
    if (!catFilter) return;

    const categories = Array.from(new Set(this.playbookItems.map(p => p.category))).filter(Boolean);
    catFilter.innerHTML = '<option value="all">Semua Kategori Keberatan</option>';
    categories.forEach(cat => {
      catFilter.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
  }

  openAddModal() {
    const form = document.getElementById('playbookForm');
    if (form) form.reset();
    const modal = document.getElementById('modalAddPlaybook');
    if (modal) modal.classList.add('active');
  }

  openAddModalWithPrefill(prospect) {
    this.openAddModal();
    if (prospect) {
      const titleInput = document.getElementById('pbFormTitle');
      if (titleInput) {
        titleInput.value = prospect.notes ? `Kendala prospek ${prospect.name}: ${prospect.notes}` : `Keberatan dari calon nasabah ${prospect.name}`;
      }
    }
  }

  closeAddModal() {
    const modal = document.getElementById('modalAddPlaybook');
    if (modal) modal.classList.remove('active');
  }

  async handleAIGenerate() {
    const titleInput = document.getElementById('pbFormTitle');
    const catSelect = document.getElementById('pbFormCategory');
    const objection = titleInput?.value.trim();

    if (!objection) {
      alert('Ketikkan terlebih dahulu kalimat keberatan calon nasabah.');
      titleInput?.focus();
      return;
    }

    const btnAi = document.getElementById('btnGeneratePlaybookAI');
    const originalText = btnAi.innerHTML;
    btnAi.disabled = true;
    btnAi.innerHTML = `<span>⏳ Menganalisa & Merumuskan Respon...</span>`;

    try {
      const res = await api.generateAIPlaybook(objection, catSelect?.value);
      if (res.result) {
        const r = res.result;
        if (catSelect && r.category) catSelect.value = r.category;
        const mindsetEl = document.getElementById('pbFormMindset');
        const keyInsightEl = document.getElementById('pbFormKeyInsight');
        const scriptEl = document.getElementById('pbFormScript');

        if (mindsetEl) mindsetEl.value = r.mindset;
        if (keyInsightEl) keyInsightEl.value = r.key_insight;
        if (scriptEl) scriptEl.value = r.script;
      }
    } catch (err) {
      alert('Gagal menghasilkan respon AI: ' + err.message);
    } finally {
      btnAi.disabled = false;
      btnAi.innerHTML = originalText;
    }
  }

  async handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const title = form.querySelector('#pbFormTitle').value.trim();
    const category = form.querySelector('#pbFormCategory').value;
    const mindset = form.querySelector('#pbFormMindset').value.trim();
    const key_insight = form.querySelector('#pbFormKeyInsight').value.trim();
    const script = form.querySelector('#pbFormScript').value.trim();

    if (!title || !script) {
      alert('Kalimat keberatan dan skrip respon wajib diisi.');
      return;
    }

    try {
      await api.createPlaybookItem({
        title,
        category,
        mindset,
        key_insight,
        script
      });
      this.closeAddModal();
      alert('Panduan keberatan berhasil ditambahkan!');
      await this.loadPlaybook();
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    }
  }

  async deleteItem(id, title) {
    if (confirm(`Hapus panduan keberatan "${title}"?`)) {
      try {
        await api.deletePlaybookItem(id);
        alert('Panduan keberatan berhasil dihapus.');
        await this.loadPlaybook();
      } catch (err) {
        alert('Gagal menghapus: ' + err.message);
      }
    }
  }

  getFilteredItems() {
    return this.playbookItems.filter(item => {
      if (this.selectedCategory !== 'all' && item.category !== this.selectedCategory) {
        return false;
      }
      if (this.searchQuery) {
        const tMatch = (item.title || '').toLowerCase().includes(this.searchQuery);
        const sMatch = (item.script || '').toLowerCase().includes(this.searchQuery);
        const kMatch = (item.keyInsight || '').toLowerCase().includes(this.searchQuery);
        if (!tMatch && !sMatch && !kMatch) return false;
      }
      return true;
    });
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = '';

    const filtered = this.getFilteredItems();
    if (filtered.length === 0) {
      this.container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #94a3b8;">
          <p style="font-size: 0.95rem; font-weight: 600;">Tidak ada panduan keberatan yang cocok.</p>
          <p style="font-size: 0.775rem; margin-top: 0.35rem;">Gunakan tombol "+ Tambah Panduan Baru" untuk merumuskan respon dengan bantuan AI.</p>
        </div>
      `;
      return;
    }

    filtered.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'playbook-card';
      
      const customBadge = item.isCustom ? `<span class="badge-custom-pb">Custom Agen</span>` : '';
      const deleteBtn = item.isCustom ? `
        <button type="button" class="btn btn-outline btn-xs btn-delete-pb" title="Hapus Keberatan Ini" style="color: #dc2626; border-color: #fca5a5; padding: 0.15rem 0.4rem;">
          Hapus
        </button>
      ` : '';

      card.innerHTML = `
        <div class="playbook-header" style="cursor: pointer;">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem;">
            <h4 style="font-size: 0.95rem; font-weight: 800; color: var(--color-slate-900); line-height: 1.4;">${item.title}</h4>
            <div style="display: flex; gap: 0.35rem; align-items: center; flex-shrink: 0;">
              ${customBadge}
              <span class="badge" style="background: var(--color-slate-50); color: var(--color-slate-600); border: 1px solid var(--border-subtle); white-space: nowrap;">${item.category}</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.5rem;">
            <span style="font-size: 0.75rem; color: var(--color-slate-500);">Klik untuk membuka panduan & skrip</span>
            <span class="playbook-toggle-icon" style="font-size: 0.775rem; font-weight: 700; color: var(--pru-red);">Buka Skrip ▼</span>
          </div>
        </div>

        <div class="playbook-body" style="display: none; padding-top: 0.75rem; border-top: 1px solid var(--border-subtle); margin-top: 0.75rem;">
          <div style="background: var(--color-slate-50); padding: 0.65rem 0.85rem; border-radius: var(--r-xs); margin-bottom: 0.65rem; font-size: 0.775rem; border: 1px solid var(--border-subtle);">
            <strong>Mindset Calon Nasabah:</strong>
            <p style="color: var(--color-slate-600); margin-top: 0.2rem; line-height: 1.45;">${item.mindset || '-'}</p>
          </div>

          <div style="background: #fffbeb; border-left: 3px solid #f59e0b; padding: 0.65rem 0.85rem; border-radius: 0 var(--r-xs) var(--r-xs) 0; margin-bottom: 0.75rem; font-size: 0.775rem;">
            <strong style="color: #92400e;">Logika & Prinsip Finansial Agen:</strong>
            <p style="color: #78350f; margin-top: 0.2rem; line-height: 1.45;">${item.keyInsight || '-'}</p>
          </div>

          <div style="position: relative; background: #ffffff; border: 1px solid var(--border-subtle); border-radius: var(--r-sm); padding: 0.85rem; margin-bottom: 0.75rem;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem;">
              <span style="font-size: 0.725rem; font-weight: 700; color: var(--pru-red); text-transform: uppercase;">Rekomendasi Skrip Respon Sales Coach:</span>
              <div style="display: flex; gap: 0.35rem;">
                ${deleteBtn}
                <button class="btn btn-outline btn-sm btn-copy-script" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;">
                  Salin Skrip
                </button>
              </div>
            </div>
            <p style="font-size: 0.825rem; color: var(--color-slate-800); line-height: 1.6; white-space: pre-line;">${item.script}</p>
          </div>
        </div>
      `;

      const header = card.querySelector('.playbook-header');
      const body = card.querySelector('.playbook-body');
      const icon = card.querySelector('.playbook-toggle-icon');

      header.addEventListener('click', () => {
        const isHidden = body.style.display === 'none';
        body.style.display = isHidden ? 'block' : 'none';
        icon.textContent = isHidden ? 'Tutup ▲' : 'Buka Skrip ▼';
      });

      card.querySelector('.btn-copy-script')?.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(item.script).then(() => {
          alert('Skrip respon berhasil disalin ke clipboard.');
        }).catch(() => {
          alert('Skrip berhasil disalin.');
        });
      });

      card.querySelector('.btn-delete-pb')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteItem(item.id, item.title);
      });

      this.container.appendChild(card);
    });
  }
}
