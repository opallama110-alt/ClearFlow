import { useEffect, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { TRANSACTION_CATEGORIES, type Transaction, type TransactionCategory } from '../types'
import RupiahInput from './RupiahInput'

type Props = {
  transaction: Transaction
  busy: boolean
  onClose: () => void
  onSave: (transaction: Transaction) => Promise<void>
}

export default function TransactionEditor({ transaction, busy, onClose, onSave }: Props) {
  const [value, setValue] = useState(transaction)
  useEffect(() => setValue(transaction), [transaction])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!value.description.trim() || value.amount <= 0 || !value.date) return
    await onSave(value)
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card editor-modal" role="dialog" aria-modal="true" aria-labelledby="edit-transaction-title">
        <header className="modal-header"><div><h2 id="edit-transaction-title">Edit transaksi</h2><p>Perubahan langsung memperbarui ringkasan kas.</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="Tutup"><X size={19} /></button></header>
        <form className="modal-form" onSubmit={submit}>
          <label className="form-field"><span>Keterangan</span><input maxLength={160} value={value.description} onChange={(event) => setValue({ ...value, description: event.target.value })} /></label>
          <div className="two-fields">
            <label className="form-field"><span>Nominal</span><span className="currency-input"><b>Rp</b><RupiahInput value={value.amount} onValueChange={(amount) => setValue({ ...value, amount })} /></span></label>
            <label className="form-field"><span>Tanggal</span><input type="date" value={value.date} onChange={(event) => setValue({ ...value, date: event.target.value })} /></label>
          </div>
          <div className="two-fields">
            <label className="form-field"><span>Arus kas</span><select value={value.flow} onChange={(event) => setValue({ ...value, flow: event.target.value as Transaction['flow'] })}><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option></select></label>
            <label className="form-field"><span>Sumber dana</span><select value={value.fund} onChange={(event) => setValue({ ...value, fund: event.target.value as Transaction['fund'] })}><option value="business">Kas Usaha</option><option value="personal">Kas Pribadi</option></select></label>
          </div>
          <label className="form-field"><span>Kategori</span><select value={value.category} onChange={(event) => setValue({ ...value, category: event.target.value as TransactionCategory })}>{TRANSACTION_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
          <button className="primary-button" type="submit" disabled={busy || !value.description.trim() || value.amount <= 0}>{busy ? 'Menyimpan...' : 'Simpan perubahan'}</button>
        </form>
      </section>
    </div>
  )
}
