# Katalog Data GIS untuk Weighted Overlay — Investment Suitability (Indonesia)

> Dokumen ini merangkum ketersediaan data spasial, sosial-ekonomi, regulasi, dan PIR-spesifik yang dibutuhkan untuk pengembangan model **Weighted Overlay GIS** guna analisis kesesuaian investasi di Indonesia.

---

## 📊 Ringkasan Eksekutif

| Kategori | Layer yang Diminta | Tersedia di Proyek | Tersedia Open Data | Aksi Diperlukan |
|----------|-------------------|-------------------|-------------------|-----------------|
| **Spatial** | Road network distance | ⚠️ Partial (20 toll roads, no full network) | ✅ OSM / BIG RBI | Download & proses |
| | Port distance | ✅ 30 ports | ✅ BIG RBI / Pelindo | Enrich jika perlu |
| | Airport distance | ✅ 22 airports | ✅ BIG RBI / Kemenhub | Enrich jika perlu |
| | Industrial zone proximity | ✅ Kemenperin KI + KEK | ✅ BIG MapServer / Kemenperin SHP | Sudah ada pipeline |
| | Land use / land cover | ❌ | ✅ ESA WorldCover / ESRI 10m / Copernicus | Download global raster |
| | Slope / elevation | ❌ | ✅ SRTM 30m / NASADEM / Copernicus DEM 30m | Download & derive slope |
| | Flood risk | ❌ | ✅ BNPB / JRC Global Flood / GLOFAS | Download & klasifikasi |
| | Utility infrastructure | ⚠️ Partial (listrik/air di RBI) | ✅ OSM / BIG RBI | Extract dari OSM/RBI |
| **Socio-economic** | Population density | ❌ | ✅ BPS / WorldPop 100m | Download & rasterize |
| | Workforce availability | ❌ | ✅ BPS Sakernas / data.go.id | Aggregasi ke kab/kota |
| | UMR by region | ❌ | ✅ Kemnaker / BPS | Scrape / download tabel |
| | Education level | ❌ | ✅ BPS Susenas / data.go.id | Aggregasi spasial |
| | Existing economic activity | ⚠️ Partial (BKPM projects) | ✅ BPS PDRB / data.go.id | Cross-reference |
| **Regulatory** | Zoning (RTRW) | ❌ | ⚠️ ATR/BPN GISTARU (login) / BIG RBI partial | Akses formal / FOIA |
| | Protected areas | ❌ | ✅ KLHK / ProtectedPlanet / Global Forest Watch | Download & merge |
| | Forest status | ❌ | ✅ KLHK / GFW / MoEF land cover | Download nasional |
| | Mining concessions | ❌ | ⚠️ ESDM / ATR/BPN (terbatas) | Request / scrape |
| **PIR-specific** | Existing investment realization | ✅ bkpm_projects.json | ✅ BKPM API / regionalinvestment.bkpm.go.id | Sudah di-scrape |
| | Project density | ✅ Dapat di-derive | ✅ Dari data BKPM | Hitung kernel density |
| | Sector specialization | ✅ Dapat di-derive | ✅ Dari data BKPM + KBLI | Analisis LQ / entropy |
| | Commodity availability | ❌ | ✅ BPS / Kementan / Perusahaan BUMN | Download / scrape |

---

## 1. Spatial Layers

### 1.1 Road Network Distance
**Status:** ⚠️ Partial — hanya 20 toll roads di `infrastructureData.ts`

| Sumber | URL / Akses | Format | Skala | Keterangan |
|--------|-------------|--------|-------|------------|
| **OpenStreetMap (OSM)** | `https://download.geofabrik.de/asia/indonesia.html` | OSM PBF / SHP | Vektor | Jalan nasional lengkap; perlu filter `highway=*` |
| **BIG RBI — Jaringan Jalan** | `https://tanahair.indonesia.go.id/portal-web/unduh` | Shapefile | 1:25K / 1:50K | Jalan, jembatan, terminal — perlu registrasi |
| **Google Earth Engine** | `ee.FeatureCollection("OSM/2022")` | Vektor | Global | Alternatif cloud-based |

