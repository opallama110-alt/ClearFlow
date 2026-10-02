import type { ConfirmedFund, FlowTotals, FundTotals, PeriodFilter, Transaction, TransactionCategory } from '../types'
import { inPeriod, today } from './format'

export const EMPTY_FUND_TOTALS: FundTotals = {
  business: { income: 0, expense: 0 },
  personal: { income: 0, expense: 0 },
}

const isCounted = (transaction: Transaction) => transaction.status === 'confirmed'

export const totalsFor = (transactions: Transaction[]): FlowTotals =>
  transactions.reduce<FlowTotals>((totals, transaction) => {
    if (!isCounted(transaction)) return totals
    totals[transaction.flow] += transaction.amount
    return totals
  }, { income: 0, expense: 0 })

export const fundTotalsFor = (transactions: Transaction[]): FundTotals => ({
  business: totalsFor(transactions.filter((transaction) => transaction.fund === 'business')),
  personal: totalsFor(transactions.filter((transaction) => transaction.fund === 'personal')),
})

export type FundSummary = {
  balance: number
  periodIncome: number
  periodExpense: number
  net: number
  /** Porsi pemasukan dari total arus kas pada periode (0–1); null bila belum ada arus kas. */
  incomeShare: number | null
}

/**
 * Menghitung ringkasan satu sumber dana. Saldo selalu memakai total sepanjang waktu
 * (`allTime`), sedangkan pemasukan/pengeluaran mengikuti periode yang dipilih.
 */
export const summarizeFund = ({
  transactions,
  fund,
  period,
  openingBalance,
  allTime,
  reference = today(),
}: {
  transactions: Transaction[]
  fund: ConfirmedFund
  period: PeriodFilter
  openingBalance: number
  allTime?: FlowTotals
  reference?: string
}): FundSummary => {
  const fundTransactions = transactions.filter((transaction) => transaction.fund === fund)
  const lifetime = allTime ?? totalsFor(fundTransactions)
  const periodTotals = period === 'all' && allTime
    ? allTime
    : totalsFor(fundTransactions.filter((transaction) => inPeriod(transaction.date, period, reference)))
  const flowTotal = periodTotals.income + periodTotals.expense

  return {
    balance: openingBalance + lifetime.income - lifetime.expense,
    periodIncome: periodTotals.income,
    periodExpense: periodTotals.expense,
    net: periodTotals.income - periodTotals.expense,
    incomeShare: flowTotal > 0 ? periodTotals.income / flowTotal : null,
  }
}

export type CategoryShare = { category: TransactionCategory; amount: number; share: number }

export const expenseByCategory = (
  transactions: Transaction[],
  fund: ConfirmedFund,
  period: PeriodFilter,
  reference = today(),
): CategoryShare[] => {
  const totals = new Map<TransactionCategory, number>()
  transactions
    .filter((transaction) => isCounted(transaction)
      && transaction.fund === fund
      && transaction.flow === 'expense'
      && inPeriod(transaction.date, period, reference))
    .forEach((transaction) => totals.set(transaction.category, (totals.get(transaction.category) ?? 0) + transaction.amount))

  const grandTotal = [...totals.values()].reduce((sum, amount) => sum + amount, 0)
  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount, share: grandTotal ? amount / grandTotal : 0 }))
    .sort((a, b) => b.amount - a.amount)
}

export type DayGroup = { date: string; transactions: Transaction[]; net: number }

/** Mengelompokkan transaksi (yang sudah terurut terbaru dahulu) per tanggal. */
export const groupByDate = (transactions: Transaction[]): DayGroup[] => {
  const groups: DayGroup[] = []
  for (const transaction of transactions) {
    let group = groups.at(-1)
    if (!group || group.date !== transaction.date) {
      group = { date: transaction.date, transactions: [], net: 0 }
      groups.push(group)
    }
    group.transactions.push(transaction)
    if (isCounted(transaction)) group.net += transaction.flow === 'income' ? transaction.amount : -transaction.amount
  }
  return groups
}

/** Urutan terbaru dahulu: tanggal transaksi, waktu dibuat, lalu urutan asli dari Firestore. */
export const sortNewestFirst = (transactions: Transaction[]) =>
  transactions
    .map((transaction, index) => ({ transaction, index }))
    .sort((a, b) => b.transaction.date.localeCompare(a.transaction.date)
      || (b.transaction.createdAtMs ?? 0) - (a.transaction.createdAtMs ?? 0)
      || a.index - b.index)
    .map(({ transaction }) => transaction)
