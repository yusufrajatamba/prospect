# Walkthrough - Integrasi Database Google Spreadsheet & Persiapan Deploy Vercel

Sesuai permintaan, sistem telah dikembalikan ke **Web Application PruProspect Pro** (desain elegan terinspirasi State.gov dengan navigasi atas, 5-step selling workflow ribbon, Kanban, dan kalkulator CFP®), serta dilengkapi integrasi **Google Spreadsheet sebagai Cloud Database Real-time 2 Arah (CRUD)** dan konfigurasi deploy ke **Vercel**.

---

## 🚀 Perubahan yang Diimplementasikan

### 1. Google Apps Script Web App REST API ([`Code.gs`](file:///c:/Users/infokes/Documents/yusuf-playground/prudential/google_apps_script/Code.gs))
- **Struktur Sheet Otomatis (`setupPrudentialSheets`)**:
  - Menyusun 6 tab sheet: `Project100_Prospek` (Tab #1 terdepan), `Log_Interaksi`, `Portofolio_Polis`, `Panduan_Keberatan`, `Target_Produksi_MDRT`, dan `Master_Data` (di posisi paling belakang).
- **REST API Endpoints (`doGet` & `doPost`)**:
  - `getProspects`, `createProspect`, `updateProspect`, `updateStage`, `deleteProspect`
  - `addInteraction` (Mencatat log dan otomatis mengupdate tanggal kontak terakhir di prospek)
  - `getPolicies`, `createPolicy`, `deletePolicy` (Lengkap dengan auto-calculate APE & link WA jatuh tempo)
  - `getGoals`, `createGoal`, `deleteGoal` (Target produksi dinamis & MDRT)
  - `getPlaybook`, `createPlaybookItem`, `deletePlaybookItem` (8 skrip keberatan)
  - `getDashboardStats` & `ping` (Verifikasi koneksi instan)

### 2. Hybrid API Client Adapter ([`js/api.js`](file:///c:/Users/infokes/Documents/yusuf-playground/prudential/js/api.js))
- Mendeteksi apakah URL Google Apps Script Web App telah diinput pengguna (`localStorage: pru_google_sheet_url`).
- **Jika terhubung ke Google Sheets**: Seluruh pemanggilan CRUD (`getProspects`, `createProspect`, `updateProspect`, `addInteraction`, `createPolicy`, dll) diarahkan langsung ke Google Apps Script Web App menggunakan `fetch()` dengan header `text/plain` untuk mencegah pemblokiran CORS `OPTIONS` preflight di browser.
- **Jika tidak diisi**: Otomatis menggunakan backend SQLite lokal (`/api/*`).

### 3. Antarmuka Pengaturan Database ([`index.html`](file:///c:/Users/infokes/Documents/yusuf-playground/prudential/index.html) & [`css/style.css`](file:///c:/Users/infokes/Documents/yusuf-playground/prudential/css/style.css))
- **Status Indicator Pill**:
  - Saat terhubung: `🟢 Google Sheets Terhubung`
  - Saat belum terhubung: `⚙️ Tautkan Google Spreadsheet`
- **Modal Konfigurasi (`#modalGoogleSheetConfig`)**:
  - Link langsung ke spreadsheet target: `https://docs.google.com/spreadsheets/d/1ykj3cCMPYfhUI0n7H0cnY2TzdfXrEo4hG5HHp2-bejA/edit`
  - Input field URL Web App (`https://script.google.com/macros/s/.../exec`).
  - Tombol **`🧪 Tes Koneksi`** dengan feedback visual real-time (nama spreadsheet & status).
  - Tombol **`💾 Simpan & Aktifkan`** yang langsung memuat data dari spreadsheet ke UI.
  - Tombol **`🔄 Putuskan`** untuk beralih kembali ke SQLite lokal.
  - Panduan cepat 3 langkah deployment di dalam modal.

### 4. Konfigurasi Vercel ([`vercel.json`](file:///c:/Users/infokes/Documents/yusuf-playground/prudential/vercel.json))
- Mendukung routing SPA (`cleanUrls` dan rewrite `/(.*) -> /index.html`).
- Frontend berjalan 100% serverless di Vercel tanpa kendala ephemeral database karena seluruh data tersimpan langsung di Google Spreadsheet.

### 5. Panduan Deployment Lengkap ([`CARA_DEPLOY_GOOGLE_SHEETS_DAN_VERCEL.md`](file:///c:/Users/infokes/Documents/yusuf-playground/prudential/google_apps_script/CARA_DEPLOY_GOOGLE_SHEETS_DAN_VERCEL.md))
- Dokumentasi langkah demi langkah cara pasang script di Google Sheets, deploy Web App dengan hak akses `Anyone`, dan deploy website ke Vercel via GitHub atau Vercel CLI.

---

## 🧪 Hasil Verifikasi & Pengujian

- **HTTP Status Code**: Server lokal merespons `200 OK` untuk file utama (`/`, `/js/api.js`, `/js/app.js`, `/css/style.css`).
- **Validasi Sintaksis JS**: `node -c js/api.js` dan `node -c js/app.js` tervalidasi bersih tanpa syntax error.
- **Transisi Antarmuka**: Modal dan status badge terpasang rapi dan selaras dengan tema institusional State.gov.

---

## 🎯 Langkah Selanjutnya untuk Pengguna
1. Buka spreadsheet: [https://docs.google.com/spreadsheets/d/1ykj3cCMPYfhUI0n7H0cnY2TzdfXrEo4hG5HHp2-bejA/edit](https://docs.google.com/spreadsheets/d/1ykj3cCMPYfhUI0n7H0cnY2TzdfXrEo4hG5HHp2-bejA/edit).
2. Ikuti instruksi di [`google_apps_script/CARA_DEPLOY_GOOGLE_SHEETS_DAN_VERCEL.md`](file:///c:/Users/infokes/Documents/yusuf-playground/prudential/google_apps_script/CARA_DEPLOY_GOOGLE_SHEETS_DAN_VERCEL.md).
3. Salin Web App URL dan tautkan di tombol **`⚙️ Tautkan Google Spreadsheet`** pada aplikasi.
