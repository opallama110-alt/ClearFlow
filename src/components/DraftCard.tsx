import { memo } from 'react'
import { ArrowDownLeft, ArrowUpRight, CircleAlert, Trash2 } from 'lucide-react'
import { draftIssues, type DraftField } from '../lib/drafts'
import { flowLabel } from '../lib/labels'
import { TRANSACTION_CATEGORIES, type Draft } from '../types'
import RupiahInput from './RupiahInput'

type Props = {
  draft: Draft
  index: number
  total: number
  showErrors: boolean
  onUpdate: (id: string, patch: Partial<Draft>) => void
  onRemove?: (id: string) => void
}

function DraftCard({ draft, index, total, showErrors, onUpdate, onRemove }: Props) {
  const confidence = Math.round(draft.confidence * 100)
  const issues = draftIssues(draft)
  const needsChoice = draft.fund === 'review' || draft.flow === 'review'
  const visibleIssues = showErrors ? issues : { fund: issues.fund, flow: issues.flow }
  const fieldId = (field: DraftField) => `draft-${draft.id}-${field}`
  const errorProps = (field: DraftField) => visibleIssues[field]
    ? { 'aria-invalid': true as const, 'aria-describedby': `${fieldId(field)}-error` }
    : {}
  const sourceText = draft.source === 'Gemini'
    ? `Disiapkan Gemini · keyakinan ${confidence}%`
    : draft.source === 'Manual' ? 'Diisi manual' : `Parser lokal · keyakinan ${confidence}%`

  return (
    <article className={`draft-card ${needsChoice ? 'needs-review' : ''}`} aria-label={total > 1 ? `Transaksi ${index + 1} dari ${total}` : 'Detail transaksi'}>
      <div className="draft-card-head">
        <span className={`transaction-icon ${draft.flow === 'income' ? 'income' : draft.flow === 'expense' ? 'expense' : 'review'}`} aria-hidden="true">
          {draft.flow === 'income' ? <ArrowUpRight size={18} /> : draft.flow === 'expense' ? <ArrowDownLeft size={18} /> : <CircleAlert size={18} />}
        </span>
        <div>
          <strong>{total > 1 ? `${index + 1}. ` : ''}{draft.flow === 'review' ? 'Butuh klarifikasi' : flowLabel(draft.flow)}</strong>
          <small>{sourceText}</small>
        </div>
        {onRemove && (
          <button type="button" className="row-action danger" onClick={() => onRemove(draft.id)} aria-label={`Buang draft ${draft.description || index + 1}`} title="Buang draft">
            <Trash2 size={15} />
          </button>
        )}
      </div>

      <div className="field">
        <label htmlFor={fieldId('description')}>Keterangan</label>
        <input id={fieldId('description')} maxLength={160} value={draft.description} placeholder="Contoh: Beli plastik kemasan" onChange={(event) => onUpdate(draft.id, { description: event.target.value })} {...errorProps('description')} />
        {visibleIssues.description && <small className="field-error" id={`${fieldId('description')}-error`}>{visibleIssues.description}</small>}
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor={fieldId('amount')}>Nominal</label>
          <span className="amount-input"><span aria-hidden="true">Rp</span><RupiahInput id={fieldId('amount')} value={draft.amount} onValueChange={(amount) => onUpdate(draft.id, { amount })} {...errorProps('amount')} /></span>
          {visibleIssues.amount && <small className="field-error" id={`${fieldId('amount')}-error`}>{visibleIssues.amount}</small>}
        </div>
        <div className="field">
          <label htmlFor={fieldId('date')}>Tanggal</label>
          <input id={fieldId('date')} type="date" value={draft.date} onChange={(event) => onUpdate(draft.id, { date: event.target.value })} {...errorProps('date')} />
          {visibleIssues.date && <small className="field-error" id={`${fieldId('date')}-error`}>{visibleIssues.date}</small>}
        </div>
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor={fieldId('flow')}>Arus kas</label>
          <select id={fieldId('flow')} className={draft.flow === 'review' ? 'needs-choice' : ''} value={draft.flow} onChange={(event) => onUpdate(draft.id, { flow: event.target.value as Draft['flow'] })} {...errorProps('flow')}>
            {draft.flow === 'review' && <option value="review">Pilih…</option>}
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
          </select>
          {visibleIssues.flow && <small className="field-error" id={`${fieldId('flow')}-error`}>{visibleIssues.flow}</small>}
        </div>
        <div className="field">
          <label htmlFor={fieldId('fund')}>Sumber dana</label>
          <select id={fieldId('fund')} className={draft.fund === 'review' ? 'needs-choice' : ''} value={draft.fund} onChange={(event) => onUpdate(draft.id, { fund: event.target.value as Draft['fund'] })} {...errorProps('fund')}>
            {draft.fund === 'review' && <option value="review">Pilih…</option>}
            <option value="business">Kas Usaha</option>
            <option value="personal">Dana Pribadi</option>
          </select>
          {visibleIssues.fund && <small className="field-error" id={`${fieldId('fund')}-error`}>{visibleIssues.fund}</small>}
        </div>
      </div>

      <div className="field">
        <label htmlFor={fieldId('category')}>Kategori</label>
        <select id={fieldId('category')} value={draft.category} onChange={(event) => onUpdate(draft.id, { category: event.target.value as Draft['category'] })}>
          {TRANSACTION_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
        </select>
      </div>
    </article>
  )
}

export default memo(DraftCard)
