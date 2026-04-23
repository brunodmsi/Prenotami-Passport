import path from 'path'
import { Page } from 'playwright'

import {
  RESERVATIONS_NAV,
  UNAVAILABLE_MODAL_DISMISS,
  UNAVAILABLE_MODAL_TEXT,
  serviceBookAnchor,
} from '../constants/locators'
import { BLOCK_FRAGMENTS, NO_AVAILABILITY_FRAGMENT } from '../constants/messages'
import { formatDate } from './formatDate'
import { pauseMedium, pauseShort } from '../humanize'

export type CheckOutcome =
  | { status: 'available'; html: string }
  | { status: 'unavailable' }
  | { status: 'blocked'; hint: string }
  | { status: 'error'; error: Error }

export interface CheckOptions {
  serviceRow: number
  screenshotPrefix?: string
}

const SCREENSHOT_DIR = path.resolve(__dirname, '..', '..', 'screenshots')

export const checkAppointment = async (
  page: Page,
  { serviceRow, screenshotPrefix }: CheckOptions,
): Promise<CheckOutcome> => {
  try {
    await page.locator(RESERVATIONS_NAV).click()
    await page.waitForLoadState('load')
    await pauseShort()

    const bodyText = await page.locator('body').innerText().catch(() => '')
    const blockHit = BLOCK_FRAGMENTS.find(fragment => bodyText.includes(fragment))
    if (blockHit) {
      return { status: 'blocked', hint: blockHit }
    }

    await page.locator(serviceBookAnchor(serviceRow)).click()
    await page.waitForLoadState('load')
    await pauseMedium()

    const modalText = await page
      .locator(UNAVAILABLE_MODAL_TEXT)
      .innerText()
      .catch(() => '')

    if (modalText.includes(NO_AVAILABILITY_FRAGMENT)) {
      if (screenshotPrefix) {
        const filename = `${screenshotPrefix}_${formatDate(new Date(), '_')}.png`
        // Screenshot the browser page, not the desktop — works on any OS
        // and in headless mode, unlike screenshot-desktop.
        await page
          .screenshot({ path: path.join(SCREENSHOT_DIR, filename), fullPage: true })
          .catch(() => {})
      }
      await page.locator(UNAVAILABLE_MODAL_DISMISS).click().catch(() => {})
      return { status: 'unavailable' }
    }

    // Modal isn't the no-availability one: we either reached the booking
    // form or something unexpected happened. Treat as available and let
    // the caller inspect the captured HTML.
    const html = await page.content()
    return { status: 'available', html }
  } catch (error) {
    return { status: 'error', error: error as Error }
  }
}
