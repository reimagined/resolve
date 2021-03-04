import fs from 'fs'
import request from 'request'
import { v4 as uuid } from 'uuid'
import crypto from 'crypto'

const createPresignedPut = async (pool, dir) => {
  const uploadId = uuid()
  const uploadUrl = `http://localhost:3000/uploader?dir=${dir}&uploadId=${uploadId}`

  return {
    uploadUrl,
    uploadId,
  }
}

export const upload = (uploadUrl, filePath) => {
  const fileSizeInBytes = fs.statSync(filePath).size
  const fileStream = fs.createReadStream(filePath)
  return new Promise((resolve, reject) =>
    request.put(
      {
        headers: {
          'Content-Length': fileSizeInBytes,
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

const createPresignedPost = async (pool, dir) => {
  const uploadId = uuid()
  const form = {
    url: `http://localhost:3000/uploader?dir=${dir}&uploadId=${uploadId}`,
    fields: {},
  }

  return {
    form,
    uploadId,
  }
}

export const uploadFormData = (form, filePath) => {
  const fileStream = fs.createReadStream(filePath)

  return new Promise((resolve, reject) =>
    request.post(
      {
        url: form.url,
        formData: {
          file: fileStream,
        },
      },
      (error) => {
        error ? reject(error) : resolve()
      }
    )
  )
}

const createToken = ({ secretKey }, { dir, expireTime = 3600 }) => {
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

const createUploader = (pool) => {
  const { directory, bucket, secretKey } = pool
  return Object.freeze({
    createPresignedPut: createPresignedPut.bind(null, pool),
    createPresignedPost: createPresignedPost.bind(null, pool),
    createToken: createToken.bind(null, pool),
    upload: upload,
    uploadFormData: uploadFormData,
    directory,
    bucket,
    secretKey,
  })
}

const getSignedPut = async (adapter, dir) =>
  await adapter.createPresignedPut(dir)

const getSignedPost = async (adapter, dir) =>
  await adapter.createPresignedPost(dir)

const initUploader = async (resolve) => {
  if (resolve.assemblies.uploadAdapter != null) {
    // TODO: provide support for custom uploader adapter
    const createUploadAdapter = resolve.assemblies.uploadAdapter
    const uploader = createUploader(createUploadAdapter())
    process.env.RESOLVE_UPLOADER_CDN_URL = 'http://localhost:3000/uploader'

    Object.assign(resolve, {
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
    })
  }
}

export default initUploader
