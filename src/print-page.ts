import path from 'path'

import { config } from './config'
import { logger } from './logger'
import { launchSession } from './browser'
import { auth } from './functions/auth'
import { checkAppointment } from './functions/appointment'
import { logout } from './functions/logout'
import { formatDate } from './functions/format-date'

// One-shot: log in, check availability once, save a screenshot, log out.
// Handy for debugging selectors and confirming the account still works
// without starting the polling loop.
const run = async () => {
  const session = await launchSession()
  const { page } = session
  try {
    await auth({ page, email: config.credentials.email, password: config.credentials.password })

    const outcome = await checkAppointment(page, {
      serviceRow: config.appointmentServiceRow,
      screenshotPrefix: config.credentials.email.replace(/[^a-z0-9]/gi, '_'),
    })

    logger.info('outcome:', outcome.status)

    const fallback = path.resolve('screenshots', `run_${formatDate(new Date(), '_')}.png`)
    await page.screenshot({ path: fallback, fullPage: true }).catch(() => {})

    await logout(page)
  } finally {
    await session.close()
  }
}

run().catch(err => {
  logger.error('printPage failed:', (err as Error).message)
  process.exit(1)
})
