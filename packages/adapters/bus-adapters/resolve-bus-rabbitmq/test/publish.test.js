import sinon from 'sinon'

import publish from '../src/publish'

test('publish should works correctly', async () => {
  let channelPublishResult = {}

  const pool = {
    channel: {
      publish: sinon
        .stub()
        .callsFake(async (exchange, queueName, buffer, options) => {
          Object.assign(channelPublishResult, {
            exchange,
            queueName,
            buffer,
            options
          })
        })
    },

    config: {
      exchange: 'exchange',
      queueName: 'queueName',
      messageTtl: 10
    },

    onEvent: sinon.stub()
  }

  const event = {}

  await publish(pool, event)

  expect(channelPublishResult.exchange).toEqual(pool.config.exchange)
  expect(channelPublishResult.queueName).toEqual(pool.config.queueName)
  expect(JSON.parse(channelPublishResult.buffer.toString())).toEqual(event)
  expect(channelPublishResult.options).toEqual({
    expiration: pool.config.messageTtl,
    persistent: false
  })
})
