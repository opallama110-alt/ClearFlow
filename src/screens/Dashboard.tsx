import { ArrowDownLeft, ArrowUpRight, ChevronRight, CircleAlert, FileClock, Lightbulb, Sparkles, TriangleAlert } from 'lucide-react'
import { EmptyState, FundSwitch, PeriodSelect, SectionHeading } from '../components/controls'
import TransactionRow from '../components/TransactionRow'
import { firstName, formatCompactCurrency, formatCurrency, greeting, periodLabel } from '../lib/format'
import { fundLabel } from '../lib/labels'
import type { CategoryShare, FundSummary } from '../lib/summary'
import type { ConfirmedFund, PeriodFilter, Transaction } from '../types'

type Props = {
  ownerName: string
  activeFund: ConfirmedFund
  period: PeriodFilter
  summary: FundSummary
  categories: CategoryShare[]
  recentTransactions: Transaction[]
  reviewCount: number
  totalsApproximate: boolean
  onFundChange: (fund: ConfirmedFund) => void
  onPeriodChange: (period: PeriodFilter) => void
  onRecord: () => void
  onOpenHistory: () => void
  onOpenReviews: () => void
}

const MAX_CATEGORY_ROWS = 4

/** Mengelompokkan kategori di luar empat teratas ke "Kategori lain" agar daftar tetap ringkas. */
const foldCategories = (categories: CategoryShare[]) => {
  if (categories.length <= MAX_CATEGORY_ROWS + 1) return categories.map((item) => ({ label: item.category as string, amount: item.amount, share: item.share }))
  const head = categories.slice(0, MAX_CATEGORY_ROWS).map((item) => ({ label: item.category as string, amount: item.amount, share: item.share }))
  const tail = categories.slice(MAX_CATEGORY_ROWS)
  return [...head, {
    label: 'Kategori lain',
    amount: tail.reduce((total, item) => total + item.amount, 0),
    share: tail.reduce((total, item) => total + item.share, 0),
  }]
}

function SpendingMeter({ income, expense }: { income: number; expense: number }) {
  if (!income && !expense) return null
  if (!income) {
    return <p className="meter-note warning"><TriangleAlert size={15} aria-hidden="true" /> Ada pengeluaran tetapi belum ada pemasukan pada periode ini.</p>
  }
  const ratio = expense / income
  const tone = ratio > 1 ? 'danger' : ratio > 0.8 ? 'warning' : 'ok'
  const percent = Math.round(ratio * 100)
  return (
    <div className="spending-meter">
      <div className="meter-label">
        <span>Pengeluaran dibanding pemasukan</span>
        <strong>{percent}%</strong>
      </div>
      <div className={`meter-track ${tone}`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(percent, 100)} aria-label={`Pengeluaran ${percent}% dari pemasukan`}>
        <span style={{ width: `${Math.min(ratio, 1) * 100}%` }} />
      </div>
      {tone !== 'ok' && (
        <p className={`meter-note ${tone}`}>
          <TriangleAlert size={15} aria-hidden="true" />
          {tone === 'danger' ? 'Pengeluaran melebihi pemasukan. Tinjau biaya terbesar Anda.' : 'Pengeluaran mendekati pemasukan. Jaga ruang untuk kas cadangan.'}
        </p>
      )}
    </div>
  )
}

