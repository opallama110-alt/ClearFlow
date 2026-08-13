import { firebaseApp } from '../firebase'

export type PilotConfig = {
  aiEnabled: boolean
  aiModel: string
  maxTransactionsPerInput: number
  pilotMode: boolean
}

const defaults: PilotConfig = {
  aiEnabled: true,
  aiModel: 'gemini-3.5-flash-lite',
  maxTransactionsPerInput: 8,
  pilotMode: true,
}

let configPromise: Promise<PilotConfig> | undefined

export const getPilotConfig = () => {
  configPromise ??= (async () => {
    try {
      const {
        fetchAndActivate,
        getBoolean,
        getNumber,
        getRemoteConfig,
        getString,
        isSupported,
      } = await import('firebase/remote-config')
      if (!(await isSupported())) return defaults

      const remoteConfig = getRemoteConfig(firebaseApp)
      remoteConfig.defaultConfig = {
        ai_enabled: defaults.aiEnabled,
        ai_model: defaults.aiModel,
        max_transactions_per_input: defaults.maxTransactionsPerInput,
        pilot_mode: defaults.pilotMode,
      }
      remoteConfig.settings.minimumFetchIntervalMillis = import.meta.env.DEV ? 60_000 : 43_200_000
      await fetchAndActivate(remoteConfig).catch(() => false)

      const maxTransactions = Math.max(1, Math.min(8, Math.round(getNumber(remoteConfig, 'max_transactions_per_input'))))
      return {
        aiEnabled: getBoolean(remoteConfig, 'ai_enabled'),
        aiModel: getString(remoteConfig, 'ai_model').trim() || defaults.aiModel,
        maxTransactionsPerInput: maxTransactions,
        pilotMode: getBoolean(remoteConfig, 'pilot_mode'),
      }
    } catch {
      return defaults
    }
  })()

  return configPromise
}
