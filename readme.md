![Prenotami](https://prenotami.esteri.it/Content/img/prenot@mi-logo.png)

# Prenotami-Passport

Watches the [Prenotami](https://prenotami.esteri.it/) booking portal for Italian
passport and citizenship appointments and pings you on Telegram the moment a
slot appears. Originally built for the Curitiba (Brazil) consulate, but the
config is generic enough to target any consulate that uses Prenotami.

> ⚠️ This project is for personal, occasional use by people who already have a
> legitimate Prenotami account. Polling aggressively or running many instances
> from the same IP is exactly how accounts get locked out and how the consulate
> ends up tightening its bot defences for everyone. Please stay polite.

## What's in this fork

This is a fork of
[Constantini21/Prenotami-Passport](https://github.com/Constantini21/Prenotami-Passport)
with the following changes focused on reliability and staying off the
consulate's ban list:

- **Stealth browser.** Replaced raw `webkit.launch` with
  [`playwright-extra`](https://github.com/berstend/puppeteer-extra/tree/master/packages/playwright-extra)
  + the Chromium stealth plugin (see
  [issue #2](https://github.com/Constantini21/Prenotami-Passport/issues/2) for
  prior art), rotating user-agents, localised timezone/locale, and scrubbed
  `navigator.webdriver`.
- **Humanised interactions.** Typing happens one character at a time with
  randomised per-keystroke delays; pauses and mouse wiggles are sprinkled
  between actions to avoid zero-delay click bursts.
- **Randomised, backed-off polling.** Instead of spinning as fast as the
  network allows, checks run at a random interval inside a configurable
  `[POLL_MIN_SECONDS, POLL_MAX_SECONDS]` window. On errors the interval
  widens; on detected blocks it backs off exponentially up to 2 hours.
- **Block detection.** The page body is scanned for common rate-limit /
  captcha signatures (`Access Denied`, `Too Many Requests`, Cloudflare
  challenge text, etc.) and the loop stops hammering instead of burning
  through retries.
- **Proxy support.** Set `PROXY_SERVER` to route through a residential proxy
  when the direct IP is throttled.
- **Configuration via `.env`.** All secrets (credentials, Telegram token,
  chat IDs) moved out of source into environment variables.
- **Bounded restarts.** The old code recursed into `main()` with no delay on
  any error — one bad state would hot-loop forever. Now there's a delay and
  a restart ceiling.
- **Unified appointment checker** (passport + citizenship) with a single
  parameterised row index.
- **Cross-platform paths and screenshots.** Replaced the Windows-only
  `__dirname.split('\\')` trick and `screenshot-desktop` (which captures the
  whole monitor) with Playwright's `page.screenshot()`.

## Setup

Requires Node.js 18+.

```bash
npm install
npm run install-browsers   # downloads Chromium for Playwright
cp .env.example .env       # then edit .env with your credentials
```

### Environment variables

All options are documented inline in [`.env.example`](./.env.example). The
ones you have to fill in:

| Variable              | Purpose                                         |
| --------------------- | ----------------------------------------------- |
| `PRENOTAMI_EMAIL`     | Login email for your Prenotami account          |
| `PRENOTAMI_PASSWORD`  | Login password                                  |

Optional, but recommended:

| Variable                 | Default      | Notes                                             |
| ------------------------ | ------------ | ------------------------------------------------- |
| `APPOINTMENT_SERVICE_ROW`| `1`          | `1` = passport, `2` = citizenship (usually)       |
| `POLL_MIN_SECONDS`       | `3300`       | Minimum gap between checks (~55 min)              |
| `POLL_MAX_SECONDS`       | `4200`       | Maximum gap between checks (~70 min)              |
| `RELOGIN_EVERY`          | `12`         | Re-authenticate every N iterations (~12h)         |
| `MAX_CONSECUTIVE_ERRORS` | `3`          | Surrender this session after N errors/blocks      |
| `HEADLESS`               | `true`       | Set `false` locally to watch it run               |
| `BROWSER_LOCALE`         | `it-IT`      | Should match the account's expected locale       |
| `BROWSER_TIMEZONE`       | `Europe/Rome`| Should match the account's expected timezone      |
| `PROXY_SERVER`           | _(none)_     | e.g. `http://user:pass@host:port`                 |
| `TELEGRAM_BOT_TOKEN`     | _(none)_     | Empty disables Telegram; falls back to log output |
| `TELEGRAM_CHAT_IDS`      | _(none)_     | Comma-separated list of chat IDs                  |
| `NOTIFY_EVERY_CHECK`     | `false`      | Ping Telegram on every "no slots" result too      |
| `LOG_LEVEL`              | `info`       | `debug` / `info` / `warn` / `error`               |

## Usage

Long-running availability watcher:

```bash
npm start
```

One-shot login + screenshot (useful for debugging selectors and confirming
your credentials still work):

```bash
npm run printPage
```

Typecheck without building:

```bash
npm run typecheck
```

## Staying off the ban list

Even with stealth enabled, a single residential IP that polls the same
endpoint for weeks will eventually get throttled — that's what happened to
@jmschp in
[issue #2](https://github.com/Constantini21/Prenotami-Passport/issues/2).

The defaults are deliberately polite: roughly **one check per hour** with
jitter, re-login every ~12 hours, and a hard surrender after 3 consecutive
errors or blocks. When a block page _is_ detected the loop parks for at
least 2 hours and doubles up to a 12h ceiling on repeats — the goal is to
stop making a temporary throttle worse.

Practical things that help, in rough order of impact:

1. **Keep the polling polite.** Defaults are ~55–70 min between checks.
   Slots don't disappear in 60 seconds and a tighter cadence is the single
   fastest way to trip rate-limiting. If you drop below `900` seconds
   expect to be throttled within hours.
2. **Rotate IPs** with a residential proxy service if you're running on a
   datacenter server (Hetzner, DO, AWS, etc.) — most datacenter IPs are
   already blocked. Tor exit nodes are blocked outright.
3. **Match locale and timezone** to where your account was created. An
   `it-IT` locale on a São Paulo IP is a tell.
4. **Don't run multiple instances** against the same account or IP in
   parallel. The poll loop is designed to be a single watcher.
5. **Stop when blocked.** The block-detection + exponential backoff already
   do this; don't wrap the process in a restart loop that fights it.
6. **Prefer business hours** in the target timezone if you can. A systemd
   timer that only fires 08:00–20:00 Europe/Rome looks less synthetic than
   a 24/7 runner.

None of this makes detection impossible; it just raises the cost of getting
singled out. The real fix is for the consulate to publish a saner booking
API.

## Project structure

```
src/
├── index.ts               Long-running orchestrator
├── print-page.ts          One-shot login + screenshot
├── config.ts              Typed env-var loader
├── logger.ts              Minimal level-based logger
├── browser.ts             Stealth Chromium factory + UA rotation
├── humanize.ts            Randomised delays, typing, mouse wiggles
├── poll.ts                Exponential-backoff polling loop
├── constants/
│   ├── locators.ts        CSS selectors + URLs
│   └── messages.ts        Italian site strings + block fragments
├── functions/
│   ├── auth.ts            go-to-login-page + user-login wrapper
│   ├── go-to-login-page.ts
│   ├── user-login.ts      Humanised login
│   ├── logout.ts
│   ├── appointment.ts     Unified availability check (passport/citizenship)
│   └── format-date.ts
└── services/
    └── telegram.ts       Telegram notifier (optional, falls back to logs)
```

## Contributors

- [Constantini](https://github.com/Constantini21/) — original author
- Fork maintained by [brunodmsi](https://github.com/brunodmsi)

## License

MIT.
