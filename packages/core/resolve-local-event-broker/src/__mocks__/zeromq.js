export const result = []

export const xpub = {}
Object.assign(xpub, {
  send: (...args) => {
    result.push('xpub.send', ...args)
  },
  setsockopt: (...args) => {
    result.push('xpub.setsockopt', ...args)
  },
  bindSync: (...args) => {
    result.push('xpub.bindSync', ...args)
  },
  unbindSync: (...args) => {
    result.push('xpub.unbindSync', ...args)
  },
  on: (topic, callback) => {
    xpub.onMessage = callback
    result.push('xpub.on', topic)
  }
})

export const sub = {}
Object.assign(sub, {
  setsockopt: (...args) => {
    result.push('sub.setsockopt', ...args)
  },
  bindSync: (...args) => {
    result.push('sub.bindSync', ...args)
  },
  unbindSync: (...args) => {
    result.push('sub.unbindSync', ...args)
  },
  on: (topic, callback) => {
    sub.onMessage = callback
    result.push('sub.on', topic)
  }
})

export default {
  socket: protocol => {
    result.push('zmq.socket', protocol)
    switch (protocol) {
      case 'sub':
        return sub
      case 'xpub':
        return xpub
      default:
        throw new Error()
    }
  }
}

export const reset = () => {
  result.length = 0
  xpub.onMessage = null
  sub.onMessage = null
}
