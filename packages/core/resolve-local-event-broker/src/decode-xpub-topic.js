const decodeXpubTopic = encodedTopic => {
  const [encodedListenerId, encodedClientId] = encodedTopic.split('-')
  return {
    listenerId: Buffer.from(encodedListenerId, 'base64').toString('utf8'),
    clientId: Buffer.from(encodedClientId, 'base64').toString('utf8')
  }
}

export default decodeXpubTopic
