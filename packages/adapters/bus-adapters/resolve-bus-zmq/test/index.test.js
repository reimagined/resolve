import sinon from 'sinon'
import zeromq from 'zeromq'
import adapter from '../src'

describe('ZeroMQ bus', () => {
  let zmqSocketStub = null
  let fakeSocketXpub = null
  let fakeSocketXsub = null
  let fakeSocketPub = null
  let fakeSocketSub = null
  let trigger = null
  let brokerActivated = {
    pub: false,
    sub: false
  }

  const generateSocket = side => ({
    bindSync: sinon.spy(() => {
      if (brokerActivated[side]) throw new Error('Bind error')
      brokerActivated[side] = true
    }),
    connect: sinon.spy(() => {
      if (!brokerActivated[side]) throw new Error('Connection error')
    }),
    identity: null,
    setsockopt: sinon.spy(),
    send: sinon.spy(),
    subscribe: sinon.spy(),
    on: sinon.spy()
  })

  const testOptions = {
    channel: '@@channel',
    address: '@@address',
    pubPort: '@@pubPort',
    subPort: '@@subPort'
  }

  beforeEach(() => {
    fakeSocketXpub = generateSocket('pub')
    fakeSocketXsub = generateSocket('sub')
    fakeSocketPub = generateSocket('pub')
    fakeSocketSub = generateSocket('sub')
    trigger = sinon.spy()

    zmqSocketStub = sinon.stub(zeromq, 'socket').callsFake(socktype => {
      switch (socktype) {
        case 'xpub':
          return fakeSocketXpub
        case 'xsub':
          return fakeSocketXsub
        case 'pub':
          return fakeSocketPub
        case 'sub':
          return fakeSocketSub
        default:
          return null
      }
    })
  })

  afterEach(() => {
    zmqSocketStub.restore()

    fakeSocketXpub = null
    fakeSocketXsub = null
    fakeSocketPub = null
    fakeSocketSub = null
    trigger = null

    brokerActivated = {
      pub: false,
      sub: false
    }
  })

  it('should init correctly and run new broker', async () => {
    const instance = adapter(testOptions)

    await instance.init()
    await instance.subscribe(trigger)

    expect(zeromq.socket.callCount).toEqual(4)

    expect(zeromq.socket.getCall(0).args).toEqual(['xsub'])
    expect(fakeSocketXsub.identity).toMatch(/^subscriber/)
    expect(fakeSocketXsub.bindSync.callCount).toEqual(1)

    expect(fakeSocketXsub.bindSync.firstCall.args).toEqual([
      `tcp://${testOptions.address}:${testOptions.subPort}`
    ])

    expect(zeromq.socket.getCall(1).args).toEqual(['xpub'])
    expect(fakeSocketXpub.identity).toMatch(/^publisher/)

    expect(fakeSocketXpub.setsockopt.callCount).toEqual(2)
    expect(fakeSocketXpub.setsockopt.firstCall.args).toEqual([
      zeromq.ZMQ_SNDHWM,
      1000
    ])
    expect(fakeSocketXpub.setsockopt.secondCall.args).toEqual([
      zeromq.ZMQ_XPUB_VERBOSE,
      0
    ])

    expect(fakeSocketXpub.bindSync.firstCall.args).toEqual([
      `tcp://${testOptions.address}:${testOptions.pubPort}`
    ])

    expect(fakeSocketXsub.on.callCount).toEqual(1)
    expect(fakeSocketXsub.on.firstCall.args[0]).toEqual('message')
    const xsubCallback = fakeSocketXsub.on.firstCall.args[1]

    expect(fakeSocketXpub.on.callCount).toEqual(1)
    expect(fakeSocketXpub.on.firstCall.args[0]).toEqual('message')
    const xpubCallback = fakeSocketXpub.on.firstCall.args[1]

    xsubCallback('xpubMarker')
    expect(fakeSocketXpub.send.callCount).toBeGreaterThan(0)
    expect(fakeSocketXpub.send.lastCall.args[0]).toEqual('xpubMarker')

    xpubCallback('xsubMarker')
    expect(fakeSocketXsub.send.callCount).toBeGreaterThan(0)
    expect(fakeSocketXsub.send.lastCall.args[0]).toEqual('xsubMarker')

    expect(zeromq.socket.getCall(2).args).toEqual(['pub'])
    expect(fakeSocketPub.connect.callCount).toEqual(1)

    expect(fakeSocketPub.connect.firstCall.args).toEqual([
      `tcp://${testOptions.address}:${testOptions.subPort}`
    ])

    expect(zeromq.socket.getCall(3).args).toEqual(['sub'])
    expect(fakeSocketSub.subscribe.callCount).toEqual(1)
    expect(fakeSocketSub.subscribe.firstCall.args).toEqual([
      testOptions.channel
    ])

    expect(fakeSocketSub.connect.callCount).toEqual(1)
    expect(fakeSocketSub.connect.firstCall.args).toEqual([
      `tcp://${testOptions.address}:${testOptions.pubPort}`
    ])

    expect(fakeSocketSub.on.callCount).toEqual(1)
    expect(fakeSocketSub.on.firstCall.args[0]).toEqual('message')
  })

  it('should init correctly and use existing broker', async () => {
    brokerActivated = { pub: true, sub: true }
    const instance = adapter(testOptions)
    await instance.init()
    instance.subscribe(trigger)

    expect(zeromq.socket.callCount).toEqual(3)

    expect(fakeSocketXsub.bindSync.callCount).toEqual(1)
    expect(fakeSocketXsub.bindSync.lastCall.exception.message).toEqual(
      'Bind error'
    )

    expect(fakeSocketXpub.bindSync.callCount).toEqual(0)
    expect(fakeSocketXpub.setsockopt.callCount).toEqual(0)

    expect(fakeSocketXsub.on.callCount).toEqual(0)
    expect(fakeSocketXpub.on.callCount).toEqual(0)

    expect(zeromq.socket.getCall(1).args).toEqual(['pub'])
    expect(fakeSocketPub.connect.callCount).toEqual(1)

    expect(fakeSocketPub.connect.firstCall.args).toEqual([
      `tcp://${testOptions.address}:${testOptions.subPort}`
    ])

    expect(zeromq.socket.getCall(2).args).toEqual(['sub'])
    expect(fakeSocketSub.subscribe.callCount).toEqual(1)
    expect(fakeSocketSub.subscribe.firstCall.args).toEqual([
      testOptions.channel
    ])

    expect(fakeSocketSub.connect.callCount).toEqual(1)
    expect(fakeSocketSub.connect.firstCall.args).toEqual([
      `tcp://${testOptions.address}:${testOptions.pubPort}`
    ])

    expect(fakeSocketSub.on.callCount).toEqual(1)
    expect(fakeSocketSub.on.firstCall.args[0]).toEqual('message')
  })

  it('should publish messages in bus', async () => {
    brokerActivated = { pub: true, sub: true }
    const instance = adapter(testOptions)
    await instance.init()

    const originalMessage = { marker: '@@message-marker' }
    const stringMessage = JSON.stringify(originalMessage)

    await instance.publish(originalMessage)

    expect(fakeSocketPub.send.callCount).toEqual(1)

    expect(fakeSocketPub.send.lastCall.args[0]).toEqual(
      `${testOptions.channel} ${stringMessage}`
    )
  })

  it('should trigger on incoming bus messages', async () => {
    brokerActivated = { pub: true, sub: true }
    const instance = adapter(testOptions)
    await instance.init()

    const originalMessage = { marker: '@@message-marker' }
    const stringMessage = JSON.stringify(originalMessage)

    await instance.init()
    await instance.subscribe(trigger)

    const onCallback = fakeSocketSub.on.firstCall.args[1]
    onCallback(`${testOptions.channel} ${stringMessage}`)

    expect(trigger.callCount).toEqual(1)
    expect(trigger.lastCall.args).toEqual([originalMessage])
  })
})
