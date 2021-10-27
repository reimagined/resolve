import { getReasonPhrase } from 'http-status-codes'

export const getHttpStatusText = (status: number | string) => {
  let httpStatusText = ''

  try {
    httpStatusText = getReasonPhrase(status)
  } catch {}

  return httpStatusText
}
