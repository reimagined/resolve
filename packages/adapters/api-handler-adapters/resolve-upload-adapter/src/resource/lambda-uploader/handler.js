process.env.DEBUG = '*'
process.env.DEBUG_LEVEL = 'verbose'

const cLog = require('./logger')

const crypto = require('crypto')

const originRequest = async request => {
  const log = cLog(`import-export`)
  const { querystring, uri } = request
  const [payload, signature] = querystring.substr(6).split('*')
  const { deploymentId, dir, expireTime } = JSON.parse(
    Buffer.from(payload, 'base64').toString()
  )

  const encodePayload = crypto
    .createHmac('md5', 'key')
    .update(payload)
    .digest('hex')

  if (!signature) {
    throw new Error('Signature does not found.')
  }

  if (signature !== encodePayload) {
    throw new Error('Signature does not match.')
  }

  if (Date.now() > expireTime) {
    throw new Error('Time is over.')
  }

  log.debug('deploymentId', deploymentId)
  log.debug('dir', dir)
  log.debug('expireTime', expireTime)
  log.debug('signature', signature)
  log.debug('uri', uri)

  request.querystring = ''

  return request
}

const execute = async (event, context) => {
  try {
    context.callbackWaitsForEmptyEventLoop = false

    const { request } = event.Records[0].cf

    if (request != null) {
      return await originRequest(request)
    }
  } catch (error) {
    return {
      status: '403',
      headers: {
        'Content-type': [{ key: 'Content-type', value: 'text/plain' }]
      },
      body: JSON.stringify({
        message: error.message,
        code: '403'
      }),
      bodyEncoding: 'text'
    }
  }
}

module.exports.execute = execute
