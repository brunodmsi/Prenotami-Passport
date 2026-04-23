// The site returns this exact sentence inside the "no availability" modal.
// We match on a distinctive substring rather than the full string so small
// punctuation changes on the server side don't silently break detection.
export const NO_AVAILABILITY_FRAGMENT = 'posti disponibili per il servizio scelto sono esauriti'

// Heuristics for detecting that we've been rate-limited or temporarily
// blocked rather than receiving a real application response. If the page
// text contains any of these we should back off hard instead of retrying.
export const BLOCK_FRAGMENTS = [
  'Access Denied',
  'Request blocked',
  'Too Many Requests',
  'Just a moment',
  'cf-chl-bypass',
  'Attention Required',
]
