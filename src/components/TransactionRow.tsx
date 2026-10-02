import { memo } from 'react'
import { ArrowDownLeft, ArrowUpRight, ChevronRight, CloudOff } from 'lucide-react'
import { formatCurrency } from '../lib/format'
import { fundLabel, sourceLabel } from '../lib/labels'
import type { Transaction } from '../types'

type Props = {
  transaction: Transaction
  showFund?: boolean
  /** Bila diisi, seluruh baris menjadi tombol untuk membuka editor transaksi. */
  onOpen?: (transaction: Transaction) => void
  isBusy?: boolean
}

function TransactionRow({ transaction, showFund = true, onOpen, isBusy = false }: Props) {
  const isIncome = transaction.flow === 'income'
  // Asal draft hanya ditampilkan untuk Gemini agar baris tetap ringkas.
  const meta = [showFund ? fundLabel(transaction.fund) : '', transaction.category, transaction.source === 'Gemini' ? sourceLabel(transaction.source) : ''].filter(Boolean).join(' · ')

  const content = (
    <>
      <span className={`transaction-icon ${isIncome ? 'income' : 'expense'}`} aria-hidden="true">
        {isIncome ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
      </span>
      <span className="transaction-copy">
        <strong>{transaction.description}</strong>
        <small>{meta}</small>
      </span>
      <span className="transaction-amount">
        <strong className={isIncome ? 'positive' : 'negative'}>
          <span className="sr-only">{isIncome ? 'Pemasukan' : 'Pengeluaran'} </span>
          {isIncome ? '+' : '−'}{formatCurrency(transaction.amount)}
        </strong>
        {transaction.pending
          ? <span className="status-badge pending"><CloudOff size={11} aria-hidden="true" /> Menunggu sinkron</span>
          : transaction.status === 'needs-review'
            ? <span className="status-badge review">Perlu tinjau</span>
            : null}
      </span>
      {onOpen && <ChevronRight className="row-chevron" size={17} aria-hidden="true" />}
    </>
  )

  return (
    <li className={`transaction-row ${onOpen ? 'interactive' : ''} ${isBusy ? 'is-busy' : ''}`}>
      {onOpen
        ? <button type="button" className="transaction-row-button" onClick={() => onOpen(transaction)} disabled={isBusy} aria-label={`Edit transaksi ${transaction.description}, ${isIncome ? 'pemasukan' : 'pengeluaran'} ${formatCurrency(transaction.amount)}`}>{content}</button>
        : content}
    </li>
  )
}

export default memo(TransactionRow)