export default function Dashboard({
  ownerName,
  activeFund,
  period,
  summary,
  categories,
  recentTransactions,
  reviewCount,
  totalsApproximate,
  onFundChange,
  onPeriodChange,
  onRecord,
  onOpenHistory,
  onOpenReviews,
}: Props) {
  const name = firstName(ownerName)
  const rows = foldCategories(categories)
  const maxShare = Math.max(...rows.map((row) => row.share), 0)
  const label = periodLabel(period).toLowerCase()

  return (
    <>
      <div className="page-intro">
        <div>
          <p className="eyebrow">Ringkasan usaha</p>
          <h1>{greeting()}{name ? `, ${name}` : ''}</h1>
        </div>
        <PeriodSelect value={period} onChange={onPeriodChange} />
      </div>

      <FundSwitch value={activeFund} onChange={onFundChange} label="Pilih sumber dana" />

      <section className={`balance-card ${activeFund}`} aria-label={`Saldo ${fundLabel(activeFund)}`}>
        <p className="balance-label">Saldo {fundLabel(activeFund)} saat ini</p>
        <strong className="balance-value">{formatCurrency(summary.balance)}</strong>
        {totalsApproximate && <small className="balance-note">Dihitung dari transaksi yang sudah dimuat. Sambungkan internet untuk saldo lengkap.</small>}
        <div className="balance-footer">
          <span><ArrowUpRight size={16} aria-hidden="true" /> Masuk {label} <b>{formatCompactCurrency(summary.periodIncome)}</b></span>
          <span><ArrowDownLeft size={16} aria-hidden="true" /> Keluar <b>{formatCompactCurrency(summary.periodExpense)}</b></span>
        </div>
      </section>

      <button type="button" className="record-prompt" onClick={onRecord}>
        <span className="prompt-icon" aria-hidden="true"><Sparkles size={20} /></span>
        <span><strong>Ceritakan transaksi hari ini</strong><small>Tulis seperti mengirim chat, lalu periksa draft-nya.</small></span>
        <span className="prompt-arrow" aria-hidden="true"><ChevronRight size={20} /></span>
      </button>

      {reviewCount > 0 && (
        <button className="review-alert" type="button" onClick={onOpenReviews}>
          <span aria-hidden="true"><CircleAlert size={19} /></span>
          <span><strong>{reviewCount} transaksi perlu ditinjau</strong><small>Pastikan arus kas dan sumber dana sudah tepat.</small></span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      )}

      <SectionHeading eyebrow="Arus kas" title={`Gambaran ${label}`} action={<span className="pill-label">Estimasi</span>} />
      <section className="card cash-flow-card">
        <div className="stat-row">
          <div className="stat-tile">
            <span className="stat-label"><span className="stat-dot income" aria-hidden="true" />Pemasukan</span>
            <strong>{formatCurrency(summary.periodIncome)}</strong>
          </div>
          <div className="stat-tile">
            <span className="stat-label"><span className="stat-dot expense" aria-hidden="true" />Pengeluaran</span>
            <strong>{formatCurrency(summary.periodExpense)}</strong>
          </div>
        </div>
        <div className="net-row">
          <span>Selisih</span>
          <strong className={summary.net >= 0 ? 'positive' : 'negative'}>{summary.net >= 0 ? '+' : '−'}{formatCurrency(Math.abs(summary.net))}</strong>
        </div>
        <SpendingMeter income={summary.periodIncome} expense={summary.periodExpense} />
        {summary.incomeShare === null && <p className="muted-note">Belum ada arus kas {label}. Catat transaksi untuk melihat gambaran.</p>}
        <small className="fine-print">Bukan laporan laba-rugi resmi.</small>
      </section>

      {rows.length > 0 && (
        <>
          <SectionHeading eyebrow="Pengeluaran" title="Per kategori" />
          <section className="card category-card">
            <ul className="category-bars">
              {rows.map((row) => (
                <li key={row.label}>
                  <div className="category-line">
                    <span>{row.label}</span>
                    <strong>{formatCurrency(row.amount)} <small>{Math.round(row.share * 100)}%</small></strong>
                  </div>
                  <span className="bar-track" aria-hidden="true"><span style={{ width: `${maxShare ? (row.share / maxShare) * 100 : 0}%` }} /></span>
                </li>
              ))}
            </ul>
            {rows[0] && (
              <p className="insight-tip"><Lightbulb size={16} aria-hidden="true" /><span>Pengeluaran terbesar {label}: <b>{rows[0].label}</b>.</span></p>
            )}
          </section>
        </>
      )}

      <SectionHeading
        eyebrow="Terbaru"
        title="Transaksi terakhir"
        action={<button type="button" className="text-button" onClick={onOpenHistory}>Lihat semua</button>}
      />
      {recentTransactions.length ? (
        <ul className="card transaction-list">
          {recentTransactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} showFund={false} />)}
        </ul>
      ) : (
        <div className="card">
          <EmptyState icon={<FileClock size={26} />} title="Belum ada transaksi" action={<button type="button" className="secondary-button compact" onClick={onRecord}>Catat transaksi pertama</button>}>
            Catatan {fundLabel(activeFund)} akan muncul di sini.
          </EmptyState>
        </div>
      )}
    </>
  )
}
