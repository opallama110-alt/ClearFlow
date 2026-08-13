import type { BusinessProfile, ExtractionResult } from '../types'
import { firebaseApp, trackEvent } from '../firebase'
import { today } from './format'
import { inferDraftsLocally, validateModelDrafts } from './parser'
import { getPilotConfig } from './remoteConfig'

const FALLBACK_MESSAGE = 'Firebase AI belum tersedia, jadi draft dibuat dengan parser lokal.'

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number) => {
  let timeoutId = 0
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error('AI_TIMEOUT')), timeoutMs)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export const extractTransactionDrafts = async (
  input: string,
  business?: BusinessProfile,
): Promise<ExtractionResult> => {
  const startedAt = Date.now()
  const cleanInput = input.trim().slice(0, 1_200)
  const inputLengthBucket = cleanInput.length < 80 ? 'short' : cleanInput.length < 300 ? 'medium' : 'long'
  const localFallback = (reason = FALLBACK_MESSAGE): ExtractionResult => ({
    drafts: inferDraftsLocally(cleanInput),
    engine: 'parser',
    fallbackReason: reason,
  })
  if (!cleanInput) return localFallback('Teks transaksi masih kosong.')

  const config = await getPilotConfig()
  if (!config.aiEnabled) return localFallback('Fitur AI sedang dijeda untuk pemeliharaan.')

  try {
    const { getAI, getGenerativeModel, GoogleAIBackend, Schema } = await import('firebase/ai')
    const responseSchema = Schema.object({
      properties: {
        transactions: Schema.array({
          maxItems: config.maxTransactionsPerInput,
          items: Schema.object({
            properties: {
              date: Schema.string({ description: 'Tanggal ISO YYYY-MM-DD dalam zona waktu Asia/Jakarta.' }),
              description: Schema.string({ description: 'Keterangan transaksi singkat, maksimal 160 karakter.' }),
              amount: Schema.number({ description: 'Nominal rupiah sebagai bilangan bulat positif tanpa tanda baca.' }),
              flow: Schema.enumString({ enum: ['income', 'expense', 'review'] }),
              fund: Schema.enumString({ enum: ['business', 'personal', 'review'] }),
              category: Schema.enumString({
                enum: ['Penjualan', 'Bahan Baku', 'Operasional', 'Gaji', 'Transportasi', 'Pribadi', 'Modal', 'Lainnya'],
              }),
              confidence: Schema.number({ description: 'Angka 0 sampai 1. Gunakan nilai rendah jika informasi ambigu.' }),
            },
          }),
        }),
      },
    })
    const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() })
    const model = getGenerativeModel(ai, {
      model: config.aiModel,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.1,
        maxOutputTokens: 1_500,
      },
    })

    const prompt = `Anda adalah asisten pencatatan transaksi UMKM Indonesia. Ubah cerita pengguna menjadi draft transaksi terstruktur.

Tanggal hari ini: ${today()} (Asia/Jakarta).
Nama usaha: ${business?.name ?? 'belum diisi'}.
Jenis usaha: ${business?.businessType ?? 'belum diisi'}.

Aturan wajib:
1. Pecah setiap kejadian ke transaksi terpisah, maksimal ${config.maxTransactionsPerInput} transaksi.
2. "rb", "ribu", dan "k" berarti dikali 1.000. "jt" dan "juta" berarti dikali 1.000.000.
3. Jangan mengarang nominal, tanggal, sumber dana, atau tujuan transaksi.
4. Jika arus kas tidak jelas, isi flow "review". Jika kas usaha/pribadi tidak jelas, isi fund "review".
5. Penjualan masuk ke kas usaha kecuali pengguna mengatakan lain.
6. Pembelian kebutuhan rumah, jajan pribadi, atau sekolah adalah fund personal dan kategori Pribadi.
7. Gunakan deskripsi ringkas dan netral. Output hanya mengikuti schema JSON.

Cerita transaksi pengguna:
${cleanInput}`

    const result = await withTimeout(model.generateContent(prompt), 15_000)
    const parsed = JSON.parse(result.response.text()) as unknown
    const drafts = validateModelDrafts(parsed, config.aiModel)
    if (!drafts.length) throw new Error('AI_EMPTY_RESULT')
    const reviewCount = drafts.filter((draft) => draft.flow === 'review' || draft.fund === 'review').length
    void trackEvent('transaction_draft_generated', {
      engine: 'gemini',
      count: drafts.length,
      model: config.aiModel,
      latency_ms: Date.now() - startedAt,
      input_length_bucket: inputLengthBucket,
      review_count: reviewCount,
    })
    return { drafts, engine: 'gemini', model: config.aiModel }
  } catch (error) {
    const reason = error instanceof Error && error.message === 'AI_TIMEOUT'
      ? 'AI membutuhkan waktu terlalu lama, jadi draft dibuat dengan parser lokal.'
      : FALLBACK_MESSAGE
    const fallback = localFallback(reason)
    void trackEvent('transaction_draft_generated', {
      engine: 'parser',
      count: fallback.drafts.length,
      latency_ms: Date.now() - startedAt,
      input_length_bucket: inputLengthBucket,
      fallback_code: error instanceof Error && error.message === 'AI_TIMEOUT' ? 'timeout' : 'unavailable',
    })
    return fallback
  }
}
