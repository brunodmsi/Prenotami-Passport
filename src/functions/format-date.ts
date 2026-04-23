const pad = (num: number) => num.toString().padStart(2, '0')

export const formatDate = (date: Date, separator = '/') =>
  [pad(date.getDate()), pad(date.getMonth() + 1), date.getFullYear()].join(separator)
