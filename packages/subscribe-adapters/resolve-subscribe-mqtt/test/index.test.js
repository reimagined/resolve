import createSubscribeAdapter, { errorMessage } from '../src'
import mqtt from 'mqtt'
import getMqttTopics from '../src/get_mqtt_topics'

const delay = timeout =>
  new Promise(resolve => {
    setTimeout(resolve, timeout)
  })

const api = {
  getSubscribeAdapterOptions: () => ({
    qos: 2,
    url: 'mqtt://test.test',
    appId: '123456'
  })
}

test('createSubscribeAdapter should return subscribeAdapter', () => {
  const subscribeAdapter = createSubscribeAdapter({ api })

  expect(typeof subscribeAdapter.init).toBe('function')
  expect(typeof subscribeAdapter.close).toBe('function')
  expect(typeof subscribeAdapter.subscribeToTopics).toBe('function')
  expect(typeof subscribeAdapter.unsubscribeFromTopics).toBe('function')
})

test('subscribeAdapter.init should works correctly', async () => {
  const subscribeAdapter = createSubscribeAdapter({ api })

  const result = subscribeAdapter.init()

  await delay(10)

  mqtt.Client._onConnect()

  expect.assertions(1)
  expect(await result).toBeUndefined()
})

test('subscribeAdapter.init should fail', async () => {
  const subscribeAdapter = createSubscribeAdapter({ api })

  const result = subscribeAdapter.init()

  await delay(10)

  const error = new Error('Test')

  mqtt.Client._onError(error)

  expect.assertions(1)
  try {
    await result
  } catch (error) {
    expect(error).toBe(error)
  }
})

test('subscribeAdapter.init (double) should fail', async () => {
  const subscribeAdapter = createSubscribeAdapter({ api })

  let result = subscribeAdapter.init()

  await delay(10)

  mqtt.Client._onConnect()

  expect.assertions(2)
  expect(await result).toBeUndefined()

  result = subscribeAdapter.init()

  await delay(10)

  mqtt.Client._onConnect()

  expect.assertions(1)
  try {
    await result
  } catch (error) {
    expect(error).toBe(error)
  }
})

test('subscribeAdapter.subscribeToTopics should works correctly', async () => {
  const subscribeAdapter = createSubscribeAdapter({ api })

  const initResult = subscribeAdapter.init()

  await delay(10)

  mqtt.Client._onConnect()

  await initResult

  expect.assertions(1)
  const result = await subscribeAdapter.subscribeToTopics([
    {
      topicName: 'testName-1',
      topicId: 'testId-1'
    },
    {
      topicName: 'testName-2',
      topicId: 'testId-2'
    }
  ])

  expect(result).toBeUndefined()
})

test('subscribeAdapter.subscribeToTopics should fail', async () => {
  const subscribeAdapter = createSubscribeAdapter({ api })

  const initResult = subscribeAdapter.init()

  await delay(10)

  mqtt.Client._onConnect()

  await initResult

  const error = new Error('Test')

  mqtt.Client._error = error

  expect.assertions(1)
  try {
    await subscribeAdapter.subscribeToTopics([
      {
        topicName: 'testName-1',
        topicId: 'testId-1'
      },
      {
        topicName: 'testName-2',
        topicId: 'testId-2'
      }
    ])
  } catch (error) {
    expect(error).toBe(error)
  }
})

test('subscribeAdapter.unsubscribeFromTopics should works correctly', async () => {
  const subscribeAdapter = createSubscribeAdapter({ api })

  const initResult = subscribeAdapter.init()

  await delay(10)

  mqtt.Client._onConnect()

  await initResult

  expect.assertions(1)
  const result = await subscribeAdapter.unsubscribeFromTopics([
    {
      topicName: 'testName-1',
      topicId: 'testId-1'
    },
    {
      topicName: 'testName-2',
      topicId: 'testId-2'
    }
  ])

  expect(result).toBeUndefined()
})

test('subscribeAdapter.unsubscribeFromTopics should fail', async () => {
  const subscribeAdapter = createSubscribeAdapter({ api })

  const initResult = subscribeAdapter.init()

  await delay(10)

  mqtt.Client._onConnect()

  await initResult

  const error = new Error('Test')

  mqtt.Client._error = error

  expect.assertions(1)
  try {
    await subscribeAdapter.unsubscribeFromTopics([
      {
        topicName: 'testName-1',
        topicId: 'testId-1'
      },
      {
        topicName: 'testName-2',
        topicId: 'testId-2'
      }
    ])
  } catch (error) {
    expect(error).toBe(error)
  }
})
