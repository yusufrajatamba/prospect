# 🌟 PruProspect Pro (Project 100 & Portfolio Management)

Aplikasi Web Manajemen Calon Nasabah (Project 100), Pipeline Penjualan 9 Tahap, Portofolio Polis Nasabah In-Force, Panduan Penanganan Keberatan (Playbook), dan Target Produksi MDRT bagi Agen Asuransi Prudential.

Terintegrasi secara real-time dua arah (**CRUD**) dengan **Google Spreadsheet** (melalui Google Apps Script Web App) dan siap dideploy langsung ke **Vercel**.

---

## 🚀 Fitur Unggulan

1. **Database Calon Nasabah (Project 100)**:
   - Pencatatan profil calon nasabah, nomor WhatsApp, relasi, pekerjaan, domisili, dan kategori kedekatan pasar (Pasar Dekat / Pasar Menengah / Pasar Baru).
   - Tampilan ganda: **List Tabel** interaktif & **Kanban Pipeline Board**.
   - Integrasi 1-klik buka percakapan WhatsApp dengan pesan salam otomatis.

2. **Pipeline Penjualan 9 Tahap Prudential**:
   - 1. Bank Nama (Suspect)
   - 2. Pendekatan Awal (Approach)
   - 3. Janji Temu (Appointment)
   - 4. Bedah Kebutuhan (Fact Finding)
   - 5. Presentasi Solusi (Presentation)
   - 6. Penanganan Keberatan (Handling Objection)
   - 7. Kesepakatan (Closing Agreement)
   - 8. Pengajuan SPAJ (Submission)
   - 9. Polis Terbit (In-Force)

3. **Portofolio Polis Nasabah In-Force**:
   - Pendaftaran polis aktif nasabah (Nomor polis, pemegang, tertanggung, produk, besaran premi, frekuensi).
   - Perhitungan Annualized Premium Equivalent (APE) otomatis.
   - Peringatan dini jatuh tempo premi (Anti-Lapse Alert) dan tombol WhatsApp sapaan jatuh tempo.

4. **Target & Progres Penjualan (Real-time Google Spreadsheet)**:
   - Target Calon Nasabah (contoh: 100 orang).
   - Target Premi Tahunan APE / MDRT (contoh: Rp 600.000.000).
   - Target Polis Terbit / Cases (contoh: 30 unit).
   - Dihitung langsung dari tab `Daftar_Calon_Nasabah` dan `Portofolio_Polis`.

5. **Playbook Penanganan Keberatan Nasabah**:
   - Kompilasi argumentasi teruji, prinsip psikologi nasabah, dan skrip diplomatis lapangan untuk membalikkan penolakan calon nasabah.

6. **Arsitektur Cloud Hybrid Tanpa Biaya (100% Gratis)**:
   - **Frontend**: HTML5, Vanilla CSS modern (Plus Jakarta Sans, Executive State.gov palette), Vanilla JS modular (ES Modules).
   - **Cloud Database**: Google Spreadsheet via Google Apps Script Web App (Serverless, tanpa biaya sewa database).
   - **Local Backend (Opsional)**: Node.js dengan built-in `node:sqlite`.

---

## 📂 Struktur Proyek

```
prudential/
├── backend/                  # Kontroler & routing backend lokal Node.js
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   └── database.js
├── css/
│   └── style.css             # Desain styling responsif, modern & elegan
├── js/
│   ├── api.js                # Hybrid API Adapter (Google Sheets Web App & Local)
│   ├── app.js                # Core controller & logic antarmuka
│   ├── calculator.js         # Kalkulator Finansial CFP®
│   ├── playbook.js           # Manajemen skrip keberatan
│   ├── policies.js           # Manajemen portofolio polis in-force
│   ├── sampleData.js         # Data awal / dummy bawaan
│   └── stageForms.js         # Form aksi dinamis tiap tahapan pipeline
├── google_apps_script/
│   ├── Code.gs               # Script backend REST API Google Spreadsheet
│   ├── CARA_DEPLOY_GOOGLE_SHEETS_DAN_VERCEL.md
│   └── PANDUAN_APPSHEET_APPSCRIPT.md
├── index.html                # Single Page Application (SPA)
├── server.js                 # Local dev server Node.js
├── vercel.json               # Konfigurasi routing deploy Vercel
├── package.json
└── README.md
```

---

## 🛠️ Menjalankan Secara Lokal

1. Clone repositori:
   ```bash
   git clone https://github.com/yusufrajatamba/prospect.git
   cd prospect
   ```

2. Jalankan dev server lokal:
   ```bash
   npm start
   # atau
   node server.js
   ```

3. Buka browser di `http://localhost:4173`.

---

## 🌐 Deploy ke Vercel

1. Push repositori ini ke akun GitHub Anda.
2. Di dashboard [Vercel](https://vercel.com), pilih **Add New Project** lalu pilih repositori `prospect`.
3. Biarkan pengaturan default (Framework: Other, Root: `./`).
4. Klik **Deploy**. Website aktif dalam 30 detik!

---

## 📊 Integrasi Google Spreadsheet

1. Buat Google Spreadsheet baru di Google Drive Anda.
2. Buka menu **Extensions > Apps Script**.
3. Salin seluruh isi file `google_apps_script/Code.gs` ke editor Apps Script.
4. Klik tombol **Deploy > New Deployment**, pilih jenis **Web App**:
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
5. Salin URL Web App yang berakhiran `/exec`.
6. Di website PruProspect Pro Anda, klik **⚙️ Tautkan Google Spreadsheet**, tempelkan URL tersebut, dan klik **Simpan & Aktifkan**.
