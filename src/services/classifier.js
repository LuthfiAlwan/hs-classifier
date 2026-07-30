import kumhsRules from '../data/kumhs_rules.json'

/**
 * Build structured prompt dari form input
 */
export function buildPrompt(form) {
  const facts = [
    form.nama_dagang && `Nama dagang/model: ${form.nama_dagang}`,
    form.nama_generik && `Nama generik: ${form.nama_generik}`,
    form.material_utama?.length && `Material utama: ${form.material_utama.join(', ')}`,
    form.kondisi_impor && `Kondisi saat impor: ${form.kondisi_impor}`,
    form.fungsi_utama && `Fungsi utama: ${form.fungsi_utama}`,
    form.cara_kerja?.length && `Cara kerja: ${form.cara_kerja.join(', ')}`,
    form.mobilitas && `Mobilitas: ${form.mobilitas}`,
    form.area_operasi && `Area operasi: ${form.area_operasi}`,
    form.sektor && `Sektor pengguna: ${form.sektor}`,
    form.apakah_part === 'Ya' && `Catatan: Merupakan bagian/part dari barang lain`,
    form.apakah_set === 'Ya' && `Catatan: Disajikan sebagai set/kit`,
    form.ada_komponen_tambahan === 'Ya - sebutkan di keterangan tambahan' && `Catatan: Ada komponen/fungsi tambahan terintegrasi`,
    form.spesifikasi && `Spesifikasi teknis: ${form.spesifikasi}`,
    form.keterangan_tambahan && `Keterangan tambahan: ${form.keterangan_tambahan}`,
  ].filter(Boolean).join('\n')

  const kumhsSummary = kumhsRules.kumhs
    .map((r) => `${r.rule} (trigger: ${r.trigger}): ${r.isi}`)
    .join('\n')

  return `Kamu adalah ahli klasifikasi HS Code berdasarkan BTKI Indonesia (PMK 26/2022).
Tugasmu: tentukan kode HS yang paling tepat untuk barang berikut menggunakan KUM HS secara berurutan.

FAKTA BARANG:
${facts}

ATURAN KUM HS (gunakan secara berurutan, hanya jika trigger-nya terpenuhi):
${kumhsSummary}

INSTRUKSI:
1. Mulai SELALU dari KUM HS 1. Baca uraian pos dan fakta barang.
2. Lanjut ke KUM HS berikutnya HANYA jika triggered.
3. Setelah pos 4-digit ditentukan, gunakan KUM HS 6 untuk subpos.
4. Jangan memaksakan kode jika fakta tidak cukup — minta klarifikasi.
5. Legal rules mengalahkan kemiripan nama.

Berikan jawaban HANYA dalam format JSON berikut (tanpa markdown, tanpa teks lain di luar JSON):
{
  "hs_code": "XXXX.XX.XX",
  "uraian": "uraian lengkap pos/subpos",
  "confidence": "TINGGI" | "SEDANG" | "RENDAH",
  "risk": "penjelasan risiko jika ada, atau null",
  "reasoning_steps": [
    { "rule": "KUM HS 1", "penjelasan": "..." },
    { "rule": "KUM HS 6", "penjelasan": "..." }
  ],
  "kandidat_eliminasi": [
    { "kode": "XXXX.XX", "alasan": "..." }
  ],
  "fakta_perlu_konfirmasi": ["..."],
  "perlu_expert_review": false,
  "alasan_expert_review": null
}`
}

/**
 * Call AI API — Groq (openai/gpt-oss-120b)
 * Untuk aktifkan: set VITE_GROQ_API_KEY di .env
 */
export async function classifyHS(form) {
  const prompt = buildPrompt(form)

  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (apiKey) {
    return callGroq(prompt, apiKey)
  }

  // Fallback: mock response untuk development tanpa API key
  return mockResponse(form)
}

