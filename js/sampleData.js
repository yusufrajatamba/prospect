// Master Data & Konfigurasi AgentProspect
// Standar Desain Korporat Agency (Minimalis & Profesional)

// 5 Fase Utama Pipeline (Proporsional & Fit Layar)
export const CORE_PIPELINE_STAGES = [
  {
    id: 'leads',
    label: '1. Daftar Kontak',
    subStages: ['suspect', 'approach'],
    desc: 'Database & Pendekatan Awal'
  },
  {
    id: 'meeting',
    label: '2. Temu & Kebutuhan',
    subStages: ['appointment', 'fact_finding'],
    desc: 'Janji Temu & Analisis Finansial'
  },
  {
    id: 'presentation',
    label: '3. Presentasi Solusi',
    subStages: ['presentation', 'objection'],
    desc: 'Pemaparan Ilustrasi & Solusi Kendala'
  },
  {
    id: 'closing',
    label: '4. Closing & Polis',
    subStages: ['closing', 'issued'],
    desc: 'Submit SPAJ & Polis In-Force'
  },
  {
    id: 'referral',
    label: '5. Referensi & Servis',
    subStages: ['referral'],
    desc: 'Pelayanan Polis & Rekomendasi'
  }
];

// 9 Tahap Detail Standar Penjualan
export const SALES_STAGES = [
  { id: 'suspect', label: '1. Daftar Nama', coreId: 'leads', desc: 'Database Baru (Belum dihubungi)' },
  { id: 'approach', label: '2. Pendekatan', coreId: 'leads', desc: 'Ice breaking via WhatsApp/Telepon' },
  { id: 'appointment', label: '3. Janji Temu', coreId: 'meeting', desc: 'Jadwal tatap muka atau virtual' },
  { id: 'fact_finding', label: '4. Bedah Kebutuhan', coreId: 'meeting', desc: 'Analisis kebutuhan proteksi' },
  { id: 'presentation', label: '5. Presentasi Solusi', coreId: 'presentation', desc: 'Pemaparan proposal ilustrasi' },
  { id: 'objection', label: '6. Tangani Kendala', coreId: 'presentation', desc: 'Penanganan keraguan nasabah' },
  { id: 'closing', label: '7. Closing (SPAJ)', coreId: 'closing', desc: 'Pengajuan e-SPAJ & pembayaran premi' },
  { id: 'issued', label: '8. Polis Terbit', coreId: 'closing', desc: 'Polis disetujui Underwriting' },
  { id: 'referral', label: '9. Referensi', coreId: 'referral', desc: 'Permintaan 3-5 referensi nasabah' }
];

export const RELATIONSHIPS = [
  'Keluarga / Kerabat',
  'Teman Sekolah (SD/SMP/SMA)',
  'Teman Kuliah',
  'Rekan Kerja / Profesi',
  'Komunitas / Organisasi',
  'Tetangga / Lingkungan',
  'Sosial Media',
  'Referensi Nasabah'
];

export const OBJECTION_PRESETS = [
  'Belum ada alokasi anggaran saat ini',
  'Sudah memiliki BPJS & asuransi dari kantor',
  'Perlu berdiskusi terlebih dahulu dengan pasangan',
  'Merasa masih muda dan sehat, belum memerlukan proteksi',
  'Pernah memiliki pengalaman klaim kurang baik',
  'Premi dirasa belum sesuai anggaran bulanan',
  'Ingin mempelajari proposal terlebih dahulu'
];

export const WA_TEMPLATES = [
  {
    id: 'ice_breaking',
    title: 'Sapaan Rekan / Teman Lama',
    text: `Halo {nama}, apa kabar? Semoga sehat dan sukses selalu ya. Sudah cukup lama tidak saling kabar. Sedang sibuk kegiatan apa sekarang?`
  },
  {
    id: 'appointment_casual',
    title: 'Undangan Diskusi Santai / Janji Temu',
    text: `Halo {nama}, apakah minggu ini ada waktu luang? Kebetulan saya ingin mengajak ngopi santai sekaligus sharing informasi mengenai perencanaan proteksi keluarga yang saat ini banyak dibahas. Kira-kira hari {hari} atau akhir pekan ada waktu?`
  },
  {
    id: 'after_fact_finding',
    title: 'Rangkuman Simulasi Manfaat',
    text: `Halo {nama}, terima kasih atas waktu diskusinya kemarin. Saya telah menyusun ringkasan simulasi proteksi kesehatan dan perencanaan finansial yang disesuaikan dengan kebutuhan keluarga Anda. Apakah berkenan jika saya kirimkan rangkumannya via PDF?`
  },
  {
    id: 'reminder_meeting',
    title: 'Konfirmasi Jadwal Pertemuan',
    text: `Halo {nama}, sekadar mengonfirmasi kembali sesuai jadwal kemarin, besok kita bertemu pukul {jam} di {lokasi}. Sampai bertemu besok, terima kasih.`
  },
  {
    id: 'handling_objection',
    title: 'Tindak Lanjut Diskusi Keluarga',
    text: `Halo {nama}, semoga aktivitas hari ini lancar. Mengenai rancangan perlindungan keluarga yang kemarin kita bahas, apakah sudah sempat didiskusikan bersama pasangan? Jika ada poin manfaat atau penyesuaian anggaran yang ingin ditinjau kembali, dengan senang hati saya bantu jelaskan.`
  },
  {
    id: 'ask_referral',
    title: 'Permohonan Referensi Nasabah',
    text: `Halo {nama}, terima kasih banyak atas kepercayaannya mempercayakan proteksi keluarga kepada kami. Apabila berkenan, bolehkah saya dibantu 2-3 nama kerabat atau rekan kerja yang sekiranya juga memerlukan informasi perencanaan proteksi serupa? Saya akan menghubungi dengan sopan dan profesional. Terima kasih.`
  }
];
