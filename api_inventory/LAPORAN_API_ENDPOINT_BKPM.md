# Laporan Inventarisasi API Endpoint — Portal Utama BKPM

**Target:** https://www.bkpm.go.id/  
**Tanggal Pemeriksaan:** 2026-05-02  
**Metode:** Playwright network logging, curl brute-force, HTML/JS source analysis, header fingerprinting  

---

## 1. Kesimpulan Utama

| Item | Temuan |
|------|--------|
| **CMS/Framework** | **Laravel (PHP 8.3.25)** — BUKAN WordPress |
| **Web Server** | nginx/1.25.2 |
| **PHP Version** | 8.3.25 |
| **Session Cookie** | `myapp_session` (format Laravel encrypted cookie) |
| **CSRF Protection** | Aktif (`XSRF-TOKEN` cookie + `csrf-token` meta tag) |
| **WAF/Firewall** | Tidak terdeteksi secara eksplisit; pemblokiran berbasis autentikasi & CSRF |

> **Verifikasi WordPress:** Semua path WordPress (`/wp-json/`, `/wp-content/`, `/wp-admin/`, `/xmlrpc.php`, dll) mengembalikan **401** atau **404**. Path `/wp-json/wp/v2/*` secara konsisten **404**, yang membuktikan tidak ada WordPress REST API yang aktif. Indikator WordPress (generator tag, script `wp-content`, dsb) **tidak ditemukan** di seluruh sumber daya.

---

## 2. Bukti Deteksi Laravel

| Bukti | Detail |
|-------|--------|
| **HTTP 419** | `POST /api/v1/` mengembalikan status `419 Page Expired` — kode khas Laravel untuk CSRF token tidak valid |
| **CSRF Meta Tag** | `<meta name="csrf-token" content="...">` di setiap halaman |
| **Form Login** | Menggunakan `_token` hidden input (konvensi Laravel) |
| **Cookie Session** | `myapp_session` dengan format encrypted JSON Laravel |
| **Cookie XSRF** | `XSRF-TOKEN` cookie otomatis diset oleh framework |
| **Error Message** | Format JSON `{"message":"..."}` konsisten dengan Laravel |
| **Asset Path** | `/assets/frontend/...`, `/assets/js/...`, `/assets/media/...` (bukan `/wp-content/`) |
| **Login Page** | Menggunakan tema **Metronic** (sering dipakai bersama Laravel) — ID form `kt_sign_in_form` |

---

## 3. Daftar Lengkap Endpoint API

### 3.1 API Internal (Laravel Backend)

Semua endpoint internal berada di bawah prefix `/api/` dan `/api/v1/`. **Seluruh endpoint internal memerlukan autentikasi** (mengembalikan `401 Unauthenticated` atau `CSRF token mismatch` jika belum login).

#### 3.1.1 Base & Auth Routes

| Endpoint | Method | Status | Keterangan |
|----------|--------|--------|------------|
| `https://www.bkpm.go.id/api/` | GET | **401** | Base API; memerlukan autentikasi. Response: `{"message":"Unauthenticated."}` |
| `https://www.bkpm.go.id/api/` | POST/PUT | **419** | Memerlukan CSRF token valid |
| `https://www.bkpm.go.id/api/v1/` | GET | **405** | Method tidak diizinkan. Allow: `POST, PUT` |
| `https://www.bkpm.go.id/api/v1/` | POST | **419/500** | Route ada, memerlukan payload & CSRF valid |
| `https://www.bkpm.go.id/api/login` | GET | **405** | Allow: POST |
| `https://www.bkpm.go.id/api/register` | GET | **405** | Allow: POST |
| `https://www.bkpm.go.id/api/user` | GET | **405** | Allow: POST |
| `https://www.bkpm.go.id/api/users` | GET | **405** | Allow: POST |
| `https://www.bkpm.go.id/api/auth/login` | GET | **500** | Route ada (Server Error tanpa payload) |
| `https://www.bkpm.go.id/api/auth/register` | GET | **500** | Route ada |
| `https://www.bkpm.go.id/api/auth/user` | GET | **500** | Route ada |
| `https://www.bkpm.go.id/api/auth/refresh` | GET | **500** | Route ada |
| `https://www.bkpm.go.id/api/auth/logout` | GET | **500** | Route ada |