**Rekomendasi Pipeline:**
1. Download OSM PBF dari Geofabrik
2. Extract jaringan jalan dengan `osmium` / `ogr2ogr`
3. Build network graph dengan `osmnx` atau `pgrouting`
4. Hitung **Euclidean Distance** atau **Network Distance** ke nearest road
5. Rasterize ke resolusi target (misal 100m)

```bash
# Contoh ekstraksi jalan utama dari OSM
osmium tags-filter indonesia-latest.osm.pbf \
  w/highway=motorway,trunk,primary,secondary \
  -o indonesia_main_roads.osm.pbf
```

---

### 1.2 Port Distance
**Status:** ✅ 30 ports tersedia di `infrastructureData.ts`

| Sumber | URL / Akses | Format | Catatan |
|--------|-------------|--------|---------|
| **Existing Project Data** | `app/src/data/infrastructureData.ts` | GeoJSON (point) | 30 pelabuhan utama |
| **BIG RBI — Pelabuhan** | Ina-Geoportal | Shapefile (pt + ar) | Lebih lengkap dari data existing |
| **Pelindo** | `https://www.pelindo.co.id` | HTML | Tidak ada API terbuka |

**Rekomendasi:** Gunakan data existing + enrich dari BIG RBI. Untuk raster distance:
```python
# GDAL Proximity — menghasilkan raster jarak ke port terdekat
gdal_proximity.py ports.tif dist_to_ports.tif \
  -distunits GEO -maxdist 200000
```

---

### 1.3 Airport Distance
**Status:** ✅ 22 airports tersedia di `infrastructureData.ts`

| Sumber | URL / Akses | Format | Catatan |
|--------|-------------|--------|---------|
| **Existing Project Data** | `infrastructureData.ts` | GeoJSON (point) | 22 bandara utama |
| **BIG RBI — Airport** | Ina-Geoportal | Shapefile | Bandara besar + kecil |
| **OurAirports** | `https://ourairports.com/data/` | CSV + SHP | Global, gratis, up-to-date |

---

### 1.4 Industrial Zone Proximity
**Status:** ✅ Sudah ada pipeline aktif

| Sumber | URL / Akses | Format | Reliabilitas |
|--------|-------------|--------|------------|
| **BIG MapServer — KI** | `https://kspservices.big.go.id/satupeta/rest/services/PUBLIK/KAWASAN_KHUSUS_DAN_TRANSMIGRASI/MapServer/4` | GeoJSON / JSON | ⭐⭐⭐⭐⭐ High |
| **Kemenperin SHP** | `https://satudata.kemenperin.go.id` | Shapefile (ZIP) | ⭐⭐⭐⭐⭐ Most authoritative |
| **KEK Metadata** | `https://kek.go.id` | HTML | Metadata & status |
| **Existing Project Data** | `kemenperinKawasanIndustri.geojson` | GeoJSON | Cache lokal |

**Pipeline yang sudah ada:**
```bash
cd data-pipeline/scripts
python3 pipeline.py --source big_kawasan_industri --output ../output/
```

---

### 1.5 Land Use / Land Cover (LULC)
**Status:** ❌ Belum tersedia di proyek

| Sumber | URL / Akses | Resolusi | Tahun | Lisensi |
|--------|-------------|----------|-------|---------|
| **ESA WorldCover** | `https://esa-worldcover.org/en` | **10m** | 2020–2021 | CC BY 4.0 |
| **ESRI 10m Land Cover** | ArcGIS Living Atlas / GEE | **10m** | 2017–2024 | CC BY 4.0 |
| **Copernicus Global Land Service** | `https://land.copernicus.eu/global` | 100m | 2015–2019 | Free |
| **BIG RBI — Tutupan Lahan** | Ina-Geoportal | 1:25K / 1:50K | Vektor | Gratis (registrasi) |

