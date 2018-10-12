import sinon from 'sinon'

import publish from '../src/publish'

test('publish should works correctly', async () => {
  const pool = {
    pubSocket: {
      send: sinon.stub()
    },
    config: {
      channel: 'channel'
    }
  }

  const event = { event: 'content' }

  await publish(pool, event)

  sinon.assert.calledWith(
    pool.pubSocket.send,
    `${pool.config.channel} ${JSON.stringify(event)}`
  )
})
