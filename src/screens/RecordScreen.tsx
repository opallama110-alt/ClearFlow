import type { KeyboardEvent } from 'react'
import { Check, CircleAlert, Lightbulb, LoaderCircle, Pencil, Plus, Sparkles, X } from 'lucide-react'
import DraftCard from '../components/DraftCard'
import { draftIssues } from '../lib/drafts'
import { MAX_STORY_LENGTH } from '../lib/ai'
import { MAX_TRANSACTIONS_PER_INPUT, type Draft, type RecordMode } from '../types'

const EXAMPLES = [
  'Jualan 300rb masuk kas usaha',
  'Beli plastik kemasan 50rb pakai kas usaha',
  'Kemarin bayar listrik rumah 250rb pakai uang pribadi',
  'Modal awal 1 jt masuk Kas Usaha',
]

type Props = {
  mode: RecordMode
  story: string
  drafts: Draft[]
  aiAllowed: boolean
  isExtracting: boolean
  isSaving: boolean
  showErrors: boolean
  engineNote: string
  onModeChange: (mode: RecordMode) => void
  onStoryChange: (story: string) => void
  onCreateDraft: () => void
  onUpdateDraft: (id: string, patch: Partial<Draft>) => void
  onRemoveDraft: (id: string) => void
  onAddManualDraft: () => void
  onClearDrafts: () => void
  onSaveDrafts: () => void
  onOpenProfile: () => void
}

