import { Iconv } from 'iconv'

const wrapAuthRequest = req => {
  if (req.body == null && req.headers['content-type'] == null) {
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
          const converter = new Iconv('utf-8', bodyCharset)
          key = converter.convert(key)
          value = converter.convert(value)
        }

        acc[key] = value
        return acc
      }, {})

      break
    }

    case 'application/json': {
      bodyContent = req.body

      if (bodyCharset !== 'utf-8') {
        const converter = new Iconv('utf-8', bodyCharset)
        bodyContent = converter.convert(bodyContent)
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
