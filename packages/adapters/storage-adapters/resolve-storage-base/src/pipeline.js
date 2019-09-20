import { promisify } from 'util'

// Ported from https://github.com/mafintosh/pump with
// permission from the author, Mathias Buus (@mafintosh).
function once(callback) {
  let called = false
  return function(...args) {
    if (called) return
    called = true
    callback.apply(this, args)
  }
}

function isRequest(stream) {
  return stream.setHeader && typeof stream.abort === 'function'
}

function endOfStream(stream, options, callback) {
  if (arguments.length === 2) {
    // eslint-disable-next-line no-param-reassign
    callback = options
    // eslint-disable-next-line no-param-reassign
    options = {}
  } else if (options == null) {
    // eslint-disable-next-line no-param-reassign
    options = {}
  } else if (typeof options !== 'object') {
    throw new TypeError('The "options" argument must be object')
  }
  if (typeof callback !== 'function') {
    throw new TypeError('The "callback" argument must be function')
  }

  // eslint-disable-next-line no-param-reassign
  callback = once(callback)

  const onError = err => {
    callback.call(stream, err)
  }

  let writableFinished =
    stream.writableFinished ||
    (stream._writableState && stream._writableState.finished)
  let readableEnded =
    stream.readableEnded ||
    (stream._readableState && stream._readableState.endEmitted)

  if (writableFinished || readableEnded || stream.destroyed || stream.aborted) {
    if (options.error !== false) stream.on('error', onError)
    // A destroy(err) call emits error in nextTick.
    process.nextTick(callback.bind(stream))
    return () => {
      stream.removeListener('error', onError)
    }
  }

  let readable =
    options.readable || (options.readable !== false && stream.readable)
  let writable =
    options.writable || (options.writable !== false && stream.writable)

  const onLegacyFinish = () => {
    if (!stream.writable) onFinish()
  }

  const onFinish = () => {
    writable = false
    writableFinished = true
    if (!readable) callback.call(stream)
  }

  const onEnd = () => {
    readable = false
    readableEnded = true
    if (!writable) callback.call(stream)
  }

  const onClose = () => {
    if (readable && !readableEnded) {
      callback.call(stream, new Error('Premature close'))
    } else if (writable && !writableFinished) {
      callback.call(stream, new Error('Premature close'))
    }
  }

  const onRequest = () => {
    stream.req.on('finish', onFinish)
  }

  if (isRequest(stream)) {
    stream.on('complete', onFinish)
    stream.on('abort', onClose)
    if (stream.req) onRequest()
    else stream.on('request', onRequest)
  } else if (writable && !stream._writableState) {
    // legacy streams
    stream.on('end', onLegacyFinish)
    stream.on('close', onLegacyFinish)
  }

  // Not all streams will emit 'close' after 'aborted'.
  if (typeof stream.aborted === 'boolean') {
    stream.on('aborted', onClose)
  }

  stream.on('end', onEnd)
  stream.on('finish', onFinish)
  if (options.error !== false) stream.on('error', onError)
  stream.on('close', onClose)

  return function() {
    stream.removeListener('aborted', onClose)
    stream.removeListener('complete', onFinish)
    stream.removeListener('abort', onClose)
    stream.removeListener('request', onRequest)
    if (stream.req) stream.req.removeListener('finish', onFinish)
    stream.removeListener('end', onLegacyFinish)
    stream.removeListener('close', onLegacyFinish)
    stream.removeListener('finish', onFinish)
    stream.removeListener('end', onEnd)
    stream.removeListener('error', onError)
    stream.removeListener('close', onClose)
  }
}

function destroyer(stream, reading, writing, callback) {
  // eslint-disable-next-line no-param-reassign
  callback = once(callback)

  let closed = false
  stream.on('close', () => {
    closed = true
  })

  endOfStream(stream, { readable: reading, writable: writing }, err => {
    if (err) return callback(err)
    closed = true
    callback()
  })

  let destroyed = false
  return err => {
    if (closed) return
    if (destroyed) return
    destroyed = true

    // request.destroy just do .end - .abort is what we want
    if (isRequest(stream)) return stream.abort()
    if (typeof stream.destroy === 'function') return stream.destroy()

    callback(err || new Error('Cannot call pipe after a stream was destroyed'))
  }
}

function call(fn) {
  fn()
}

function pipe(from, to) {
  return from.pipe(to)
}

function popCallback(streams) {
  // Streams should never be an empty array. It should always contain at least
  // a single stream. Therefore optimize for the average case instead of
  // checking for length === 0 as well.
  if (typeof streams[streams.length - 1] !== 'function') {
    throw new TypeError(
      `Callback must be a function. Received ${streams[streams.length - 1]}`
    )
  }
  return streams.pop()
}

function pipeline(...streams) {
  const callback = popCallback(streams)

  if (streams.length < 2) {
    throw new TypeError('The streams argument must be specified')
  }

  let error
  const destroys = streams.map(function(stream, i) {
    const reading = i < streams.length - 1
    const writing = i > 0
    return destroyer(stream, reading, writing, function(err) {
      if (!error) error = err
      if (err) destroys.forEach(call)
      if (reading) return
      destroys.forEach(call)
      callback(error)
    })
  })

  return streams.reduce(pipe)
}

export default promisify(pipeline)
