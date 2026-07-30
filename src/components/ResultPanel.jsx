const CONFIDENCE_COLOR = {
  TINGGI: 'bg-green-100 text-green-800 border-green-300',
  SEDANG: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  RENDAH: 'bg-red-100 text-red-800 border-red-300',
}

export default function ResultPanel({ result, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col items-center justify-center gap-3 min-h-64">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">AI sedang menganalisis barang...</p>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col items-center justify-center gap-3 min-h-64 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl">🔍</div>
        <p className="text-gray-500 text-sm">Isi form di sebelah kiri lalu klik <strong>Analisis HS Code</strong></p>
        <p className="text-gray-400 text-xs">AI akan menjalankan reasoning berdasarkan KUM HS 1–6</p>
      </div>
    )
  }

  if (result.error) {
    return (
      <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6">
        <div className="flex items-center gap-2 text-red-600 font-semibold mb-2">
          <span>⚠️</span> Terjadi Kesalahan
        </div>
        <p className="text-sm text-red-500">{result.error}</p>
      </div>
    )
  }

  const confidenceClass = CONFIDENCE_COLOR[result.confidence?.toUpperCase()] || CONFIDENCE_COLOR.SEDANG

  return (
    <div className="flex flex-col gap-4">
      {/* Primary Result */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Rekomendasi HS Code</p>
            <p className="text-3xl font-bold text-blue-700 tracking-wider">{result.hs_code}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${confidenceClass}`}>
            Confidence: {result.confidence}
          </span>
        </div>
        <p className="text-sm font-medium text-gray-800 mb-1">{result.uraian}</p>
        {result.risk && (
          <p className="text-xs text-orange-600 mt-2">⚠️ {result.risk}</p>
        )}
      </div>

      {/* KUM HS Reasoning */}
      {result.reasoning_steps?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>⚖️</span> Reasoning KUM HS
          </h3>
          <div className="flex flex-col gap-3">
            {result.reasoning_steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex-shrink-0 w-20 pt-0.5">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {step.rule}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{step.penjelasan}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kandidat Dieliminasi */}
      {result.kandidat_eliminasi?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>❌</span> Kandidat yang Dieliminasi
          </h3>
          <div className="flex flex-col gap-2">
            {result.kandidat_eliminasi.map((k, i) => (
              <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xs font-mono font-bold text-gray-500 w-24 flex-shrink-0">{k.kode}</span>
                <p className="text-xs text-gray-500">{k.alasan}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fakta yang perlu konfirmasi */}
      {result.fakta_perlu_konfirmasi?.length > 0 && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
          <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <span>❓</span> Fakta yang Masih Perlu Dikonfirmasi
          </h3>
          <ul className="flex flex-col gap-1">
            {result.fakta_perlu_konfirmasi.map((f, i) => (
              <li key={i} className="text-xs text-amber-700 flex gap-2">
                <span>•</span> {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expert Review Flag */}
      {result.perlu_expert_review && (
        <div className="bg-red-50 rounded-2xl border border-red-200 p-4 flex items-center gap-3">
          <span className="text-2xl">👨‍⚖️</span>
          <div>
            <p className="text-sm font-semibold text-red-700">Perlu Expert Review</p>
            <p className="text-xs text-red-500">{result.alasan_expert_review}</p>
          </div>
        </div>
      )}
    </div>
  )
}
