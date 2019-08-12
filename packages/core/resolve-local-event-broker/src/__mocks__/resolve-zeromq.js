export const result = []

export const xpub = {}
Object.assign(xpub, {
  send: (...args) => {
    result.push('xpub.send', ...args)
  },
  setsockopt: (...args) => {
    result.push('xpub.setsockopt', ...args)
  },
  bind: (...args) => {
    result.push('xpub.bind', ...args)
  },
  unbind: (...args) => {
    result.push('xpub.unbind', ...args)
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
  bind: (...args) => {
    result.push('sub.bind', ...args)
  },
  unbind: (...args) => {
    result.push('sub.unbind', ...args)
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
