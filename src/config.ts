import 'dotenv/config'

const required = (name: string): string => {
  const value = process.env[name]
  if (!value || value.trim() === '') {
    throw new Error(`Missing required env var ${name}. Copy .env.example to .env and fill it in.`)
  }
  return value.trim()
}

const optional = (name: string, fallback = ''): string => {
  const value = process.env[name]
  return value === undefined ? fallback : value.trim()
}

const num = (name: string, fallback: number): number => {
  const raw = process.env[name]
  if (raw === undefined || raw.trim() === '') return fallback
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) {
    throw new Error(`Env var ${name} must be a number, got "${raw}"`)
  }
  return parsed
}

const bool = (name: string, fallback: boolean): boolean => {
  const raw = optional(name).toLowerCase()
  if (raw === '') return fallback
  return raw === 'true' || raw === '1' || raw === 'yes'
}

const chatIds = optional('TELEGRAM_CHAT_IDS')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

export const config = {
  credentials: {
    email: required('PRENOTAMI_EMAIL'),
    password: required('PRENOTAMI_PASSWORD'),
  },
  appointmentServiceRow: num('APPOINTMENT_SERVICE_ROW', 1),
  poll: {
    minSeconds: num('POLL_MIN_SECONDS', 3300),
    maxSeconds: num('POLL_MAX_SECONDS', 4200),
    reloginEvery: num('RELOGIN_EVERY', 12),
    maxConsecutiveErrors: num('MAX_CONSECUTIVE_ERRORS', 3),
  },
  browser: {
    headless: bool('HEADLESS', true),
    locale: optional('BROWSER_LOCALE', 'it-IT'),
    timezone: optional('BROWSER_TIMEZONE', 'Europe/Rome'),
    proxyServer: optional('PROXY_SERVER'),
  },
  telegram: {
    token: optional('TELEGRAM_BOT_TOKEN'),
    chatIds,
    enabled: optional('TELEGRAM_BOT_TOKEN') !== '' && chatIds.length > 0,
    notifyEveryCheck: bool('NOTIFY_EVERY_CHECK', false),
  },
  logLevel: optional('LOG_LEVEL', 'info'),
} as const

if (config.poll.minSeconds > config.poll.maxSeconds) {
  throw new Error('POLL_MIN_SECONDS must be <= POLL_MAX_SECONDS')
}
