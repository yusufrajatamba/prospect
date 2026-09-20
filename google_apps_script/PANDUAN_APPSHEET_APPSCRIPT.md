# Panduan Lengkap: Implementasi AgentProspect Suite di Google Sheets + AppSheet + Apps Script

Dokumen ini berisi panduan terstruktur langkah-demi-langkah untuk membangun aplikasi asisten penjualan agen asuransi menggunakan **Google Sheets** sebagai database utama, **AppSheet** sebagai antarmuka aplikasi seluler (Android & iPhone) serta web, dan **Google Apps Script (GAS)** untuk otomasi perhitungan dan notifikasi.

---

## 1. Arsitektur Solusi (Tanpa Server, Praktis & Ringan)

```
[ Google Spreadsheet ]  <===>  [ Google Apps Script ]
 (Database Terpusat)           - Otomasi rumus APE & MDRT
  ├── 1. Daftar_Calon_Nasabah  - Generator Tautan WhatsApp
  ├── 2. Pipeline_Penjualan    - Cek Jatuh Tempo Harian
  ├── 3. Log_Interaksi         - Sinkronisasi Status Prospek
  ├── 4. Portofolio_Polis      - Auto-Sync VLOOKUP antar Sheet
  ├── 5. Target_Produksi_MDRT  - Database Pengguna & Password
  ├── 6. Panduan_Keberatan
  ├── 7. Akun_Agen (Login/Auth)
  └── 8. Master_Data
         ▲
         │ (Sinkronisasi Real-time & Mode Offline)
         ▼
    [ AppSheet ]
 (Aplikasi Mobile di HP Agen)
  ├── Pipeline Kanban Project 100
  ├── Tombol 1-Klik Kirim WhatsApp
  ├── Pencatatan Riwayat & Follow-up
  ├── Monitoring Polis & Reminder Jatuh Tempo
  └── Akses Skrip Panduan Keberatan
```

---

## 2. Langkah 1: Setup Otomatis Google Spreadsheet (1 Kali Klik)

Anda **tidak perlu** membuat kolom dan rumus satu per satu secara manual. Skrip setup otomatis telah kami sediakan:

