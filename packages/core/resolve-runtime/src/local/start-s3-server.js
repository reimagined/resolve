import express from 'express'
import multer from 'multer'
import bodyParser from 'body-parser'
import fs from 'fs'
import crypto from 'crypto'
import cors from 'cors'

const startS3Server = ({ directory, bucket, port, secretKey }) => {
  const path = `${directory}/${bucket}`
  const app = express()
  app.use(
    cors({
      origin: '*',
      optionsSuccessStatus: 200
    })
  )
  app.use((req, res, next) => {
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
    }
    next()
  }, express.static(path))

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory)
  }

  if (!fs.existsSync(path)) {
    fs.mkdirSync(path)
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      if (!fs.existsSync(`${path}/${req.query.dir}`)) {
        fs.mkdirSync(`${path}/${req.query.dir}`)
      }
      cb(null, `${path}/${req.query.dir}`)
    },
    filename: (req, file, cb) => {
      cb(null, req.query.uploadId)
    }
  })
  const upload = multer({ storage })

  app.post('/upload', upload.single('file'))

  app.use((req, res) => {
    res.end()
  })

  const bodyParserMiddleware = bodyParser.raw({
    type: () => true,
    limit: '100mb'
  })

  app.put('/upload', bodyParserMiddleware, (req, res) => {
    if (!fs.existsSync(`${path}/${req.query.dir}`)) {
      fs.mkdirSync(`${path}/${req.query.dir}`)
    }
    fs.appendFileSync(
      `${path}/${req.query.dir}/${req.query.uploadId}`,
      req.body
    )
    res.end()
  })

  app.listen(port)
}

export default startS3Server
