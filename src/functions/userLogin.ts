import { Page } from 'playwright'

import {
  LOGIN_EMAIL,
  LOGIN_PASSWORD,
  LOGIN_SUBMIT,
  LANGUAGE_BUTTON,
} from '../constants/locators'
import { pauseShort, pauseMedium, typeHumanlike, wiggleMouse } from '../humanize'

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

  await typeHumanlike(page.locator(LOGIN_EMAIL), email)
  await pauseShort()
  await typeHumanlike(page.locator(LOGIN_PASSWORD), password)
  await pauseMedium()

  await page.locator(LOGIN_SUBMIT).first().click()
  await page.waitForLoadState('load')
  await pauseShort()

  const langButton = page.locator(LANGUAGE_BUTTON)
  if (await langButton.count()) {
    await langButton.first().click().catch(() => {})
    await page.waitForLoadState('load').catch(() => {})
  }
}
