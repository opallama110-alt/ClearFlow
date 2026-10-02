import { useCallback, useEffect, useMemo, useState } from 'react'
import { reportError } from '../firebase'
import { fetchFundTotals, subscribeBusiness, subscribeTransactions, type TransactionsSnapshot } from '../lib/data'
import { fundTotalsFor, sortNewestFirst } from '../lib/summary'
import type { BusinessProfile, FundTotals } from '../types'
import { useOnlineStatus } from './useOnlineStatus'

export const PAGE_SIZE = 500
const MAX_LOADED = 5_000

const syncErrorMessage = (error: unknown) => {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
  if (code === 'permission-denied') return 'Akses data ditolak. Coba keluar lalu masuk kembali.'
  if (code === 'resource-exhausted') return 'Kuota layanan data sedang penuh. Coba lagi beberapa saat lagi.'
  return 'Data belum bisa disinkronkan. Periksa koneksi lalu coba lagi.'
}

/**
 * Berlangganan profil usaha dan transaksi secara realtime. Listener memuat transaksi terbaru
 * (bertahap per 500), sementara saldo sepanjang waktu diambil dari agregasi server bila
 * data lokal belum lengkap, sehingga angka tetap benar untuk riwayat yang panjang.
 */
export const useWorkspaceData = (uid: string) => {
  const online = useOnlineStatus()
  const [business, setBusiness] = useState<BusinessProfile>()
  const [businessLoaded, setBusinessLoaded] = useState(false)
  const [snapshot, setSnapshot] = useState<TransactionsSnapshot>()
  const [maxDocuments, setMaxDocuments] = useState(PAGE_SIZE)
  const [syncError, setSyncError] = useState('')
  const [serverTotals, setServerTotals] = useState<FundTotals>()

  useEffect(() => subscribeBusiness(uid, (profile) => {
    setBusiness(profile)
    setBusinessLoaded(true)
  }, (error) => {
    reportError(error, 'subscribe-business')
    setSyncError(syncErrorMessage(error))
    setBusinessLoaded(true)
  }), [uid])

  useEffect(() => subscribeTransactions(uid, maxDocuments, (next) => {
    setSnapshot(next)
    setSyncError('')
  }, (error) => {
    reportError(error, 'subscribe-transactions')
    setSyncError(syncErrorMessage(error))
    setSnapshot((current) => current ?? { transactions: [], complete: true, fromCache: true, hasPendingWrites: false })
  }), [uid, maxDocuments])

  const transactions = useMemo(() => sortNewestFirst(snapshot?.transactions ?? []), [snapshot])
  const complete = snapshot?.complete ?? true

  useEffect(() => {
    if (complete || !online) return undefined
    let cancelled = false
    const timeout = window.setTimeout(() => {
      fetchFundTotals(uid)
        .then((totals) => { if (!cancelled) setServerTotals(totals) })
        .catch((error) => {
          reportError(error, 'fund-totals')
          if (!cancelled) setServerTotals(undefined)
        })
    }, 1_200)
    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [complete, online, transactions, uid])

  const localTotals = useMemo(() => fundTotalsFor(transactions), [transactions])
  const useServerTotals = !complete && serverTotals !== undefined

  const loadMore = useCallback(() => setMaxDocuments((current) => Math.min(current + PAGE_SIZE, MAX_LOADED)), [])

  return {
    business,
    transactions,
    isLoading: !businessLoaded || !snapshot,
    syncError,
    complete,
    canLoadMore: !complete && maxDocuments < MAX_LOADED,
    loadMore,
    /** Total sepanjang waktu per sumber dana (dari server bila data lokal belum lengkap). */
    fundTotals: useServerTotals ? serverTotals : localTotals,
    /** True bila saldo hanya dihitung dari sebagian transaksi (agregasi server tidak tersedia). */
    totalsApproximate: !complete && !useServerTotals,
    hasPendingWrites: snapshot?.hasPendingWrites ?? false,
    fromCache: snapshot?.fromCache ?? true,
  }
}
