import debugLevels from 'resolve-debug-levels'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import fileType from 'file-type'

import extractRequestBody from '../utils/extract-request-body'

const log = debugLevels('resolve:resolve-runtime:uploader-handler')

const uploaderHandler = async (req, res) => {
  try {
    const { directory, bucket, secretKey } = req.resolve.uploader
    const bucketPath = path.join(directory, bucket)

    if (!fs.existsSync(bucketPath)) {
      fs.mkdirSync(bucketPath, { recursive: true })
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const { dir, uploadId } = req.query

      const dirName = path.join(directory, bucket, dir)
      if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true })
      }

      let body = null
      let data = null

      if (req.method === 'POST') {
        body = extractRequestBody(req)
        data = Buffer.from(body.file.contentData, 'latin1')

        fs.appendFileSync(
          `${dirName}/${uploadId}.metadata`,
          JSON.stringify({
            'Content-Type': body.file.contentType
          })
        )
      } else {
        body = req.body
        data = Buffer.from(body, 'latin1')

        fs.appendFileSync(
          `${dirName}/${uploadId}.metadata`,
          JSON.stringify({
            'Content-Type':
              fileType(data) != null ? fileType(data).mime : 'text/plain'
          })
        )
      }

      fs.appendFileSync(`${dirName}/${uploadId}`, data)
    } else if (req.method === 'GET') {
      const uploadParams = req.matchedParams.params
      if (uploadParams == null || uploadParams.constructor !== String) {
        return res.status(403).end('Invalid URL.')
      }

      const uploadParamsArray = uploadParams.split('/')
      const requestDir = uploadParamsArray.slice(0, -1).join('/')
      const [uploadId] = uploadParamsArray.slice(-1)

      const { token } = req.query

      if (token == null || token === '') {
        return res.status(403).end('Signature does not found.')
      }

      const [payload, signature] = token.split('*')

      if (payload == null || signature == null) {
        return res.status(403).end('Invalid Signature.')
      }

      const { dir, expireTime } = JSON.parse(
        Buffer.from(payload, 'base64').toString()
      )

      if (requestDir !== dir) {
        return res.status(403).end('Invalid dir.')
      }

      const encodePayload = crypto
        .createHmac('md5', secretKey)
        .update(payload)
        .digest('hex')

      if (signature !== encodePayload) {
        return res.status(403).end('Signature does not match.')
      }

      if (Date.now() > expireTime) {
        return res.status(403).end('Time is over.')
      }

      const metadata = JSON.parse(
        fs.readFileSync(
          path.join(bucketPath, dir, `${uploadId}.metadata`),
          'utf8'
        )
      )

      const file = fs.readFileSync(path.join(bucketPath, dir, uploadId))

      res.setHeader('Content-Type', metadata['Content-Type'])
      res.setHeader('Content-Disposition', 'inline')
      res.end(file)
    }
  } catch (err) {
    log.warn('Uploader handler error', err)
    await res.status(500)
    await res.setHeader('Content-Type', 'text/plain')
    await res.end(err.toString())
  }
}

export default uploaderHandler
