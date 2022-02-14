import type { Readable } from 'stream'
import type { FileInfo } from 'busboy'
import Busboy from 'busboy'

import type { ContentType, MultipartData } from '../types'
import getLog from '../get-log'

export const parser = (
  body: Buffer,
  contentType: string
): Promise<MultipartData | undefined> => {
  return new Promise<MultipartData | undefined>((resolve) => {
    const busboy = Busboy({
      headers: {
        'content-type': contentType,
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
      resolve(undefined)
    })

    busboy.on('finish', () => {
      resolve(result)
    })

    busboy.write(body)
    busboy.end()

    return result
  })
}

export const predicate = ({
  type,
  subType,
  params: { boundary },
}: ContentType): boolean =>
  type === 'multipart' &&
  subType === 'form-data' &&
  boundary?.constructor === String