1. Buka spreadsheet Anda:  
   👉 [AgentProspect - Google Spreadsheet](https://docs.google.com/spreadsheets/d/1ykj3cCMPYfhUI0n7H0cnY2TzdfXrEo4hG5HHp2-bejA/edit?gid=0#gid=0)
2. Klik menu **Extensions (Ekstensi)** ➔ **Apps Script**.
3. Hapus kode lama di file `Code.gs`, lalu salin (*copy-paste*) seluruh kode terbaru dari file:  
   [`google_apps_script/Code.gs`](Code.gs)
4. Klik ikon **Save (Simpan / Ctrl+S)**.
5. Pada dropdown fungsi di atas editor Apps Script, pilih fungsi:  
   `setupAgentSheets` ➔ klik tombol **Run (Jalankan)**.
6. Berikan izin otorisasi (*Review Permissions ➔ Pilih Akun Google Anda ➔ Advanced ➔ Go to Untitled (unsafe) ➔ Allow*).
7. Tunggu beberapa detik hingga muncul popup konfirmasi:  
   `"Setup Berhasil Selesai! Struktur sheet baru telah siap & terintegrasi..."`

### Struktur Sheet Terintegrasi di Google Spreadsheet
* **Tab 1: `Daftar_Calon_Nasabah` (Ringkas & Bersih)**:
  * Khusus identitas nasabah agar tidak pusing melihat banyak kolom: `ID_Prospek`, `Nama_Lengkap`, `Nomor_WhatsApp`, `Relasi_Hubungan`, `Pekerjaan`, `Estimasi_Penghasilan`, `Alamat_Domisili`, `Tautan_WhatsApp`, `Tanggal_Terdaftar`.
* **Tab 2: `Pipeline_Penjualan` (Proses Penjualan & Follow-up)**:
  * Khusus aktivitas sales: `ID_Prospek`, `Nama_Lengkap` (otomatis VLOOKUP), `Tahap_Pipeline`, `Kategori_Pasar` (Hot/Warm/Cold), `Money_Qualified`, `Authority_Qualified`, `Need_Qualified`, `Target_Kontak_Berikutnya`, `Terakhir_Dihubungi`, `Kendala_Keberatan_Terakhir`, `Catatan_Pribadi`, `Tautan_WhatsApp`.
* **Tab 3: `Log_Interaksi`**: Riwayat interaksi, respon prospek, kendala, dan janji temu berikutnya.
* **Tab 4: `Portofolio_Polis`**: Nomor polis, premi, frekuensi bayar, **Rumus Otomatis Hitung APE (Bulanan x12, Kuartalan x4, dsb.)**, **Hitung Mundur Jatuh Tempo**, dan template reminder WA.
* **Tab 5: `Target_Produksi_MDRT`**: Dashboard target Rp 600 Juta APE, 50 Polis Baru, dan Star Club Trip yang membaca data real-time dari tabel polis.
* **Tab 6: `Panduan_Keberatan`**: Terisi lengkap **8 Skenario Keberatan Teruji** (Sudah ada BPJS/kantor, uang diputar di bisnis, premi mahal, takut agen berhenti, klaim susah, asuransi syariah, dll) beserta skrip percakapan.
* **Tab 7: `Akun_Agen`**: Database akun agen terdaftar, nomor WhatsApp, kata sandi (password), kantor agency, kode agen, role, dan tanggal terdaftar.
* **Tab 8: `Master_Data`**: Referensi dropdown pilihan tahap penjualan, relasi, dan produk asuransi.

---

## 3. Langkah 2: Mengaktifkan AppSheet (Mobile App)

Setelah Google Spreadsheet Anda terisi sheet di atas:

1. Di Google Sheets Anda, klik menu **Extensions (Ekstensi)** ➔ **AppSheet** ➔ **Create an app**.
2. AppSheet akan otomatis membaca struktur data spreadsheet Anda dan membangun aplikasi seluler dalam waktu ~15 detik.
3. Di dashboard AppSheet (editor browser):
   * Buka menu **Data** di sebelah kiri.
   * Pastikan tabel `Daftar_Calon_Nasabah` dan `Pipeline_Penjualan` sudah aktif.
   * Klik tombol **Add Table** untuk menambahkan sheet lainnya:
     * Tambahkan `Portofolio_Polis`
     * Tambahkan `Log_Interaksi`
     * Tambahkan `Panduan_Keberatan`
     * Tambahkan `Target_Produksi_MDRT`

---

## 4. Langkah 3: Konfigurasi Tipe Kolom di AppSheet

Di menu **Data ➔ Columns**, sesuaikan tipe kolom berikut agar fitur interaktif bekerja maksimal:

### A. Tabel `Project100_Prospek`
* `ID_Prospek`: **Text** (Centang `Key`, Formula Initial Value: `UNIQUEID()`, centang `Hidden`).
* `Nama_Lengkap`: **Name** (Centang `Label`).
* `Nomor_WhatsApp`: **Phone**.
* `Kategori_Pasar`: **Enum** (Values: `Pasar Dekat (Hot)`, `Pasar Menengah (Warm)`, `Pasar Baru (Cold)`).
* `Tahap_Pipeline`: **Enum** (Values dari `Master_Data!A2:A12`).
* `Money_Qualified`, `Authority_Qualified`, `Need_Qualified`: **Yes/No**.
* `Tautan_WhatsApp`: **Url**.

### B. Tabel `Portofolio_Polis`
* `Nomor_Polis`: **Text** (Centang `Key`).
* `ID_Prospek`: **Ref** (Pilih Ref ke tabel `Project100_Prospek` agar riwayat nasabah terhubung otomatis).
* `Besaran_Premi`: **Price** (Currency: `Rp`).
* `Nominal_APE`: **Price** (Formula: hitung otomatis dari sheet).
* `Hari_Menuju_Jatuh_Tempo`: **Number**.
* `Tautan_Reminder_WA`: **Url**.

### C. Tabel `Log_Interaksi`
* `ID_Log`: **Text** (Key, `UNIQUEID()`).
* `ID_Prospek`: **Ref** (ke `Project100_Prospek`).
* `Tanggal_Waktu`: **DateTime** (Initial Value: `NOW()`).

---

## 5. Langkah 4: Desain Tampilan UX di AppSheet

Di menu **App ➔ Navigation / Views**, susun 4 menu utama di navigasi bawah (*Bottom Navigation*):

1. **Menu 1: "Project 100" (Pipeline Penjualan)**
   * View type: **Deck** atau **Card**.
   * Group by: `Tahap_Pipeline`.
   * Sort by: `Target_Kontak_Berikutnya` (Ascending).
   * Quick Actions: Tampilkan tombol telepon dan chat WhatsApp langsung di kartu.

2. **Menu 2: "Polis Nasabah"**
   * View type: **Table**.
   * Group by: `Status_Polis`.
   * Format Rule: Beri warna merah pada baris jika `Hari_Menuju_Jatuh_Tempo <= 14`.

3. **Menu 3: "Panduan Keberatan"**
   * View type: **Card**.
   * Group by: `Kategori`.
   * Title: `Keberatan_Calon_Nasabah`.
   * Body: `Skrip_Respon_Langsung`.

4. **Menu 4: "MDRT 2026"**
   * View type: **Detail** atau **Gallery**.
   * Menampilkan capaian APE dan progres persentase menuju kualifikasi MDRT.

---

## 6. Langkah 5: Membuat Tombol Aksi 1-Klik WhatsApp di AppSheet

Untuk mempermudah sapaan dan pengingat premi saat agen berada di lapangan:

1. Di AppSheet, buka menu **Actions** ➔ klik **+ Add Action**.
2. **Action 1: "Sapa via WhatsApp" (Pada Tabel Project100_Prospek)**:
   * Action name: `Kirim WA Sapaan`
   * For a record of table: `Project100_Prospek`
   * Do this: `External: go to a website`
   * Target URL:
     ```excel
     CONCATENATE(
       "https://wa.me/",
       IF(STARTSWITH([Nomor_WhatsApp], "0"), CONCATENATE("62", RIGHT([Nomor_WhatsApp], LEN([Nomor_WhatsApp]) - 1)), [Nomor_WhatsApp]),
       "?text=",
       ENCODEURL(CONCATENATE("Halo Bapak/Ibu ", [Nama_Lengkap], ", salam silaturahmi dari saya. Semoga kabar sehat selalu."))
     )
     ```
   * Icon: Pilih icon Chat / WhatsApp hijau.

3. **Action 2: "Kirim Pengingat Jatuh Tempo" (Pada Tabel Portofolio_Polis)**:
   * Action name: `Kirim Reminder Premi`
   * For a record of table: `Portofolio_Polis`
   * Do this: `External: go to a website`
   * Target URL:
     ```excel
     CONCATENATE(
       "https://wa.me/",
       IF(STARTSWITH([No_WhatsApp_Nasabah], "0"), CONCATENATE("62", RIGHT([No_WhatsApp_Nasabah], LEN([No_WhatsApp_Nasabah]) - 1)), [No_WhatsApp_Nasabah]),
       "?text=",
       ENCODEURL(CONCATENATE("Yth. Bapak/Ibu ", [Nama_Pemegang_Polis], ", kami mengingatkan polis No. ", [Nomor_Polis], " (", [Produk_Asuransi], ") akan jatuh tempo. Terima kasih atas kepercayaan Bapak/Ibu."))
     )
     ```

---

## 7. Keunggulan Solusi Ini untuk Kebutuhan Agen Asuransi

1. **Dapat Diinstal di Smartphone**: Agen cukup mengunduh aplikasi **AppSheet** dari App Store / Google Play Store, lalu login dengan akun Google. Aplikasi langsung muncul di layar utama HP.
2. **Berjalan Lancar Saat Offline**: Data dapat diinput di lokasi yang minim sinyal (misalnya basement rumah sakit atau kantor nasabah) dan otomatis tersinkronisasi saat tersambung internet kembali.
3. **Data Terkendali Penuh di Google Drive**: Seluruh rekaman tersimpan rapi di spreadsheet pribadi Anda dan dapat diekspor ke Excel / PDF kapan pun tanpa ketergantungan server lokal.
4. **Bebas Biaya Pemeliharaan & Hosting**: Menggunakan kuota gratis AppSheet Core untuk penggunaan pribadi agen.
