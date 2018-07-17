const mqtt = {
  connect(url) {
    const Client = {
      _error: null,
      _url: url,
      _topics: [],
      _options: {},

      subscribe(topics, options, callback) {
        Client._topics = topics
        Client._options = options

        callback(Client._error)
      },

      unsubscribe(topics, callback) {
        Client._topics = topics

        callback(Client._error)
      },

      on(eventType, callback) {
        switch (eventType) {
          case 'connect':
            Client._onConnect = callback
            break
          case 'error':
            Client._onError = callback
            break
          default:
        }
      }
    }

    mqtt.Client = Client

    return Client
  }
}

export default mqtt
