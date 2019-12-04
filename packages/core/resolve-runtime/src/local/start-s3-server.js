import express from 'express'
import multer from 'multer'
import bodyParser from 'body-parser'
import fs from 'fs'
import crypto from 'crypto'
import cors from 'cors'
import path from 'path'

const startS3Server = ({ directory, bucket, port, secretKey }) => {
  const bucketPath = path.join(directory, bucket)
  const app = express()
  let metadata = null
  app.use(
    cors({
      origin: '*',
      optionsSuccessStatus: 200
    })
  )
  app.use(
    (req, res, next) => {
      if (req.method === 'GET') {
        if (req.query.token == null || req.query.token === '') {
          return res.status(403).end('Signature does not found.')
        }

        const [payload, signature] = req.query.token.split('*')

        if (payload == null || signature == null) {
          return res.status(403).end('Invalid Signature.')
        }

        const { dir, expireTime } = JSON.parse(
          Buffer.from(payload, 'base64').toString()
        )

        const requestDir = req.originalUrl.split('?')[0].split('/')[1]

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

        const uploadId = req.originalUrl.split('?')[0].split('/')[2]

        try {
          metadata = JSON.parse(
            fs.readFileSync(
              path.join(bucketPath, dir, `${uploadId}.metadata`),
              'utf8'
            )
          )
        } catch (e) {}
      }
      next()
    },
    express.static(bucketPath, {
      setHeaders: res => {
        res.set('Content-Type', metadata['Content-Type'])
      }
    })
  )

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory)
  }

  if (!fs.existsSync(bucketPath)) {
    fs.mkdirSync(bucketPath)
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(bucketPath, req.query.dir))
    },
    filename: (req, file, cb) => {
      cb(null, req.query.uploadId)
    }
  })
  const upload = multer({ storage })

  app.post(
    '/upload',
    (req, res, next) => {
      try {
        if (!fs.existsSync(path.join(bucketPath, req.query.dir))) {
          fs.mkdirSync(path.join(bucketPath, req.query.dir))
        }
        fs.appendFileSync(
          path.join(
            bucketPath,
            req.query.dir,
            `${req.query.uploadId}.metadata`
          ),
          JSON.stringify({ 'Content-Type': req.query.type })
        )
      } catch (error) {}

      next()
    },
    upload.single('file')
  )

  app.use((req, res) => {
    res.end()
  })

  const bodyParserMiddleware = bodyParser.raw({
    type: () => true,
    limit: '100mb'
  })

  app.put('/upload', bodyParserMiddleware, (req, res) => {
    if (!fs.existsSync(path.join(bucketPath, req.query.dir))) {
      fs.mkdirSync(path.join(bucketPath, req.query.dir))
    }
    fs.appendFileSync(
      path.join(bucketPath, req.query.dir, req.query.uploadId),
      req.body
    )
    try {
      fs.appendFileSync(
        path.join(bucketPath, req.query.dir, `${req.query.uploadId}.metadata`),
        JSON.stringify({ 'Content-Type': req.query.type })
      )
    } catch (error) {}
    res.end()
  })

  app.listen(port)
}

export default startS3Server