#### 3.1.2 Content / Public Routes (Mengembalikan Server Error — route terdaftar)

| Endpoint | Method | Status | Keterangan |
|----------|--------|--------|------------|
| `https://www.bkpm.go.id/api/public` | GET | **405** | Allow: `POST, PUT` |
| `https://www.bkpm.go.id/api/public` | POST | **CSRF mismatch** | Memerlukan CSRF token valid |
| `https://www.bkpm.go.id/api/public/posts` | GET | **500** | Route terdaftar, error tanpa parameter |
| `https://www.bkpm.go.id/api/public/pages` | GET | **500** | Route terdaftar |
| `https://www.bkpm.go.id/api/public/news` | GET | **500** | Route terdaftar |
| `https://www.bkpm.go.id/api/public/content` | GET | **500** | Route terdaftar |
| `https://www.bkpm.go.id/api/public/data` | GET | **500** | Route terdaftar |
| `https://www.bkpm.go.id/api/public/search` | GET | **500** | Route terdaftar |
| `https://www.bkpm.go.id/api/public/media` | GET | **500** | Route terdaftar |
| `https://www.bkpm.go.id/api/public/categories` | GET | **500** | Route terdaftar |
| `https://www.bkpm.go.id/api/public/tags` | GET | **500** | Route terdaftar |

#### 3.1.3 v1 Public Routes (Mengembalikan Server Error)

| Endpoint | Method | Status | Keterangan |
|----------|--------|--------|------------|
| `https://www.bkpm.go.id/api/v1/public` | GET | **500** | Route terdaftar |
| `https://www.bkpm.go.id/api/v2/public` | GET | **500** | Route terdaftar |
| `https://www.bkpm.go.id/api/v1/public/posts` | GET | **404** | Route tidak ditemukan |
| `https://www.bkpm.go.id/api/v1/public/pages` | GET | **404** | Route tidak ditemukan |
| `https://www.bkpm.go.id/api/v1/public/news` | GET | **404** | Route tidak ditemukan |

#### 3.1.4 Generic GET Routes (Semua 405 — hanya POST/PUT)

| Endpoint | Status | Keterangan |
|----------|--------|------------|
| `/api/get-data` | 405 | Allow: POST/PUT |
| `/api/get-content` | 405 | Allow: POST/PUT |
| `/api/content-list` | 405 | Allow: POST/PUT |
| `/api/get-posts` | 405 | Allow: POST/PUT |
| `/api/get-pages` | 405 | Allow: POST/PUT |
| `/api/get-news` | 405 | Allow: POST/PUT |
| `/api/get-articles` | 405 | Allow: POST/PUT |
| `/api/get-media` | 405 | Allow: POST/PUT |
| `/api/get-categories` | 405 | Allow: POST/PUT |
| `/api/get-tags` | 405 | Allow: POST/PUT |
| `/api/get-search` | 405 | Allow: POST/PUT |
| `/api/get-menu` | 405 | Allow: POST/PUT |
| `/api/get-menus` | 405 | Allow: POST/PUT |
| `/api/get-sliders` | 405 | Allow: POST/PUT |
| `/api/get-banners` | 405 | Allow: POST/PUT |
| `/api/get-announcements` | 405 | Allow: POST/PUT |
| `/api/get-events` | 405 | Allow: POST/PUT |
| `/api/get-downloads` | 405 | Allow: POST/PUT |
| `/api/get-galleries` | 405 | Allow: POST/PUT |
| `/api/get-videos` | 405 | Allow: POST/PUT |
| `/api/get-infographics` | 405 | Allow: POST/PUT |
| `/api/get-statistics` | 405 | Allow: POST/PUT |
| `/api/get-investment` | 405 | Allow: POST/PUT |
| `/api/get-regulations` | 405 | Allow: POST/PUT |
| `/api/get-services` | 405 | Allow: POST/PUT |
| `/api/get-faq` | 405 | Allow: POST/PUT |
| `/api/get-contact` | 405 | Allow: POST/PUT |
| `/api/get-locations` | 405 | Allow: POST/PUT |
| `/api/get-offices` | 405 | Allow: POST/PUT |

