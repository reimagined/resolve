import Lambda from 'aws-sdk/clients/lambda'
import fs from 'fs'
import path from 'path'
import request from 'request'
import crypto from 'crypto'
import mime from 'mime-types'

const createPresignedPut = async (
  { uploaderArn, deploymentId, encryptedDeploymentId },
  dir
) => {
  const lambda = new Lambda()

  const result = await lambda
    .invoke({
      FunctionName: uploaderArn,
      Payload: JSON.stringify({
        type: 'put',
        deploymentId,
        encryptedDeploymentId,
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
  { uploaderArn, deploymentId, encryptedDeploymentId },
  dir
) => {
  const lambda = new Lambda()

  const { FunctionError, Payload: ResponsePayload } = await lambda
    .invoke({
      FunctionName: uploaderArn,
      Payload: JSON.stringify({
        type: 'post',
        deploymentId,
        encryptedDeploymentId,
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
  { encryptedDeploymentId },
  { dir, expireTime = 3600 }
) => {
  const payload = Buffer.from(
    JSON.stringify({
      encryptedDeploymentId,
      dir,
      expireTime: Date.now() + expireTime * 1000,
    })
  )
    .toString('base64')
    .replace(/=/g, '')

  const signature = crypto
    .createHmac('md5', encryptedDeploymentId)
    .update(payload)
    .digest('hex')

  return `${payload}*${signature}`
}

const createUploader = (config) => {
  const { deploymentId, CDN, encryptedDeploymentId } = config

  return Object.freeze({
    createPresignedPut: createPresignedPut.bind(null, config),
    upload: upload.bind(null, config),
    createPresignedPost: createPresignedPost.bind(null, config),
    uploadFormData: uploadFormData.bind(null, config),
    createToken: createToken.bind(null, config),
    deploymentId,
    CDN,
    encryptedDeploymentId,
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
    process.env.RESOLVE_UPLOADER_CDN_URL = `https://${uploader.CDN}/${uploader.deploymentId}`

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