export default function RecordScreen({
  mode,
  story,
  drafts,
  aiAllowed,
  isExtracting,
  isSaving,
  showErrors,
  engineNote,
  onModeChange,
  onStoryChange,
  onCreateDraft,
  onUpdateDraft,
  onRemoveDraft,
  onAddManualDraft,
  onClearDrafts,
  onSaveDrafts,
  onOpenProfile,
}: Props) {
  const openChoices = drafts.filter((draft) => draft.fund === 'review' || draft.flow === 'review').length
  const invalidCount = drafts.filter((draft) => Object.keys(draftIssues(draft)).length > 0).length

  const handleStoryKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && story.trim() && !isExtracting) {
      event.preventDefault()
      onCreateDraft()
    }
  }

  return (
    <>
      <div className="page-intro stacked">
        <p className="eyebrow">Catat transaksi</p>
        <h1>Hari ini ada transaksi apa?</h1>
        <p className="lead">Pilih cara tercepat untuk Anda. Semua data tetap diperiksa sebelum disimpan.</p>
      </div>

      <div className="segmented record-mode" role="group" aria-label="Cara mencatat transaksi">
        <button type="button" aria-pressed={mode === 'assistant'} className={mode === 'assistant' ? 'active' : ''} onClick={() => onModeChange('assistant')}>
          <Sparkles size={16} aria-hidden="true" /> Dengan cerita
        </button>
        <button type="button" aria-pressed={mode === 'manual'} className={mode === 'manual' ? 'active' : ''} onClick={() => onModeChange('manual')}>
          <Pencil size={16} aria-hidden="true" /> Isi manual
        </button>
      </div>

      {mode === 'assistant' && (
        <section className="card composer-card">
          {!aiAllowed ? (
            <div className="consent-callout">
              <CircleAlert size={18} aria-hidden="true" />
              <div>
                <strong>Izin pemrosesan AI belum aktif</strong>
                <p>Aktifkan izin di profil agar cerita dapat diubah menjadi draft oleh Gemini, atau gunakan mode manual.</p>
                <div className="callout-actions">
                  <button type="button" className="secondary-button compact" onClick={onOpenProfile}>Buka profil</button>
                  <button type="button" className="text-button" onClick={() => onModeChange('manual')}>Pakai formulir manual</button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <label htmlFor="transaction-input">Cerita transaksi</label>
              <textarea
                id="transaction-input"
                value={story}
                onChange={(event) => onStoryChange(event.target.value)}
                onKeyDown={handleStoryKeyDown}
                maxLength={MAX_STORY_LENGTH}
                placeholder="Contoh: Jualan 300rb, lalu beli plastik kemasan 50rb pakai uang kas usaha."
                rows={4}
                aria-describedby="composer-hint"
              />
              <div className="composer-meta">
                <span id="composer-hint">Maks. {MAX_TRANSACTIONS_PER_INPUT} transaksi per cerita</span>
                <span>{story.length.toLocaleString('id-ID')}/{MAX_STORY_LENGTH.toLocaleString('id-ID')}</span>
              </div>
              {!story && (
                <div className="example-chips" aria-label="Contoh cerita">
                  {EXAMPLES.map((example) => (
                    <button type="button" key={example} onClick={() => onStoryChange(example)}>{example}</button>
                  ))}
                </div>
              )}
              <button className="primary-button" type="button" onClick={onCreateDraft} disabled={isExtracting || !story.trim()}>
                {isExtracting ? <LoaderCircle size={18} className="spin" aria-hidden="true" /> : <Sparkles size={18} aria-hidden="true" />}
                {isExtracting ? 'Gemini sedang menyiapkan draft...' : 'Analisis dengan Gemini'}
              </button>
              <p className="composer-note"><CircleAlert size={14} aria-hidden="true" /> Teks diproses melalui Firebase AI Logic. Hasil hanya berupa draft dan tidak disimpan sebelum Anda konfirmasi. Jangan menulis PIN atau kata sandi.</p>
              <details className="ai-explainer">
                <summary>Bagaimana AI membaca cerita?</summary>
                <ol>
                  <li>Cerita dikirim ke Gemini melalui Firebase AI Logic yang dilindungi App Check.</li>
                  <li>Gemini mengembalikan draft dengan format JSON terstruktur.</li>
                  <li>ClearFlow memvalidasi format dan menandai bagian yang belum pasti.</li>
                  <li>Jika AI tidak tersedia, parser lokal tetap menyiapkan draft.</li>
                  <li>Hanya transaksi yang Anda konfirmasi yang disimpan.</li>
                </ol>
              </details>
            </>
          )}
        </section>
      )}

      {mode === 'assistant' && aiAllowed && !drafts.length && (
        <p className="record-tip"><Lightbulb size={16} aria-hidden="true" /> Punya modal awal? Catat di sini, misalnya “Modal awal 1 jt masuk Kas Usaha”.</p>
      )}

      {drafts.length > 0 && (
        <section className="draft-section" aria-labelledby="draft-heading">
          <div className="draft-heading">
            <div>
              <p className="eyebrow">{mode === 'manual' ? 'Formulir transaksi' : 'Hasil ekstraksi'}</p>
              <h2 id="draft-heading">{mode === 'manual' ? 'Isi detail transaksi' : `${drafts.length} transaksi ditemukan`}</h2>
            </div>
            {mode === 'assistant' && <button className="icon-button" type="button" onClick={onClearDrafts} aria-label="Buang semua draft"><X size={19} /></button>}
          </div>
          {mode === 'assistant' && engineNote && <p className="engine-note">{engineNote}</p>}
          {openChoices > 0 && (
            <div className="callout warning" role="note">
              <CircleAlert size={17} aria-hidden="true" />
              <span>{openChoices === 1 ? 'Ada 1 transaksi' : `Ada ${openChoices} transaksi`} yang belum pasti. Pilih arus kas atau sumber dananya sebelum menyimpan.</span>
            </div>
          )}
          <div className="draft-list">
            {drafts.map((draft, index) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                index={index}
                total={drafts.length}
                showErrors={showErrors}
                onUpdate={onUpdateDraft}
                onRemove={mode === 'assistant' || drafts.length > 1 ? onRemoveDraft : undefined}
              />
            ))}
          </div>
          {mode === 'manual' && drafts.length < MAX_TRANSACTIONS_PER_INPUT && (
            <button type="button" className="dashed-button" onClick={onAddManualDraft}><Plus size={17} aria-hidden="true" /> Tambah transaksi lain</button>
          )}
          {showErrors && invalidCount > 0 && (
            <p className="inline-error" role="alert">{invalidCount === 1 ? '1 transaksi' : `${invalidCount} transaksi`} belum lengkap. Periksa kolom yang ditandai.</p>
          )}
          <button className="primary-button save-button" type="button" onClick={onSaveDrafts} disabled={isSaving}>
            {isSaving ? <LoaderCircle size={18} className="spin" aria-hidden="true" /> : <Check size={18} aria-hidden="true" />}
            {isSaving ? 'Menyimpan...' : `Konfirmasi dan simpan ${drafts.length} transaksi`}
          </button>
          <p className="fine-print center">Anda dapat mengedit atau menghapus transaksi kembali dari menu Riwayat.</p>
        </section>
      )}
    </>
  )
}
