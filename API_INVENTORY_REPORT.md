# Laporan Inventarisasi API Endpoint
## Portal Regional Investment BKPM
**URL:** https://regionalinvestment.bkpm.go.id/  
**Tanggal Scan:** 2026-05-02  
**Metode:** Playwright Network Capture, Brute-force Path, JS Bundle Analysis, Endpoint Testing

---

## Ringkasan Eksekutif

Portal ini adalah aplikasi **Next.js** yang mengkomunikasikan data melalui backend API berbasis prefix `/be/`. Tidak ditemukan endpoint REST berformat `/api/v1/` atau `/api/v2/` yang aktif (semua mengembalikan HTTP 500). Seluruh data dinamis diambil melalui endpoint custom di bawah `/be/`. Portal ini juga terintegrasi dengan **Geoportal** yang memiliki endpoint terpisah di bawah `/geoportal/be/`.

| Kategori | Jumlah |
|---|---|
| Endpoint aktif (HTTP 200) | 40+ |
| Endpoint memerlukan autentikasi (HTTP 401) | 7 |
| Endpoint method tidak diizinkan (HTTP 405) | 1 |
| Endpoint error server (HTTP 500) | 29 |
| Total endpoint unik terdeteksi | 76+ |

---

## 1. Endpoint Aktif (HTTP 200) — Berdasarkan Fungsi

### 1.1 Homepage & Global

| No | Endpoint | Method | Parameter | Status | Struktur Response (Keys) | Keterangan |
|---|---|---|---|---|---|---|
| 1 | `/be/home/slider/id` | GET | `id` (bahasa: `id`/`en`) | 200 | `success`, `data`, `data.id_app_slider`, `data.judul`, `data.deskripsi`, `data.nama_file_image`, `data.url_link`, `data.ordering` | Slider hero di homepage |
| 2 | `/be/home/slider_background/` | GET | — | 200 | `success`, `data`, `data.id_app_slider`, `data.judul`, `data.deskripsi`, `data.nama_file_image`, `data.is_background` | Background slider |
| 3 | `/be/home/running_text` | GET | `_t` (timestamp) | 200 | `success`, `data` | Teks berjalan (marquee) |
| 4 | `/be/home/link_terkait` | GET | — | 200 | `success`, `data`, `data.id_link_terkait`, `data.nama`, `data.alamat`, `data.url_web`, `data.file_logo` | Link terkait / kontak |
| 5 | `/be/home/ikn` | GET | `_t` (timestamp) | 200 | `success`, `data`, `data.ikn`, `data.ikn.id_ikn`, `data.ikn.nama`, `data.ikn.deskripsi`, `data.ikn.file_image`, `data.ikn.file_logo`, `data.ikn.lon`, `data.ikn.lat`, `data.ikn.view_count`, `data.ikn.tb_ikn_tr` | Data Ibu Kota Nusantara (IKN) |
| 6 | `/be/home/sektor_nasonal_ref/id` | GET | `id` (provinsi ID?) | 200 | `success`, `data`, `data.datas`, `data.datas.id_sektor`, `data.datas.nama`, `data.datas.icon`, `data.datas.id_kategori_sektor` | Referensi sektor nasional |
| 7 | `/be/home/sektor_nasional_detail/id/{id}` | GET | `id` (numeric) | 200 | `success`, `data`, `data.peluang`, `data.umr`, `data.jumlah_penduduk`, `data.prdb`, `data.realisasi_investasi`, `data.kawasan` | Detail sektor nasional per provinsi |
| 8 | `/be/home/sektor_unggulan_nasional/id/{id}` | GET | `id` (numeric) | 200 | `success`, `data`, `data.deskripsi`, `data.data`, `data.data.id_sektor`, `data.data.nama_sektor`, `data.data.tahun`, `data.data.numeric_value` | Sektor unggulan nasional |
| 9 | `/be/home/sektor_unggulan_wilayah/id/{id}` | GET | `id` (numeric, provinsi ID) | 200 | `success`, `data`, `data.sektor_unggulan`, `data.sektor_unggulan.id_sektor_daerah`, `data.sektor_unggulan.deskripsi`, `data.sektor_unggulan.sektor_nasional`, `data.peluang_investasi` | Sektor unggulan per wilayah |
| 10 | `/be/home/peluang_investasi_wilayah/{id}/` | GET | `id` (numeric, provinsi ID) | 200 | `success`, `data`, `data.data`, `data.data.id_peluang_kabkot`, `data.data.nama`, `data.data.nilai_investasi`, `data.data.nilai_irr`, `data.data.nilai_npv`, `data.data.nilai_pp`, `data.data.tb_peluang_kabkot_tr` | Daftar peluang investasi per wilayah |
| 11 | `/be/home/prov_ref/id` | GET | — | 200 | `success`, `data`, `data.data`, `data.data.id_adm_provinsi`, `data.data.nama` | Referensi provinsi |
| 12 | `/be/menu` | GET | — | 200 | `success`, `data`, `data.data`, `data.data.id`, `data.data.menu_name`, `data.data.url`, `data.data.parent_id`, `data.data.icon`, `data.data.order` | Struktur menu navigasi |
| 13 | `/be/slider` | GET | — | 200 | `success`, `data`, `data.data`, `data.data.id_app_slider`, `data.data.judul`, `data.data.deskripsi`, `data.data.nama_file_image`, `data.data.url_link`, `data.data.tb_app_slider_tr` | Semua data slider |

