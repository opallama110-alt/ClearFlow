import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight, CloudOff, FileClock, Home, Plus, RefreshCw, ShieldCheck, WifiOff } from 'lucide-react'
import {
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  linkWithPopup,
  reauthenticateWithPopup,
  sendEmailVerification,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import BrandMark from '../components/BrandMark'
import BusinessSetup from '../components/BusinessSetup'
import { draftIssues } from '../lib/drafts'
import LoadingScreen from '../components/LoadingScreen'
import ProductTour from '../components/ProductTour'
import ProfilePanel from '../components/ProfilePanel'
import TransactionEditor from '../components/TransactionEditor'
import { auth, reportError, trackEvent } from '../firebase'
import { useConfirm } from '../hooks/useConfirm'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useTheme } from '../hooks/useTheme'
import { useToast } from '../hooks/useToast'
import { useWorkspaceData } from '../hooks/useWorkspaceData'
import { extractTransactionDrafts } from '../lib/ai'
import { authErrorCode, authErrorMessage } from '../lib/authErrors'
import { buildTransactionsCsv, downloadTextFile } from '../lib/csv'
import {
  deleteAllUserData,
  deleteFundTransactionHistory,
  deleteTransaction,
  onLateWriteError,
  saveBusinessProfile,
  saveDraftTransactions,
  saveProductTourVersion,
  updateTransaction,
} from '../lib/data'
import { formatCurrency, initials, inPeriod, makeId, today } from '../lib/format'
import { fundLabel } from '../lib/labels'
import { getPilotConfig } from '../lib/remoteConfig'
import { expenseByCategory, summarizeFund } from '../lib/summary'
import Dashboard from '../screens/Dashboard'
import HistoryScreen from '../screens/HistoryScreen'
import RecordScreen from '../screens/RecordScreen'
import {
  PRODUCT_TOUR_VERSION,
  type BusinessProfileInput,
  type ConfirmedFund,
  type Draft,
  type HistoryFilter,
  type PeriodFilter,
  type RecordMode,
  type Screen,
  type Transaction,
  type WriteOutcome,
} from '../types'

const GOOGLE_AUTH_ENABLED = import.meta.env.VITE_ENABLE_GOOGLE_AUTH === 'true'
const RECENT_LOGIN_WINDOW_MS = 4 * 60_000

const createManualDraft = (): Draft => ({
  id: makeId(),
  date: today(),
  description: '',
  amount: 0,
  flow: 'expense',
  fund: 'business',
  category: 'Operasional',
  confidence: 1,
  source: 'Manual',
  schemaVersion: 2,
})

const setupDefaults = (user: User): BusinessProfileInput => ({
  ownerName: user.displayName ?? '',
  name: '',
  businessType: 'Lainnya',
  city: '',
  bookkeepingStartDate: today(),
  openingBusinessBalance: 0,
  openingPersonalBalance: 0,
  onboardingCompleted: false,
  aiProcessingConsent: false,
})

/** Mendukung pintasan PWA seperti /?screen=record, lalu merapikan URL. */
const initialScreen = (): Screen => {
  const params = new URLSearchParams(window.location.search)
  const requested = params.get('screen')
  if (requested) window.history.replaceState(null, '', window.location.pathname)
  return requested === 'record' || requested === 'history' ? requested : 'dashboard'
}

const savedMessage = (outcome: WriteOutcome, synced: string) =>
  outcome === 'synced' ? synced : `${synced.replace(/\.$/, '')} di perangkat. Akan disinkronkan saat online.`

type Props = { user: User; userRevision: number }

