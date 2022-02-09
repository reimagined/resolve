import { getReasonPhrase } from 'http-status-codes'

const getHttpStatusText = (status: number | string) => {
  let httpStatusText = ''

  try {
    httpStatusText = getReasonPhrase(status)
  } catch {}

  return httpStatusText
}

export default getHttpStatusText
