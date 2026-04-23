import { Page } from 'playwright'

import { PRENOTAMI_URL } from '../constants/locators'

export const goToLoginPage = async (page: Page) => {
  await page.goto(PRENOTAMI_URL, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('load')
}
