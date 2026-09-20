// ==========================================================================
// AGENTPROSPECT PRO - PLAYBOOK & AI COACH CONTROLLER
// ==========================================================================

import { db } from '../database.js';
import { sendJson, parseJsonBody } from '../middleware/auth.js';

// AI Objection Response Generator (MDRT & CFP Standard Heuristic Engine)
export function generateAIObjectionResponse(rawObjection, preferredCategory) {
  const query = (rawObjection || '').toLowerCase().trim();

  if (query.includes('investasi') || query.includes('saham') || query.includes('crypto') || query.includes('reksadana') || query.includes('reksa') || query.includes('bisnis') || query.includes('putar modal') || query.includes('trading') || query.includes('deposito') || query.includes('emas')) {
    return {
      title: rawObjection || 'Uang lebih baik diputar di instrumen bisnis atau investasi',
      category: 'Skema & Investasi',
      mindset: 'Calon nasabah adalah investor atau pebisnis cerdas yang berfokus pada imbal hasil (opportunity cost). Jangan mendiskreditkan instrumen mereka, melainkan posisikan asuransi sebagai sistem proteksi gembok pengaman yang membentengi 95% aset mereka dari forced liquidation saat terjadi musibah medis.',
      key_insight: 'Piramida Perencanaan Keuangan (CFP/OJK): Proteksi adalah pondasi dasar sebelum akumulasi aset. Biaya perawatan medis penyakit kritis bernilai ratusan juta dapat memaksa likuidasi aset saham/bisnis di saat kondisi pasar sedang turun (kerugian ganda). Menyisihkan 5% cashflow mengamankan 95% portofolio lainnya.',
      script: `“Saya sangat sepakat dengan prinsip Bapak/Ibu! Memutar uang di instrumen bisnis atau investasi memang langkah terbaik untuk melipatgandakan aset keluarga.

Namun izinkan saya berbagi satu sudut pandang perencana keuangan: jika Bapak/Ibu membangun gedung perkantoran bernilai miliaran rupiah, apakah Bapak/Ibu merasa perlu memasang instalasi pemadam kebakaran dan sistem proteksi gembok yang kokoh?

Tentu ya. Bisnis dan portofolio Bapak/Ibu adalah gedungnya, sedangkan asuransi adalah sistem proteksinya. Kita tidak ingin ketika risiko medis atau sakit kritis datang mendadak dengan tagihan Rp 500 juta, Bapak/Ibu terpaksa menjual aset investasi atau menarik modal kerja bisnis di saat harga sedang turun.

Cukup alokasikan 5% uang likuid untuk proteksi, maka seluruh aset bisnis dan investasi Bapak/Ibu terlindungi 100%. Boleh kita telaah bagaimana struktur portofolio Bapak/Ibu tetap aman bertumbuh tanpa kekhawatiran risiko tak terduga?”`
    };
  }

  if (query.includes('bpjs') || query.includes('kantor') || query.includes('perusahaan') || query.includes('fasilitas kantor') || query.includes('corporate')) {
    return {
      title: rawObjection || 'Saya sudah punya BPJS Kesehatan dan fasilitas asuransi dari kantor',
      category: 'Manfaat & Kebutuhan',
      mindset: 'Calon nasabah merasa aman dengan benefit tempat kerja. Validasi kenyamanan tersebut, lalu secara profesional edukasikan 3 celah risiko fatal: kepemilikan benefit (menempel pada jabatan vs pribadi), risiko pensiun/PHK saat sakit berat, dan inflasi kamar rumah sakit privat.',
      key_insight: 'Kelemahan asuransi kantor: 1. Proteksi terputus saat resign, pensiun, atau PHK. 2. Membuka polis baru di usia 50+ jauh lebih mahal dan berisiko ditolak underwriter jika sudah ada riwayat medis. 3. Memiliki limit tindakan tahunan yang seringkali menyisakan ekses klaim puluhan juta rupiah.',
      script: `“Luar biasa Bapak/Ibu! Itu membuktikan perusahaan tempat Bapak/Ibu berkarier sangat bonafide dan peduli pada kesejahteraan karyawannya.

Namun izinkan saya bertanya satu hal penting: fasilitas asuransi kantor tersebut menempel pada nama Bapak/Ibu secara pribadi, atau menempel pada status jabatan karyawan?

Jika suatu hari Bapak/Ibu memutuskan resign, pensiun di usia 55 tahun, atau amit-amit terjadi sakit berat yang membuat perusahaan terpaksa melakukan PHK, apakah fasilitas kesehatan tersebut tetap bisa dibawa pulang? Tentu tidak.

Masalahnya, membuka asuransi pribadi saat usia sudah di atas 50 tahun atau setelah ada riwayat penyakit jauh lebih mahal atau bahkan ditolak oleh underwriter. Karena itu, para profesional bijak menyiapkan proteksi kesehatan komprehensif kamar 1 bed privat sebagai 'pondasi pribadi' seumur hidup, sementara kartu kantor tetap digunakan sebagai manfaat pendukung. Boleh kita hitung opsi premi hematnya?”`
    };
  }

  if (query.includes('mahal') || query.includes('tidak ada uang') || query.includes('belum ada dana') || query.includes('bajet') || query.includes('uangnya belum ada') || query.includes('sulit') || query.includes('berat')) {
    return {
      title: rawObjection || 'Premi terasa mahal / Sedang belum ada anggaran alokasi asuransi',
      category: 'Premi & Biaya',
      mindset: 'Calon nasabah melihat premi sebagai pos pengeluaran konsumtif tambahan (cost), bukan sebagai instrumen pengungkit risiko (financial leverage). Tunjukkan bahwa asuransi bukan pos belanja orang kaya, melainkan penjaga agar keluarga tidak jatuh miskin seketika akibat tagihan rumah sakit.',
      key_insight: 'Rasio Kemampuan Finansial (CFP/OJK): Alokasi ideal premi proteksi adalah 5-10% dari penghasilan. Jika menyisihkan premi Rp 30.000 - Rp 50.000 per hari terasa berat, maka menanggung sendiri deposit rumah sakit tunai Rp 100 juta - 300 juta dalam tempo 24 jam adalah bencana finansial.',
      script: `“Saya sangat memahami Bapak/Ibu. Mengelola arus kas keluarga di masa sekarang memang menuntut kehati-hatian dalam setiap pos pengeluaran.

Namun mari kita lihat secara realistis: jika untuk menyisihkan premi Rp 30.000 hingga Rp 50.000 sehari—setara secangkir kopi—kita merasa perlu berpikir panjang, bayangkan betapa beratnya beban keluarga jika tiba-tiba rumah sakit meminta deposit tunai Rp 100 juta dalam 24 jam karena tindakan operasi darurat?

Asuransi hadir bukan untuk menambah beban belanja, melainkan memindahkan risiko besar tersebut ke perusahaan asuransi dengan biaya yang sangat terjangkau. Kami bisa menyesuaikan plafon manfaat agar sesuai dengan alokasi kemampuan Bapak/Ibu saat ini tanpa mengganggu kebutuhan sehari-hari. Boleh kita hitung nominal paling nyaman untuk Bapak/Ibu?”`
    };
  }

  if (query.includes('rugi') || query.includes('hangus') || query.includes('tidak sakit') || query.includes('buang uang') || query.includes('sayang uangnya')) {
    return {
      title: rawObjection || 'Premi hangus kalau tidak sakit / Merasa rugi bayar premi',
      category: 'Premi & Biaya',
      mindset: 'Calon nasabah menghendaki kepastian pengembalian modal. Tawarkan solusi modern yang memiliki fitur Guaranteed Return of Premium atau berikan analogi helm dan rasa aman.',
      key_insight: 'Paradigma Proteksi Modern: Kita membeli tabung pemadam api bukan berharap rumah terbakar, tapi berharap tidak panik saat api muncul. Selain itu, tersedia program proteksi syariah dengan fitur uang premi kembali 100% bila nasabah sehat walafiat hingga akhir masa kepesertaan.',
      script: `“Sangat wajar jika Bapak/Ibu berpikir demikian. Kabar baiknya, industri asuransi modern telah bertransformasi!

Tersedia program asuransi syariah khusus: jika selama masa perlindungan 20 tahun Bapak/Ibu senantiasa diberikan kesehatan prima oleh Tuhan Yang Maha Esa, maka 100% total premi yang telah disetorkan akan dikembalikan utuh tanpa potongan.

Artinya, jika terjadi risiko, keluarga menerima Uang Pertanggungan hingga miliaran rupiah. Jika sehat walafiat, seluruh uang kembali 100%. Jadi tidak ada istilah uang hangus. Boleh kita hitung simulasinya?”`
    };
  }

  if (query.includes('syariah') || query.includes('riba') || query.includes('haram') || query.includes('halal') || query.includes('islam')) {
    return {
      title: rawObjection || 'Apakah asuransi sesuai dengan prinsip syariat Islam?',
      category: 'Syariah',
      mindset: 'Hormati komitmen keyakinan religius calon nasabah. Tunjukkan sertifikasi resmi Dewan Syariah Nasional (DSN-MUI) dan jelaskan konsep tolong-menolong (Ta’awun).',
      key_insight: 'Asuransi Syariah beroperasi secara resmi di bawah pengawasan DSN-MUI dan OJK. Menggunakan akad Tabarru’ (hibah tolong-menolong antarpeserta), bebas dari Riba, Gharar, dan Maisir, serta memiliki fitur wakaf manfaat asuransi.',
      script: `“Pertanyaan yang sangat mulia Bapak/Ibu. Sebagai Muslim, memastikan setiap ikhtiar finansial kita sesuai syariat adalah kewajiban utama.

Asuransi Syariah diawasi langsung oleh Dewan Syariah Nasional Majelis Ulama Indonesia (DSN-MUI). Sistem kami tidak menggunakan jual-beli risiko, melainkan akad Tabarru’ di mana seluruh peserta saling menolong saat ada saudara peserta lain tertimpa musibah.

Bahkan, polis asuransi syariah dilengkapi fitur Wakaf Manfaat Asuransi resmi ke lembaga nazhir bersertifikasi BWI, sehingga menjadi amal jariyah yang pahalanya terus mengalir abadi.”`
    };
  }

  // General Fallback Heuristic
  return {
    title: rawObjection || 'Pertimbangan khusus calon nasabah',
    category: preferredCategory || 'Manfaat & Kebutuhan',
    mindset: 'Dengarkan secara aktif (active listening), validasi kekhawatiran nasabah dengan empati mendalam, posisikan diri Anda sebagai perencana keuangan independen (CFP), dan ajak nasabah berdialog berbasis data angka riil, bukan sekadar penawaran produk.',
    key_insight: 'Keputusan menolak asuransi seringkali berakar dari ketidaktahuan atas besarnya risiko finansial medis di Indonesia (inflasi medis 13.6% per tahun menurut survei Mercer Marsh Benefits 2024). Analogi yang jelas dan empati selalu lebih efektif dibanding perdebatan teknis.',
    script: `“Saya sangat berterima kasih Bapak/Ibu telah membagikan sudut pandang ini secara terbuka. Membeli asuransi memang keputusan penting yang harus diambil dengan keyakinan penuh.

Tujuan saya hadir bukan untuk memaksa Bapak/Ibu membeli polis hari ini, melainkan membantu melakukan audit objektif terhadap risiko finansial keluarga. Setelah Bapak/Ibu melihat kalkulasi riilnya, keputusan sepenuhnya berada di tangan Bapak/Ibu. Boleh kita luangkan waktu 10 menit untuk melihat audit kebutuhannya?”`
  };
}

