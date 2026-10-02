import { useState, type FormEvent } from 'react'
import { LoaderCircle, Trash2, X } from 'lucide-react'
import { formatDate } from '../lib/format'
import { sourceLabel } from '../lib/labels'
import { TRANSACTION_CATEGORIES, type Transaction, type TransactionCategory } from '../types'
import Modal from './Modal'
import RupiahInput from './RupiahInput'

type Props = {
  transaction: Transaction
  busy: boolean
  onClose: () => void
  onSave: (transaction: Transaction) => Promise<void>
  onDelete: (transaction: Transaction) => void
}

export default function TransactionEditor({ transaction, busy, onClose, onSave, onDelete }: Props) {
  const [value, setValue] = useState(transaction)
  const [submitted, setSubmitted] = useState(false)
  const update = (patch: Partial<Transaction>) => setValue((current) => ({ ...current, ...patch }))

  const descriptionError = !value.description.trim() ? 'Keterangan wajib diisi.' : ''
  const amountError = !(value.amount > 0) ? 'Nominal harus lebih dari Rp0.' : ''
  const dateError = !value.date ? 'Tanggal wajib diisi.' : ''
  const hasErrors = Boolean(descriptionError || amountError || dateError)
  const unchanged = JSON.stringify(value) === JSON.stringify(transaction)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (hasErrors || unchanged) {
      if (unchanged) onClose()
      return
    }
    await onSave({ ...value, status: 'confirmed' })
  }

  return (
    <Modal labelledBy="edit-transaction-title" onClose={onClose} dismissible={!busy} className="editor-modal">
      <header className="modal-header">
        <div>
          <h2 id="edit-transaction-title">Edit transaksi</h2>
          <p>Dicatat {formatDate(transaction.date)} · {sourceLabel(transaction.source)}</p>
        </div>
        <button className="icon-button" type="button" onClick={onClose} disabled={busy} aria-label="Tutup"><X size={19} /></button>
      </header>
      <form className="modal-body form-stack" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="edit-description">Keterangan</label>
          <input id="edit-description" data-autofocus maxLength={160} value={value.description} onChange={(event) => update({ description: event.target.value })} aria-invalid={submitted && Boolean(descriptionError)} />
          {submitted && descriptionError && <small className="field-error">{descriptionError}</small>}
        </div>
        <div className="field-grid">
          <div className="field">
            <label htmlFor="edit-amount">Nominal</label>
            <span className="amount-input"><span aria-hidden="true">Rp</span><RupiahInput id="edit-amount" value={value.amount} onValueChange={(amount) => update({ amount })} aria-invalid={submitted && Boolean(amountError)} /></span>
            {submitted && amountError && <small className="field-error">{amountError}</small>}
          </div>
          <div className="field">
            <label htmlFor="edit-date">Tanggal</label>
            <input id="edit-date" type="date" value={value.date} onChange={(event) => update({ date: event.target.value })} aria-invalid={submitted && Boolean(dateError)} />
            {submitted && dateError && <small className="field-error">{dateError}</small>}
          </div>
        </div>
        <div className="field-grid">
          <div className="field">
            <label htmlFor="edit-flow">Arus kas</label>
            <select id="edit-flow" value={value.flow} onChange={(event) => update({ flow: event.target.value as Transaction['flow'] })}>
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="edit-fund">Sumber dana</label>
            <select id="edit-fund" value={value.fund} onChange={(event) => update({ fund: event.target.value as Transaction['fund'] })}>
              <option value="business">Kas Usaha</option>
              <option value="personal">Dana Pribadi</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="edit-category">Kategori</label>
          <select id="edit-category" value={value.category} onChange={(event) => update({ category: event.target.value as TransactionCategory })}>
            {TRANSACTION_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
          </select>
        </div>
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose} disabled={busy}>Batal</button>
          <button className="primary-button" type="submit" disabled={busy}>
            {busy && <LoaderCircle size={18} className="spin" aria-hidden="true" />}
            {busy ? 'Menyimpan...' : 'Simpan perubahan'}
          </button>
        </div>
        <button className="delete-link" type="button" onClick={() => onDelete(transaction)} disabled={busy}>
          <Trash2 size={16} aria-hidden="true" /> Hapus transaksi ini
        </button>
      </form>
    </Modal>
  )
}
