const convertToCharset = (input, charset) =>
  Buffer.from(input, 'utf8').toString(charset)

const extractRequestBody = req => {
  if (req.body === null) {
    return req.query
  }

  const [contentType, charsetEntry] = String(req.headers['content-type'])
    .split(';')
    .map(value => value.trim().toLowerCase())
  const charset = charsetEntry != null ? charsetEntry.substring(8) : null
  let bodyFields = {}

  switch (contentType) {
    case 'application/json': {
      bodyFields = JSON.parse(
        charset != null ? convertToCharset(req.body, charset) : req.body
      )
      break
    }
    case 'application/x-www-form-urlencoded': {
      bodyFields = req.body.split('&').reduce((acc, pair) => {
        let [key, value] = pair.split('=').map(decodeURIComponent)
        if (charset != null) {
          key = convertToCharset(key, charset)
          value = convertToCharset(value, charset)
        }
        acc[key] = value
        return acc
      }, {})
      break
    }
    default: {
      throw new Error('Unsupported Content-Type in request body')
    }
  }

  return Object.assign(bodyFields, req.query)
}

export default extractRequestBody
