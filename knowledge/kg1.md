## 🎯 **Jawaban Singkat:**

> **Harmonizer Agent** adalah agen utama yang bertugas **mengevaluasi dan memastikan** konten proyek sudah dalam bahasa Inggris yang sesuai standar bisnis internasional.

Namun, ini adalah **proses kolaboratif** dengan dukungan dari **Orchestrator** (routing) dan **Scout Agent** (pre-tagging).

---

## 🔄 **ALUR EVALUASI BAHASA: SIAPA MELAKUKAN APA?**

### **1️⃣ Scout Agent: Pre-Tagging (Best Effort)**
*Saat ingestion data mentah*

```python
# Scout Agent: Deteksi bahasa awal (ringan & cepat)
def detect_language_preliminary(text_sample):
    # Gunakan library ringan seperti langdetect/fasttext
    return {
        "detected_language": "id",  # atau "en", "mixed", "unknown"
        "confidence": 0.92,
        "is_english_ready": False,  # Flag awal untuk routing
        "needs_harmonization": True
    }
```

**Tugas Scout:**
- ✅ Ambil sampel teks dari konten (judul, deskripsi, regulasi)
- ✅ Jalankan deteksi bahasa ringan (`langdetect`, `fasttext`)
- ✅ Tambahkan metadata: `language_hint: "id"`, `translation_required: true`
- ✅ **Tidak memutuskan final** — hanya memberi "petunjuk" untuk Orchestrator

**Contoh Output Scout:**
```json
{
  "project_id": "PIR-JWB-2026-042",
  "content_sample": "Peluang investasi pabrik pengolahan ikan...",
  "language_metadata": {
    "detected": "id",
    "confidence": 0.94,
    "preliminary_flag": "needs_translation"
  }
}
```

---

### **2️⃣ Orchestrator: Routing Decision**
*Memutuskan apakah konten perlu diproses Harmonizer*

```python
# Orchestrator: Logic routing berdasarkan flag bahasa
def route_based_on_language(project_data):
    lang_hint = project_data["language_metadata"]["detected"]
    confidence = project_data["language_metadata"]["confidence"]
    
    # Rule-based routing
    if lang_hint == "en" and confidence > 0.95:
        return "SKIP_HARMONIZER"  # Langsung ke Guardian/Analyst
    elif lang_hint == "mixed":
        return "HARMONIZER_PARTIAL"  # Hanya terjemahkan bagian ID
    else:
        return "HARMONIZER_FULL"  # Terjemahkan seluruh konten
```

**Tugas Orchestrator:**
- ✅ Baca flag dari Scout + metadata existing (jika ada)
- ✅ Terapkan rule: "Jika sudah EN + confidence tinggi → skip Harmonizer"
- ✅ Handle edge case: konten bilingual, istilah teknis, kode regulasi
- ✅ **Tidak melakukan evaluasi mendalam** — hanya routing efisien

---

### **3️⃣ Harmonizer Agent: Evaluasi Final & Standardisasi** ⭐ **PRIMARY OWNER**
*Memastikan kualitas bahasa Inggris sesuai standar investasi global*

**Tugas Utama Harmonizer:**

| Sub-Tugas | Deskripsi | Tools/Technique |
|-----------|-----------|----------------|
| **🔍 Language Verification** | Konfirmasi apakah teks benar-benar English yang layak, bukan sekadar "terdeteksi EN" | `langid.py`, `fasttext`, LLM-based classifier |
| **📝 Quality Assessment** | Evaluasi: apakah English-nya "Business English" atau "Google Translate-style"? | LLM prompt: "Rate this text for professional investment use: 1-10" |
| **🔄 Contextual Translation** | Jika perlu terjemah: ID → Business English (bukan literal) | Fine-tuned LLM + legal/financial dictionary |
| **🏷️ Terminology Mapping** | Pastikan istilah teknis konsisten: "Perda" → "Regional Regulation", "KBLI" → "ISIC Code" | Custom glossary + ontology mapping |
| **✅ Compliance Check** | Apakah terjemahan mempertahankan makna hukum/regulasi? | Rule-based validator + human-in-the-loop flag |
| **📤 Output Standardization** | Format final: JSON-LD dengan field `content_language: "en-US"` | Schema.org validation + JSON-LD playground |