### 1.2 Peluang Investasi

| No | Endpoint | Method | Parameter | Status | Struktur Response (Keys) | Keterangan |
|---|---|---|---|---|---|---|
| 14 | `/be/peluang/peluang_investasi_wilayah` | GET | `page`, `page_size`, `search` | 200 | `success`, `totalRecords`, `totalPage`, `page`, `pageSize`, `data`, `data.id_peluang`, `data.nama`, `data.tahun`, `data.nilai_irr`, `data.nilai_investasi`, `data.nilai_npv`, `data.nilai_pp`, `data.nama_sektor`, `data.status_proyek`, `data.icon`, `data.image`, `data.lon`, `data.lat` | Daftar peluang investasi (paginasi) |
| 15 | `/be/peluang/detail/{id}` | GET | `id` (numeric, ID peluang) | 200 | `success`, `data`, `data.detail`, `data.detail.id_sektor`, `data.detail.judul`, `data.detail.nama_kabkot`, `data.detail.nama_provinsi`, `data.detail.lokasi_kawasan`, `data.detail.nilai_investasi`, `data.detail.nilai_irr`, `data.detail.nilai_npv`, `data.detail.payback_period`, `data.detail.longitude`, `data.detail.latitude`, `data.insentif`, `data.info`, `data.galeri`, `data.kontak`, `data.proyek_terkait`, `data.layer` | Detail lengkap proyek peluang investasi |
| 16 | `/be/peluang/peluang_investasi_sektor/` | GET | — | 200 | `success`, `data`, `data.id_sektor`, `data.nama`, `data.proyek`, `data.jumlah_proyek`, `data.icon`, `data.image`, `data.kategori_sektor` | Daftar peluang investasi per sektor |
| 17 | `/be/peluang/peluang_investasi_card/` | GET | — | 200 | `success`, `data`, `data.proyek`, `data.sektor`, `data.pengunjung`, `data.status_proyek` | Kartu ringkasan dashboard peluang investasi |
| 18 | `/be/peluang/slider/` | GET | — | 200 | `success`, `data`, `data.data`, `data.data.id_app_slider`, `data.data.judul`, `data.data.deskripsi`, `data.data.nama_file_image`, `data.data.url_link`, `data.data.ordering` | Slider khusus halaman peluang investasi |
| 19 | `/be/peluang/count_viewer` | GET | `id_halaman_pengunjung` | 200 | `status`, `message` | Counter pengunjung halaman |
| 20 | `/be/peluang/get_ppi_like/{id}` | GET | `id` (ID peluang), `_t` | 200 | `success`, `data`, `data.id_peluang_kabkot`, `data.jumlah` | Jumlah like PPI per peluang |
| 21 | `/be/peluang/is_ppi_like/{id}` | GET | `id` (ID peluang), `_t` | 200 | `success`, `data`, `data.is_like` | Cek status like user |

### 1.3 Hilirisasi

