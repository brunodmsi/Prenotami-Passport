import 'dotenv/config'
import fs from 'fs'

// For every config name, `<NAME>_FILE` can point at a file whose contents
// are the value. The file path takes precedence over the inline env var.
// This is the standard secrets pattern used by Docker secrets, Kubernetes,
// systemd's LoadCredential, and agenix — the secret never has to land in
// process env (which is readable via /proc/<pid>/environ by anything that
// can stat the process). Trailing whitespace is stripped because most
// secret-writing tools (echo, agenix, sops) tack on a newline.
const readSecretFile = (path: string): string => {
  try {
    return fs.readFileSync(path, 'utf8').trim()
  } catch (err) {
    throw new Error(`Failed to read secret file at ${path}: ${(err as Error).message}`)
  }
}

const fromEnvOrFile = (name: string): string | undefined => {
  const filePath = process.env[`${name}_FILE`]?.trim()
  if (filePath) return readSecretFile(filePath)
  const value = process.env[name]
  return value === undefined ? undefined : value.trim()
}

const required = (name: string): string => {
  const value = fromEnvOrFile(name)
  if (value === undefined || value === '') {
    throw new Error(
      `Missing required value ${name} (or ${name}_FILE). Copy .env.example to .env and fill it in.`,
    )
  }
  return value
}

const optional = (name: string, fallback = ''): string => {
  const value = fromEnvOrFile(name)
  return value === undefined ? fallback : value
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
  telegram: (() => {
    const token = optional('TELEGRAM_BOT_TOKEN')
    return {
      token,
      chatIds,
      enabled: token !== '' && chatIds.length > 0,
      notifyEveryCheck: bool('NOTIFY_EVERY_CHECK', false),
    }
  })(),
  logLevel: optional('LOG_LEVEL', 'info'),
} as const

if (config.poll.minSeconds > config.poll.maxSeconds) {
  throw new Error('POLL_MIN_SECONDS must be <= POLL_MAX_SECONDS')
}