**Rekomendasi:**
- **Untuk model nasional skala besar:** ESA WorldCover 10m (cakupan global, akurasi Asia ~81%)
- **Untuk detail lokal:** ESRI 10m Annual Land Cover (time series 2017–2024)
- **Untuk validasi:** Cross-check dengan BIG RBI vektor

```python
# Download ESA WorldCover untuk bbox Indonesia
# Via GEE (Google Earth Engine) — paling praktis
import ee
worldcover = ee.ImageCollection("ESA/WorldCover/v200").first()
# Clip ke Indonesia, export sebagai GeoTIFF
```

---

### 1.6 Slope / Elevation
**Status:** ❌ Belum tersedia di proyek

| Sumber | URL / Akses | Resolusi | Akurasi Vertikal |
|--------|-------------|----------|------------------|
| **SRTM 1 Arc-Second (30m)** | `https://earthexplorer.usgs.gov/` | 30m | ~16m |
| **NASADEM** | NASA Earthdata / `earthaccess` | 30m | ~2–3m RMSE |
| **Copernicus DEM 30m** | `https://dataspace.copernicus.eu/` | 30m | ~4m |
| **ALOS PALSAR 12.5m** | Alaska Satellite Facility | 12.5m | ~5m |

**Rekomendasi:**
- **NASADEM** (30m, reprocessed SRTM, kualitas lebih baik) atau **Copernicus DEM 30m**
- Setelah download DEM, derive slope dengan GDAL:

```bash
# Hitung slope dari DEM
gdaldem slope indonesia_dem.tif indonesia_slope.tif -p
# Reclassify slope untuk suitability
gdal_calc.py -A indonesia_slope.tif --outfile=slope_suit.tif \
  --calc="(A<=2)*5 + (A>2)*(A<=8)*4 + (A>8)*(A<=15)*3 + (A>15)*(A<=30)*2 + (A>30)*1"
```

---

### 1.7 Flood Risk
**Status:** ❌ Belum tersedia di proyek

| Sumber | URL / Akses | Format | Cakupan |
|--------|-------------|--------|---------|
| **JRC Global Flood Awareness** | `https://data.jrc.ec.europa.eu/` | Raster / Shapefile | Global, return period |
| **GLOFAS** | Copernicus EMS | Raster | Global flood forecasting |
| **BNPB — Peta Risiko Bencana** | `https://petabencana.id` / `https://dibi.bnpb.go.id` | Web / CSV | Indonesia, crowdsourced + official |
| **Fathom-Global** | `https://www.fathom.global/` | Raster | Komersial, ada versi akademik |
| **WorldPop Flood Risk** | `https://www.worldpop.org/` | Raster | Indonesia coverage |

**Rekomendasi:**
- Layer 1: **JRC Flood Hazard Map** (return period 100-tahun, raster global)
- Layer 2: **BNPB historical flood points** (dari `dibi.bnpb.go.id` — dapat di-scrape)
- Kombinasikan keduanya untuk composite flood risk score

---

### 1.8 Utility Infrastructure (Electricity, Water, Internet)
**Status:** ⚠️ Partial — beberapa titik di BIG RBI

| Sumber | URL / Akses | Format | Catatan |
|--------|-------------|--------|---------|
| **BIG RBI — Gardu Listrik, PLN, Menara** | Ina-Geoportal | Shapefile | Titik utilitas |
| **OpenStreetMap** | Geofabrik / Overpass API | OSM PBF | `power=*, man_made=tower, pipeline=*` |
| **PLN — Statistik** | `https://www.pln.co.id` | PDF / HTML | Tidak ada shapefile publik |
| **Kominfo — BTS/Internet** | `https://postel.go.id` | HTML | Terbatas |

**Rekomendasi:**
- Extract dari OSM untuk coverage nasional:
```bash
osmium tags-filter indonesia-latest.osm.pbf \
  nwr/power=plant,substation,transformer,tower \
  nwr/man_made=tower \
  nwr/pipeline=* \
  -o utilities.osm.pbf
```
- Hitung proximity raster ke jaringan listrik & tower telekomunikasi

---

## 2. Socio-Economic Layers