export default function Workspace({ user }: Props) {
  const toast = useToast()
  const confirm = useConfirm()
  const online = useOnlineStatus()
  const { preference: theme, setPreference: setTheme } = useTheme()
  const installPrompt = useInstallPrompt()
  const data = useWorkspaceData(user.uid)
  const { business, transactions } = data

  const [screen, setScreen] = useState<Screen>(initialScreen)
  const [activeFund, setActiveFund] = useState<ConfirmedFund>('business')
  const [period, setPeriod] = useState<PeriodFilter>('month')
  const [recordMode, setRecordMode] = useState<RecordMode>('assistant')
  const [story, setStory] = useState('')
  const [assistantDrafts, setAssistantDrafts] = useState<Draft[]>([])
  const [manualDrafts, setManualDrafts] = useState<Draft[]>(() => [createManualDraft()])
  const [engineNote, setEngineNote] = useState('')
  const [showDraftErrors, setShowDraftErrors] = useState(false)
  const [historySearch, setHistorySearch] = useState('')
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all')
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [busyTransactionId, setBusyTransactionId] = useState('')
  const [editingTransaction, setEditingTransaction] = useState<Transaction>()
  const [profileOpen, setProfileOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const [tourStep, setTourStep] = useState(0)
  const scrollRef = useRef<HTMLElement>(null)

  const aiAllowed = business?.aiProcessingConsent ?? false
  const drafts = recordMode === 'assistant' ? assistantDrafts : manualDrafts
  const setDrafts = recordMode === 'assistant' ? setAssistantDrafts : setManualDrafts
  const modeInitialized = useRef(false)

  // Pengguna tanpa izin AI langsung diarahkan ke formulir manual saat pertama membuka.
  useEffect(() => {
    if (!business || modeInitialized.current) return
    modeInitialized.current = true
    if (!business.aiProcessingConsent) setRecordMode('manual')
  }, [business])

  useEffect(() => onLateWriteError(() => {
    toast.error('Sebagian perubahan ditolak server dan dibatalkan. Periksa kembali catatan Anda.')
  }), [toast])

  useEffect(() => {
    if (aiAllowed) void getPilotConfig()
  }, [aiAllowed])

  useEffect(() => {
    window.scrollTo({ top: 0 })
    scrollRef.current?.scrollTo({ top: 0 })
  }, [screen])

  // ---------------------------------------------------------------------------
  // Turunan data
  // ---------------------------------------------------------------------------

  const summary = useMemo(() => summarizeFund({
    transactions,
    fund: activeFund,
    period,
    openingBalance: activeFund === 'business' ? business?.openingBusinessBalance ?? 0 : business?.openingPersonalBalance ?? 0,
    allTime: data.complete ? undefined : data.fundTotals[activeFund],
  }), [activeFund, business, data.complete, data.fundTotals, period, transactions])

  const categories = useMemo(() => expenseByCategory(transactions, activeFund, period), [activeFund, period, transactions])
  const recentTransactions = useMemo(() => transactions.filter((transaction) => transaction.fund === activeFund).slice(0, 5), [activeFund, transactions])
  const reviewCount = useMemo(() => transactions.filter((transaction) => transaction.status === 'needs-review').length, [transactions])

  const filteredTransactions = useMemo(() => {
    const search = historySearch.trim().toLowerCase()
    return transactions.filter((transaction) => {
      const matchesSearch = !search || `${transaction.description} ${transaction.category}`.toLowerCase().includes(search)
      const matchesFlow = historyFilter === 'all'
        || (historyFilter === 'needs-review' ? transaction.status === 'needs-review' : transaction.flow === historyFilter)
      return transaction.fund === activeFund && matchesSearch && matchesFlow && inPeriod(transaction.date, period)
    })
  }, [activeFund, historyFilter, historySearch, period, transactions])

  // ---------------------------------------------------------------------------
  // Navigasi
  // ---------------------------------------------------------------------------

  const navigate = useCallback((next: Screen) => {
    setScreen(next)
    setShowDraftErrors(false)
  }, [])

  const openHistory = () => {
    setHistoryFilter('all')
    setHistorySearch('')
    navigate('history')
  }

  const openReviews = () => {
    setHistoryFilter('needs-review')
    setPeriod('all')
    navigate('history')
  }

  // ---------------------------------------------------------------------------
  // Pencatatan
  // ---------------------------------------------------------------------------

  const switchRecordMode = (next: RecordMode) => {
    if (next === recordMode) return
    setRecordMode(next)
    setShowDraftErrors(false)
  }

  const updateDraft = useCallback((id: string, patch: Partial<Draft>) => {
    setDrafts((current) => current.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)))
  }, [setDrafts])

  const removeDraft = useCallback((id: string) => {
    setDrafts((current) => {
      const next = current.filter((draft) => draft.id !== id)
      return recordMode === 'manual' && !next.length ? [createManualDraft()] : next
    })
  }, [recordMode, setDrafts])

  const createDraft = async () => {
    if (!story.trim() || isExtracting) return
    if (!aiAllowed) {
      toast.info('Aktifkan izin pemrosesan AI di profil atau gunakan pencatatan manual.')
      return
    }
    setIsExtracting(true)
    setShowDraftErrors(false)
    try {
      const result = await extractTransactionDrafts(story, business)
      if (!result.drafts.length) {
        toast.error('Nominal transaksi belum terbaca. Tambahkan angka seperti "50rb", atau gunakan mode manual.')
        return
      }
      setAssistantDrafts(result.drafts)
      setEngineNote(result.engine === 'gemini' ? '' : result.fallbackReason ?? '')
      toast.success(result.engine === 'gemini'
        ? `${result.drafts.length} draft disiapkan Gemini. Periksa sebelum menyimpan.`
        : `${result.drafts.length} draft disiapkan parser lokal. Periksa sebelum menyimpan.`)
    } catch (error) {
      reportError(error, 'create-draft')
      toast.error('Draft belum bisa dibuat. Coba lagi atau gunakan mode manual.')
    } finally {
      setIsExtracting(false)
    }
  }

  const clearAssistantDrafts = () => {
    setAssistantDrafts([])
    setEngineNote('')
    setShowDraftErrors(false)
  }

  const saveDrafts = async () => {
    if (!drafts.length || isSaving) return
    const invalid = drafts.find((draft) => Object.keys(draftIssues(draft)).length > 0)
    if (invalid) {
      setShowDraftErrors(true)
      const issues = draftIssues(invalid)
      const field = (['description', 'amount', 'date', 'flow', 'fund'] as const).find((key) => issues[key])
      window.requestAnimationFrame(() => document.getElementById(`draft-${invalid.id}-${field}`)?.focus())
      return
    }

    setIsSaving(true)
    try {
      const outcome = await saveDraftTransactions(user.uid, drafts)
      toast.success(savedMessage(outcome, `${drafts.length} transaksi tersimpan.`))
      void trackEvent('transaction_saved', { count: drafts.length, source: drafts[0]?.source ?? 'unknown', offline: outcome === 'queued' })
      const savedFund = drafts[0]?.fund
      if (savedFund === 'business' || savedFund === 'personal') setActiveFund(savedFund)
      if (recordMode === 'assistant') {
        clearAssistantDrafts()
        setStory('')
      } else {
        setManualDrafts([createManualDraft()])
      }
      setShowDraftErrors(false)
      navigate('dashboard')
    } catch (error) {
      reportError(error, 'save-drafts')
      toast.error('Transaksi belum tersimpan. Coba lagi setelah koneksi stabil.')
    } finally {
      setIsSaving(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Riwayat
  // ---------------------------------------------------------------------------

  const saveEditedTransaction = async (transaction: Transaction) => {
    setIsSaving(true)
    try {
      const outcome = await updateTransaction(user.uid, transaction)
      setEditingTransaction(undefined)
      toast.success(savedMessage(outcome, 'Perubahan transaksi tersimpan.'))
    } catch (error) {
      reportError(error, 'update-transaction')
      toast.error('Perubahan transaksi belum tersimpan.')
    } finally {
      setIsSaving(false)
    }
  }

  const removeTransaction = useCallback(async (transaction: Transaction) => {
    if (busyTransactionId || isResetting) return
    const accepted = await confirm({
      title: 'Hapus transaksi?',
      message: `"${transaction.description}" sebesar ${formatCurrency(transaction.amount)} akan dihapus permanen dan saldo dihitung ulang.`,
      confirmLabel: 'Hapus',
      tone: 'danger',
    })
    if (!accepted) return
    setEditingTransaction(undefined)
    setBusyTransactionId(transaction.id)
    try {
      const outcome = await deleteTransaction(user.uid, transaction.id)
      toast.success(savedMessage(outcome, 'Transaksi dihapus.'))
    } catch (error) {
      reportError(error, 'delete-transaction')
      toast.error('Transaksi belum berhasil dihapus.')
    } finally {
      setBusyTransactionId('')
    }
  }, [confirm, busyTransactionId, isResetting, toast, user.uid])

  const removeHistory = async () => {
    if (isResetting) return
    const fundName = fundLabel(activeFund)
    if (!transactions.some((transaction) => transaction.fund === activeFund)) {
      toast.info(`Riwayat ${fundName} sudah kosong.`)
      return
    }
    const accepted = await confirm({
      title: `Hapus seluruh riwayat ${fundName}?`,
      message: `Semua transaksi ${fundName} akan dihapus permanen. Riwayat sumber dana lainnya tidak ikut terhapus. Unduh CSV terlebih dahulu jika perlu.`,
      confirmLabel: 'Hapus riwayat',
      tone: 'danger',
    })
    if (!accepted) return
    setIsResetting(true)
    try {
      const count = await deleteFundTransactionHistory(user.uid, activeFund)
      toast.success(`${count} transaksi ${fundName} dihapus.`)
    } catch (error) {
      reportError(error, 'delete-history')
      toast.error('Riwayat transaksi belum berhasil dihapus.')
    } finally {
      setIsResetting(false)
    }
  }

  const exportCsv = () => {
    if (!filteredTransactions.length) return
    downloadTextFile(
      buildTransactionsCsv(filteredTransactions),
      `clearflow-${activeFund === 'business' ? 'kas-usaha' : 'dana-pribadi'}-${today()}.csv`,
    )
    toast.success(`CSV berisi ${filteredTransactions.length} transaksi sedang diunduh.`)
    void trackEvent('csv_exported', { count: filteredTransactions.length })
  }

  // ---------------------------------------------------------------------------
  // Profil, akun, dan panduan
  // ---------------------------------------------------------------------------

  const finishSetup = async (value: BusinessProfileInput) => {
    setIsSaving(true)
    try {
      await saveBusinessProfile(user.uid, value, false)
      setRecordMode(value.aiProcessingConsent ? 'assistant' : 'manual')
      setTourStep(0)
      setTourOpen(true)
      void trackEvent('onboarding_complete', { business_type: value.businessType, ai_consent: value.aiProcessingConsent })
      void trackEvent('product_tour_started', { source: 'new_account', version: PRODUCT_TOUR_VERSION })
    } catch (error) {
      reportError(error, 'finish-setup')
      toast.error('Data usaha belum tersimpan. Periksa koneksi lalu coba lagi.')
    } finally {
      setIsSaving(false)
    }
  }

  const saveProfile = async (value: BusinessProfileInput) => {
    setIsSaving(true)
    try {
      const outcome = await saveBusinessProfile(user.uid, value, true)
      if (value.aiProcessingConsent && !aiAllowed) setRecordMode('assistant')
      setProfileOpen(false)
      toast.success(savedMessage(outcome, 'Profil usaha diperbarui.'))
    } catch (error) {
      reportError(error, 'save-profile')
      toast.error('Profil belum berhasil disimpan.')
    } finally {
      setIsSaving(false)
    }
  }

  const upgradeEmail = async (name: string, email: string, password: string) => {
    if (!user.isAnonymous) return
    setIsSaving(true)
    try {
      const result = await linkWithCredential(user, EmailAuthProvider.credential(email, password))
      await updateProfile(result.user, { displayName: name })
      await result.user.getIdToken(true)
      void sendEmailVerification(result.user).catch(() => undefined)
      toast.success('Akun tamu sudah diamankan dengan email. Cek kotak masuk untuk verifikasi.')
      setProfileOpen(false)
      void trackEvent('sign_up', { method: 'email_link' })
    } catch (error) {
      toast.error(authErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const upgradeGoogle = async () => {
    if (!user.isAnonymous) return
    setIsSaving(true)
    try {
      const result = await linkWithPopup(user, new GoogleAuthProvider())
      await result.user.getIdToken(true)
      toast.success('Akun tamu sudah terhubung ke Google.')
      setProfileOpen(false)
      void trackEvent('sign_up', { method: 'google_link' })
    } catch (error) {
      toast.error(authErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const sendVerification = async () => {
    if (user.emailVerified) return
    setIsSaving(true)
    try {
      await sendEmailVerification(user)
      toast.success('Email verifikasi sudah dikirim.')
    } catch (error) {
      toast.error(authErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const signOutAccount = async () => {
    if (user.isAnonymous) {
      const accepted = await confirm({
        title: 'Keluar dari akun tamu?',
        message: 'Akun tamu tidak dapat dibuka lagi setelah keluar. Hubungkan email terlebih dahulu jika ingin menyimpan catatan.',
        confirmLabel: 'Tetap keluar',
        tone: 'danger',
      })
      if (!accepted) return
    }
    setIsSaving(true)
    try {
      await signOut(auth)
    } finally {
      setIsSaving(false)
    }
  }

  /** Firebase mewajibkan login baru-baru ini; dicek sebelum data dihapus agar tidak terhapus setengah. */
  const ensureRecentLogin = async () => {
    if (user.isAnonymous) return true
    const { authTime } = await user.getIdTokenResult()
    if (Date.now() - Date.parse(authTime) < RECENT_LOGIN_WINDOW_MS) return true
    const usesGoogle = user.providerData.some((provider) => provider.providerId === 'google.com')
    if (usesGoogle) {
      await reauthenticateWithPopup(user, new GoogleAuthProvider())
      return true
    }
    toast.error('Demi keamanan, keluar lalu masuk lagi, kemudian hapus akun dalam 4 menit.')
    return false
  }

  const removeAccount = async () => {
    if (!online) {
      toast.error('Sambungkan internet untuk menghapus akun.')
      return
    }
    const accepted = await confirm({
      title: 'Hapus akun dan semua data?',
      message: user.isAnonymous
        ? 'Akun tamu dan seluruh transaksi akan dihapus permanen. Data tidak dapat dipulihkan.'
        : 'Akun, profil usaha, dan seluruh transaksi akan dihapus permanen. Data tidak dapat dipulihkan.',
      confirmLabel: 'Hapus permanen',
      tone: 'danger',
    })
    if (!accepted) return

    setIsSaving(true)
    try {
      if (!(await ensureRecentLogin())) return
      setIsDeletingAccount(true)
      setProfileOpen(false)
      await deleteAllUserData(user.uid)
      await deleteUser(user)
      toast.success('Akun dan seluruh data telah dihapus.')
    } catch (error) {
      setIsDeletingAccount(false)
      if (authErrorCode(error) !== 'auth/popup-closed-by-user') reportError(error, 'delete-account')
      toast.error(authErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const rememberTour = () => {
    void saveProductTourVersion(user.uid, PRODUCT_TOUR_VERSION).catch(() => undefined)
  }

  const skipTour = () => {
    rememberTour()
    setTourOpen(false)
    void trackEvent('product_tour_skipped', { step: tourStep + 1, version: PRODUCT_TOUR_VERSION })
  }

  const finishTour = () => {
    rememberTour()
    setTourOpen(false)
    navigate('record')
    void trackEvent('product_tour_completed', { version: PRODUCT_TOUR_VERSION })
  }

  const reopenTour = () => {
    setProfileOpen(false)
    setTourStep(0)
    setTourOpen(true)
    void trackEvent('product_tour_started', { source: 'profile', version: PRODUCT_TOUR_VERSION })
  }

  const installApp = async () => {
    const accepted = await installPrompt.install()
    if (accepted) toast.success('ClearFlow dipasang di perangkat Anda.')
  }

  // ---------------------------------------------------------------------------
  // Tampilan
  // ---------------------------------------------------------------------------

  if (isDeletingAccount) return <LoadingScreen label="Menghapus akun dan seluruh data..." />
  if (data.isLoading) return <LoadingScreen label="Menyambungkan data usaha..." />

  if (!business) {
    if (data.syncError) {
      return (
        <main className="fullscreen-state">
          <BrandMark size="large" />
          <h1>Data belum bisa dimuat</h1>
          <p>{data.syncError}</p>
          <button type="button" className="primary-button" onClick={() => window.location.reload()}><RefreshCw size={18} /> Coba lagi</button>
          <button type="button" className="link-button" onClick={() => void signOut(auth)}>Keluar</button>
        </main>
      )
    }
    return <BusinessSetup initialValue={setupDefaults(user)} busy={isSaving} onFinish={finishSetup} onExit={() => void signOut(auth)} />
  }

  const syncState = !online ? 'offline' : data.hasPendingWrites ? 'pending' : 'synced'
  const syncLabel = syncState === 'offline' ? 'Offline' : syncState === 'pending' ? 'Menyinkronkan' : 'Tersinkron'

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Lewati ke konten utama</a>
      <div className="app-frame">
        <header className="app-header">
          <div className="header-brand">
            <BrandMark />
            <span className="header-copy"><strong>ClearFlow<span>.AI</span></strong><small>{business.name}</small></span>
          </div>
          <div className="header-actions">
            <span className={`sync-pill ${syncState}`} role="status" title={syncLabel}>
              {syncState === 'offline' ? <WifiOff size={14} aria-hidden="true" /> : syncState === 'pending' ? <CloudOff size={14} aria-hidden="true" /> : <span className="sync-dot" aria-hidden="true" />}
              <span>{syncLabel}</span>
            </span>
            <button className="avatar-button" type="button" onClick={() => setProfileOpen(true)} aria-label="Buka profil usaha">
              {initials(business.ownerName || user.displayName || '')}
            </button>
          </div>
        </header>

        <main className="screen-scroll" id="main-content" ref={scrollRef} tabIndex={-1}>
          <div className="screen" key={screen}>
            {!online && (
              <div className="callout info" role="status">
                <WifiOff size={17} aria-hidden="true" />
                <span>Anda sedang offline. Catatan tetap tersimpan di perangkat dan disinkronkan otomatis saat online.</span>
              </div>
            )}
            {data.syncError && online && <div className="callout danger" role="alert"><span>{data.syncError}</span></div>}
            {user.isAnonymous && (
              <button className="guest-banner" type="button" onClick={() => setProfileOpen(true)}>
                <span className="guest-shield" aria-hidden="true"><ShieldCheck size={17} /></span>
                <span><strong>Anda memakai akun tamu</strong><small>Hubungkan email agar data tidak hilang saat browser dibersihkan.</small></span>
                <ChevronRight size={17} aria-hidden="true" />
              </button>
            )}

            {screen === 'dashboard' && (
              <Dashboard
                ownerName={business.ownerName}
                activeFund={activeFund}
                period={period}
                summary={summary}
                categories={categories}
                recentTransactions={recentTransactions}
                reviewCount={reviewCount}
                totalsApproximate={data.totalsApproximate}
                onFundChange={setActiveFund}
                onPeriodChange={setPeriod}
                onRecord={() => navigate('record')}
                onOpenHistory={openHistory}
                onOpenReviews={openReviews}
              />
            )}
            {screen === 'record' && (
              <RecordScreen
                mode={recordMode}
                story={story}
                drafts={drafts}
                aiAllowed={aiAllowed}
                isExtracting={isExtracting}
                isSaving={isSaving}
                showErrors={showDraftErrors}
                engineNote={engineNote}
                onModeChange={switchRecordMode}
                onStoryChange={setStory}
                onCreateDraft={createDraft}
                onUpdateDraft={updateDraft}
                onRemoveDraft={removeDraft}
                onAddManualDraft={() => setManualDrafts((current) => [...current, createManualDraft()])}
                onClearDrafts={clearAssistantDrafts}
                onSaveDrafts={saveDrafts}
                onOpenProfile={() => setProfileOpen(true)}
              />
            )}
            {screen === 'history' && (
              <HistoryScreen
                transactions={filteredTransactions}
                search={historySearch}
                filter={historyFilter}
                fund={activeFund}
                period={period}
                reviewCount={reviewCount}
                canLoadMore={data.canLoadMore}
                isResetting={isResetting}
                busyTransactionId={busyTransactionId}
                onSearchChange={setHistorySearch}
                onFilterChange={setHistoryFilter}
                onFundChange={setActiveFund}
                onPeriodChange={setPeriod}
                onExport={exportCsv}
                onReset={removeHistory}
                onLoadMore={data.loadMore}
                onOpenTransaction={setEditingTransaction}
              />
            )}
          </div>
        </main>

        <nav className="bottom-nav" aria-label="Navigasi utama">
          <NavButton active={screen === 'dashboard'} icon={<Home size={21} />} label="Beranda" onClick={() => navigate('dashboard')} />
          <NavButton active={screen === 'record'} icon={<Plus size={22} strokeWidth={2.6} />} label="Catat" emphasized onClick={() => navigate('record')} />
          <NavButton active={screen === 'history'} icon={<FileClock size={21} />} label="Riwayat" onClick={openHistory} />
        </nav>
      </div>

      {profileOpen && (
        <ProfilePanel
          user={user}
          profile={business}
          busy={isSaving}
          googleEnabled={GOOGLE_AUTH_ENABLED}
          theme={theme}
          canInstall={installPrompt.available}
          onClose={() => setProfileOpen(false)}
          onSave={saveProfile}
          onSignOut={signOutAccount}
          onSendVerification={sendVerification}
          onUpgradeEmail={upgradeEmail}
          onUpgradeGoogle={upgradeGoogle}
          onOpenTour={reopenTour}
          onDeleteAccount={removeAccount}
          onThemeChange={setTheme}
          onInstall={() => void installApp()}
        />
      )}
      {tourOpen && (
        <ProductTour
          step={tourStep}
          onNext={(nextStep) => {
            setTourStep(nextStep)
            void trackEvent('product_tour_step', { step: nextStep + 1, version: PRODUCT_TOUR_VERSION })
          }}
          onBack={() => setTourStep((current) => Math.max(current - 1, 0))}
          onSkip={skipTour}
          onStart={finishTour}
        />
      )}
      {editingTransaction && (
        <TransactionEditor transaction={editingTransaction} busy={isSaving} onClose={() => setEditingTransaction(undefined)} onSave={saveEditedTransaction} onDelete={(transaction) => void removeTransaction(transaction)} />
      )}
    </div>
  )
}

function NavButton({ active, emphasized = false, icon, label, onClick }: { active: boolean; emphasized?: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-current={active ? 'page' : undefined} className={`${active ? 'active' : ''} ${emphasized ? 'emphasized' : ''}`}>
      <span aria-hidden="true">{icon}</span>
      <small>{label}</small>
    </button>
  )
}
