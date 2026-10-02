import { firebaseApp, USE_EMULATORS } from '../firebase'
import { MAX_TRANSACTIONS_PER_INPUT } from '../types'

export type PilotConfig = {
  aiEnabled: boolean
  aiModel: string
  maxTransactionsPerInput: number
  pilotMode: boolean
}

export const DEFAULT_PILOT_CONFIG: PilotConfig = {
  aiEnabled: true,
  aiModel: 'gemini-3.5-flash-lite',
  maxTransactionsPerInput: MAX_TRANSACTIONS_PER_INPUT,
  pilotMode: true,
}

let configPromise: Promise<PilotConfig> | undefined

/** Dipanggil lebih awal (saat ruang kerja dibuka) agar permintaan AI pertama tidak menunggu. */
export const getPilotConfig = () => {
  configPromise ??= (async () => {
    if (USE_EMULATORS) return DEFAULT_PILOT_CONFIG
    try {
      const {
        fetchAndActivate,
        getBoolean,
        getNumber,
        getRemoteConfig,
        getString,
        isSupported,
      } = await import('firebase/remote-config')
      if (!(await isSupported())) return DEFAULT_PILOT_CONFIG

      const remoteConfig = getRemoteConfig(firebaseApp)
      remoteConfig.defaultConfig = {
        ai_enabled: DEFAULT_PILOT_CONFIG.aiEnabled,
        ai_model: DEFAULT_PILOT_CONFIG.aiModel,
        max_transactions_per_input: DEFAULT_PILOT_CONFIG.maxTransactionsPerInput,
        pilot_mode: DEFAULT_PILOT_CONFIG.pilotMode,
      }
      remoteConfig.settings.minimumFetchIntervalMillis = import.meta.env.DEV ? 60_000 : 43_200_000
      remoteConfig.settings.fetchTimeoutMillis = 4_000
      await fetchAndActivate(remoteConfig).catch(() => false)

      const maxTransactions = Math.max(1, Math.min(MAX_TRANSACTIONS_PER_INPUT, Math.round(getNumber(remoteConfig, 'max_transactions_per_input'))))
      return {
        aiEnabled: getBoolean(remoteConfig, 'ai_enabled'),
        aiModel: getString(remoteConfig, 'ai_model').trim() || DEFAULT_PILOT_CONFIG.aiModel,
        maxTransactionsPerInput: maxTransactions,
        pilotMode: getBoolean(remoteConfig, 'pilot_mode'),
      }
    } catch {
      return DEFAULT_PILOT_CONFIG
    }
  })()

  return configPromise
}
