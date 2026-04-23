import { Page } from 'playwright'

import { IAM_HOST, PINGID_LOGIN_BUTTON, PRENOTAMI_URL } from '../constants/locators'
import { logger } from '../logger'
import { pauseShort } from '../humanize'

export const goToLoginPage = async (page: Page) => {
  await page.goto(PRENOTAMI_URL, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('load')

  // If we're already on the IAM login host (session still valid, redirect
  // already happened, etc.) we're done.
  if (page.url().includes(IAM_HOST)) return

  const loginButton = page.locator(PINGID_LOGIN_BUTTON)
  if (await loginButton.count()) {
    logger.debug('clicking pingid redirect button')
    await pauseShort()
    await Promise.all([
      page.waitForURL(url => url.toString().includes(IAM_HOST), { timeout: 20_000 }),
      loginButton.first().click(),
    ])
    await page.waitForLoadState('load')
    return
  }

  // Either the landing page design changed again or we're already logged
  // in and looking at the portal dashboard. Caller's login step will tell
  // us which by failing to find the email field.
  logger.warn(`no pingid button found on ${page.url()}; continuing anyway`)
}
