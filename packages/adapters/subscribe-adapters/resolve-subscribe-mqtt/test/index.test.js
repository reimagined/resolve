import createSubscribeAdapter from '../src/index'
import mqtt from 'mqtt'

const delay = timeout =>
  new Promise(resolve => {
    setTimeout(resolve, timeout)
  })

const appId = '123456'
const url = 'mqtt://test.test'
const events = []

const onEvent = event => {
  events.push(event)
}

test('createSubscribeAdapter should return subscribeAdapter', () => {
  const subscribeAdapter = createSubscribeAdapter({ url, appId, onEvent })

  expect(typeof subscribeAdapter.init).toBe('function')
  expect(typeof subscribeAdapter.close).toBe('function')
  expect(typeof subscribeAdapter.subscribeToTopics).toBe('function')
  expect(typeof subscribeAdapter.unsubscribeFromTopics).toBe('function')
})

test('subscribeAdapter.init should works correctly', async () => {
  const subscribeAdapter = createSubscribeAdapter({ url, appId, onEvent })

  const result = subscribeAdapter.init()

  await delay(10)

  mqtt.Client._onConnect()

  expect.assertions(1)
  expect(await result).toBeUndefined()
})

test('subscribeAdapter.init should fail', async () => {
  const subscribeAdapter = createSubscribeAdapter({ url, appId, onEvent })

  const result = subscribeAdapter.init()

  await delay(10)

  const error = new Error('Test')

  mqtt.Client._onError(error)

  expect.assertions(1)
  try {
    await result
  } catch (err) {
    expect(err).toBe(error)
  }
})

test('subscribeAdapter.init (double) should fail', async () => {
  const subscribeAdapter = createSubscribeAdapter({ url, appId, onEvent })

  subscribeAdapter.init()

  await delay(10)

  mqtt.Client._onConnect()

  expect.assertions(1)

  try {
    await subscribeAdapter.init()
  } catch (error) {
    expect(error).toBe(error)
  }
})

test('subscribeAdapter.subscribeToTopics should works correctly', async () => {
  const subscribeAdapter = createSubscribeAdapter({ url, appId, onEvent })

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
  const subscribeAdapter = createSubscribeAdapter({ url, appId, onEvent })

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
  const subscribeAdapter = createSubscribeAdapter({ url, appId, onEvent })

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
  const subscribeAdapter = createSubscribeAdapter({ url, appId, onEvent })

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
