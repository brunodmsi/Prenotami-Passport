import { config } from './config'
import { logger } from './logger'
import { randomInt, sleep } from './humanize'

export interface PollStep {
  /** Iteration index (starts at 1). */
  iteration: number
  /** How many errors have happened in a row before this iteration. */
  consecutiveErrors: number
  /** True every `RELOGIN_EVERY` iterations — caller should re-authenticate. */
  shouldRelogin: boolean
}

export type StepResult = 'ok' | 'error' | 'blocked' | 'stop'

// Sleep time picked uniformly at random inside the configured window.
// A fixed interval is the single strongest signal for "this is a bot":
// real humans don't refresh at exactly the same cadence.
const nextDelaySeconds = (consecutiveErrors: number, wasBlocked: boolean): number => {
  const { minSeconds, maxSeconds } = config.poll
  const base = randomInt(minSeconds, maxSeconds)
  if (wasBlocked) {
    // Exponential backoff capped at 2h after being blocked. Every further
    // block doubles the wait, so if the IP is throttled we stop making it
    // worse.
    const backoff = Math.min(2 ** consecutiveErrors * base, 2 * 60 * 60)
    return backoff
  }
  if (consecutiveErrors > 0) {
    return Math.min(base * (1 + consecutiveErrors), 2 * base)
  }
  return base
}

export const runPollLoop = async (
  step: (ctx: PollStep) => Promise<StepResult>,
): Promise<void> => {
  let iteration = 0
  let consecutiveErrors = 0
  let lastWasBlocked = false

  while (true) {
    iteration++
    const shouldRelogin =
      config.poll.reloginEvery > 0 && iteration > 1 && iteration % config.poll.reloginEvery === 1

    let result: StepResult
    try {
      result = await step({ iteration, consecutiveErrors, shouldRelogin })
    } catch (err) {
      logger.error('poll step threw', (err as Error).message)
      result = 'error'
    }

    if (result === 'stop') return

    if (result === 'ok') {
      consecutiveErrors = 0
      lastWasBlocked = false
    } else {
      consecutiveErrors++
      lastWasBlocked = result === 'blocked'
      if (consecutiveErrors >= config.poll.maxConsecutiveErrors) {
        logger.warn(
          `hit ${consecutiveErrors} consecutive failures — surrendering this session`,
        )
        return
      }
    }

    const delay = nextDelaySeconds(consecutiveErrors, lastWasBlocked)
    logger.info(`next check in ${delay}s (iteration ${iteration}, errors=${consecutiveErrors})`)
    await sleep(delay * 1000)
  }
}