### 2.1 Population Density
**Status:** ❌ Belum tersedia

| Sumber | URL / Akses | Resolusi | Tahun |
|--------|-------------|----------|-------|
| **WorldPop (Unconstrained)** | `https://www.worldpop.org/` | **100m** | 2020 |
| **WorldPop (Constrained)** | `https://www.worldpop.org/` | **100m** | 2020 |
| **BPS — Kependudukan** | `https://www.bps.go.id` | Kabupaten/Kecamatan | 2020–2024 |
| **Facebook / Meta High Resolution** | `https://dataforgood.facebook.com/dfg/tools/population-density-maps` | 30m | 2020 |

**Rekomendasi:**
- **WorldPop 100m** untuk model nasional (gratis, raster siap pakai)
- **BPS data** untuk validasi aggregasi regional

```bash
# Download WorldPop Indonesia (TIF format)
wget https://data.worldpop.org/GIS/Population_Density/Global_2000_2020_Constrained/2020/maxar_v1/IDN/IDN_pd_2020_1km.tif
```

---

### 2.2 Workforce Availability
**Status:** ❌ Belum tersedia

| Sumber | URL / Akses | Format | Catatan |
|--------|-------------|--------|---------|
| **BPS — Sakernas** | `https://www.bps.go.id` | Tabel (CSV/XLSX) | Angkatan kerja per provinsi/kabupaten |
| **BPS — Indikator Ketenagakerjaan** | `https://www.bps.go.id` | Tabel | TPT, TPK, upah |
| **data.go.id** | `https://data.go.id` | API / CSV | Aggregasi SATU Data |

**Rekomendasi:**
- Download tabel Sakernas terbaru (2023/2024)
- Join dengan batas administrasi BIG untuk spasialisasi
- Rasterize atau gunakan sebagai vector overlay (polygon kabupaten)

---

### 2.3 UMR (Upah Minimum Regional) by Region
**Status:** ❌ Belum tersedia

| Sumber | URL / Akses | Format | Tahun |
|--------|-------------|--------|-------|
| **Kemnaker — UMP/UMK** | `https://kemnaker.go.id` | HTML / PDF / Tabel | 2024 / 2025 |
| **Wikipedia / Media** | `https://id.wikipedia.org/wiki/Upah_minimum` | Tabel | Updated tahunan |
| **BPS — Upah** | `https://www.bps.go.id` | Tabel | Survey data |

**Rekomendasi:**
- Scrape tabel UMP 2025 dari Kemnaker atau Wikipedia
- Join ke polygon provinsi/kabupaten BIG
- UMR adalah faktor cost — semakin rendah UMR, semakin tinggi suitability untuk labor-intensive industries

---

### 2.4 Education Level
**Status:** ❌ Belum tersedia

| Sumber | URL / Akses | Format | Catatan |
|--------|-------------|--------|---------|
| **BPS — Susenas / Sektoral Pendidikan** | `https://www.bps.go.id` | Tabel | RLS, literacy rate, sekolah per daerah |
| **data.go.id — Pendidikan** | `https://data.go.id` | CSV / JSON | Aggregasi nasional |
| **PODES (Potensi Desa)** | BPS | Tabel | Data desa-level (sangat detail) |

**Rekomendasi:**
- **PODES 2023/2024** memberikan data tingkat pendidikan per **desa** — sangat powerful untuk analisis lokal
- Join PODES dengan batas desa BIG untuk pemetaan

---

### 2.5 Existing Economic Activity
**Status:** ⚠️ Partial — data BKPM projects sudah ada

| Sumber | URL / Akses | Format | Catatan |
|--------|-------------|--------|---------|
| **BKPM Scraped Data** | `data/bkpm_projects.json` | JSON | ~1,500 proyek PIR |
| **BPS — PDRB (GDP Regional)** | `https://www.bps.go.id` | Tabel | PDRB per provinsi/kabupaten per sektor |
| **BPS — KBLI / industri** | `https://www.bps.go.id` | Tabel | Jumlah perusahaan per sektor |

