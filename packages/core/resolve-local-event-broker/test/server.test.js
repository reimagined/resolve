import { result, xpub, sub, reset } from 'resolve-zeromq'
import createAndInitBroker from '../src/server/index'
import { CLIENT_TO_SERVER_TOPICS } from '../src/constants'

describe('main broker tests', () => {
  let broker = null
  const encodeContent = content =>
    Buffer.from(JSON.stringify(content), 'utf8').toString('base64')

  beforeEach(async () => {
    const events = [{ type: 'Test' }]

    const eventStore = {
      loadEvents: jest.fn(async (_, callback) => {
        if (events.length > 0) {
          callback(events.pop())
        }
      }),
      dispose: jest.fn()
    }
    const config = {
      zmqBrokerAddress: 'tcp://127.0.0.1:3500',
      zmqConsumerAddress: 'tcp://127.0.0.1:3501',
      databaseFile: ':memory:',
      batchSize: 1,
      initialTimestamp: 0,
      eventStore
    }

    broker = await createAndInitBroker(config)
  })

  afterEach(async () => {
    const disposeBroker = broker
    await disposeBroker()
    broker = null
    reset()
  })

  test('sub <- CLIENT_TO_SERVER_TOPICS.EVENT_TOPIC', async () => {
    const content = {}

    await sub.onMessage(
      Buffer.from(
        `${CLIENT_TO_SERVER_TOPICS.EVENT_TOPIC} ${encodeContent(content)}`
      )
    )

    expect(result).toMatchSnapshot()
  })

  test('sub <- CLIENT_TO_SERVER_TOPICS.RESET_LISTENER_TOPIC', async () => {
    const content = {
      messageGuid: 'messageGuid',
      listenerId: 'listenerId',
      clientId: 'clientId'
    }

    await sub.onMessage(
      Buffer.from(
        `${CLIENT_TO_SERVER_TOPICS.RESET_LISTENER_TOPIC} ${encodeContent(
          content
        )}`
      )
    )

    expect(result).toMatchSnapshot()
  })

  test('sub <- CLIENT_TO_SERVER_TOPICS.PAUSE_LISTENER_TOPIC', async () => {
    const content = {
      listenerId: 'listenerId'
    }

    await sub.onMessage(
      Buffer.from(
        `${CLIENT_TO_SERVER_TOPICS.PAUSE_LISTENER_TOPIC} ${encodeContent(
          content
        )}`
      )
    )

    expect(result).toMatchSnapshot()
  })

  test('sub <- CLIENT_TO_SERVER_TOPICS.RESUME_LISTENER_TOPIC', async () => {
    const content = {
      listenerId: 'listenerId'
    }

    await sub.onMessage(
      Buffer.from(
        `${CLIENT_TO_SERVER_TOPICS.RESUME_LISTENER_TOPIC} ${encodeContent(
          content
        )}`
      )
    )

    expect(result).toMatchSnapshot()
  })

  test('sub <- CLIENT_TO_SERVER_TOPICS.ACKNOWLEDGE_BATCH_TOPIC', async () => {
    const content = {
      listenerId: 'listenerId',
      lastError: { code: '400', message: 'Test' },
      lastEvent: { type: 'Test' },
      messageGuid: 'messageGuid'
    }

    await sub.onMessage(
      Buffer.from(
        `${CLIENT_TO_SERVER_TOPICS.ACKNOWLEDGE_BATCH_TOPIC} ${encodeContent(
          content
        )}`
      )
    )

    expect(result).toMatchSnapshot()
  })

  test('sub <- CLIENT_TO_SERVER_TOPICS.INFORMATION_TOPIC', async () => {
    const content = {
      messageGuid: 'messageGuid',
      listenerId: 'listenerId',
      clientId: 'clientId'
    }

    await sub.onMessage(
      Buffer.from(
        `${CLIENT_TO_SERVER_TOPICS.INFORMATION_TOPIC} ${encodeContent(content)}`
      )
    )

    expect(result).toMatchSnapshot()
  })

  test('sub <- CLIENT_TO_SERVER_TOPICS.PROPERTIES_TOPIC "listProperties"', async () => {
    const propertyAction = {
      listenerId: 'listenerId',
      key: 'key',
      value: 'value',
      action: 'listProperties'
    }

    const content = {
      messageGuid: 'messageGuid',
      clientId: 'clientId',
      ...propertyAction
    }

    await sub.onMessage(
      Buffer.from(
        `${CLIENT_TO_SERVER_TOPICS.PROPERTIES_TOPIC} ${encodeContent(content)}`
      )
    )

    expect(result).toMatchSnapshot()
  })

  test('sub <- CLIENT_TO_SERVER_TOPICS.PROPERTIES_TOPIC "getProperty"', async () => {
    const propertyAction = {
      listenerId: 'listenerId',
      key: 'key',
      value: 'value',
      action: 'getProperty'
    }

    const content = {
      messageGuid: 'messageGuid',
      clientId: 'clientId',
      ...propertyAction
    }

    await sub.onMessage(
      Buffer.from(
        `${CLIENT_TO_SERVER_TOPICS.PROPERTIES_TOPIC} ${encodeContent(content)}`
      )
    )

    expect(result).toMatchSnapshot()
  })

  test('sub <- CLIENT_TO_SERVER_TOPICS.PROPERTIES_TOPIC "setProperty"', async () => {
    const propertyAction = {
      listenerId: 'listenerId',
      key: 'key',
      value: 'value',
      action: 'setProperty'
    }

    const content = {
      messageGuid: 'messageGuid',
      clientId: 'clientId',
      ...propertyAction
    }

    await sub.onMessage(
      Buffer.from(
        `${CLIENT_TO_SERVER_TOPICS.PROPERTIES_TOPIC} ${encodeContent(content)}`
      )
    )

    expect(result).toMatchSnapshot()
  })

  test('sub <- CLIENT_TO_SERVER_TOPICS.PROPERTIES_TOPIC "deleteProperty"', async () => {
    const propertyAction = {
      listenerId: 'listenerId',
      key: 'key',
      value: 'value',
      action: 'deleteProperty'
    }

    const content = {
      messageGuid: 'messageGuid',
      clientId: 'clientId',
      ...propertyAction
    }

    await sub.onMessage(
      Buffer.from(
        `${CLIENT_TO_SERVER_TOPICS.PROPERTIES_TOPIC} ${encodeContent(content)}`
      )
    )

    expect(result).toMatchSnapshot()
  })

  test('xpub subscribe', async () => {
    const listenerId = 'listenerId'
    const clientId = 'clientId'

    const encodedTopic = `${Buffer.from(listenerId).toString(
      'base64'
    )}-${Buffer.from(clientId).toString('base64')}`

    const subscribe = xpub.onMessage(Buffer.from(`\u0001${encodedTopic}`))

    const content = {
      listenerId,
      lastError: null,
      lastEvent: { type: 'Test' },
      messageGuid: 'cuid'
    }

    await new Promise(resolve => setTimeout(resolve, 10))

    await sub.onMessage(
      Buffer.from(
        `${CLIENT_TO_SERVER_TOPICS.ACKNOWLEDGE_BATCH_TOPIC} ${encodeContent(
          content
        )}`
      )
    )

    await new Promise(resolve => setTimeout(resolve, 10))

    await sub.onMessage(
      Buffer.from(
        `${CLIENT_TO_SERVER_TOPICS.ACKNOWLEDGE_BATCH_TOPIC} ${encodeContent(
          content
        )}`
      )
    )

    await new Promise(resolve => setTimeout(resolve, 10))

    await sub.onMessage(
      Buffer.from(
        `${CLIENT_TO_SERVER_TOPICS.ACKNOWLEDGE_BATCH_TOPIC} ${encodeContent(
          content
        )}`
      )
    )

    await subscribe

    expect(result).toMatchSnapshot()
  })

  test('xpub unsubscribe', async () => {
    const listenerId = 'listenerId'
    const clientId = 'clientId'

    const encodedTopic = `${Buffer.from(listenerId).toString(
      'base64'
    )}-${Buffer.from(clientId).toString('base64')}`

    await xpub.onMessage(Buffer.from(`\u0000${encodedTopic}`))

    expect(result).toMatchSnapshot()
  })
})

describe('failure broker tests', () => {
  test('wrong config', async () => {
    try {
      await createAndInitBroker({})
      return Promise.reject('Test failed')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })
})
