import { chromium as chromiumExtra } from 'playwright-extra'
import stealth from 'puppeteer-extra-plugin-stealth'
import type { Browser, BrowserContext, Page } from 'playwright'

import { config } from './config'
import { logger } from './logger'

chromiumExtra.use(stealth())

// Pool of recent, plausible desktop user-agents. Rotated per browser launch.
// A single pinned UA is fine inside one session but becomes a fingerprint
// across many restarts; rotating here spreads that out without looking
// erratic within any individual visit.
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
]

const pickUserAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]

export interface Session {
  browser: Browser
  context: BrowserContext
  page: Page
  close: () => Promise<void>
}

export const launchSession = async (): Promise<Session> => {
  const userAgent = pickUserAgent()
  logger.debug('launching browser', {
    headless: config.browser.headless,
    proxy: config.browser.proxyServer ? 'configured' : 'none',
    userAgent,
  })

  const browser = await chromiumExtra.launch({
    headless: config.browser.headless,
    proxy: config.browser.proxyServer
      ? { server: config.browser.proxyServer }
      : undefined,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  })

  const context = await browser.newContext({
    userAgent,
    locale: config.browser.locale,
    timezoneId: config.browser.timezone,
    viewport: { width: 1440, height: 820 },
    deviceScaleFactor: 2,
    // Matching a desktop Chrome profile more closely. `navigator.webdriver`
    // is still the loudest tell; stealth plugin scrubs it, but we also drop
    // the `--enable-automation` switch (via args above) for good measure.
    extraHTTPHeaders: {
      'Accept-Language': `${config.browser.locale},en;q=0.8`,
    },
  })

  const page = await context.newPage()

  return {
    browser,
    context,
    page,
    close: async () => {
      await context.close().catch(() => {})
      await browser.close().catch(() => {})
    },
  }
}
