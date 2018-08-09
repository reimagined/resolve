import sinon from 'sinon'
import amqplib from 'amqplib'
import adapter from '../src'

const fakeChannel = {
  publish: () => {},
  consume: () => {},
  bindQueue: () => {},
  assertQueue: () => {},
  assertExchange: () => {}
}

const fakeConnection = {
  createChannel: () => fakeChannel
}

describe('RabbitMQ bus', () => {
  let amqplibMock
  let fakeChannelMock
  let consumeExpectation
  let assertExchangeExpectation

  const adapterConfig = {
    url: 'url',
    messageTtl: 'messageTtl',
    maxLength: 'maxLength'
  }
  const queue = { queue: 'queue' }

  const queueConfig = {
    arguments: {
      messageTtl: adapterConfig.messageTtl,
      maxLength: adapterConfig.maxLength
    }
  }

  const message = {
    content: JSON.stringify({ type: 'eventType' })
  }

  beforeEach(() => {
    amqplibMock = sinon.mock(amqplib)
    fakeChannelMock = sinon.mock(fakeChannel)

    amqplibMock
      .expects('connect')
      .withArgs(adapterConfig.url)
      .resolves(fakeConnection)

    consumeExpectation = fakeChannelMock.expects('consume')

    fakeChannelMock
      .expects('assertQueue')
      .withArgs('', queueConfig)
      .resolves(queue)

    fakeChannelMock
      .expects('bindQueue')
      .withArgs(queue.queue, 'exchange')
      .resolves()

    assertExchangeExpectation = fakeChannelMock
      .expects('assertExchange')
      .resolves()
  })

  afterEach(() => {
    amqplibMock.restore()
    fakeChannelMock.restore()
  })

  describe('publish', () => {
    it('calls amqplib connect once', async () => {
      const instance = adapter(adapterConfig)
      await instance.init()
      await instance.publish({})
      await instance.publish({})
      amqplibMock.verify()
    })

    it('calls amqplib publish', async () => {
      const event = {}

      fakeChannelMock
        .expects('publish')
        .withArgs('exchange', '', new Buffer(JSON.stringify(event)))

      const instance = adapter(adapterConfig)
      await instance.init()
      await instance.publish(event)

      fakeChannelMock.verify()
    })

    it('calls amqplib connect once in parallel', async () => {
      const instance = adapter(adapterConfig)
      await instance.init()
      const firstEvent = { message: 1 }
      const secondEvent = { message: 2 }

      fakeChannelMock
        .expects('publish')
        .onCall(0)
        .callsFake((exchange, queueName, event, options) => {
          expect(new Buffer(JSON.stringify(firstEvent))).toEqual(event)
          expect(options).toEqual({
            expiration: adapterConfig.messageTtl,
            persistent: false
          })
        })

      fakeChannelMock
        .expects('publish')
        .onCall(1)
        .callsFake((exchange, queueName, event, options) => {
          expect(new Buffer(JSON.stringify(secondEvent))).toEqual(event)
          expect(options).toEqual({
            expiration: adapterConfig.messageTtl,
            persistent: false
          })
        })

      await Promise.all([
        instance.publish(firstEvent),
        instance.publish(secondEvent)
      ])

      amqplibMock.verify()
    })
  })

  describe('onEvent', () => {
    it('calls amqplib connect only once in sequence', async () => {
      const instance = adapter(adapterConfig)
      await instance.init()
      await instance.subscribe(() => {})
      await instance.subscribe(['eventType'], () => {})
      amqplibMock.verify()
    })

    it('calls callback on message is got from amqplib', async () => {
      const instance = adapter(adapterConfig)
      let emitter

      consumeExpectation.callsFake((queueName, func, options) => {
        expect(queueName).toEqual('')
        expect(func).toBeInstanceOf(Function)
        expect(options).toEqual({ noAck: true })
        emitter = func
      })

      await instance.init()

      await instance.subscribe(event => {
        expect(JSON.stringify(event)).toEqual(message.content)
        fakeChannelMock.verify()
      })

      emitter(message)
    })

    it('calls amqplib bindQueue with correct arguments', async () => {
      const instance = adapter(adapterConfig)
      await instance.init()

      await instance.subscribe(['eventType'], () => {})
      fakeChannelMock.verify()
    })

    it('calls amqplib assertExchange', async () => {
      const instance = adapter(adapterConfig)
      await instance.init()

      assertExchangeExpectation
        .withArgs('exchange', 'fanout', { durable: false })
        .resolves()

      await instance.subscribe(() => {})
      fakeChannelMock.verify()
    })
  })
})