**Rekomendasi:**
- Gunakan **PDRB per kabupaten** sebagai proxy economic activity
- Cross-correlate dengan BKPM project density untuk validasi

---

## 3. Regulatory Layers

### 3.1 Zoning (RTRW — Rencana Tata Ruang Wilayah)
**Status:** ❌ Belum tersedia — sulit diakses

| Sumber | URL / Akses | Format | Aksesibilitas |
|--------|-------------|--------|---------------|
| **ATR/BPN — GISTARU** | `https://gistaru.atrbpn.go.id` | ArcGIS REST | ⛔ Login diperlukan |
| **BIG RBI — Batas Administrasi** | Ina-Geoportal | Shapefile | ✅ Gratis (registrasi) |
| **One Map Policy Geoportal** | `https://onemap.big.go.id` | Web Map | ⚠️ Terbatas |
| **Geoportal KSP** | `https://portalksp.ina-sdi.or.id` | Shapefile | ⛔ Restricted (pemerintah only) |

**Rekomendasi:**
1. Ajukan permohonan data RTRW ke **ATR/BPN** melalui mekanisme **PPID** (Pejabat Pengelola Informasi dan Dokumentasi)
2. Alternatif: gunakan **land cover** sebagai proxy zoning (built-up = developed, forest = protected, etc.)
3. Untuk KEK / KI: gunakan data yang sudah ada (sudah termasuk zona industri)

---

### 3.2 Protected Areas
**Status:** ❌ Belum tersedia

| Sumber | URL / Akses | Format | Cakupan |
|--------|-------------|--------|---------|
| **ProtectedPlanet (WDPA)** | `https://www.protectedplanet.net/` | Shapefile / GeoJSON | Global, termasuk Taman Nasional Indonesia |
| **KLHK — Kawasan Konservasi** | `https://www.menlhk.go.id` | PDF / SHP (terbatas) | Nasional |
| **Global Forest Watch** | `https://www.globalforestwatch.org/` | Vector / Raster | Global, dapat di-download per negara |
| **World Database on Protected Areas** | UNEP-WCMC | Shapefile | Standar internasional |

**Rekomendasi:**
- Download **WDPA** (World Database on Protected Areas) untuk Indonesia
- Filter untuk: Taman Nasional, Cagar Alam, Suaka Margasatwa, Taman Wisata Alam, Taman Hutan Raya

```bash
# Download WDPA untuk Indonesia (via ProtectedPlanet API)
curl "https://api.protectedplanet.net/v3/protected_areas/search?country=IDN&token=YOUR_TOKEN"
```

---

### 3.3 Forest Status
**Status:** ❌ Belum tersedia

| Sumber | URL / Akses | Format | Tahun |
|--------|-------------|--------|-------|
| **Global Forest Watch — Tree Cover** | `https://www.globalforestwatch.org/` | Raster 30m | 2000–2023 |
| **Hansen Global Forest Change** | GEE / `https://earthenginepartners.appspot.com/science-2013-global-forest` | Raster 30m | 2000–2023 |
| **KLHK — Peta Hutan Indonesia** | `https://www.menlhk.go.id` | Shapefile / Raster | Terbatas |
| **MoEF Land Cover** | `https://www.menlhk.go.id` | Raster | Multi-tahun |

**Rekomendasi:**
- **Hansen Global Forest Change** (UMD / Google) — gratis, raster 30m, time series panjang
- Gunakan layer **tree cover 2000** + **loss year** untuk menentukan status hutan saat ini

---

### 3.4 Mining Concessions
**Status:** ❌ Belum tersedia

| Sumber | URL / Akses | Format | Aksesibilitas |
|--------|-------------|--------|---------------|
| **ESDM — Minerba** | `https://www.esdm.go.id` | PDF / Terbatas | ⛔ Tidak ada download massal |
| **ATR/BPN — Pertambangan** | GISTARU / e-Mineral | Shapefile (terbatas) | ⛔ Login |
| **Global Mining Claims** | `https://www.resolv.org/site-vision/` / various | Vektor | Partial coverage |

