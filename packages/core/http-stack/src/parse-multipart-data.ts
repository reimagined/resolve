import type { HttpRequest, ContentType } from './types'
import { parse as parseContentDisposition } from 'content-disposition'
import { IncomingHttpHeaders } from 'http'
import getContentType from './get-content-type'

const getBoundaryRegexp = (boundary: string) => {
  return
}

const parseMultipartData = (
  body: Buffer | null,
  headers: IncomingHttpHeaders,
  contentType: ContentType = getContentType(headers)
): Record<string, any> | null => {
  if (
    body == null ||
    contentType.mediaType !== 'multipart/form-data' ||
    contentType.boundary == null
  ) {
    return null
  }

  const multipart: Record<
    string,
    {
      contentType: ContentType
      body: string // TODO Buffer|null
    }
  > = {}

  const boundaryRegexp = new RegExp(
    `\r?\n--${String(boundary).replace(
      // eslint-disable-next-line no-useless-escape
      /[-\/\\^$*+?.()|[\]{}]/g,
      '\\$&'
    )}(?:(?:\r?\n)|--)`,
    'ig'
  )

  // TODO encode/decode problems. Rework
  const contentArray = `\n${body}\n`.split(boundaryRegexp).slice(1, -1)

  for (let index = 0; index < contentArray.length; index++) {
    const contentArrayItem = contentArray[index]
    if (contentArrayItem == null) {
      continue
    }
    const separatorMatch = contentArrayItem.match(/\r?\n\r?\n/)
    if (separatorMatch == null) {
      continue
    }
    const separatorIndex = separatorMatch.index
    if (separatorIndex == null) {
      continue
    }
    const separatorLength = separatorMatch[0]?.length ?? 0
    const inlineHeadersString = contentArrayItem.substring(0, separatorIndex)
    const inlineBodyString = contentArrayItem.substring(
      separatorIndex + separatorLength
    )

    const inlineHeaders = inlineHeadersString
      .split(/\r?\n/g)
      .reduce<Record<string, string>>((acc, content) => {
        const [inlineHeaderName, ...inlineHeaderContent] = content.split(
          // eslint-disable-next-line no-useless-escape
          /\: /g
        )
        if (inlineHeaderName != null) {
          acc[inlineHeaderName.toLowerCase()] = inlineHeaderContent.join(': ')
        }
        return acc
      }, {})

    // const [inlineContentType, inlineCharset] = String(
    //   inlineHeaders['content-type']
    // )
    //   .split(';')
    //   .map((value) => value.trim().toLowerCase())
    const inlineContentType = getContentType(inlineHeaders)

    const inlineHeaderContentDisposition = inlineHeaders['content-disposition']

    if (inlineHeaderContentDisposition == null || inlineContentType == null) {
      continue
    }

    const {
      type: dispositionType,
      parameters: { name },
    } = parseContentDisposition(inlineHeaderContentDisposition)

    if (dispositionType !== 'form-data' || name?.constructor !== String) {
      continue
    }

    multipart[name as string] = {
      contentType: inlineContentType,
      body: inlineBodyString,
    }
  }

  return multipart
}

export default parseMultipartData