| No | Endpoint | Method | Parameter | Status | Struktur Response (Keys) | Keterangan |
|---|---|---|---|---|---|---|
| 22 | `/be/hilirisasi/gambar-slider/get` | GET | — | 200 | `status`, `message`, `data`, `data.id`, `data.ordering`, `data.terjemahan`, `data.terjemahan.id.judul`, `data.terjemahan.id.gambar_url` | Slider halaman hilirisasi |
| 23 | `/be/hilirisasi/about/dashboard/get` | GET | — | 200 | `status`, `message`, `data`, `data.cards`, `data.cards.total_sektor`, `data.cards.total_komoditas`, `data.cards.total_nilai_ekonomi`, `data.cards.total_tenaga_kerja`, `data.charts`, `data.charts.pie_sektor`, `data.charts.bar_nilai_ekonomi`, `data.charts.target_investasi`, `data.charts.realisasi_investasi` | Dashboard data hilirisasi |
| 24 | `/be/hilirisasi/sektor/list/get` | GET | — | 200 | `status`, `message`, `data`, `data.id`, `data.nama`, `data.nama_en`, `data.terjemahan`, `data.icon_url`, `data.cover_url`, `data.total_komoditas` | Daftar sektor hilirisasi |
| 25 | `/be/hilirisasi/komoditas/list/get` | GET | `limit` (default 1000) | 200 | `status`, `message`, `data`, `data.id`, `data.id_komoditas_his`, `data.nama_komoditas`, `data.nama_sektor`, `data.gambar_hero_url`, `data.terjemahan`, `data.peta`, `meta`, `meta.total`, `meta.page`, `meta.limit` | Daftar komoditas hilirisasi |
| 26 | `/be/hilirisasi/peta/get/geojson` | GET | `_t` (timestamp) | 200 | `type`, `features`, `features.type`, `features.geometry`, `features.geometry.coordinates`, `features.properties`, `features.properties.id`, `features.properties.id_sektor_his`, `features.properties.id_komoditas_his`, `features.properties.id_provinsi`, `features.properties.latitude`, `features.properties.longitude`, `features.properties.provinsi`, `features.properties.nama_sektor`, `features.properties.nama_komoditas`, `features.properties.terjemahan` | Data GeoJSON untuk peta hilirisasi |

### 1.4 Daerah (Wilayah Indonesia)

| No | Endpoint | Method | Parameter | Status | Struktur Response (Keys) | Keterangan |
|---|---|---|---|---|---|---|
| 27 | `/be/daerah` | GET | `_t` (timestamp) | 200 | `success`, `data`, `data.wilayah indonesia bagian barat`, `data.wilayah indonesia bagian barat.id_adm_provinsi`, `data.wilayah indonesia bagian barat.nama`, `data.wilayah indonesia bagian barat.luas_wilayah`, `data.wilayah indonesia bagian barat.image`, `data.wilayah indonesia bagian barat.peluang`, `data.wilayah indonesia bagian barat.realisasi` | Daftar daerah dengan statistik investasi |
| 28 | `/be/daerah/get_prov/` | GET | — | 200 | `success`, `data`, `data.id_adm_provinsi`, `data.nama`, `data.lon`, `data.lat` | Referensi data provinsi (koordinat) |
| 29 | `/be/daerah/get_prov/{id}` | GET | `id` (ID provinsi, e.g. `11`, `id`) | 200 | `success`, `data`, `data.id_adm_provinsi`, `data.nama`, `data.lon`, `data.lat` | Detail provinsi berdasarkan ID |
| 30 | `/be/daerah/get_zona_waktu/` | GET | `_t` (timestamp) | 200 | `success`, `data`, `data.id_zona_waktu`, `data.nama` | Referensi zona waktu Indonesia |

### 1.5 Proposal Bisnis (Probis)

| No | Endpoint | Method | Parameter | Status | Struktur Response (Keys) | Keterangan |
|---|---|---|---|---|---|---|
| 31 | `/be/probis/proposal_bisnis_wilayah` | GET | `page`, `page_size`, `search` | 200 | `success`, `totalRecords`, `totalPage`, `page`, `pageSize`, `data` | Daftar proposal bisnis per wilayah |

### 1.6 Referensi Global

| No | Endpoint | Method | Parameter | Status | Struktur Response (Keys) | Keterangan |
|---|---|---|---|---|---|---|
| 32 | `/be/global/getReferensi/tb_negara` | GET | `id` (optional) | 200 | `success`, `data`, `data.id_negara`, `data.nama`, `data.ibu_kota`, `data.keterangan` | Referensi data negara |
| 33 | `/be/global/getReferensi/vw_kawasan` | GET | `id` (optional) | 200 | `success`, `data`, `data.id_kawasan_industri`, `data.id_adm_kabkot`, `data.nama`, `data.keterangan`, `data.alamat`, `data.luas`, `data.luas_satuan`, `data.jarak_bandara_terdekat`, `data.jarak_pelabuhan_terdekat`, `data.jarak_ibukota`, `data.url_web`, `data.no_telp`, `data.email`, `data.cp`, `data.lon`, `data.lat`, `data.shape`, `data.kabkot`, `data.provinsi` | Referensi kawasan industri |
| 34 | `/be/global/getReferensi/vw_peluang_daerah_id` | GET | `id` (optional) | 200 | `success`, `data`, `data.id_peluang_daerah`, `data.id_adm_provinsi`, `data.id_adm_kabkot`, `data.judul`, `data.lokasi`, `data.tahun`, `data.keterangan`, `data.aspek_pasar`, `data.aspek_teknis`, `data.lon`, `data.lat`, `data.is_ikn`, `data.kabkot`, `data.provinsi`, `data.nilai_irr`, `data.nilai_npv`, `data.nilai_pp`, `data.nilai_investasi` | Referensi peluang investasi daerah |
| 35 | `/be/global/getReferensi/vw_peluang_kabkot_id` | GET | `id` (optional) | 200 | `success`, `data`, `data.id_peluang_kabkot`, `data.sektor`, `data.nama`, `data.lokasi_kawasan`, `data.kabkot`, `data.provinsi`, `data.tahun`, `data.nilai_investasi`, `data.nilai_irr`, `data.nilai_npv`, `data.nilai_pp`, `data.lon`, `data.lat`, `data.prioritas`, `data.status`, `data.iconmap` | Referensi peluang investasi kabupaten/kota |

