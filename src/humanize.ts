import { Page, Locator } from 'playwright'

export const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

export const randomInt = (min: number, max: number) =>
  Math.floor(min + Math.random() * (max - min + 1))

// Small pause between actions — pure zero-delay click-then-type bursts look
// nothing like a real user and are a trivial heuristic for bot detection.
export const pauseShort = () => sleep(randomInt(180, 520))
export const pauseMedium = () => sleep(randomInt(700, 1400))

export const typeHumanlike = async (locator: Locator, text: string) => {
  await locator.click()
  for (const char of text) {
    await locator.page().keyboard.type(char, { delay: randomInt(55, 170) })
  }
}

export const wiggleMouse = async (page: Page) => {
  const viewport = page.viewportSize()
  if (!viewport) return
  const steps = randomInt(3, 6)
  for (let i = 0; i < steps; i++) {
    await page.mouse.move(
      randomInt(0, viewport.width - 1),
      randomInt(0, viewport.height - 1),
      { steps: randomInt(5, 15) },
    )
    await sleep(randomInt(80, 250))
  }
}