**Rekomendasi:**
- Ajukan permohonan ke **Direktorat Jenderal Mineral dan Batubara (Ditjen Minerba)** via PPID
- Alternatif: gunakan **BIG MapServer layer 3** (Kawasan Pertambangan) sebagai proxy kasar

---

## 4. PIR-Specific Layers

### 4.1 Existing Investment Realization
**Status:** ✅ Sudah tersedia

| Sumber | File | Format | Catatan |
|--------|------|--------|---------|
| **BKPM Scraper Output** | `data/bkpm_projects.json` | JSON | ~1,500 proyek |
| **BKPM API** | `https://api.regionalinvestment.bkpm.go.id` | JSON (internal) | Dari hasil inventory API |

**Rekomendasi Derive:**
```python
# Hitung total investment realization per provinsi/kabupaten
# dari bkpm_projects.json untuk weighted overlay attribute
```

---

### 4.2 Project Density
**Status:** ✅ Dapat di-derive dari data existing

**Cara Hitung:**
1. Ambil koordinat lat/lng dari setiap project di `bkpm_projects.json`
2. Buat **point density raster** (Kernel Density Estimation) atau **hexbin aggregation**
3. Resolusi: sesuaikan dengan layer lain (misal 1km x 1km)

```python
# Contoh dengan GeoPandas + rasterio
import geopandas as gpd
from scipy.ndimage import gaussian_filter
# ... load projects, create raster grid, count per cell, apply gaussian KDE
```

---

### 4.3 Sector Specialization
**Status:** ✅ Dapat di-derive dari data existing

**Metrik yang bisa dihitung:**
- **Location Quotient (LQ):** per kabupaten per sektor KBLI
- **Sectoral Entropy / HHI:** untuk mengukur diversifikasi vs. spesialisasi
- **Dominant Sector:** sektor dengan investment value tertinggi per region

---

### 4.4 Commodity Availability
**Status:** ❌ Belum tersedia

| Sumber | URL / Akses | Format | Catatan |
|--------|-------------|--------|---------|
| **BPS — Statistik Pertanian** | `https://www.bps.go.id` | Tabel | Produksi komoditas per provinsi |
| **Kementan — P2HP** | `https://pertanian.go.id` | PDF / Tabel | Harga & produksi komoditas |
| **Perusahaan BUMN (Pertamina, PLN, Antam)** | Masing-masing | Annual Report | Untuk energy & mineral |
| **FAO / UN Comtrade** | `https://www.fao.org/faostat/` | CSV | Trade & production data |

**Rekomendasi:**
- Download **FAOSTAT** untuk produksi komoditas pertanian Indonesia
- Join dengan data regional BPS untuk spasialisasi

---

## 🛠️ Pipeline Teknis yang Disarankan

### Stack Rekomendasi

```
Input Sources
    ├── OSM (roads, utilities) → osmium / osmnx
    ├── BIG (admin boundaries, KI, KEK) → ArcGIS REST / pyshp
    ├── Global Rasters (ESA WorldCover, SRTM, WorldPop) → GDAL / rioxarray
    ├── BPS Tables (socio-economic) → pandas / geopandas
    └── BKPM JSON (PIR data) → pandas / geopandas
                ↓
    Processing Layer
    ├── QGIS / Python (rasterio, xarray, geopandas)
    ├── Google Earth Engine (untuk raster besar)
    └── PostgreSQL + PostGIS (untuk vector storage)
                ↓
    Weighted Overlay Model
    ├── Raster Algebra (gdal_calc.py / numpy)
    ├── AHP / ML Weighting
    └── Suitability Score Output (GeoTIFF / GeoJSON)
```

### Contoh Skrip Starter

Buat file `scripts/prepare_gis_layers.py`:

