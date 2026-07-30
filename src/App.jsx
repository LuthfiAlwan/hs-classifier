import { useState } from 'react'
import ClassificationForm from './components/ClassificationForm'
import ResultPanel from './components/ResultPanel'
import { classifyHS } from './services/classifier'

export default function App() {
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (form) => {
    setIsLoading(true)
    setResult(null)
    try {
      const res = await classifyHS(form)
      setResult(res)
    } catch (err) {
      setResult({ error: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              HS
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">
                AI HS Classification Intelligence
              </h1>
              <p className="text-xs text-gray-500">SMART · BTKI 2022 · PMK 26/2022</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
              MVP · Data Terbatas
            </span>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: Form */}
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Data Barang</h2>
              <p className="text-sm text-gray-500">Isi informasi barang selengkap mungkin untuk hasil yang akurat</p>
            </div>
            <ClassificationForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>

          {/* Right: Result */}
          <div className="lg:sticky lg:top-24">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Hasil Analisis</h2>
              <p className="text-sm text-gray-500">Rekomendasi kode HS + reasoning KUM HS</p>
            </div>
            <ResultPanel result={result} isLoading={isLoading} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12 py-4 text-center">
        <p className="text-xs text-gray-400">
          Output merupakan rekomendasi, bukan penetapan resmi DJBC. Selalu verifikasi dengan ahli kepabeanan.
        </p>
      </footer>
    </div>
  )
}
