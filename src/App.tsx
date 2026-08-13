import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Download,
  FileClock,
  Home,
  Lightbulb,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react'
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  linkWithPopup,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import './App.css'
import AuthScreen from './components/AuthScreen'
import BusinessSetup from './components/BusinessSetup'
import ProductTour from './components/ProductTour'
import ProfilePanel from './components/ProfilePanel'
import RupiahInput from './components/RupiahInput'
import TransactionEditor from './components/TransactionEditor'
import { auth, authPersistenceReady, initializeObservability, trackEvent } from './firebase'
import { extractTransactionDrafts } from './lib/ai'
import { authErrorMessage } from './lib/authErrors'
import {
  deleteAllUserData,
  deleteFundTransactionHistory,
  deleteTransaction as deleteTransactionDocument,
  saveBusinessProfile,
  saveDraftTransactions,
  saveProductTourVersion,
  subscribeBusiness,
  subscribeTransactions,
  updateTransaction as updateTransactionDocument,
} from './lib/data'
import {
  formatCompact,
  formatCurrency,
  formatDate,
  inPeriod,
  makeId,
  periodLabel,
  today,
} from './lib/format'
import {
  TRANSACTION_CATEGORIES,
  type BusinessProfile,
  type BusinessProfileInput,
  type ConfirmedFund,
  type Draft,
  type Flow,
  type Fund,
  type HistoryFilter,
  type PeriodFilter,
  type Screen,
  type Transaction,
} from './types'

const GOOGLE_AUTH_ENABLED = import.meta.env.VITE_ENABLE_GOOGLE_AUTH === 'true'
const PRODUCT_TOUR_VERSION = 1

const flowLabel = (flow: Flow) =>
  flow === 'income' ? 'Pemasukan' : flow === 'expense' ? 'Pengeluaran' : 'Perlu klarifikasi'

const fundLabel = (fund: Fund) =>
  fund === 'business' ? 'Kas Usaha' : fund === 'personal' ? 'Kas Pribadi' : 'Pilih sumber dana'

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

