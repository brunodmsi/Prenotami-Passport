import fs from 'fs/promises'
import path from 'path'

import { config } from './config'
import { logger } from './logger'
import { launchSession, Session } from './browser'
import { notify } from './services/telegram'
import { auth } from './functions/auth'
import { checkAppointment } from './functions/appointment'
import { runPollLoop } from './poll'
import { sleep } from './humanize'

const RESTART_DELAY_MS = 60_000
const MAX_RESTARTS = 10

const runOnce = async () => {
  let session: Session | null = null
  try {
    session = await launchSession()
    const { page } = session

    await auth({ page, email: config.credentials.email, password: config.credentials.password })
    await notify('Prenotami checker started')

    await runPollLoop(async ({ iteration, shouldRelogin }) => {
      if (!session) return 'stop'

      if (shouldRelogin) {
        logger.info(`re-authenticating (iteration ${iteration})`)
        await auth({
          page: session.page,
          email: config.credentials.email,
          password: config.credentials.password,
        })
      }

      const outcome = await checkAppointment(session.page, {
        serviceRow: config.appointmentServiceRow,
      })

      switch (outcome.status) {
        case 'available': {
          logger.info('appointment slot appears available')
          const outPath = path.resolve('passportPage.html')
          await fs.writeFile(outPath, outcome.html)
          await notify(`Prenotami: appointment slot may be available. Page saved to ${outPath}.`)
          return 'stop'
        }
        case 'unavailable': {
          logger.info(`no slots (iteration ${iteration})`)
          // Always ping on the first iteration so the user can confirm the
          // whole pipeline (login → check → notifier) works end-to-end
          // within an hour of startup, without waiting for an actual hit.
          // Every-check mode is opt-in because at ~1/hour it's 24+ pings/day.
          const shouldPing = iteration === 1 || config.telegram.notifyEveryCheck
          if (shouldPing) {
            await notify(`Prenotami check #${iteration}: no slots available.`)
          }
          return 'ok'
        }
        case 'blocked':
          logger.warn('looks like we were blocked or rate-limited:', outcome.hint)
          await notify(`Prenotami: possible block detected ("${outcome.hint}") — backing off`)
          return 'blocked'
        case 'error':
          logger.error('check failed:', outcome.error.message)
          return 'error'
      }
    })
  } finally {
    if (session) await session.close()
  }
}

const main = async () => {
  let restarts = 0
  while (restarts <= MAX_RESTARTS) {
    try {
      await runOnce()
      logger.info('poll loop finished cleanly; exiting')
      return
    } catch (err) {
      restarts++
      const message = (err as Error).message
      logger.error(`run failed (restart ${restarts}/${MAX_RESTARTS}):`, message)
      await notify(`Prenotami checker crashed: ${message}. Restart ${restarts}/${MAX_RESTARTS}.`)
      if (restarts > MAX_RESTARTS) break
      await sleep(RESTART_DELAY_MS)
    }
  }
  logger.error('exceeded max restarts — giving up')
  process.exit(1)
}

main()
