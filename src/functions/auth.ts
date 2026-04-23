import { Page } from 'playwright'

import { goToLoginPage } from './goToLoginPage'
import { userLogin } from './userLogin'
import { logger } from '../logger'

export const auth = async ({
  page,
  email,
  password,
}: {
  page: Page
  email: string
  password: string
}) => {
  await goToLoginPage(page)
  await userLogin({ page, email, password })
  logger.info('authenticated')
}
