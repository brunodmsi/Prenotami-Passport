import { Telegraf } from 'telegraf'

import { config } from '../config'
import { logger } from '../logger'

const bot = config.telegram.enabled ? new Telegraf(config.telegram.token) : null

export const notify = async (message: string): Promise<void> => {
  if (!bot) {
    logger.info('[notify]', message)
    return
  }
  await Promise.all(
    config.telegram.chatIds.map(id =>
      bot.telegram.sendMessage(id, message).catch(err => {
        logger.warn(`telegram send to ${id} failed`, (err as Error).message)
      }),
    ),
  )
}