> **Catatan:** Semua endpoint di atas terdaftar di routing Laravel. Saat diakses dengan POST + CSRF token valid, mengembalikan `401 Unauthenticated`, yang membuktikan adanya middleware `auth` atau `sanctum`.

#### 3.1.5 Admin & Backend Routes

| Endpoint | Method | Status | Keterangan |
|----------|--------|--------|------------|
| `https://www.bkpm.go.id/admin` | GET | **401** | Akses dibatasi |
| `https://www.bkpm.go.id/admin/` | GET | **401** | Akses dibatasi |
| `https://www.bkpm.go.id/login` | GET | **200** | Halaman login Laravel |
| `https://www.bkpm.go.id/login/` | GET | **200** | Halaman login Laravel |
| `https://www.bkpm.go.id/register` | GET | **401** | Akses dibatasi |
| `https://www.bkpm.go.id/backend` | GET | **401** | Akses dibatasi |
| `https://www.bkpm.go.id/panel` | GET | **401** | Akses dibatasi |
| `https://www.bkpm.go.id/nova` | GET | **401** | Akses dibatasi (Laravel Nova adalah admin panel premium) |

---

### 3.2 API Eksternal (Pihak Ketiga)

| Endpoint | Method | Status | Keterangan Fungsi |
|----------|--------|--------|-------------------|
| `https://api.userway.org/api/v1/tunings/1IUZrMWFRn` | POST | **200** | UserWay Accessibility Widget — tuning konfigurasi widget aksesibilitas |
| `https://api.userway.org/api/a11y-data/v0/page/https%3A%2F%2Fwww.bkpm.go.id%2F/DESKTOP/WIDGET_OFF/status` | GET | **200** | UserWay Accessibility — mengambil status a11y (accessibility) untuk halaman aktif |

---

### 3.3 Layanan & Integrasi Eksternal Lainnya (Non-API)

Berikut adalah domain pihak ketiga yang direferensikan di frontend (ditemukan di HTML/JS), meskipun bukan API endpoint dalam konteks REST:

| Layanan | URL / Pattern | Keterangan |
|---------|---------------|------------|
| Google Tag Manager | `https://www.googletagmanager.com/gtag/js?id=G-BT2NVHY1TH` | Analytics & tracking |
| Google Analytics | `G-BT2NVHY1TH` | Property ID GA4 |
| UserWay Accessibility | `https://cdn.userway.org/...` | Widget aksesibilitas |
| Sienna Accessibility | `https://cdn.jsdelivr.net/npm/sienna-accessibility@latest/...` | Library aksesibilitas tambahan |
| Data Indonesia (data.go.id) | `https://data.go.id/` | Link portal open data |
| Lapor.go.id | `https://www.lapor.go.id/...` | Link aspirasi & pengaduan |
| Social Media | Facebook, Twitter/X, LinkedIn, YouTube | Link profil resmi BKPM |

---

## 4. Parameter & Payload yang Terdeteksi

Dari inspeksi form dan JavaScript:

| Parameter | Lokasi | Keterangan |
|-----------|--------|------------|
| `_token` | Form login (hidden input) | CSRF token Laravel |
| `csrf-token` | Meta tag `<meta name="csrf-token">` | CSRF token untuk AJAX/Fetch |
| `email` | Form login | Username/email |
| `password` | Form login | Password |
| `remember` | Form login | Checkbox "Remember me" |
| `_method` | Form login | HTTP method override (Laravel convention) |

---

## 5. Hasil Playwright Network Monitoring

Script Playwright mengunjungi 6 halaman utama dan melakukan scroll + wait 5 detik:

