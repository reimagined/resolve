import { getReasonPhrase } from 'http-status-codes'

const getHttpStatusText = (status) => {
  let httpStatusText = ''

  try {
    httpStatusText = getReasonPhrase(status)
  } catch {}

  return httpStatusText
}

export default getHttpStatusText