### 1.7 IKN (Ibu Kota Nusantara)

| No | Endpoint | Method | Parameter | Status | Struktur Response (Keys) | Keterangan |
|---|---|---|---|---|---|---|
| 36 | `/be/ikn/detail/` | GET | — | 200 | `success`, `data`, `data.ikn`, `data.ikn.nama`, `data.ikn.lon`, `data.ikn.lat`, `data.ikn.deskripsi`, `data.ikn.logo`, `data.ikn.image`, `data.ikn.vidio`, `data.ikn.lokasi`, `data.indikator`, `data.peluang`, `data.peraturan`, `data.profil`, `data.galeri` | Detail IKN lengkap |

---

## 2. Endpoint Memerlukan Autentikasi (HTTP 401)

| No | Endpoint | Method | Status | Keterangan |
|---|---|---|---|---|
| 1 | `/be/` | GET | 401 | Root backend API (memerlukan auth token) |
| 2 | `/geoportal/be/cms/layer/{layer_id}/info` | GET | 401 | Info layer geoportal (5 layer ID berbeda terdeteksi) |

**Layer ID Geoportal yang terdeteksi:**
- `ZlMvBZEjgInDPeYR`
- `UzqvFzNKdKwqHdVS`
- `rVWHLDywkDsNrxtw`
- `SeliAFmdDopWUDDq`
- `KJPnBNNfbcnAuoJc`

---

## 3. Endpoint Khusus Method (HTTP 405 / POST)

| No | Endpoint | Method | Status | Keterangan |
|---|---|---|---|---|
| 1 | `/geoportal/be/iam/login` | POST | 405 (GET not allowed) | Login endpoint untuk geoportal |
| 2 | `/be/hilirisasi/count-viewer` | POST | 200 (`{"success":false,"message":"IP sudah tercatat baru-baru ini."}`) | Counter viewer halaman hilirisasi (rate-limited by IP) |

---

## 4. Endpoint Tidak Aktif / Server Error (HTTP 500)

Semua endpoint di bawah prefix `/api/` dan `/api/v1/` mengembalikan **HTTP 500 Internal Server Error**, yang mengindikasikan bahwa prefix ini mungkin merupakan legacy route atau memerlukan konfigurasi/headers khusus yang tidak terpenuhi.

| Prefix | Contoh Endpoint | Status |
|---|---|---|
| `/api/` | `/api/content/`, `/api/menu/`, `/api/slider/`, `/api/home/`, `/api/daerah/`, `/api/peluang/`, `/api/probis/`, `/api/global/`, `/api/hilirisasi/`, `/api/informasi/`, `/api/ipro/`, `/api/search/` | 500 |
| `/api/v1/` | `/api/v1/content/`, `/api/v1/menu/`, `/api/v1/slider/`, `/api/v1/home/`, `/api/v1/daerah/`, `/api/v1/peluang/`, `/api/v1/probis/`, `/api/v1/global/`, `/api/v1/hilirisasi/`, `/api/v1/informasi/`, `/api/v1/ipro/`, `/api/v1/search/` | 500 |
| `/api/v2/` | `/api/v2/` | 500 |
| `/api/docs` | `/api/docs` | 500 |

> **Catatan:** Endpoint YouTube (`/api/stats/*`) yang muncul di network capture adalah request ke domain `youtube.com`, bukan API portal BKPM.

---

## 5. Endpoint Asset / Uploads (Non-API)

Portal menggunakan path `/be/uploads/` untuk menyajikan file static (gambar, icon, slider, dokumen). Berikut kategori upload yang terdeteksi:

