export const PRENOTAMI_URL = 'https://prenotami.esteri.it/'

export const LOGIN_EMAIL = '#login-email'
export const LOGIN_PASSWORD = '#login-password'
export const LOGIN_SUBMIT = 'button[type="submit"], form button'

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