async function callGroq(prompt, apiKey) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      temperature: 0.1,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Groq API error ${res.status}`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ''

  const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    return { error: 'Gagal parse respons AI. Raw: ' + text.slice(0, 300) }
  }
}

// Mock response untuk development tanpa API key
function mockResponse(form) {
  return new Promise((resolve) =>
    setTimeout(() => {
      const isLaptop = form.nama_generik?.toLowerCase().includes('laptop')
      const isDumper = form.nama_generik?.toLowerCase().includes('dumper')
      const isCrane = form.nama_generik?.toLowerCase().includes('crane')

      if (isLaptop) {
        resolve({
          hs_code: '8471.30.20',
          uraian: 'Laptop termasuk notebook dan subnotebook',
          confidence: 'TINGGI',
          risk: null,
          reasoning_steps: [
            { rule: 'KUM HS 1', penjelasan: 'Barang memenuhi Catatan 5 Bab 84 sebagai mesin pengolah data otomatis portabel.' },
            { rule: 'KUM HS 6', penjelasan: 'Subpos 8471.30 dipilih karena portabel, berat ≤10kg, memiliki CPU+keyboard+display terintegrasi.' },
          ],
          kandidat_eliminasi: [
            { kode: '8525', alasan: 'Kamera bukan fungsi utama. Catatan 3 Bagian XVI → fungsi utama = ADP.' },
            { kode: '8528', alasan: 'Display bukan menjadikan keseluruhan laptop sebagai monitor.' },
          ],
          fakta_perlu_konfirmasi: ['Konfirmasi berat unit ≤ 10 kg'],
          perlu_expert_review: false,
          alasan_expert_review: null,
        })
      } else if (isDumper) {
        resolve({
          hs_code: '8704.10.31',
          uraian: 'Dumpers designed for off-highway use, other than CKD, GVW not exceeding 5 tonnes',
          confidence: 'TINGGI',
          risk: null,
          reasoning_steps: [
            { rule: 'KUM HS 1', penjelasan: 'Barang adalah kendaraan bermotor untuk pengangkutan barang → Pos 87.04.' },
            { rule: 'KUM HS 6', penjelasan: 'Subpos 8704.10 (dumper off-highway) lebih spesifik dari 8704.21 (kendaraan diesel umum). KUM HS 3(a) via KUM HS 6.' },
          ],
          kandidat_eliminasi: [
            { kode: '8704.21', alasan: 'Residual/umum. Barang ini punya karakter spesifik dumper off-highway.' },
            { kode: '8701', alasan: 'Traktor untuk menarik implement. Barang ini self-propelled dengan dump body.' },
          ],
          fakta_perlu_konfirmasi: ['Konfirmasi GVW tidak melebihi 5 ton'],
          perlu_expert_review: false,
          alasan_expert_review: null,
        })
      } else if (isCrane) {
        resolve({
          hs_code: '8905.90.90',
          uraian: 'Other vessels, the navigability of which is subsidiary to their main function; other',
          confidence: 'TINGGI',
          risk: null,
          reasoning_steps: [
            { rule: 'KUM HS 1', penjelasan: 'EN 89.05 secara eksplisit menyebut floating crane. Fungsi utama = pengangkatan, bukan transportasi.' },
            { rule: 'KUM HS 6', penjelasan: 'Bukan dredger (8905.10), bukan drilling platform → 8905.90 → 8905.90.90 (lainnya).' },
          ],
          kandidat_eliminasi: [
            { kode: '8901.90', alasan: 'Pos 89.01 untuk kapal yang fungsi utamanya transportasi. Crane barge tidak berlayar sendiri.' },
          ],
          fakta_perlu_konfirmasi: [],
          perlu_expert_review: false,
          alasan_expert_review: null,
        })
      } else {
        resolve({
          hs_code: '????',
          uraian: 'Tidak dapat ditentukan — ini adalah mock response',
          confidence: 'RENDAH',
          risk: 'Data tidak cukup untuk reasoning yang akurat',
          reasoning_steps: [
            { rule: 'KUM HS 1', penjelasan: 'Tidak cukup fakta untuk menentukan pos yang tepat.' },
          ],
          kandidat_eliminasi: [],
          fakta_perlu_konfirmasi: ['Lengkapi semua field yang relevan', 'Tambahkan spesifikasi teknis'],
          perlu_expert_review: true,
          alasan_expert_review: 'Fakta material tidak mencukupi untuk klasifikasi otomatis.',
        })
      }
    }, 1500)
  )
}
