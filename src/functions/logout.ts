import { Page } from 'playwright'

import { LOGOUT_BUTTON } from '../constants/locators'

export const logout = async (page: Page) => {
  const button = page.locator(LOGOUT_BUTTON)
  if (await button.count()) {
    await button.first().click().catch(() => {})
    await page.waitForLoadState('load').catch(() => {})
  }
}