| Halaman | API Request Ditemukan |
|---------|----------------------|
| Homepage (`/`) | 2 request ke `api.userway.org` |
| Data Investasi (`/id/halaman/data-investasi`) | 0 |
| Berita (`/id/halaman/berita`) | 0 |
| Layanan Prioritas (`/id/halaman/layanan-prioritas`) | 0 |
| Kebijakan & Regulasi (`/id/halaman/kebijakan-dan-regulasi`) | 0 |
| Tentang BKPM (`/id/halaman/tentang-bkpm`) | 0 |

**Kesimpulan:** Frontend portal tidak melakukan AJAX call ke API internal saat halaman di-render. Semua konten dirender server-side (SSR) oleh Laravel. API internal kemungkinan hanya digunakan oleh:
- Panel admin (Laravel Nova / backend)
- Aplikasi mobile (jika ada)
- Microsite/internal tools

---

## 6. Uji Brute-Force Endpoint Umum

| Path | Status | Interpretasi |
|------|--------|--------------|
| `/api/` | 401 | Base API Laravel, autentikasi wajib |
| `/api/v1/` | 405 | Hanya POST/PUT |
| `/api/v2/` | 405 | Hanya POST/PUT |
| `/wp-json/` | 401 | Path terblokir (bukan WordPress aktif) |
| `/wp-json/wp/v2/posts` | 404 | WordPress REST API tidak ada |
| `/wp-admin/` | 401 | Terblokir |
| `/xmlrpc.php` | 401 | Terblokir |
| `/graphql` | 401 | Terblokir |
| `/swagger` | 401 | Terblokir |
| `/openapi.json` | 401 | Terblokir |
| `/rest/` | 401 | Terblokir |
| `/json/` | 401 | Terblokir |
| `/feed/` | 401 | Terblokir |
| `/rss/` | 401 | Terblokir |
| `/sitemap.xml` | **200** | Sitemap tersedia (dibuat dengan xml-sitemaps.com) |
| `/robots.txt` | **200** | Tersedia |
| `/.well-known/` | 403 | Directory listing ditolak |

---

## 7. Rekomendasi & Catatan Keamanan

1. **Tidak ada WordPress:** Asumsi awal (WordPress) **TIDAK TERBUKTI**. Portal menggunakan **Laravel** yang secara umum lebih aman dari serangan plugin WordPress.
2. **API Internal Terlindungi:** Semua endpoint `/api/*` dilindungi oleh middleware autentikasi + CSRF. Tidak ada API publik yang terbuka tanpa login.
3. **Laravel Nova Terdeteksi:** Path `/nova` mengembalikan 401, mengindikasikan penggunaan Laravel Nova (admin panel premium). Ini adalah surface attack yang potensial jika ada celah di Nova.
4. **Error Message:** Beberapa endpoint mengembalikan `500 Server Error` saat diakses tanpa payload. Ini adalah informasi leakage yang menunjukkan route ada meskipun tidak bisa dieksploitasi langsung.
5. **Session Cookie:** Cookie `myapp_session` menggunakan format encrypted Laravel. Durasi session 2 jam (Max-Age=7200).
6. **Content Security Policy:** Terdapat header `Content-Security-Policy: default-src 'self' http: https: data: blob: 'unsafe-inline'` — cukup longgar karena mengizinkan semua HTTP/HTTPS origin.

---

## 8. Lampiran: Struktur File Hasil Pemeriksaan

```
api_inventory/
├── LAPORAN_API_ENDPOINT_BKPM.md    # Laporan ini
├── bkpm_api_discovery.py           # Script Playwright
├── brute_force_endpoints.sh        # Script curl brute-force
├── brute_force_results.txt         # Raw output curl
├── playwright_results.json         # Raw output Playwright
├── homepage.html                   # HTML homepage (cache)
├── data-investasi.html             # HTML halaman data investasi
├── berita.html                     # HTML halaman berita
├── bundle.js                       # JS bundle frontend
├── robots.txt                      # robots.txt
├── sitemap.xml                     # sitemap.xml
└── cookies.txt                     # Cookie jar dari curl
```

---

*Laporan ini dibuat secara otomatis dengan kombinasi Playwright, curl brute-force, dan analisis sumber daya statis.*
