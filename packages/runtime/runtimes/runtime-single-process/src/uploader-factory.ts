import fs from 'fs'
import { v4 as uuid } from 'uuid'
import crypto from 'crypto'
import type { Uploader, UploaderPool } from '@resolve-js/runtime-base'
import fetch from 'node-fetch'
import FormData from 'form-data'

export type UploaderPoolLocal = UploaderPool & {
  directory: string
  secretKey: string
  bucket: any
}

type Pool = UploaderPoolLocal

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type RemoveFirstType<T extends any[]> = T extends [infer _, ...infer R]
  ? R
  : never
export type RemovePoolArg<M extends (pool: Pool, ...args: any[]) => any> = (
  ...args: RemoveFirstType<Parameters<M>>
) => ReturnType<M>

const createPreSignedPut = async (pool: Pool, dir: string) => {
  const uploadId = uuid()
  const uploadUrl = `${process.env.RESOLVE_UPLOADER_CDN_URL}?dir=${dir}&uploadId=${uploadId}`
  return {
    uploadUrl,
    uploadId,
  }
}

export const upload = (uploadUrl: string, filePath: string) => {
  const fileSizeInBytes = fs.statSync(filePath).size
  const fileStream = fs.createReadStream(filePath)
  return new Promise<void>(async (resolve, reject) => {
    try {
      const res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Length': fileSizeInBytes.toString(),
        },
        body: fileStream,
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      resolve()
    } catch (error) {
      reject(error)
    }
  })
}

const createPresignedPost = async (pool: Pool, dir: string) => {
  const uploadId = uuid()
  const form = {
    url: `${process.env.RESOLVE_UPLOADER_CDN_URL}?dir=${dir}&uploadId=${uploadId}`,
    fields: {},
  }

  return {
    form,
    uploadId,
  }
}

export const uploadFormData = (form: { url: string }, filePath: string) => {
  const fileStream = fs.createReadStream(filePath)

  const formData = new FormData()

  formData.append('file', fileStream)

  return new Promise<void>(async (resolve, reject) => {
    try {
      const res = await fetch(form.url, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      resolve()
    } catch (error) {
      reject(error)
    }
  })
}

const createToken = (
  { secretKey }: Pool,
  { dir, expireTime = 3600 }: { dir: string; expireTime: number }
) => {
  const payload = Buffer.from(
    JSON.stringify({
      dir,
      expireTime: Date.now() + expireTime * 1000,
    })
  )
    .toString('base64')
    .replace(/=/g, '')

  const signature = crypto
    .createHmac('md5', secretKey)
    .update(payload)
    .digest('hex')

  return `${payload}*${signature}`
}

type UploaderAdapter = {
  directory: string
  bucket: any
  secretKey: string
  createPresignedPut: RemovePoolArg<typeof createPreSignedPut>
  createPresignedPost: RemovePoolArg<typeof createPresignedPost>
  createToken: RemovePoolArg<typeof createToken>
  upload: typeof upload
  uploadFormData: typeof uploadFormData
}

const createUploader = (pool: Pool): UploaderAdapter => {
  const { directory, bucket, secretKey } = pool
  return Object.freeze({
    createPresignedPut: createPreSignedPut.bind(null, pool),
    createPresignedPost: createPresignedPost.bind(null, pool),
    createToken: createToken.bind(null, pool),
    upload: upload,
    uploadFormData: uploadFormData,
    directory,
    bucket,
    secretKey,
  })
}

const getSignedPut = async (adapter: UploaderAdapter, dir: string) =>
  await adapter.createPresignedPut(dir)

const getSignedPost = async (adapter: UploaderAdapter, dir: string) =>
  await adapter.createPresignedPost(dir)

type UploaderFactoryParameters = {
  uploaderAdapterFactory: () => UploaderPool
  host: string
  port: string
}

export const uploaderFactory = async (
  params: UploaderFactoryParameters
): Promise<{
  uploader: Uploader
  env: Record<string, string>
} | null> => {
  const { uploaderAdapterFactory, host, port } = params

  if (uploaderAdapterFactory != null) {
    // TODO: provide support for custom uploader adapter
    const uploader = createUploader(
      uploaderAdapterFactory() as UploaderPoolLocal
    )
    const env = {
      RESOLVE_UPLOADER_CDN_URL: `http://${host}:${port}/uploader`,
    }

    return {
      uploader: {
        getSignedPut: getSignedPut.bind(null, uploader),
        getSignedPost: getSignedPost.bind(null, uploader),
        uploadPut: uploader.upload,
        uploadPost: uploader.uploadFormData,
        createToken: uploader.createToken,
        directory: uploader.directory,
        bucket: uploader.bucket,
        secretKey: uploader.secretKey,
      },
      env,
    }
  }
  return null
}
