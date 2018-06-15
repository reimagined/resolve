import mqtt from 'mqtt'

const createSubscribeAdapter = ({ api }) => {
  let client, qos, url
  
  return {
    async init() {
      const options = await api.getSubscribeAdapterOptions()
      qos = options.qos
      url = options.url
      
      client = mqtt.connect(url)
    },
    
    close() {
      client.add()
    },
  
    subscribeToTopics(topics) {
      for(const { appId, topicName, topicId } of topics) {
      
      }
    },
    
    unsubscribeFromTopics() {
    }
  }
}

export default createSubscribeAdapter