| Kategori | Contoh Path |
|---|---|
| Icon sektor | `/be/uploads/icon-web/{nama_icon}.svg` |
| Slider | `/be/uploads/slider/{timestamp}.webp` |
| Peluang investasi | `/be/uploads/peluang/{id}/{tahun}/{bulan}/{nama_file}` |
| Peluang daerah | `/be/uploads/peluang_daerah/{id}/{uuid}.{ext}` |
| Daerah (logo provinsi) | `/be/uploads/daerah/{id_provinsi}/{nama_file}` |
| Sektor | `/be/uploads/sektor/img/{id}/{nama_file}` |
| Sektor Hilirisasi | `/be/uploads/sektor_his/cover/{timestamp}.webp` |
| Hilirisasi slider | `/be/uploads/hilirisasi/slider/{timestamp}.webp` |
| Hilirisasi hero | `/be/uploads/hilirisasi/detail-komoditas/hero/{timestamp}.webp` |
| IKN | `/be/uploads/ikn/{uuid}` |

---

## 6. Pola URL & Parameter yang Dikenali

### 6.1 Pola Pagination
Banyak endpoint listing menggunakan pola pagination standar:
```
?page={number}&page_size={number}&search={keyword}
```

### 6.2 Pola Timestamp Cache Buster
Beberapa endpoint menggunakan parameter `_t` sebagai cache buster:
```
?_t={unix_timestamp_milliseconds}
```

### 6.3 Pola ID Resource
Detail resource menggunakan pola REST-like:
```
/be/peluang/detail/{id_peluang}
/be/home/sektor_nasional_detail/id/{id_provinsi}
/be/home/sektor_unggulan_wilayah/id/{id_provinsi}
/be/daerah/get_prov/{id_provinsi}
```

### 6.4 Pola Referensi Global
Endpoint referensi menggunakan pola:
```
/be/global/getReferensi/{nama_tabel}
```
Nama tabel yang diketahui:
- `tb_negara`
- `vw_kawasan`
- `vw_peluang_daerah_id`
- `vw_peluang_kabkot_id`

---

## 7. Temuan dari JS Bundle Next.js

Scan terhadap **28 file JS chunks** Next.js tidak menemukan endpoint API yang di-hardcode selain path upload (`/be/uploads/...`). Ini mengindikasikan bahwa URL API kemungkinan besar dikonstruksi secara dinamis di runtime atau di-fetch melalui server-side rendering (SSR) Next.js App Router.

**File chunks yang di-scan:**
- `_next/static/chunks/app/page-*.js`
- `_next/static/chunks/app/layout-*.js`
- `_next/static/chunks/app/not-found-*.js`
- `_next/static/chunks/main-app-*.js`
- `_next/static/chunks/webpack-*.js`
- Dan 22 chunk dinamis lainnya

---

## 8. Rekomendasi Penggunaan API

### 8.1 Endpoint Tanpa Autentikasi (Publik)
Semua endpoint di bawah `/be/` (kecuali root `/be/` dan `/geoportal/be/`) dapat diakses publik tanpa token autentikasi. Gunakan parameter pagination untuk mengoptimalkan request:

```bash
# Contoh: Daftar peluang investasi dengan pagination
curl "https://regionalinvestment.bkpm.go.id/be/peluang/peluang_investasi_wilayah?page=1&page_size=20&search=pertanian"

# Contoh: Detail proyek
curl "https://regionalinvestment.bkpm.go.id/be/peluang/detail/1531"

# Contoh: Data GeoJSON hilirisasi
curl "https://regionalinvestment.bkpm.go.id/be/hilirisasi/peta/get/geojson"
```

### 8.2 Endpoint Memerlukan Autentikasi
- `/be/` — kemungkinan dashboard/root API admin
- `/geoportal/be/cms/layer/{id}/info` — layer geoportal CMS
- `/geoportal/be/iam/login` — login IAM geoportal

### 8.3 Endpoint Legacy/Tidak Aktif
Hindari penggunaan prefix `/api/` dan `/api/v1/` karena selalu mengembalikan HTTP 500.

---

## Lampiran: File Output Scan

Semua data raw hasil scan tersimpan di folder `scraper/`:

| File | Isi |
|---|---|
| `api_inventory_discovered.json` | Endpoint hasil capture network Playwright |
| `api_inventory_bruteforce.json` | Hasil brute-force path umum |
| `api_inventory_js_scan.json` | Hasil scan JS bundle Next.js |
| `api_inventory_tested.json` | Hasil testing endpoint (status + struktur JSON) |
| `api_inventory_extra.json` | Hasil testing endpoint variasi parameter tambahan |

---

*Laporan ini dibuat secara otomatis melalui kombinasi teknik network capture, brute-force, JS bundle analysis, dan endpoint testing.*
