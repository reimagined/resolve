import debugLevels from 'resolve-debug-levels'

const log = debugLevels('resolve:resolve-runtime:pubsub-manager')

const createPubsubManager = () => {
  const map = new Map()

  const pubsubManager = {
    subscribe({ client, topicName, topicId }) {
      if (!map.has(topicName)) {
        map.set(topicName, new Map())
      }

      if (!map.get(topicName).has(topicId)) {
        map.get(topicName).set(topicId, [])
      }

      map
        .get(topicName)
        .get(topicId)
        .push(client)
    },

    unsubscribe({ client, topicName, topicId }) {
      if (!map.has(topicName)) {
        return
      }

      if (!map.get(topicName).has(topicId)) {
        return
      }

      const clients = map.get(topicName).get(topicId)
      const idx = clients.findIndex(cl => client === cl)
      clients.splice(idx, 1)

      if (clients.length === 0) {
        map.get(topicName).delete(topicId)
      }

      if (map.get(topicName).size === 0) {
        map.delete(topicName)
      }
    },

    unsubscribeClient(client) {
      for (const topicName of map.keys()) {
        for (const topicId of map.get(topicName).keys()) {
          const clients = map.get(topicName).get(topicId)

          const idx = clients.findIndex(cl => client === cl)
          if (idx >= 0) {
            clients.splice(idx, 1)
          }
        }
      }
    },

    dispatch({ topicName, topicId, event }) {
      const clients = []

      if (map.has(topicName) && map.get(topicName).has(topicId)) {
        clients.push(...map.get(topicName).get(topicId))
      }

      if (map.has(topicName) && map.get(topicName).has('+')) {
        clients.push(...map.get(topicName).get('+'))
      }

      if (map.has('+') && map.get('+').has(topicId)) {
        clients.push(...map.get('+').get(topicId))
      }

      if (map.has('+') && map.get('+').has('+')) {
        clients.push(...map.get('+').get('+'))
      }

      clients.forEach(client =>
        client(topicName, topicId, event).catch(warning => {
          log.warn('PubSub manager caused warning from client', warning)
        })
      )
    }
  }

  return pubsubManager
}

export default createPubsubManager
