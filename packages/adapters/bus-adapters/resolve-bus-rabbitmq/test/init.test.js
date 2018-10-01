import sinon from 'sinon'

import init from '../src/init'
import RabbitMQError from '../src/rabbitmq-error'

test('init should works correctly', async () => {
  const queue = { queue: 'queue' }
  const channel = {
    assertExchange: sinon.stub(),
    assertQueue: sinon.stub().callsFake(async () => queue),
    bindQueue: sinon.stub(),
    consume: sinon.stub()
  }
  const connection = {
    createChannel: sinon.stub().callsFake(async () => channel)
  }
  const amqp = {
    connect: sinon.stub().callsFake(async () => connection)
  }
  const pool = {
    config: {
      url: 'url',
      exchange: 'exchangeName',
      exchangeType: 'exchangeType',
      queueName: 'queueName',
      messageTtl: 10,
      maxLength: 20
    }
  }
  const onMessage = sinon.stub()

  await init(amqp, pool, onMessage)

  sinon.assert.callOrder(
    amqp.connect,
    connection.createChannel,
    channel.assertExchange,
    channel.assertQueue,
    channel.bindQueue,
    channel.consume
  )

  sinon.assert.calledWith(amqp.connect, pool.config.url)

  sinon.assert.calledWith(connection.createChannel)

  sinon.assert.calledWith(
    channel.assertExchange,
    pool.config.exchange,
    pool.config.exchangeType,
    {
      durable: false
    }
  )

  sinon.assert.calledWith(channel.assertQueue, pool.config.queueName, {
    arguments: {
      messageTtl: pool.config.messageTtl,
      maxLength: pool.config.maxLength
    }
  })

  sinon.assert.calledWith(
    channel.bindQueue,
    pool.queue.queue,
    pool.config.exchange
  )

  sinon.assert.calledWith(channel.consume, pool.config.queueName, onMessage, {
    noAck: true
  })

  expect(pool).toMatchObject({
    connection,
    channel,
    queue
  })
})

test('init should handle connection error', async () => {
  const error = new RabbitMQError('Test error', 'Test stack', 'Test cause')
  const amqp = {
    connect: sinon.stub().callsFake(async () => {
      throw error
    })
  }
  const pool = {
    config: {
      url: 'url',
      exchange: 'exchangeName',
      exchangeType: 'exchangeType',
      queueName: 'queueName',
      messageTtl: 10,
      maxLength: 20
    }
  }

  const onMessage = sinon.stub()

  try {
    await init(amqp, pool, onMessage)

    return Promise.reject('Test failed')
  } catch (e) {
    expect(e.message).toEqual(error.message)
  }
})
