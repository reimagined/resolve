const decodeXpubTopic = encodedTopic => {
  const [encodedListenerId, encodedClientId] = encodedTopic.split('-')
  return {
    listenerId: new Buffer(encodedListenerId, 'base64').toString('utf8'),
    clientId: new Buffer(encodedClientId, 'base64').toString('utf8')
  }
}

export default decodeXpubTopic
