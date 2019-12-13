import S3 from 'aws-sdk/clients/s3'
import fs from 'fs'
import request from 'request'
import uuid from 'uuid/v4'
import crypto from 'crypto'

import createCloudFrontDistribution from './resource/createCloudFrontDistribution'

const createPresignedPut = async (
  { s3, bucket, config: { deploymentId } },
  dir
) => {
  const uploadId = uuid()
  const uploadUrl = await s3.getSignedUrlPromise('putObject', {
    Bucket: bucket,
    Key: `${deploymentId}/${dir}/${uploadId}`
  })

  return {
    uploadUrl,
    uploadId
  }
}

export const upload = (pool, uploadUrl, filePath) => {
  const fileSizeInBytes = fs.statSync(filePath).size
  const fileStream = fs.createReadStream(filePath)
  return new Promise((resolve, reject) =>
    request.put(
      {
        headers: {
          'Content-Length': fileSizeInBytes
        },
        uri: uploadUrl,
        body: fileStream
      },
      (error, _, body) => {
        error ? reject(error) : body ? reject(body) : resolve()
      }
    )
  )
}

const createPresignedPost = async (
  { s3, bucket, config: { deploymentId } },
  dir
) => {
  const uploadId = uuid()
  const form = await new Promise((resolve, reject) => {
    s3.createPresignedPost(
      {
        Bucket: bucket,
        Fields: {
          Key: `${deploymentId}/${dir}/${uploadId}`
        }
      },
      (error, data) => {
        error ? reject(error) : resolve(data)
      }
    )
  })

  return {
    form,
    uploadId
  }
}

export const uploadFormData = (pool, form, filePath) => {
  const fileStream = fs.createReadStream(filePath)
  form.fields.key = form.fields.Key
  delete form.fields.Key
  return new Promise((resolve, reject) =>
    request.post(
      {
        url: form.url,
        formData: {
          ...form.fields,
          file: fileStream
        }
      },
      error => {
        error ? reject(error) : resolve()
      }
    )
  )
}

export const createToken = (
  { config: { deploymentId, secretKey } },
  { dir, expireTime }
) => {
  const payload = Buffer.from(
    JSON.stringify({
      deploymentId,
      dir,
      expireTime: Date.now() + expireTime
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

const createUploadAdapter = config => {
  const {
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
    endpoint,
    deploymentId,
    CDN,
    secretKey
  } = config

  const s3 = new S3({
    credentials: {
      accessKeyId,
      secretAccessKey
    },
    endpoint,
    region,
    signatureVersion: 'v4',
    useAccelerateEndpoint: true
  })

  const pool = { config, s3, bucket }

  return Object.freeze({
    createPresignedPut: createPresignedPut.bind(null, pool),
    upload: upload.bind(null, pool),
    createPresignedPost: createPresignedPost.bind(null, pool),
    uploadFormData: uploadFormData.bind(null, pool),
    deploymentId,
    CDN,
    secretKey,
    createToken,
    resource: {
      create: createCloudFrontDistribution.bind(null, {
        accessKeyId,
        secretAccessKey,
        bucketName: bucket,
        region
      })
    }
  })
}

export default createUploadAdapter