export function handleListPlaybook(req, res, currentUser) {
  const items = db.prepare(`
    SELECT * FROM objection_playbook 
    WHERE user_id = 'system' OR user_id = ? 
    ORDER BY is_custom ASC, created_at DESC
  `).all(currentUser.id);

  return sendJson(res, 200, { playbook: items });
}

export async function handleCreatePlaybook(req, res, currentUser) {
  const body = await parseJsonBody(req);
  const { title, category, mindset, key_insight, script } = body;

  if (!title || !script) {
    return sendJson(res, 400, { error: 'Judul keberatan dan skrip respon wajib diisi.' });
  }

  const newPbId = `pb_${Date.now()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO objection_playbook (id, user_id, title, category, mindset, key_insight, script, is_custom, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(
    newPbId,
    currentUser.id,
    title,
    category || 'Lainnya',
    mindset ?? '',
    key_insight ?? '',
    script,
    now
  );

  return sendJson(res, 201, {
    message: 'Panduan keberatan berhasil ditambahkan ke playbook Anda!',
    id: newPbId
  });
}

export function handleDeletePlaybook(req, res, currentUser, pbId) {
  const info = db.prepare('DELETE FROM objection_playbook WHERE id = ? AND user_id = ?').run(pbId, currentUser.id);
  if (info.changes === 0) {
    return sendJson(res, 403, { error: 'Item panduan standar sistem tidak dapat dihapus, atau item tidak ditemukan.' });
  }
  return sendJson(res, 200, { message: 'Panduan keberatan berhasil dihapus.' });
}

export async function handleGenerateAI(req, res) {
  const body = await parseJsonBody(req);
  const { objection, category } = body;

  if (!objection || !objection.trim()) {
    return sendJson(res, 400, { error: 'Ketikkan terlebih dahulu kalimat keberatan calon nasabah.' });
  }

  const aiResult = generateAIObjectionResponse(objection.trim(), category);
  return sendJson(res, 200, { result: aiResult });
}
