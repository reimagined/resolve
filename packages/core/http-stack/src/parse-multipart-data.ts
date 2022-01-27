import type { IncomingHttpHeaders } from 'http'
import type { Readable } from 'stream'
import type { FileInfo } from 'busboy'
import Busboy from 'busboy'

import type { MultipartData } from './types'
import parseContentType from './parse-content-type'
import getLog from './get-log'

const parseMultipartData = (
  body: Buffer | null,
  headers: IncomingHttpHeaders
): Promise<MultipartData | null> => {
  const contentType = headers['content-type']
  if (body == null || contentType == null) {
    return Promise.resolve(null)
  }

  const {
    type: mediaType,
    subType: mediaSubType,
    params: { boundary },
  } = parseContentType(contentType)

  if (
    mediaType !== 'multipart' ||
    mediaSubType !== 'form-data' ||
    boundary?.constructor !== String
  ) {
    return Promise.resolve(null)
  }

  return new Promise((resolve) => {
    const busboy = Busboy({
      headers: {
        'content-type': headers['content-type'],
      },
    })
    const result: MultipartData = {
      files: [],
      fields: {},
    }

    busboy.on(
      'file',
      (
        fieldName: string,
        file: Readable,
        { filename: fileName, mimeType, encoding }: FileInfo
      ) => {
        let content: Buffer

        file.on('data', (data: Buffer) => {
          content = data
        })

        file.on('end', () => {
          if (content != null) {
            result.files.push({
              content,
              fieldName,
              fileName,
              mimeType,
              encoding,
            })
          }
        })
      }
    )

    busboy.on('field', (fieldName: string, value: string) => {
      result.fields[fieldName] = value
    })

    busboy.on('error', (error: Error) => {
      const log = getLog('parse-multipart-data')
      log.warn(error)
      resolve(null)
    })

    busboy.on('finish', () => {
      resolve(result)
    })

    busboy.write(body)
    busboy.end()

    return result
  })
}

export default parseMultipartData
