export const PRENOTAMI_URL = 'https://prenotami.esteri.it/'

// Prenotami now delegates login to iam.esteri.it (Ping Identity OAuth).
// The landing page only shows this button; clicking it redirects through
// /pingid to the IAM login form.
export const PINGID_LOGIN_BUTTON = '#pingid-button'
export const IAM_HOST = 'iam.esteri.it'

// Fallback chains for the IAM login form. The iam.esteri.it backend is
// currently ForgeRock (Vue-driven, `fr-field callback-component` form);
// fields are `callback_1` / `callback_2`. `autocomplete="username"` /
// `autocomplete="current-password"` are the most stable anchors because
// browsers rely on them. We include PingFederate and generic fallbacks in
// case the IAM vendor gets swapped again or a specific consulate ends up
// on a different skin. Vue-generated ids like `floatingLabelInput33` are
// deliberately *not* matched — the numeric suffix changes on every render.
export const LOGIN_EMAIL =
  'input[autocomplete="username"], input[name="callback_1"], input[name="pf.username"], #username, input[type="email"], input[name="username"], #login-email'
export const LOGIN_PASSWORD =
  'input[autocomplete="current-password"], input[name="callback_2"], input[name="pf.pass"], #password, input[type="password"], input[name="password"], #login-password'
export const LOGIN_SUBMIT =
  'button[type="submit"], input[type="submit"], .fr-btn-primary, .btn-primary, #signOnButton, [data-testid="btn-login"], form button'

export const LANGUAGE_BUTTON = '.top-nav__languages > a:nth-child(1)'
export const RESERVATIONS_NAV = '#advanced'
export const LOGOUT_BUTTON = '#logoutForm > button'

// Appointment "Prenotazioni" services table — the book-appointment anchor
// sits in the 4th column of each row; row index selects which service.
export const serviceBookAnchor = (row: number) =>
  `#dataTableServices > tbody > tr:nth-child(${row}) > td:nth-child(4) > a`

// Modal shown when no slots are available.
export const UNAVAILABLE_MODAL_TEXT = '.jconfirm-content > div'
export const UNAVAILABLE_MODAL_DISMISS = '.jconfirm-buttons > button'
