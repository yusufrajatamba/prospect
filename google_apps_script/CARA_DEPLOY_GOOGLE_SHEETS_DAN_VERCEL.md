# Panduan Lengkap: Menghubungkan Google Spreadsheet Sebagai Database & Deploy ke Vercel

Panduan ini memandu Anda mengaktifkan **Google Spreadsheet** milik Anda sebagai **Database Cloud Real-time 2-Arah (CRUD)** untuk aplikasi **AgentProspect Pro**, dan cara melakukan deploy gratis ke **Vercel**.

---

## 🎯 Target & Keuntungan Arsitektur Ini

1. **Database Milik Pribadi & Gratis**: Seluruh data prospek (Project 100), log riwayat interaksi nasabah, polis in-force, panduan keberatan, dan target MDRT tersimpan aman di Google Drive / Spreadsheet pribadi Anda.
2. **Real-time 2 Arah (CRUD)**:
   - Tambah/edit/hapus dari Website langsung masuk dan mengubah baris di Google Spreadsheet.
   - Mengubah data manual di Google Spreadsheet otomatis terbaca di Website saat dimuat.
3. **Deploy Vercel Zero-Config**: Frontend berkecepatan tinggi global tanpa perlu sewa server backend/database bulanan.
4. **Desain Elegan Kelas Institusi**: Tampilan tetap menggunakan desain premium State.gov (Top navigation bar, 5-step selling ribbon, pipeline Kanban, kalkulator CFP®, dan skrip closing) tanpa batasan tampilan bawaan AppSheet yang kaku.

---

