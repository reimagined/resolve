import S3 from 'aws-sdk/clients/s3'
import fs from 'fs'
import request from 'request'
import path from 'path'
import uuid from 'uuid/v4'

// const createMultipartUpload = async ({ s3, bucket }, uploadId = uuid()) => {
//   const result = await s3
//     .createMultipartUpload({ Bucket: bucket, Key: uploadId })
//     .promise()
//   console.log(result)
// }

const createUploader = async ({ s3, bucket }, uploadId = uuid()) => {
  const uploadUrl = await s3.getSignedUrlPromise('putObject', {
    Bucket: bucket,
    Key: uploadId
  })

  return {
    uploadUrl,
    uploadId
  }
}

const upload = (pool, uploadUrl) => {
  const filePath = path.join(__dirname, 'test.jpg')
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

const createPresignedPost = async ({ s3, bucket }) => {
  const uploadId = uuid()
  const form = await new Promise((resolve, reject) => {
    s3.createPresignedPost(
      {
        Bucket: bucket,
        Key: uploadId,
        Fields: {
          Key: uploadId
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

const uploadFormData = (pool, form) => {
  const filePath = path.join(__dirname, 'test.jpg')
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
  const {
    accessKeyId,
    secretAccessKey,
    endpoint,
    bucket,
    region,
    ...additionalParams
  } = config

  const s3 = new S3({
    credentials: {
      accessKeyId,
      secretAccessKey
    },
    endpoint,
    region,
    signatureVersion: 'v4',
    ...additionalParams
  })

  const pool = { config, s3, bucket }

  return Object.freeze({
    createUploader: createUploader.bind(null, pool),
    createPresignedPost: createPresignedPost.bind(null, pool),
    upload: upload.bind(null, pool),
    uploadFormData: uploadFormData.bind(null, pool)
  })
}

export default createUploadAdapter