function App() {
  const [authUser, setAuthUser] = useState<User | null | undefined>(undefined)
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authNotice, setAuthNotice] = useState('')
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [business, setBusiness] = useState<BusinessProfile>()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [deletingTransactionId, setDeletingTransactionId] = useState('')
  const [syncError, setSyncError] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const [tourStep, setTourStep] = useState(0)
  const [editingTransaction, setEditingTransaction] = useState<Transaction>()
  const [activeFund, setActiveFund] = useState<ConfirmedFund>('business')
  const [period, setPeriod] = useState<PeriodFilter>('month')
  const [input, setInput] = useState('')
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [recordMode, setRecordMode] = useState<'assistant' | 'manual'>('assistant')
  const [historySearch, setHistorySearch] = useState('')
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all')
  const [toast, setToast] = useState('')

  useEffect(() => {
    let unsubscribe: () => void = () => undefined
    authPersistenceReady.finally(() => {
      unsubscribe = onAuthStateChanged(auth, (user) => setAuthUser(user))
    })
    void initializeObservability()
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!authUser) {
      setBusiness(undefined)
      setTransactions([])
      setIsLoadingData(false)
      return undefined
    }

    let profileLoaded = false
    let transactionsLoaded = false
    setIsLoadingData(true)
    setSyncError('')

    const finishLoading = () => {
      if (profileLoaded && transactionsLoaded) setIsLoadingData(false)
    }
    const failSync = () => {
      setSyncError('Data belum bisa disinkronkan. Periksa koneksi lalu coba lagi.')
      setIsLoadingData(false)
    }

    const unsubscribeBusiness = subscribeBusiness(authUser.uid, (profile) => {
      profileLoaded = true
      setBusiness(profile)
      finishLoading()
    }, failSync)
    const unsubscribeTransactions = subscribeTransactions(authUser.uid, (nextTransactions) => {
      transactionsLoaded = true
      setTransactions(nextTransactions)
      setSyncError('')
      finishLoading()
    }, failSync)

    return () => {
      unsubscribeBusiness()
      unsubscribeTransactions()
    }
  }, [authUser])

  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(''), 3_800)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    if (business && !business.aiProcessingConsent && recordMode === 'assistant') setRecordMode('manual')
  }, [business, recordMode])

  const runAuth = async (action: () => Promise<unknown>, successMessage = '') => {
    setAuthBusy(true)
    setAuthError('')
    setAuthNotice('')
    try {
      await action()
      if (successMessage) setAuthNotice(successMessage)
    } catch (error) {
      setAuthError(authErrorMessage(error))
      throw error
    } finally {
      setAuthBusy(false)
    }
  }

  const emailLogin = async (email: string, password: string) => {
    await runAuth(async () => {
      await signInWithEmailAndPassword(auth, email, password)
      void trackEvent('login', { method: 'email' })
    }).catch(() => undefined)
  }

  const emailRegister = async (name: string, email: string, password: string) => {
    await runAuth(async () => {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(result.user, { displayName: name })
      await sendEmailVerification(result.user)
      void trackEvent('sign_up', { method: 'email' })
    }).catch(() => undefined)
  }

  const resetPassword = async (email: string) => {
    await runAuth(
      () => sendPasswordResetEmail(auth, email),
      'Tautan pemulihan sudah dikirim. Periksa kotak masuk dan folder spam.',
    ).catch(() => undefined)
  }

  const googleLogin = async () => {
    await runAuth(async () => {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      await signInWithPopup(auth, provider)
      void trackEvent('login', { method: 'google' })
    }).catch(() => undefined)
  }

  const guestLogin = async () => {
    await runAuth(async () => {
      await signInAnonymously(auth)
      void trackEvent('login', { method: 'anonymous' })
    }).catch(() => undefined)
  }

  const finishSetup = async (value: BusinessProfileInput) => {
    if (!authUser) return
    setIsSaving(true)
    try {
      await saveBusinessProfile(authUser.uid, value, false)
      setTourStep(0)
      setTourOpen(true)
      setToast('Ruang usaha siap. Anda dapat mulai mencatat.')
      void trackEvent('onboarding_complete', { business_type: value.businessType })
      void trackEvent('product_tour_started', { source: 'new_account', version: PRODUCT_TOUR_VERSION })
    } catch {
      setToast('Data usaha belum tersimpan. Periksa koneksi lalu coba lagi.')
    } finally {
      setIsSaving(false)
    }
  }

  const saveProfile = async (value: BusinessProfileInput) => {
    if (!authUser) return
    setIsSaving(true)
    try {
      await saveBusinessProfile(authUser.uid, value, true)
      setProfileOpen(false)
      setToast('Profil usaha berhasil diperbarui.')
    } catch {
      setToast('Profil belum berhasil disimpan.')
    } finally {
      setIsSaving(false)
    }
  }

  const upgradeEmail = async (name: string, email: string, password: string) => {
    if (!authUser?.isAnonymous) return
    setIsSaving(true)
    try {
      const credential = EmailAuthProvider.credential(email, password)
      const result = await linkWithCredential(authUser, credential)
      await updateProfile(result.user, { displayName: name })
      await sendEmailVerification(result.user)
      setToast('Akun tamu sudah diamankan dengan email.')
      setProfileOpen(false)
      void trackEvent('sign_up', { method: 'email_link' })
    } catch (error) {
      setToast(authErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const upgradeGoogle = async () => {
    if (!authUser?.isAnonymous) return
    setIsSaving(true)
    try {
      await linkWithPopup(authUser, new GoogleAuthProvider())
      setToast('Akun tamu sudah terhubung ke Google.')
      setProfileOpen(false)
      void trackEvent('sign_up', { method: 'google_link' })
    } catch (error) {
      setToast(authErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const sendVerification = async () => {
    if (!authUser || authUser.emailVerified) return
    setIsSaving(true)
    try {
      await sendEmailVerification(authUser)
      setToast('Email verifikasi sudah dikirim.')
    } catch (error) {
      setToast(authErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const signOutAccount = async () => {
    setIsSaving(true)
    try {
      await signOut(auth)
      setProfileOpen(false)
      setScreen('dashboard')
    } finally {
      setIsSaving(false)
    }
  }

  const removeAccount = async () => {
    if (!authUser) return
    const message = authUser.isAnonymous
      ? 'Hapus akun tamu dan seluruh transaksi? Data tidak dapat dipulihkan.'
      : 'Hapus akun, profil usaha, dan seluruh transaksi? Data tidak dapat dipulihkan.'
    if (!window.confirm(message)) return

    setIsSaving(true)
    try {
      await deleteAllUserData(authUser.uid)
      await deleteUser(authUser)
      setProfileOpen(false)
      setToast('Akun dan seluruh data telah dihapus.')
    } catch (error) {
      setToast(authErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const confirmedTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.status === 'confirmed'),
    [transactions],
  )
  const businessTransactions = useMemo(
    () => confirmedTransactions.filter((transaction) => transaction.fund === 'business'),
    [confirmedTransactions],
  )
  const personalTransactions = useMemo(
    () => confirmedTransactions.filter((transaction) => transaction.fund === 'personal'),
    [confirmedTransactions],
  )
  const currentAllTransactions = activeFund === 'business' ? businessTransactions : personalTransactions
  const currentPeriodTransactions = currentAllTransactions.filter((transaction) => inPeriod(transaction.date, period))
  const income = currentPeriodTransactions.filter((transaction) => transaction.flow === 'income').reduce((total, transaction) => total + transaction.amount, 0)
  const expense = currentPeriodTransactions.filter((transaction) => transaction.flow === 'expense').reduce((total, transaction) => total + transaction.amount, 0)
  const allIncome = currentAllTransactions.filter((transaction) => transaction.flow === 'income').reduce((total, transaction) => total + transaction.amount, 0)
  const allExpense = currentAllTransactions.filter((transaction) => transaction.flow === 'expense').reduce((total, transaction) => total + transaction.amount, 0)
  const openingBalance = activeFund === 'business' ? business?.openingBusinessBalance ?? 0 : business?.openingPersonalBalance ?? 0
  const balance = openingBalance + allIncome - allExpense
  const reviewCount = transactions.filter((transaction) => transaction.status === 'needs-review').length
  const recentTransactions = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4)
  const categorySpend = useMemo(() => {
    const totals = new Map<string, number>()
    businessTransactions
      .filter((transaction) => transaction.flow === 'expense' && inPeriod(transaction.date, period))
      .forEach((transaction) => totals.set(transaction.category, (totals.get(transaction.category) ?? 0) + transaction.amount))
    return [...totals.entries()].sort((a, b) => b[1] - a[1])[0]
  }, [businessTransactions, period])

  const filteredTransactions = useMemo(() => {
    const search = historySearch.trim().toLowerCase()
    return [...transactions]
      .filter((transaction) => {
        const matchesSearch = !search || `${transaction.description} ${transaction.category}`.toLowerCase().includes(search)
        const matchesFlow = historyFilter === 'all'
          || (historyFilter === 'needs-review' ? transaction.status === 'needs-review' : transaction.flow === historyFilter)
        return transaction.fund === activeFund && matchesSearch && matchesFlow && inPeriod(transaction.date, period)
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [activeFund, historyFilter, historySearch, period, transactions])

  const updateDraft = (id: string, field: keyof Draft, value: string | number) => {
    setDrafts((current) => current.map((draft) => draft.id === id ? { ...draft, [field]: value } as Draft : draft))
  }

  const createDraft = async () => {
    if (!input.trim()) {
      setToast('Tulis transaksi beserta nominal, misalnya "jualan 50rb".')
      return
    }
    if (!business?.aiProcessingConsent) {
      setToast('Aktifkan izin pemrosesan AI di profil atau gunakan pencatatan manual.')
      return
    }

    setIsExtracting(true)
    try {
      const result = await extractTransactionDrafts(input, business)
      if (!result.drafts.length) {
        setToast('Transaksi belum dapat dibaca. Gunakan mode manual agar tetap bisa mencatat.')
        return
      }
      setDrafts(result.drafts)
      setToast(result.engine === 'gemini'
        ? `${result.drafts.length} draft disiapkan oleh Gemini. Tetap periksa sebelum menyimpan.`
        : result.fallbackReason ?? 'Draft disiapkan dengan parser lokal.')
    } finally {
      setIsExtracting(false)
    }
  }

  const clearDraft = () => {
    setDrafts([])
    setInput('')
  }

  const switchRecordMode = (next: 'assistant' | 'manual') => {
    if (next === 'assistant' && !business?.aiProcessingConsent) {
      setToast('Aktifkan izin Firebase AI Logic dari profil usaha terlebih dahulu.')
      return
    }
    setRecordMode(next)
    setInput('')
    setDrafts(next === 'manual' ? [createManualDraft()] : [])
  }

  const saveDrafts = async () => {
    if (!authUser || !drafts.length || isSaving) return
    if (drafts.some((draft) => draft.fund === 'review' || draft.flow === 'review')) {
      setToast('Lengkapi transaksi yang perlu klarifikasi sebelum menyimpan.')
      return
    }
    if (drafts.some((draft) => !draft.description.trim() || draft.amount <= 0 || !draft.date)) {
      setToast('Keterangan, nominal, dan tanggal wajib diisi.')
      return
    }

    setIsSaving(true)
    try {
      await saveDraftTransactions(authUser.uid, drafts)
      setToast(`${drafts.length} transaksi tersimpan dan tersinkron.`)
      void trackEvent('transaction_saved', { count: drafts.length, source: drafts[0]?.source ?? 'unknown' })
      clearDraft()
      setScreen('dashboard')
    } catch {
      setToast('Transaksi belum tersimpan. Coba lagi setelah koneksi stabil.')
    } finally {
      setIsSaving(false)
    }
  }

  const saveEditedTransaction = async (transaction: Transaction) => {
    if (!authUser) return
    setIsSaving(true)
    try {
      await updateTransactionDocument(authUser.uid, transaction)
      setEditingTransaction(undefined)
      setToast('Transaksi berhasil diperbarui.')
    } catch {
      setToast('Perubahan transaksi belum tersimpan.')
    } finally {
      setIsSaving(false)
    }
  }

  const removeTransaction = async (transaction: Transaction) => {
    if (!authUser || deletingTransactionId || isResetting) return
    if (!window.confirm(`Hapus transaksi "${transaction.description}" sebesar ${formatCurrency(transaction.amount)}?`)) return
    setDeletingTransactionId(transaction.id)
    try {
      await deleteTransactionDocument(authUser.uid, transaction.id)
      setToast('Transaksi berhasil dihapus.')
    } catch {
      setToast('Transaksi belum berhasil dihapus.')
    } finally {
      setDeletingTransactionId('')
    }
  }

  const removeHistory = async () => {
    if (!authUser || isResetting) return
    const fundName = activeFund === 'business' ? 'Kas Usaha' : 'Dana Pribadi'
    if (!transactions.some((transaction) => transaction.fund === activeFund)) {
      setToast(`Riwayat ${fundName} sudah kosong.`)
      return
    }
    if (!window.confirm(`Hapus seluruh riwayat ${fundName}? Riwayat sumber dana lainnya tidak ikut terhapus.`)) return
    setIsResetting(true)
    try {
      await deleteFundTransactionHistory(authUser.uid, activeFund)
      setToast(`Riwayat ${fundName} berhasil dihapus.`)
    } catch {
      setToast('Riwayat transaksi belum berhasil dihapus.')
    } finally {
      setIsResetting(false)
    }
  }

  const exportCsv = () => {
    const rows = filteredTransactions.map((transaction) => [
      transaction.date,
      transaction.description,
      transaction.amount,
      flowLabel(transaction.flow),
      fundLabel(transaction.fund),
      transaction.category,
      transaction.source === 'Gemini' ? 'Gemini' : transaction.source === 'Manual' ? 'Manual' : 'Parser lokal',
      transaction.status === 'confirmed' ? 'Dikonfirmasi' : 'Perlu ditinjau',
    ])
    const csv = [
      ['Tanggal', 'Keterangan', 'Nominal', 'Arus Kas', 'Sumber Dana', 'Kategori', 'Sumber Draft', 'Status'],
      ...rows,
    ].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n')
    const href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = href
    link.download = `clearflow-${activeFund === 'business' ? 'kas-usaha' : 'dana-pribadi'}-${today()}.csv`
    link.click()
    URL.revokeObjectURL(href)
    setToast('CSV transaksi sedang diunduh.')
    void trackEvent('csv_exported', { count: rows.length })
  }

  const navigate = (next: Screen) => {
    setScreen(next)
    if (next !== 'record') clearDraft()
    if (next === 'record' && recordMode === 'manual') setDrafts([createManualDraft()])
  }

  const openReviews = () => {
    setHistoryFilter('needs-review')
    setPeriod('all')
    setScreen('history')
  }

  const rememberTour = () => {
    if (!authUser) return
    window.localStorage.setItem(`clearflow-product-tour-${PRODUCT_TOUR_VERSION}:${authUser.uid}`, 'done')
    void saveProductTourVersion(authUser.uid, PRODUCT_TOUR_VERSION).catch(() => undefined)
  }

  const skipTour = () => {
    rememberTour()
    setTourOpen(false)
    void trackEvent('product_tour_skipped', { step: tourStep + 1, version: PRODUCT_TOUR_VERSION })
  }

  const nextTourStep = () => {
    const nextStep = Math.min(tourStep + 1, 3)
    setTourStep(nextStep)
    void trackEvent('product_tour_step', { step: nextStep + 1, version: PRODUCT_TOUR_VERSION })
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

  if (authUser === undefined) return <LoadingScreen label="Menyiapkan ClearFlow..." />

  if (!authUser) {
    return (
      <AuthScreen
        busy={authBusy}
        error={authError}
        notice={authNotice}
        googleEnabled={GOOGLE_AUTH_ENABLED}
        onEmailLogin={emailLogin}
        onEmailRegister={emailRegister}
        onPasswordReset={resetPassword}
        onGoogle={googleLogin}
        onGuest={guestLogin}
      />
    )
  }

  if (isLoadingData) return <LoadingScreen label="Menyambungkan data usaha..." />

  if (!business) {
    return (
      <BusinessSetup
        initialValue={setupDefaults(authUser)}
        busy={isSaving}
        onFinish={finishSetup}
        onExit={() => signOut(auth)}
      />
    )
  }

  return (
    <main className="app-shell">
      <section className="phone-frame" aria-label="Aplikasi ClearFlow AI">
        <header className="app-header">
          <button className="brand-button" type="button" onClick={() => setProfileOpen(true)} aria-label="Buka profil usaha">
            <span className="brand-mark">C</span>
            <span className="brand-copy"><strong>ClearFlow<span>.AI</span></strong><small>{business.name}</small></span>
            <ChevronDown size={15} />
          </button>
          <button className="icon-button notification" type="button" onClick={openReviews} aria-label={reviewCount ? `Buka ${reviewCount} transaksi yang perlu ditinjau` : 'Tidak ada notifikasi baru'}>
            <Bell size={20} />
            {reviewCount > 0 && <span className="notification-dot" />}
          </button>
        </header>

        <div className="screen-content">
          {syncError && <div className="sync-banner sync-error" role="alert">{syncError}</div>}
          {authUser.isAnonymous && <button className="guest-banner" type="button" onClick={() => setProfileOpen(true)}><ShieldCheckIcon /> <span><strong>Anda memakai akun tamu</strong><small>Hubungkan email agar data tidak hilang saat browser dibersihkan.</small></span><ChevronRight size={17} /></button>}

          {screen === 'dashboard' && (
            <Dashboard
              activeFund={activeFund}
              balance={balance}
              businessName={business.name}
              categorySpend={categorySpend}
              expense={expense}
              income={income}
              period={period}
              recentTransactions={recentTransactions}
              reviewCount={reviewCount}
              setActiveFund={setActiveFund}
              setPeriod={setPeriod}
              onRecord={() => navigate('record')}
              onReview={openReviews}
            />
          )}
          {screen === 'record' && (
            <RecordScreen
              mode={recordMode}
              input={input}
              drafts={drafts}
              aiAllowed={business.aiProcessingConsent}
              isExtracting={isExtracting}
              isSaving={isSaving}
              onModeChange={switchRecordMode}
              onInputChange={(event) => setInput(event.target.value)}
              onCreateDraft={createDraft}
              onUpdateDraft={updateDraft}
              onClearDraft={clearDraft}
              onSaveDrafts={saveDrafts}
            />
          )}
          {screen === 'history' && (
            <HistoryScreen
              transactions={filteredTransactions}
              search={historySearch}
              filter={historyFilter}
              fund={activeFund}
              period={period}
              onSearchChange={(event) => setHistorySearch(event.target.value)}
              onFilterChange={setHistoryFilter}
              onFundChange={setActiveFund}
              onPeriodChange={setPeriod}
              onExport={exportCsv}
              onReset={removeHistory}
              onEditTransaction={setEditingTransaction}
              onDeleteTransaction={removeTransaction}
              isResetting={isResetting}
              deletingTransactionId={deletingTransactionId}
            />
          )}
        </div>

        <nav className="bottom-nav" aria-label="Navigasi utama">
          <NavButton active={screen === 'dashboard'} icon={<Home size={21} />} label="Beranda" onClick={() => navigate('dashboard')} />
          <NavButton active={screen === 'record'} icon={<Plus size={22} strokeWidth={2.6} />} label="Catat" emphasized onClick={() => navigate('record')} />
          <NavButton active={screen === 'history'} icon={<FileClock size={21} />} label="Riwayat" onClick={() => navigate('history')} />
        </nav>
      </section>

      {profileOpen && (
        <ProfilePanel
          user={authUser}
          profile={business}
          busy={isSaving}
          googleEnabled={GOOGLE_AUTH_ENABLED}
          onClose={() => setProfileOpen(false)}
          onSave={saveProfile}
          onSignOut={signOutAccount}
          onSendVerification={sendVerification}
          onUpgradeEmail={upgradeEmail}
          onUpgradeGoogle={upgradeGoogle}
          onOpenTour={reopenTour}
          onDeleteAccount={removeAccount}
        />
      )}
      {tourOpen && <ProductTour step={tourStep} onNext={nextTourStep} onSkip={skipTour} onStart={finishTour} />}
      {editingTransaction && <TransactionEditor transaction={editingTransaction} busy={isSaving} onClose={() => setEditingTransaction(undefined)} onSave={saveEditedTransaction} />}
      {toast && <div className="toast" role="status"><Check size={17} /> {toast}</div>}
    </main>
  )
}

function LoadingScreen({ label }: { label: string }) {
  return <main className="loading-shell"><span className="brand-mark large">C</span><div className="loading-line" /><p>{label}</p></main>
}

function ShieldCheckIcon() {
  return <span className="guest-shield"><Check size={15} /></span>
}

function Dashboard({
  activeFund,
  balance,
  businessName,
  categorySpend,
  expense,
  income,
  period,
  recentTransactions,
  reviewCount,
  setActiveFund,
  setPeriod,
  onRecord,
  onReview,
}: {
  activeFund: ConfirmedFund
  balance: number
  businessName: string
  categorySpend?: [string, number]
  expense: number
  income: number
  period: PeriodFilter
  recentTransactions: Transaction[]
  reviewCount: number
  setActiveFund: (fund: ConfirmedFund) => void
  setPeriod: (period: PeriodFilter) => void
  onRecord: () => void
  onReview: () => void
}) {
  const firstName = businessName.replace(/^toko\s+/i, '') || 'Anda'
  return (
    <>
      <div className="page-intro">
        <div><p className="eyebrow">RINGKASAN USAHA</p><h1>Halo, {firstName}</h1></div>
        <PeriodSelect value={period} onChange={setPeriod} />
      </div>

      <div className="fund-switch" role="tablist" aria-label="Pilih sumber dana">
        <button type="button" role="tab" aria-selected={activeFund === 'business'} className={activeFund === 'business' ? 'active' : ''} onClick={() => setActiveFund('business')}><WalletCards size={17} /> Kas Usaha</button>
        <button type="button" role="tab" aria-selected={activeFund === 'personal'} className={activeFund === 'personal' ? 'active personal-active' : ''} onClick={() => setActiveFund('personal')}><span className="personal-icon">P</span> Dana Pribadi</button>
      </div>

      <section className="balance-card">
        <div className="balance-card-top"><div><p>{activeFund === 'business' ? 'Saldo kas usaha saat ini' : 'Saldo dana pribadi saat ini'}</p><strong>{formatCurrency(balance)}</strong></div><span className="balance-sparkle"><Sparkles size={18} /></span></div>
        <div className="balance-divider" />
        <div className="balance-footer"><span><ArrowUpRight size={16} /> Pemasukan {periodLabel(period)} <b>{formatCompact(income)}</b></span><span><ArrowDownLeft size={16} /> Pengeluaran <b>{formatCompact(expense)}</b></span></div>
      </section>

      <section className="record-prompt"><div className="prompt-icon"><Sparkles size={20} /></div><div><strong>Ceritakan transaksi hari ini</strong><p>Tulis seperti mengirim chat, lalu periksa draft-nya.</p></div><button type="button" onClick={onRecord} aria-label="Catat transaksi"><ChevronRight size={21} /></button></section>

      {reviewCount > 0 && <button className="review-alert" type="button" onClick={onReview}><span><CircleAlert size={19} /></span><span><strong>{reviewCount} transaksi perlu ditinjau</strong><small>Pastikan sumber dana sudah tepat.</small></span><ChevronRight size={18} /></button>}

      <section className="section-heading"><div><p className="eyebrow">ARUS KAS</p><h2>Gambaran {periodLabel(period).toLowerCase()}</h2></div><span className="estimate-label">Estimasi</span></section>
      <section className="cash-insight-card">
        <div className="insight-main"><span className="chart-ring"><span /></span><div><p>Selisih pemasukan dan pengeluaran</p><strong className={income - expense >= 0 ? 'positive' : 'negative'}>{income - expense >= 0 ? '+' : '-'}{formatCurrency(Math.abs(income - expense))}</strong><small>Bukan laporan laba-rugi resmi</small></div></div>
        {categorySpend && <div className="insight-tip"><Lightbulb size={16} /> Pengeluaran terbesar: <b>{categorySpend[0]}</b> ({formatCurrency(categorySpend[1])})</div>}
      </section>

      <section className="section-heading transaction-heading"><div><p className="eyebrow">TERBARU</p><h2>Transaksi terakhir</h2></div><button type="button" className="text-button" onClick={onReview}>Lihat semua</button></section>
      <section className="transaction-list">{recentTransactions.length ? recentTransactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} />) : <div className="empty-state dashboard-empty"><FileClock size={27} /><strong>Belum ada transaksi</strong><p>Catat transaksi pertama untuk melihat ringkasan kas.</p></div>}</section>
    </>
  )
}

function RecordScreen({
  mode,
  input,
  drafts,
  aiAllowed,
  isExtracting,
  isSaving,
  onModeChange,
  onInputChange,
  onCreateDraft,
  onUpdateDraft,
  onClearDraft,
  onSaveDrafts,
}: {
  mode: 'assistant' | 'manual'
  input: string
  drafts: Draft[]
  aiAllowed: boolean
  isExtracting: boolean
  isSaving: boolean
  onModeChange: (mode: 'assistant' | 'manual') => void
  onInputChange: (event: ChangeEvent<HTMLTextAreaElement>) => void
  onCreateDraft: () => Promise<void>
  onUpdateDraft: (id: string, field: keyof Draft, value: string | number) => void
  onClearDraft: () => void
  onSaveDrafts: () => Promise<void>
}) {
  const hasOpenReview = drafts.some((draft) => draft.fund === 'review' || draft.flow === 'review')
  return (
    <>
      <div className="record-heading"><p className="eyebrow">CATAT TRANSAKSI</p><h1>Hari ini ada transaksi apa?</h1><p>Pilih cara tercepat untuk Anda. Semua data tetap diperiksa sebelum disimpan.</p></div>
      <p className="record-tip"><Lightbulb size={15} /> Punya modal awal? Catat di sini, misalnya “Modal awal 1 jt masuk Kas Usaha”.</p>

      <div className="record-mode" role="tablist" aria-label="Cara mencatat transaksi">
        <button type="button" role="tab" aria-selected={mode === 'assistant'} className={mode === 'assistant' ? 'selected' : ''} onClick={() => onModeChange('assistant')}><Sparkles size={16} /> Dengan cerita</button>
        <button type="button" role="tab" aria-selected={mode === 'manual'} className={mode === 'manual' ? 'selected' : ''} onClick={() => onModeChange('manual')}><Pencil size={16} /> Isi manual</button>
      </div>

      {mode === 'assistant' && (
        <section className="composer-card">
          <label htmlFor="transaction-input">Cerita transaksi</label>
          <textarea id="transaction-input" value={input} onChange={onInputChange} maxLength={1_200} placeholder="Contoh: Jualan 300rb, lalu beli plastik kemasan 50rb pakai uang kas usaha." rows={5} />
          <div className="composer-counter">{input.length}/1.200 karakter</div>
          <button className="primary-button" type="button" onClick={onCreateDraft} disabled={isExtracting || !input.trim() || !aiAllowed}><Sparkles size={18} /> {isExtracting ? 'Gemini sedang menyiapkan draft...' : 'Analisis dengan Gemini'}</button>
          <p className="composer-note"><CircleAlert size={14} /> Teks diproses melalui Firebase AI Logic. Hasil hanya berupa draft dan tidak disimpan sebelum Anda konfirmasi.</p>
          <details className="ai-explainer">
            <summary>Bagaimana AI membaca cerita?</summary>
            <ol>
              <li>Cerita dikirim ke Gemini melalui Firebase AI Logic.</li>
              <li>Gemini mengembalikan draft dengan format terstruktur.</li>
              <li>ClearFlow memeriksa format dan menandai bagian yang belum pasti.</li>
              <li>Hanya transaksi yang Anda konfirmasi yang disimpan.</li>
            </ol>
          </details>
          {!aiAllowed && <p className="inline-error">Pemrosesan AI dinonaktifkan. Aktifkan dari profil atau gunakan mode manual.</p>}
        </section>
      )}

      {drafts.length > 0 && (
        <section className={`draft-section ${mode === 'manual' ? 'manual-draft-section' : ''}`}>
          <div className="draft-heading"><div><p className="eyebrow">{mode === 'manual' ? 'FORM TRANSAKSI' : 'HASIL EKSTRAKSI'}</p><h2>{mode === 'manual' ? 'Isi detail transaksi' : `${drafts.length} transaksi ditemukan`}</h2></div>{mode === 'assistant' && <button className="icon-button" type="button" onClick={onClearDraft} aria-label="Buang draft"><X size={19} /></button>}</div>
          {hasOpenReview && <div className="clarification-note"><CircleAlert size={17} /> Ada detail yang belum pasti. Pilih nilainya sebelum menyimpan.</div>}
          <div className="draft-list">{drafts.map((draft) => <DraftCard key={draft.id} draft={draft} onUpdate={onUpdateDraft} />)}</div>
          <button className="primary-button save-button" type="button" onClick={onSaveDrafts} disabled={isSaving || hasOpenReview}><Check size={18} /> {isSaving ? 'Menyimpan...' : `Konfirmasi dan simpan ${drafts.length} transaksi`}</button>
          <p className="audit-note">Anda dapat mengedit atau menghapus transaksi kembali dari menu Riwayat.</p>
        </section>
      )}
    </>
  )
}

function DraftCard({ draft, onUpdate }: { draft: Draft; onUpdate: (id: string, field: keyof Draft, value: string | number) => void }) {
  const confidence = Math.round(draft.confidence * 100)
  const needsReview = draft.fund === 'review' || draft.flow === 'review'
  return (
    <article className={`draft-card ${needsReview ? 'draft-needs-review' : ''}`}>
      <div className="draft-card-head">
        <div className={`transaction-icon ${draft.flow === 'income' ? 'income-icon' : draft.flow === 'expense' ? 'expense-icon' : 'review-icon'}`}>{draft.flow === 'income' ? <ArrowUpRight size={18} /> : draft.flow === 'expense' ? <ArrowDownLeft size={18} /> : <CircleAlert size={18} />}</div>
        <div><strong>{draft.flow === 'review' ? 'Butuh klarifikasi' : flowLabel(draft.flow)}</strong><small>{draft.source === 'Gemini' ? `Gemini ${confidence}%` : draft.source === 'Manual' ? 'Diisi manual' : `Parser lokal ${confidence}%`}</small></div>
      </div>
      <label className="field-label">Keterangan<input maxLength={160} value={draft.description} onChange={(event) => onUpdate(draft.id, 'description', event.target.value)} /></label>
      <div className="draft-fields">
        <label className="field-label">Nominal<span className="amount-field"><span>Rp</span><RupiahInput value={draft.amount} onValueChange={(amount) => onUpdate(draft.id, 'amount', amount)} /></span></label>
        <label className="field-label">Tanggal<input type="date" value={draft.date} onChange={(event) => onUpdate(draft.id, 'date', event.target.value)} /></label>
      </div>
      <div className="draft-fields">
        <label className="field-label">Sumber dana<select className={draft.fund === 'review' ? 'needs-choice' : ''} value={draft.fund} onChange={(event) => onUpdate(draft.id, 'fund', event.target.value)}><option value="review">Pilih sumber dana</option><option value="business">Kas Usaha</option><option value="personal">Dana Pribadi</option></select></label>
        <label className="field-label">Kategori<select value={draft.category} onChange={(event) => onUpdate(draft.id, 'category', event.target.value)}>{TRANSACTION_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
      </div>
      <label className="field-label">Arus kas<select className={draft.flow === 'review' ? 'needs-choice' : ''} value={draft.flow} onChange={(event) => onUpdate(draft.id, 'flow', event.target.value)}><option value="review">Pilih arus kas</option><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option></select></label>
      {needsReview && <p className="draft-question"><CircleAlert size={15} /> Informasi ini belum cukup jelas. Anda tetap menentukan pilihan akhirnya.</p>}
    </article>
  )
}

function HistoryScreen({
  transactions,
  search,
  filter,
  fund,
  period,
  onSearchChange,
  onFilterChange,
  onFundChange,
  onPeriodChange,
  onExport,
  onReset,
  onEditTransaction,
  onDeleteTransaction,
  isResetting,
  deletingTransactionId,
}: {
  transactions: Transaction[]
  search: string
  filter: HistoryFilter
  fund: ConfirmedFund
  period: PeriodFilter
  onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void
  onFilterChange: (filter: HistoryFilter) => void
  onFundChange: (fund: ConfirmedFund) => void
  onPeriodChange: (period: PeriodFilter) => void
  onExport: () => void
  onReset: () => Promise<void>
  onEditTransaction: (transaction: Transaction) => void
  onDeleteTransaction: (transaction: Transaction) => Promise<void>
  isResetting: boolean
  deletingTransactionId: string
}) {
  return (
    <>
      <div className="history-header"><div><p className="eyebrow">SEMUA CATATAN</p><h1>Riwayat transaksi</h1></div><button type="button" className="export-button" onClick={onExport} disabled={!transactions.length}><Download size={17} /> CSV</button></div>
      <div className="fund-switch history-fund-switch" role="tablist" aria-label="Pilih riwayat sumber dana">
        <button type="button" role="tab" aria-selected={fund === 'business'} className={fund === 'business' ? 'active' : ''} onClick={() => onFundChange('business')}><WalletCards size={17} /> Kas Usaha</button>
        <button type="button" role="tab" aria-selected={fund === 'personal'} className={fund === 'personal' ? 'active personal-active' : ''} onClick={() => onFundChange('personal')}><span className="personal-icon">P</span> Dana Pribadi</button>
      </div>
      <label className="search-input"><Search size={19} /><input value={search} onChange={onSearchChange} placeholder="Cari transaksi atau kategori" /></label>
      <div className="history-controls"><div className="filter-chips" aria-label="Filter arus kas">{([['all', 'Semua'], ['income', 'Pemasukan'], ['expense', 'Pengeluaran'], ['needs-review', 'Perlu tinjau']] as const).map(([value, label]) => <button type="button" className={filter === value ? 'selected' : ''} onClick={() => onFilterChange(value)} key={value}>{label}</button>)}</div><PeriodSelect value={period} onChange={onPeriodChange} /></div>
      <div className="history-summary"><span>{transactions.length} transaksi</span><span><CalendarDays size={15} /> {periodLabel(period)}</span></div>
      <section className="transaction-list history-list">{transactions.length ? transactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} showDate showFund={false} onEdit={onEditTransaction} onDelete={onDeleteTransaction} isDeleting={deletingTransactionId === transaction.id} />) : <div className="empty-state"><Search size={28} /><strong>Belum ada transaksi {fund === 'business' ? 'Kas Usaha' : 'Dana Pribadi'}</strong><p>Coba ubah pencarian, filter, atau periode.</p></div>}</section>
      <button className="reset-data-button" type="button" onClick={onReset} disabled={isResetting}>{isResetting ? 'Menghapus riwayat...' : `Hapus riwayat ${fund === 'business' ? 'Kas Usaha' : 'Dana Pribadi'}`}</button>
      <p className="history-footer">Catatan ini untuk membantu pemantauan internal dan bukan dokumen pajak resmi.</p>
    </>
  )
}

function TransactionRow({ transaction, showDate = false, showFund = true, onEdit, onDelete, isDeleting = false }: {
  transaction: Transaction
  showDate?: boolean
  showFund?: boolean
  onEdit?: (transaction: Transaction) => void
  onDelete?: (transaction: Transaction) => Promise<void>
  isDeleting?: boolean
}) {
  const isIncome = transaction.flow === 'income'
  const source = transaction.source === 'Gemini' ? 'Gemini' : transaction.source === 'Manual' ? 'Manual' : 'Parser lokal'
  return (
    <article className={`transaction-row ${onDelete ? 'has-actions' : ''}`}>
      <span className={`transaction-icon ${isIncome ? 'income-icon' : 'expense-icon'}`}>{isIncome ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}</span>
      <div className="transaction-copy"><strong>{transaction.description}</strong><small>{showDate ? `${formatDate(transaction.date)} · ` : ''}{showFund ? `${transaction.fund === 'business' ? 'Kas Usaha' : 'Dana Pribadi'} · ` : ''}{transaction.category} · {source}</small></div>
      <div className="transaction-amount"><strong className={isIncome ? 'positive' : 'negative'}>{isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}</strong>{transaction.status === 'needs-review' ? <span className="status-review">Perlu tinjau</span> : <span className="status-confirmed">Terkonfirmasi</span>}</div>
      {onDelete && <div className="transaction-actions"><button className="edit-transaction-button" type="button" onClick={() => onEdit?.(transaction)} aria-label={`Edit transaksi ${transaction.description}`} title="Edit transaksi"><Pencil size={15} /></button><button className="delete-transaction-button" type="button" onClick={() => onDelete(transaction)} disabled={isDeleting} aria-label={`Hapus transaksi ${transaction.description}`} title="Hapus transaksi"><Trash2 size={15} /></button></div>}
    </article>
  )
}

function PeriodSelect({ value, onChange }: { value: PeriodFilter; onChange: (period: PeriodFilter) => void }) {
  return <label className="period-select"><CalendarDays size={15} /><select aria-label="Pilih periode" value={value} onChange={(event) => onChange(event.target.value as PeriodFilter)}><option value="week">Minggu ini</option><option value="month">Bulan ini</option><option value="all">Semua waktu</option></select><ChevronDown size={14} /></label>
}

function NavButton({ active, emphasized = false, icon, label, onClick }: { active: boolean; emphasized?: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`${active ? 'nav-active' : ''} ${emphasized ? 'nav-emphasized' : ''}`}><span>{icon}</span><small>{label}</small></button>
}

export default App