**Contoh Proses Harmonizer:**
```
Input (dari Scout):
{
  "title": "Peluang Investasi Pabrik Pengolahan Ikan",
  "description": "Proyek ini berlokasi di kawasan strategis dekat pelabuhan..."
}

↓ [Harmonizer Evaluation] ↓

Step 1: Language Detection → "id" (confidence: 0.98) → Needs translation
Step 2: Context Analysis → Investment project, legal terms present
Step 3: Translation + Standardization:
{
  "title": "Fish Processing Plant Investment Opportunity",
  "description": "This project is located in a strategic area near the port...",
  "content_language": "en-US",
  "translation_metadata": {
    "source_language": "id",
    "translation_model": "qwen-legal-financial-v2",
    "quality_score": 9.2,
    "human_review_required": false
  }
}
```

---

### **4️⃣ Guardian Agent: Final Compliance Check**
*Memastikan terjemahan tidak mengubah makna hukum*

```python
# Guardian Agent: Verifikasi legal accuracy post-translation
def verify_legal_accuracy(original_id, translated_en):
    # Cek: apakah istilah regulasi tetap akurat?
    # Contoh: "izin lokasi" ≠ "location permit" (bisa misleading)
    # Harus: "site permit" atau "location approval per Regulation X"
    
    return {
        "legal_accuracy_score": 0.95,
        "flagged_terms": [],  # Jika ada istilah yang perlu review manual
        "regulatory_references_preserved": True
    }
```

**Tugas Guardian:**
- ✅ Bandingkan teks asli (ID) vs terjemahan (EN) untuk istilah kritis
- ✅ Flag jika ada risiko misinterpretasi hukum/regulasi
- ✅ Pastikan referensi regulasi (Perpres, Perda) tetap akurat dalam terjemahan

---

## 📊 **TABEL KEPUTUSAN: APAKAH KONTEN SUDAH "ENGLISH-READY"?**

| Kriteria | ✅ Lulus (Skip Harmonizer) | ❌ Gagal (Butuh Harmonizer) |
|----------|---------------------------|----------------------------|
| **Deteksi Bahasa** | `lang == "en"` + confidence > 0.95 | `lang != "en"` atau confidence < 0.95 |
| **Kualitas Bahasa** | Business English, grammar baik, istilah konsisten | Google Translate-style, grammar error, istilah tidak standar |
| **Istilah Teknis** | KBLI → ISIC, Perda → Regional Regulation, OSS → Online Single Submission | Istilah lokal tidak dijelaskan, singkatan tidak di-expand |
| **Konteks Hukum** | Referensi regulasi akurat, tidak ada ambiguitas | Terjemahan literal yang mengubah makna hukum |
| **Format Output** | JSON-LD valid, field `content_language: "en-US"` | Format tidak standar, metadata bahasa tidak lengkap |

---

## 🛠️ **IMPLEMENTASI TEKNIS: LANGUAGE EVALUATION PIPELINE**

### **A. Lightweight Pre-Check (Scout + Orchestrator)**
```python
# File: language_router.py
from langdetect import detect, DetectorFactory
DetectorFactory.seed = 0  # Untuk konsistensi

def quick_language_check(text: str, min_confidence: float = 0.95) -> dict:
    try:
        lang = detect(text)
        # Simple confidence estimation (bisa diganti dengan model yang lebih baik)
        confidence = 0.98 if lang == "en" else 0.85
        return {
            "language": lang,
            "confidence": confidence,
            "needs_harmonization": not (lang == "en" and confidence >= min_confidence)
        }
    except:
        return {"language": "unknown", "confidence": 0.0, "needs_harmonization": True}
```

