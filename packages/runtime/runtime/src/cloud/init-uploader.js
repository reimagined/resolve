import fs from 'fs'
import path from 'path'
import request from 'request'
import crypto from 'crypto'
import mime from 'mime-types'
import pureRequire from '../common/utils/pure-require'

const createPresignedPut = async (
  { uploaderArn, userId, encryptedUserId },
  dir
) => {
  let Lambda
  try {
    Lambda = pureRequire('aws-sdk/clients/lambda')
  } catch (error) {
    console.log('IMPORT ERROR', error)
  }
  const lambda = new Lambda()

  const result = await lambda
    .invoke({
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

export const upload = (pool, uploadUrl, filePath) => {
  const fileSizeInBytes = fs.statSync(filePath).size
  const fileStream = fs.createReadStream(filePath)
  const contentType =
    mime.contentType(path.extname(filePath)) || 'text/plain; charset=utf-8'
  return new Promise((resolve, reject) =>
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
  { uploaderArn, userId, encryptedUserId },
  dir
) => {
  let Lambda
  try {
    Lambda = pureRequire('aws-sdk/clients/lambda')
  } catch (error) {
    console.log('IMPORT ERROR', error)
  }
  const lambda = new Lambda()

  const { FunctionError, Payload: ResponsePayload } = await lambda
    .invoke({
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

export const uploadFormData = (pool, form, filePath) => {
  const fileStream = fs.createReadStream(filePath)
  const contentType =
    mime.contentType(path.extname(filePath)) || 'text/plain; charset=utf-8'
  form.fields.key = form.fields.Key
  delete form.fields.Key
  return new Promise((resolve, reject) =>
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
  { encryptedUserId },
  { dir, expireTime = 3600 }
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

const createUploader = (config) => {
  const { CDN } = config

  const userId = process.env['RESOLVE_USER_ID']
  const encryptedUserId = process.env['RESOLVE_ENCRYPTED_USER_ID']

  Object.assign(config, {
    userId,
    encryptedUserId,
  })

  return Object.freeze({
    createPresignedPut: createPresignedPut.bind(null, config),
    upload: upload.bind(null, config),
    createPresignedPost: createPresignedPost.bind(null, config),
    uploadFormData: uploadFormData.bind(null, config),
    createToken: createToken.bind(null, config),
    CDN,
    userId,
    encryptedUserId,
  })
}

const getSignedPut = async (adapter, dir) =>
  await adapter.createPresignedPut(dir)

const getSignedPost = async (adapter, dir) =>
  await adapter.createPresignedPost(dir)

const getCDNUrl = async ({ CDN }) => CDN

const initUploader = async (resolve) => {
  if (resolve.assemblies.uploadAdapter != null) {
    // TODO: provide support for custom uploader adapter
    const createUploadAdapter = resolve.assemblies.uploadAdapter
    const uploader = createUploader(createUploadAdapter())
    process.env.RESOLVE_UPLOADER_CDN_URL = `https://${uploader.CDN}/${uploader.userId}`

    Object.assign(resolve, {
      uploader: {
        getSignedPut: getSignedPut.bind(null, uploader),
        getSignedPost: getSignedPost.bind(null, uploader),
        getCDNUrl: getCDNUrl.bind(null, uploader),
        createToken: uploader.createToken,
        uploadPut: uploader.upload,
        uploadPost: uploader.uploadFormData,
      },
    })
  }
}

export default initUploader
