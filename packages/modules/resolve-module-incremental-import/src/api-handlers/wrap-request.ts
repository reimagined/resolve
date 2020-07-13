import iconv from 'iconv-lite'

const convertCodepage = (content, fromEncoding, toEncoding) =>
  iconv.decode(iconv.encode(content, fromEncoding), toEncoding)

const wrapAuthRequest = req => {
  if (req.body == null || req.headers['content-type'] == null) {
    return req
  }

  const [bodyContentType, ...bodyOptions] = req.headers['content-type']
    .toLowerCase()
    .split(';')
    .map(value => value.trim())
  const bodyCharset = (
    bodyOptions.find(option => option.startsWith('charset=')) || 'charset=utf-8'
  ).substring(8)

  let bodyContent = null

  // TODO: use string-based body parsers (not stream-based like npm body-parser)
  switch (bodyContentType) {
    case 'application/x-www-form-urlencoded': {
      bodyContent = req.body.split('&').reduce((acc, part) => {
        let [key, ...value] = part.split('=').map(decodeURIComponent)
        value = value.join('=')

        if (bodyCharset !== 'utf-8') {
          key = convertCodepage(key, 'utf-8', bodyCharset)
          value = convertCodepage(value, 'utf-8', bodyCharset)
        }

        acc[key] = value
        return acc
      }, {})

      break
    }

    case 'application/json': {
      bodyContent = req.body

      if (bodyCharset !== 'utf-8') {
        bodyContent = convertCodepage(bodyContent, 'utf-8', bodyCharset)
      }

      bodyContent = JSON.parse(bodyContent)
      break
    }

    default: {
      throw new Error(`Invalid request body Content-type: ${bodyContentType}`)
    }
  }

  return Object.create(req, {
    body: {
      value: bodyContent,
      enumerable: true
    }
  })
}

export default wrapAuthRequest
