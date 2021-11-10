import fs from 'fs'
import path from 'path'
import request from 'request'
import crypto from 'crypto'
import mime from 'mime-types'

import type { Uploader, UploaderPool } from '@resolve-js/runtime-base'
import { pureRequire } from '@resolve-js/runtime-base'

export type UploaderPoolCloud = UploaderPool & {
  uploaderArn: string
  userId: string
  encryptedUserId: string
  CDN: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type RemoveFirstType<T extends any[]> = T extends [infer _, ...infer R]
  ? R
  : never
export type RemovePoolArg<
  M extends (pool: UploaderPoolCloud, ...args: any[]) => any
> = (...args: RemoveFirstType<Parameters<M>>) => ReturnType<M>

const createPreSignedPut = async (
  { uploaderArn, userId, encryptedUserId }: UploaderPoolCloud,
  dir: string
) => {
  let Lambda: any
  try {
    Lambda = pureRequire('aws-sdk/clients/lambda')
  } catch {}
  const lambda = new Lambda()

  const result = await lambda
    ?.invoke({
      FunctionName: uploaderArn,
      Payload: JSON.stringify({
        type: 'put',
        userId,
        encryptedUserId,
        dir,
      }),
    })
    .promise()

  const { FunctionError, Payload: ResponsePayload } = result

  if (FunctionError != null) {
    const { errorMessage } =
      ResponsePayload == null
        ? { errorMessage: 'Unknown error' }
        : JSON.parse(ResponsePayload.toString())
    throw new Error(errorMessage)
  }

  return ResponsePayload != null ? JSON.parse(ResponsePayload.toString()) : null
}

export const upload = (
  pool: UploaderPoolCloud,
  uploadUrl: string,
  filePath: string
) => {
  const fileSizeInBytes = fs.statSync(filePath).size
  const fileStream = fs.createReadStream(filePath)
  const contentType =
    mime.contentType(path.extname(filePath)) || 'text/plain; charset=utf-8'
  return new Promise<void>((resolve, reject) =>
    request.put(
      {
        headers: {
          'Content-Length': fileSizeInBytes,
          'Content-Type': contentType,
        },
        uri: uploadUrl,
        body: fileStream,
      },
      (error, _, body) => {
        error ? reject(error) : body ? reject(body) : resolve()
      }
    )
  )
}

const createPresignedPost = async (
  { uploaderArn, userId, encryptedUserId }: UploaderPoolCloud,
  dir: string
) => {
  let Lambda: any
  try {
    Lambda = pureRequire('aws-sdk/clients/lambda')
  } catch {}
  const lambda = new Lambda()

  const { FunctionError, Payload: ResponsePayload } = await lambda
    ?.invoke({
      FunctionName: uploaderArn,
      Payload: JSON.stringify({
        type: 'post',
        userId,
        encryptedUserId,
        dir,
      }),
    })
    .promise()

  if (FunctionError != null) {
    const { errorMessage } =
      ResponsePayload == null
        ? { errorMessage: 'Unknown error' }
        : JSON.parse(ResponsePayload.toString())
    throw new Error(errorMessage)
  }

  return ResponsePayload != null ? JSON.parse(ResponsePayload.toString()) : null
}

export const uploadFormData = (
  pool: UploaderPoolCloud,
  form: any,
  filePath: string
) => {
  const fileStream = fs.createReadStream(filePath)
  const contentType =
    mime.contentType(path.extname(filePath)) || 'text/plain; charset=utf-8'
  form.fields.key = form.fields.Key
  delete form.fields.Key
  return new Promise<void>((resolve, reject) =>
    request.post(
      {
        url: form.url,
        formData: {
          ...form.fields,
          'Content-Type': contentType,
          file: fileStream,
        },
      },
      (error) => {
        error ? reject(error) : resolve()
      }
    )
  )
}

export const createToken = (
  { encryptedUserId }: UploaderPoolCloud,
  { dir, expireTime = 3600 }: { dir: string; expireTime: number }
) => {
  const payload = Buffer.from(
    JSON.stringify({
      encryptedUserId,
      dir,
      expireTime: Date.now() + expireTime * 1000,
    })
  )
    .toString('base64')
    .replace(/=/g, '')

  const signature = crypto
    .createHmac('md5', encryptedUserId)
    .update(payload)
    .digest('hex')

  return `${payload}*${signature}`
}

type UploaderAdapter = {
  CDN: UploaderPoolCloud['CDN']
  userId: UploaderPoolCloud['userId']
  encryptedUserId: UploaderPoolCloud['encryptedUserId']
  createPresignedPut: RemovePoolArg<typeof createPreSignedPut>
  createPresignedPost: RemovePoolArg<typeof createPresignedPost>
  createToken: RemovePoolArg<typeof createToken>
  upload: RemovePoolArg<typeof upload>
  uploadFormData: RemovePoolArg<typeof uploadFormData>
}

const createUploader = (config: UploaderPoolCloud): UploaderAdapter => {
  const { CDN } = config

  const userId = process.env['RESOLVE_USER_ID'] as string
  const encryptedUserId = process.env['RESOLVE_ENCRYPTED_USER_ID'] as string

  Object.assign(config, {
    userId,
    encryptedUserId,
  })

  return Object.freeze({
    createPresignedPut: createPreSignedPut.bind(null, config),
    upload: upload.bind(null, config),
    createPresignedPost: createPresignedPost.bind(null, config),
    uploadFormData: uploadFormData.bind(null, config),
    createToken: createToken.bind(null, config),
    CDN,
    userId,
    encryptedUserId,
  })
}

const getSignedPut = async (adapter: UploaderAdapter, dir: string) =>
  await adapter.createPresignedPut(dir)

const getSignedPost = async (adapter: UploaderAdapter, dir: string) =>
  await adapter.createPresignedPost(dir)

const getCDNUrl = async ({ CDN }: UploaderAdapter) => CDN

type UploaderFactoryParameters = {
  uploaderAdapterFactory: () => UploaderPool
}

export const uploaderFactory = async (
  params: UploaderFactoryParameters
): Promise<Uploader | null> => {
  const { uploaderAdapterFactory } = params
  if (uploaderAdapterFactory != null) {
    // TODO: provide support for custom uploader adapter
    const uploader = createUploader(
      uploaderAdapterFactory() as UploaderPoolCloud
    )
    process.env.RESOLVE_UPLOADER_CDN_URL = `https://${uploader.CDN}/${uploader.userId}`

    return {
      getSignedPut: getSignedPut.bind(null, uploader),
      getSignedPost: getSignedPost.bind(null, uploader),
      getCDNUrl: getCDNUrl.bind(null, uploader),
      createToken: uploader.createToken,
      uploadPut: uploader.upload,
      uploadPost: uploader.uploadFormData,
    }
  }
  return null
}
