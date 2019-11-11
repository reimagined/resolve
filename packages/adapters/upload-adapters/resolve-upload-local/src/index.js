import S3 from 'aws-sdk/clients/s3'
import fs from 'fs'
import request from 'request'
import uuid from 'uuid/v4'

const createPresignedPut = async ({ s3, bucket }, dir, uploadId = uuid()) => {
  const key = dir !== '' ? `${dir}/${uploadId}` : `${uploadId}`
  const uploadUrl = await s3.getSignedUrlPromise('putObject', {
    Bucket: bucket,
    Key: key
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

const createPresignedPost = async ({ s3, bucket }, dir, uploadId = uuid()) => {
  const key = dir !== '' ? `${dir}/${uploadId}` : `${uploadId}`
  const form = await new Promise((resolve, reject) => {
    s3.createPresignedPost(
      {
        Bucket: bucket,
        Fields: {
          Key: key
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

const createUploadAdapter = config => {
  const { bucket, host, port, protocol } = config

  const s3 = new S3({
    credentials: {
      accessKeyId: 'S3RVER',
      secretAccessKey: 'S3RVER'
    },
    endpoint: `${protocol}://${host}:${port}`,
    signatureVersion: 'v4',
    sslEnabled: false,
    s3ForcePathStyle: true
  })

  const pool = { config, s3, bucket }

  return Object.freeze({
    createPresignedPut: createPresignedPut.bind(null, pool),
    upload: upload.bind(null, pool),
    createPresignedPost: createPresignedPost.bind(null, pool),
    uploadFormData: uploadFormData.bind(null, pool)
  })
}

export default createUploadAdapter