```python
"""
Pipeline dasar untuk menyiapkan layer GIS weighted overlay
untuk Investment Suitability Analysis — Indonesia
"""

import geopandas as gpd
import rasterio
from rasterio.features import rasterize
import numpy as np

# 1. Load batas administrasi Indonesia (BIG)
admin = gpd.read_file("data/admin/indonesia_provinsi.shp")

# 2. Load DEM & hitung slope
with rasterio.open("data/dem/nasadem_idn.tif") as src:
    dem = src.read(1)
    transform = src.transform
    crs = src.crs

# 3. Rasterize vector layers (ports, airports, KI)
def rasterize_points(gdf, value_field, shape, transform):
    shapes = ((geom, value) for geom, value in zip(gdf.geometry, gdf[value_field]))
    return rasterize(shapes, out_shape=shape, transform=transform, fill=0)

# 4. Hitung proximity raster (contoh: ke pelabuhan)
#    Gunakan scipy.ndimage.distance_transform_edt atau GDAL Proximity

# 5. Normalisasi & Weighted Overlay
#    suitability = w1*road_dist + w2*port_dist + w3*slope + ...
```

---

## ⚖️ Catatan Legal & Lisensi

| Sumber | Lisensi | Keterangan |
|--------|---------|------------|
| BIG RBI / Satu Peta | Gratis (registrasi) | Perpres No. 9/2016 |
| OSM | ODbL | Attribution required |
| ESA WorldCover | CC BY 4.0 | Attribution required |
| ESRI Land Cover | CC BY 4.0 | Attribution required |
| SRTM / NASADEM | US Public Domain | Free |
| WorldPop | CC BY 4.0 | Attribution required |
| BPS Data | Open Data | Gratis untuk non-komersial |
| WDPA | Restricted / CC BY-NC | Cek terms per download |
| BKPM Scraped Data | Fair Use / Open Gov | Sesuai attributi di README |

---

## ✅ Action Plan — Prioritas

### Phase 1: Foundation (Minggu 1–2)
- [ ] Download **NASADEM** atau **Copernicus DEM 30m** untuk Indonesia → derive slope
- [ ] Download **ESA WorldCover 10m** → reclassify untuk built-up, forest, agriculture
- [ ] Download **WorldPop 100m** → population density raster
- [ ] Download **OSM Indonesia** → extract roads, utilities
- [ ] Run existing pipeline: `python3 data-pipeline/scripts/pipeline.py --all`

### Phase 2: Enrichment (Minggu 2–3)
- [ ] Scrape / download **BPS Sakernas & UMR 2025** → join ke admin boundaries
- [ ] Download **WDPA** protected areas untuk Indonesia
- [ ] Download **Hansen Forest Change** → forest status layer
- [ ] Extract **BKPM project density** & **sector specialization** dari data existing

### Phase 3: Integration (Minggu 3–4)
- [ ] Rasterize / resample SEMUA layer ke resolusi uniform (misal 100m atau 1km)
- [ ] Hitung proximity raster untuk point layers (ports, airports, KI, roads)
- [ ] Normalisasi skor (0–100 atau 0–1)
- [ ] Jalankan **Weighted Overlay** dengan bobot AHP atau ML-derived
- [ ] Validasi output dengan ground truth (BKPM realized projects)

---

## 📚 Referensi Tambahan

| Resource | URL |
|----------|-----|
| Ina-Geoportal (BIG) | `https://tanahair.indonesia.go.id/portal-web/unduh` |
| Data.go.id (SATU Data) | `https://data.go.id` |
| BPS Statistics | `https://www.bps.go.id` |
| Google Earth Engine Catalog | `https://developers.google.com/earth-engine/datasets` |
| Copernicus Data Space | `https://dataspace.copernicus.eu/` |
| NASA Earthdata | `https://search.earthdata.nasa.gov/` |
| OpenTopography | `https://opentopography.org/` |
| ProtectedPlanet | `https://www.protectedplanet.net/` |
| Global Forest Watch | `https://www.globalforestwatch.org/` |

---

*Dokumen ini disusun berdasarkan eksplorasi proyek existing dan riset sumber data terbuka untuk Indonesia. Untuk data yang memerlukan akses login pemerintah (ATR/BPN, Geoportal KSP, ESDM), disarankan mengajukan permohonan resmi via PPID atau kerjasama institusi.*
