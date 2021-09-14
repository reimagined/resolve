import * as contentDisposition from 'content-disposition'
import iconv from 'iconv-lite'

import type { ResolveRequest } from '../types'

const convertCodepage = (
  content: string,
  fromEncoding: string,
  toEncoding: string
) => iconv.decode(iconv.encode(content, fromEncoding), toEncoding)

const extractRequestBody = (req: ResolveRequest) => {
  if (req.body == null || req.body === '') {
    return req.query
  }
  const [contentType, optionsEntry] =
    req.headers['content-type'] != null
      ? String(req.headers['content-type'])
          .split(';')
          .map((value) => value.trim().toLowerCase())
      : []

  let bodyFields: any = {}

  switch (contentType) {
    case 'application/json': {
      bodyFields = JSON.parse(req.body)
      break
    }

    case 'application/x-www-form-urlencoded': {
      bodyFields = req.body
        .split('&')
        .reduce<Record<string, string>>((acc, pair) => {
          let [key, value] = pair.split('=').map(decodeURIComponent)
          acc[key] = value
          return acc
        }, {})
      break
    }

    case 'multipart/form-data': {
      bodyFields = {}
      let boundary = null

      if (optionsEntry != null && optionsEntry.startsWith('boundary=')) {
        boundary = optionsEntry.substring('boundary='.length)
      }
      if (boundary == null) {
        throw new Error('Invalid boundary for multipart/form-data')
      }
      const boundaryRegexp = new RegExp(
        `\r?\n--${String(boundary).replace(
          // eslint-disable-next-line no-useless-escape
          /[-\/\\^$*+?.()|[\]{}]/g,
          '\\$&'
        )}(?:(?:\r?\n)|--)`,
        'ig'
      )

      const contentArray = `\n${req.body}\n`.split(boundaryRegexp).slice(1, -1)
      for (let index = 0; index < contentArray.length; index++) {
        const separatorMatch = contentArray[index].match(/\r?\n\r?\n/)
        if (separatorMatch == null) {
          throw new Error(
            'Invalid inline body separator for multipart/form-data'
          )
        }
        const separatorIndex = separatorMatch.index as number
        const separatorLength = separatorMatch[0].length
        const inlineHeadersString = contentArray[index].substring(
          0,
          separatorIndex
        )
        const inlineBodyString = contentArray[index].substring(
          separatorIndex + separatorLength
        )

        const inlineHeaders = inlineHeadersString
          .split(/\r?\n/g)
          .reduce<Record<string, string>>((acc, content) => {
            const [inlineHeaderName, ...inlineHeaderContent] = content.split(
              // eslint-disable-next-line no-useless-escape
              /\: /g
            )
            const inlineHeaderValue = inlineHeaderContent.join(': ')
            acc[inlineHeaderName.toLowerCase()] = inlineHeaderValue
            return acc
          }, {})

        const [inlineContentType, inlineCharset] = String(
          inlineHeaders['content-type']
        )
          .split(';')
          .map((value) => value.trim().toLowerCase())

        const {
          type: dispositionType,
          parameters: { name, filename },
        } = contentDisposition.parse(inlineHeaders['content-disposition'])

        if (dispositionType !== 'form-data') {
          throw new Error(
            'Invalid inline content disposition for multipart/form-data'
          )
        }

        bodyFields[name] = {
          contentType: inlineContentType,
          contentData:
            inlineCharset != null
              ? convertCodepage(inlineBodyString, 'latin1', inlineCharset)
              : inlineBodyString,
          contentCharset: inlineCharset != null ? inlineCharset : 'latin1',
          filename,
        }
      }
      break
    }
    default: {
      throw new Error('Unsupported Content-Type in request body')
    }
  }

  return Object.assign(bodyFields, req.query)
}

export default extractRequestBody
