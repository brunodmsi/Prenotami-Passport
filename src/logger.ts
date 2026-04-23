import { config } from './config'

type Level = 'debug' | 'info' | 'warn' | 'error'

const order: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 }
const threshold = order[(config.logLevel as Level)] ?? order.info

const ts = () => new Date().toISOString()

const write = (level: Level, args: unknown[]) => {
  if (order[level] < threshold) return
  const line = `[${ts()}] ${level.toUpperCase()}`
  if (level === 'error' || level === 'warn') {
    console.error(line, ...args)
  } else {
    console.log(line, ...args)
  }
}

export const logger = {
  debug: (...args: unknown[]) => write('debug', args),
  info: (...args: unknown[]) => write('info', args),
  warn: (...args: unknown[]) => write('warn', args),
  error: (...args: unknown[]) => write('error', args),
}