## 📋 Data Spreadsheet Anda
- **Link Google Spreadsheet**: [https://docs.google.com/spreadsheets/d/1ykj3cCMPYfhUI0n7H0cnY2TzdfXrEo4hG5HHp2-bejA/edit](https://docs.google.com/spreadsheets/d/1ykj3cCMPYfhUI0n7H0cnY2TzdfXrEo4hG5HHp2-bejA/edit)
- **ID Spreadsheet**: `1ykj3cCMPYfhUI0n7H0cnY2TzdfXrEo4hG5HHp2-bejA`

---

## 🚀 Langkah 1: Pasang Kode Apps Script ke Spreadsheet Anda

1. Buka spreadsheet Anda melalui link di atas menggunakan browser.
2. Di menu atas Google Spreadsheet, klik menu **Ekstensi (Extensions)** ➔ **Apps Script**.
3. Di editor Apps Script:
   - Buka file `Code.gs` bawaan (hapus fungsi `myFunction()` jika ada).
   - Buka file [`google_apps_script/Code.gs`](Code.gs) di repositori ini, lalu **salin (copy) seluruh kodenya** dan **tempelkan (paste)** ke editor Apps Script.
   - Klik tombol **Simpan** (ikon disket 💾 atau tekan `Ctrl + S`).
4. **Jalankan Setup Struktur Otomatis**:
   - Pada dropdown toolbar fungsi di bagian atas editor, pilih fungsi: **`setupAgentSheets`**.
   - Klik tombol **Run (Jalankan)** (ikon segitiga `▶`).
   - *Jika muncul jendela Authorization Required / Perizinan:*
     - Klik **Review Permissions** (Tinjau Izin).
     - Pilih akun Google Anda.
     - Klik **Advanced** (Lanjutan) di kiri bawah ➔ Klik **Go to Untitled project (unsafe)**.
     - Klik **Allow (Izinkan)**.
   - Script akan otomatis membuat dan menata 6 lembar kerja (Tab):
     1. `Project100_Prospek` *(Tab #1 di posisi terdepan)*
     2. `Log_Interaksi`
     3. `Portofolio_Polis`
     4. `Panduan_Keberatan` *(8 skrip keberatan teruji)*
     5. `Target_Produksi_MDRT`
     6. `Master_Data` *(Dropdown relasi, produk & tahap)*

---

## 🌐 Langkah 2: Deploy Sebagai Web App (Mendapatkan URL API)

Agar aplikasi web di Vercel atau localhost dapat membaca & menulis ke spreadsheet Anda:

1. Di pojok kanan atas editor Apps Script, klik tombol biru **Deploy** ➔ pilih **New deployment** (Terapkan baru).
2. Di jendela popup:
   - Klik ikon roda gigi (⚙️) di sebelah kiri tulisan *Select type* ➔ pilih **Web app**.
   - **Description**: `AgentProspect Pro Database API v2`
   - **Execute as**: Pilih **`Me (<email-anda>@gmail.com)`**
   - **Who has access**: Pilih **`Anyone`** *(SANGAT PENTING: Harus "Anyone" agar browser Anda dapat mengirim data tanpa login Google pop-up)*.
3. Klik tombol **Deploy**.
4. Salin **Web App URL** yang diberikan:
   - URL memiliki format seperti ini:
     `https://script.google.com/macros/s/AKfycbxxxxxxxxx.../exec`

> [!TIP]
> Jika di kemudian hari Anda memperbarui isi kode `Code.gs`, pastikan klik **Deploy ➔ Manage deployments ➔ Edit (ikon pensil) ➔ Version: New version ➔ Deploy** agar perubahan langsung aktif.

---

## 🔗 Langkah 3: Tautkan URL ke Website AgentProspect Pro

1. Buka aplikasi web AgentProspect Pro (bisa di `http://localhost:4173` saat ini, atau nanti di link Vercel Anda).
2. Di bagian sub-header atas (sebelah kanan tanggal), klik tombol:
   **`⚙️ Tautkan Google Spreadsheet`** (atau via menu avatar profil di pojok kanan atas ➔ `📊 Database Google Sheets`).
3. Jendela pengaturan database akan muncul:
   - Tempelkan (*paste*) **Web App URL** yang Anda salin pada Langkah 2 ke kotak isian.
   - Klik tombol **`🧪 Tes Koneksi`**.
   - Sistem akan memverifikasi koneksi. Jika berhasil, akan muncul pesan hijau:
     `✅ KONEKSI BERHASIL! Spreadsheet: AgentProspect Suite`.
   - Klik tombol biru **`💾 Simpan & Aktifkan`**.
4. Selesai! Indikator di header akan berubah menjadi **`🟢 Google Sheets Terhubung`**.
   - Setiap kali Anda menambah prospek, menggeser stage di Kanban, mencatat polis baru, atau mencatat log interaksi, semuanya otomatis langsung tersimpan ke Google Spreadsheet Anda!

---

## ☁️ Langkah 4: Deploy Aplikasi ke Vercel (Gratis & Cepat)

Konfigurasi [`vercel.json`](../vercel.json) sudah disiapkan di root proyek ini. Anda bisa men-deploy dengan 2 cara:

### Cara A: Deploy via GitHub (Paling Direkomendasikan)
1. Buat repositori baru di akun GitHub Anda (misal: `agentprospect-pro`).
2. Push proyek ini ke GitHub:
   ```bash
   git add .
   git commit -m "feat: google sheets database integration and vercel ready"
   git branch -M main
   git remote add origin https://github.com/USERNAME/agentprospect-pro.git
   git push -u origin main
   ```
3. Buka dashboard [Vercel](https://vercel.com) dan login (bisa login dengan akun GitHub).
4. Klik **Add New...** ➔ **Project**.
5. Pilih repositori `agentprospect-pro` dari daftar GitHub Anda ➔ Klik **Import**.
6. Konfigurasi Project:
   - **Framework Preset**: `Other` (otomatis terdeteksi).
   - **Root Directory**: `./`.
   - Biarkan setting build default kosong (karena ini web app murni tanpa bundler berat).
7. Klik **Deploy**.
8. Dalam 30-45 detik, website Anda sudah aktif dengan URL publik gratis, misalnya:
   `https://agentprospect-pro.vercel.app`
9. Buka link Vercel Anda di smartphone atau laptop, klik **⚙️ Tautkan Google Spreadsheet**, masukkan Web App URL Anda sekali saja (tersimpan di browser). Aplikasi siap dipakai di lapangan kapan saja!

---

### Cara B: Deploy via Vercel CLI (Langsung dari Komputer)
Jika Anda memiliki Node.js terpasang di komputer:
```bash
npx vercel
```
- Ikuti petunjuk di terminal untuk login.
- Pilih `Set up and deploy "~/agentprospect"? [Y/n]` ➔ Tekan `Y`.
- Untuk deploy langsung ke domain produksi:
  ```bash
  npx vercel --prod
  ```

---

## 🔍 Pengujian & Validasi Fitur yang Terhubung ke Sheets

| Fitur di Website | Target Lembar Kerja di Google Sheets | Aksi Real-time |
| :--- | :--- | :--- |
| **Project 100 Prospek** | Tab `Project100_Prospek` | Tambah nama baru, edit data, hapus, filter kategori pasar |
| **Kanban Pipeline** | Tab `Project100_Prospek` (Kolom Stage) | Drag & drop atau ubah stage (Approach, Fact Finding, Closing) |
| **Log Interaksi & WA** | Tab `Log_Interaksi` & update kolom `Last_Contact` | Mencatat hasil telepon, chat WA, dan keberatan |
| **Portofolio Polis** | Tab `Portofolio_Polis` | Pendaftaran polis in-force, hitung APE otomatis, sisa hari jatuh tempo |
| **Target Produksi MDRT** | Tab `Target_Produksi_MDRT` | Target APE tahunan, kasus polis baru, persentase capaian |
| **Panduan Keberatan** | Tab `Panduan_Keberatan` | 8 skrip respons teruji + tambah keberatan baru secara dinamis |

---

## 💡 Troubleshooting / Pertanyaan Umum

**Q: Mengapa tes koneksi muncul pesan "Koneksi timeout" atau "Respon tidak valid"?**
> **A:** Pastikan saat melakukan **Deploy Web App** di Apps Script, opsi **Who has access** dipilih **`Anyone`** (bukan "Only myself"). Jika "Only myself", Google akan memblokir request dari luar akun.

**Q: Apakah data saya bisa hilang saat cold-start di Vercel?**
> **A:** Tidak akan pernah hilang, karena seluruh data disimpan langsung di Google Spreadsheet Anda di server Google Cloud, bukan di memori sementara Vercel.

**Q: Apakah saya masih bisa mengedit data langsung lewat Google Spreadsheet?**
> **A:** Ya! Anda bisa membuka Google Spreadsheet di aplikasi Google Drive / Sheets di smartphone Anda, mengedit baris atau menambahkan nama. Saat website dibuka kembali, data terbaru akan langsung dimuat.
