import debugLevels from 'resolve-debug-levels'
import fs from 'fs'
import path from 'path'

import extractRequestBody from '../utils/extract-request-body'
import crypto from 'crypto'

const log = debugLevels('resolve:resolve-runtime:uploader-handler')

const uploaderHandler = async (req, res) => {
  try {
    const { directory, bucket, secretKey } = req.resolve.uploader
    const bucketPath = path.join(directory, bucket)

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory)
    }

    if (!fs.existsSync(bucketPath)) {
      fs.mkdirSync(bucketPath)
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const { dir, uploadId } = req.query

      const dirName = path.join(directory, bucket, dir)
      if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName)
      }

      const body = extractRequestBody(req)
      const data = Buffer.from(body.file.contentData, 'latin1')

      fs.appendFileSync(`${dirName}/${uploadId}`, data)
      fs.appendFileSync(
        `${dirName}/${uploadId}.metadata`,
        JSON.stringify({
          'Content-Type': body.file.contentType
        })
      )
    } else if (req.method === 'GET') {
      const { dir: requestDir, uploadId } = req.matchedParams
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
