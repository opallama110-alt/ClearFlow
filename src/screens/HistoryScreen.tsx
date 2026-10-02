import { useMemo } from 'react'
import { Download, LoaderCircle, Search, Trash2, X } from 'lucide-react'
import { EmptyState, FundSwitch, PeriodSelect } from '../components/controls'
import TransactionRow from '../components/TransactionRow'
import { formatCurrency, formatDayHeading, periodLabel } from '../lib/format'
import { fundLabel } from '../lib/labels'
import { groupByDate } from '../lib/summary'
import type { ConfirmedFund, HistoryFilter, PeriodFilter, Transaction } from '../types'

const FILTERS: Array<[HistoryFilter, string]> = [
  ['all', 'Semua'],
  ['income', 'Pemasukan'],
  ['expense', 'Pengeluaran'],
  ['needs-review', 'Perlu tinjau'],
]

type Props = {
  transactions: Transaction[]
  search: string
  filter: HistoryFilter
  fund: ConfirmedFund
  period: PeriodFilter
  reviewCount: number
  canLoadMore: boolean
  isResetting: boolean
  busyTransactionId: string
  onSearchChange: (search: string) => void
  onFilterChange: (filter: HistoryFilter) => void
  onFundChange: (fund: ConfirmedFund) => void
  onPeriodChange: (period: PeriodFilter) => void
  onExport: () => void
  onReset: () => void
  onLoadMore: () => void
  onOpenTransaction: (transaction: Transaction) => void
}

export default function HistoryScreen({
  transactions,
  search,
  filter,
  fund,
  period,
  reviewCount,
  canLoadMore,
  isResetting,
  busyTransactionId,
  onSearchChange,
  onFilterChange,
  onFundChange,
  onPeriodChange,
  onExport,
  onReset,
  onLoadMore,
  onOpenTransaction,
}: Props) {
  const groups = useMemo(() => groupByDate(transactions), [transactions])
  const filters = FILTERS.filter(([value]) => value !== 'needs-review' || reviewCount > 0 || filter === 'needs-review')
  const isFiltered = Boolean(search.trim()) || filter !== 'all'

  return (
    <>
      <div className="page-intro">
        <div><p className="eyebrow">Semua catatan</p><h1>Riwayat transaksi</h1></div>
        <button type="button" className="export-button" onClick={onExport} disabled={!transactions.length} aria-label={`Unduh CSV ${transactions.length} transaksi`}>
          <Download size={17} aria-hidden="true" /> CSV
        </button>
      </div>

      <FundSwitch value={fund} onChange={onFundChange} label="Pilih riwayat sumber dana" />

      <div className="search-input">
        <Search size={18} aria-hidden="true" />
        <input type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Cari keterangan atau kategori" aria-label="Cari transaksi" enterKeyHint="search" />
        {search && <button type="button" onClick={() => onSearchChange('')} aria-label="Hapus pencarian"><X size={16} /></button>}
      </div>

      <div className="filter-chips" role="group" aria-label="Filter arus kas">
        {filters.map(([value, label]) => (
          <button type="button" aria-pressed={filter === value} className={filter === value ? 'active' : ''} onClick={() => onFilterChange(value)} key={value}>{label}</button>
        ))}
      </div>

      <div className="history-summary">
        <p aria-live="polite"><strong>{transactions.length}</strong> transaksi · {periodLabel(period).toLowerCase()}</p>
        <PeriodSelect value={period} onChange={onPeriodChange} />
      </div>

      {transactions.length > 0 && <p className="fine-print history-hint">Ketuk transaksi untuk mengedit atau menghapusnya.</p>}

      {groups.length ? (
        <div className="history-groups">
          {groups.map((group) => (
            <section className="day-group" key={group.date} aria-label={formatDayHeading(group.date)}>
              <header className="day-heading">
                <h3>{formatDayHeading(group.date)}</h3>
                <span className={group.net >= 0 ? 'positive' : 'negative'}>{group.net >= 0 ? '+' : '−'}{formatCurrency(Math.abs(group.net))}</span>
              </header>
              <ul className="card transaction-list">
                {group.transactions.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    showFund={false}
                    onOpen={onOpenTransaction}
                    isBusy={busyTransactionId === transaction.id}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={<Search size={26} />}
            title={isFiltered
              ? 'Tidak ada transaksi yang cocok'
              : `Belum ada transaksi ${fundLabel(fund)}${period === 'all' ? '' : ` ${periodLabel(period).toLowerCase()}`}`}
            action={isFiltered || period !== 'all'
              ? <button type="button" className="secondary-button compact" onClick={() => { onSearchChange(''); onFilterChange('all'); onPeriodChange('all') }}>{isFiltered ? 'Tampilkan semua' : 'Lihat semua waktu'}</button>
              : undefined}
          >
            {isFiltered ? 'Coba ubah pencarian, filter, atau periode.' : 'Transaksi yang Anda simpan akan muncul di sini.'}
          </EmptyState>
        </div>
      )}

      {canLoadMore && (
        <button type="button" className="secondary-button load-more" onClick={onLoadMore}>Muat transaksi lebih lama</button>
      )}

      <button className="reset-button" type="button" onClick={onReset} disabled={isResetting}>
        {isResetting ? <LoaderCircle size={16} className="spin" aria-hidden="true" /> : <Trash2 size={16} aria-hidden="true" />}
        {isResetting ? 'Menghapus riwayat...' : `Hapus riwayat ${fundLabel(fund)}`}
      </button>
      <p className="fine-print center">Catatan ini untuk membantu pemantauan internal dan bukan dokumen pajak resmi.</p>
    </>
  )
}