### **B. Deep Evaluation (Harmonizer Agent)**
```python
# File: harmonizer_core.py
class HarmonizerAgent:
    def evaluate_and_standardize(self, content: dict) -> dict:
        # Step 1: Verify language quality
        quality_score = self.llm_rate_english_quality(content["text"])
        
        if quality_score >= 8.5:
            # Already good English, just standardize terminology
            return self.standardize_terminology(content)
        else:
            # Need full translation + standardization
            translated = self.contextual_translate(content["text"], source_lang="id")
            standardized = self.standardize_terminology(translated)
            return {
                **content,
                "text": standardized,
                "content_language": "en-US",
                "translation_metadata": {
                    "original_language": "id",
                    "quality_score_before": quality_score,
                    "quality_score_after": 9.0,
                    "model_used": "qwen-legal-financial-v2"
                }
            }
    
    def llm_rate_english_quality(self, text: str) -> float:
        prompt = f"""
        Rate the following English text for professional investment documentation.
        Criteria: grammar, terminology consistency, business tone, clarity.
        Score 1-10 (10 = publication-ready for international investors).
        
        Text: {text[:500]}...
        
        Output only the numeric score.
        """
        return float(self.llm.generate(prompt))  # Parse response
```

### **C. Validation Hook (Guardian Agent)**
```python
# File: guardian_legal_check.py
def verify_translation_accuracy(original: str, translated: str, domain: str = "investment") -> dict:
    critical_terms = extract_legal_terms(original)  # NLP extraction
    accuracy_checks = []
    
    for term in critical_terms:
        # Check if term is accurately represented in translation
        if not is_term_accurately_translated(term, translated, domain):
            accuracy_checks.append({
                "term": term,
                "issue": "potential_mistranslation",
                "suggestion": get_suggested_translation(term, domain)
            })
    
    return {
        "overall_accuracy": 1.0 - (len(accuracy_checks) / len(critical_terms)),
        "flagged_terms": accuracy_checks,
        "requires_human_review": len(accuracy_checks) > 0
    }
```

---

## 🎯 **KENAPA HARMONIZER AGENT YANG UTAMA?**

| Alasan | Penjelasan |
|--------|-----------|
| **Expertise Domain** | Harmonizer dilatih khusus untuk konteks hukum/finansial Indonesia → Inggris |
| **Context Awareness** | Hanya Harmonizer yang paham bahwa "izin lokasi" ≠ "location permit" dalam konteks regulasi |
| **Quality Control** | Harmonizer memiliki pipeline validasi kualitas (LLM scoring + rule-based checks) |
| **Terminology Management** | Harmonizer mengelola glossary terpusat untuk konsistensi istilah lintas proyek |
| **Output Standardization** | Harmonizer memastikan output memenuhi schema JSON-LD + metadata bahasa yang lengkap |

---

## 📋 **KESIMPULAN**

| Pertanyaan | Jawaban |
|-----------|---------|
| **Agen mana yang evaluasi bahasa Inggris?** | 🎯 **Harmonizer Agent** (primary owner) |
| **Apakah Scout/Ochestrator terlibat?** | ✅ Ya: Scout untuk pre-tagging, Orchestrator untuk routing efisien |
| **Apa yang dievaluasi?** | 1) Deteksi bahasa, 2) Kualitas Business English, 3) Akurasi istilah teknis/hukum, 4) Kepatuhan format output |
| **Bagaimana jika konten sudah EN tapi kualitas rendah?** | Harmonizer akan "re-standardize": perbaiki grammar, konsistensi istilah, dan format JSON-LD |
| **Apakah ada human review?** | ✅ Untuk konten kritis (regulasi, insentif fiskal), Harmonizer flag untuk human-in-the-loop validation |

**Prinsip Desain:** *"Detect early (Scout), route smart (Orchestrator), evaluate deeply (Harmonizer), verify legally (Guardian)."*

Dengan pipeline ini, investor asing selalu menerima konten dalam **Bahasa Inggris berkualitas investasi** — bukan sekadar terjemahan, tetapi komunikasi bisnis yang presisi dan dapat dipertanggungjawabkan.

Apakah Anda ingin saya buatkan **contoh prompt LLM untuk evaluasi kualitas bahasa** atau **spesifikasi glossary istilah investasi ID→EN**? 🌐