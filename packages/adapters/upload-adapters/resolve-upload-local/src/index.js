import fs from 'fs'
import path from 'path'
import request from 'request'
import uuid from 'uuid/v4'
import crypto from 'crypto'

const createPresignedPut = async ({ host, port, protocol }, dir) => {
  const uploadId = uuid()
  const uploadUrl = `${protocol}://${host}:${port}/upload?dir=${dir}&uploadId=${uploadId}`

  return {
    uploadUrl,
    uploadId
  }
}

export const upload = (uploadUrl, filePath) => {
  const fileSizeInBytes = fs.statSync(filePath).size
  const fileStream = fs.createReadStream(filePath)
  return new Promise((resolve, reject) =>
    request.put(
      {
        headers: {
          'Content-Length': fileSizeInBytes
        },
        uri: uploadUrl.concat(path.extname(filePath)),
        body: fileStream
      },
      (error, _, body) => {
        error ? reject(error) : body ? reject(body) : resolve()
      }
    )
  )
}

const createPresignedPost = async ({ host, port, protocol }, dir) => {
  const uploadId = uuid()
  const form = {
    url: `${protocol}://${host}:${port}/upload?dir=${dir}&uploadId=${uploadId}`,
    url_fields: {}
  }

  return {
    form,
    uploadId
  }
}

export const uploadFormData = (form, filePath) => {
  const fileStream = fs.createReadStream(filePath)

  return new Promise((resolve, reject) =>
    request.post(
      {
        url: form.url.concat(path.extname(filePath)),
        formData: {
          file: fileStream
        }
      },
      error => {
        error ? reject(error) : resolve()
      }
    )
  )
}

const createToken = ({ secretKey }, { dir, expireTime }) => {
  const payload = Buffer.from(
    JSON.stringify({
      dir,
      expireTime: Date.now() + expireTime * 1000
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

const createUploadAdapter = pool => {
  return Object.freeze({
    createPresignedPut: createPresignedPut.bind(null, pool),
    createPresignedPost: createPresignedPost.bind(null, pool),
    createToken: createToken.bind(null, pool),
    upload: upload,
    uploadFormData: uploadFormData
  })
}

export default createUploadAdapter
