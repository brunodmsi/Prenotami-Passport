import { Page } from 'playwright'

import {
  IAM_HOST,
  LOGIN_EMAIL,
  LOGIN_PASSWORD,
  LOGIN_SUBMIT,
  LANGUAGE_BUTTON,
} from '../constants/locators'
import { logger } from '../logger'
import { pauseShort, pauseMedium, typeHumanlike, wiggleMouse } from '../humanize'

const FIELD_TIMEOUT_MS = 15_000
const NAV_TIMEOUT_MS = 30_000

// ForgeRock's submit button is labelled "Next" (single-step or first
// step), other IAM vendors use "Log in" / "Sign in" / "Accedi" / "Avanti".
// Matching by accessible name beats raw CSS here because the page often
// has other hidden submit buttons (language selector, cookie banner)
// that `button[type="submit"]` would pick up first.
const SUBMIT_LABEL = /^\s*(next|log\s*in|sign\s*in|accedi|avanti)\s*$/i

export const userLogin = async ({
  page,
  email,
  password,
}: {
  page: Page
  email: string
  password: string
}) => {
  await wiggleMouse(page)
  await pauseShort()

  const emailField = page.locator(LOGIN_EMAIL).first()
  try {
    await emailField.waitFor({ state: 'visible', timeout: FIELD_TIMEOUT_MS })
  } catch {
    throw new Error(`login email field not found on ${page.url()}`)
  }
  await typeHumanlike(emailField, email)
  await pauseShort()

  const passwordField = page.locator(LOGIN_PASSWORD).first()
  try {
    await passwordField.waitFor({ state: 'visible', timeout: FIELD_TIMEOUT_MS })
  } catch {
    throw new Error(`login password field not found on ${page.url()}`)
  }
  await typeHumanlike(passwordField, password)
  await pauseMedium()

  // Prefer a button located by accessible name; fall back to the CSS
  // chain only if that can't find anything. Playwright auto-waits for
  // actionability (visible, enabled, stable) before the click fires.
  let submit = page.getByRole('button', { name: SUBMIT_LABEL }).first()
  if (!(await submit.count())) {
    logger.debug('no button matched submit label; falling back to CSS selector')
    submit = page.locator(LOGIN_SUBMIT).first()
  }
  await submit.waitFor({ state: 'visible', timeout: FIELD_TIMEOUT_MS })
  await submit.scrollIntoViewIfNeeded().catch(() => {})

  await Promise.all([
    page
      .waitForURL(url => !url.toString().includes(IAM_HOST), { timeout: NAV_TIMEOUT_MS })
      .catch(() => null),
    submit.click(),
  ])
  await page.waitForLoadState('load').catch(() => {})
  await pauseShort()

  if (page.url().includes(IAM_HOST)) {
    const errors = await page
      .locator('.fr-validation-requirements, [role="alert"], .error-messages, .error-message')
      .allInnerTexts()
      .catch(() => [] as string[])
    const hint = errors.filter(Boolean).join(' | ') || 'no visible error on page'
    throw new Error(`login submit did not leave IAM (${page.url()}). Hint: ${hint}`)
  }

  const langButton = page.locator(LANGUAGE_BUTTON)
  if (await langButton.count()) {
    await langButton.first().click().catch(() => {})
    await page.waitForLoadState('load').catch(() => {})
  }
}
